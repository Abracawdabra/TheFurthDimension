/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { IEventDispatcher } from "./IEventDispatcher";
import { ASSET_MANIFESTS } from "./AssetManifests";
import * as colors from "./Colors";

const PRELOADER_DISPLAY_WIDTH = 100;
const PRELOADER_DISPLAY_HEIGHT = 20;

// Set to false for local testing in order to fix
// preloading issues. Set to true for production.
const PREFER_XHR = false;

export class Game {
    static readonly DISPLAY_WIDTH = 160;
    static readonly DISPLAY_HEIGHT = 144;
    static readonly DEFAULT_DISPLAY_SCALE = 2;

    static readonly CENTER_X = Math.floor(Game.DISPLAY_WIDTH / 2);
    static readonly CENTER_Y = Math.floor(Game.DISPLAY_HEIGHT / 2);

    static readonly BACKGROUND_COLOR = colors.GB_COLOR_LIGHT_GREEN;

    static readonly FPS = 59.7;

    static Assets: { [id: string]: any };

    get displayScale(): number {
        return this._displayScale;
    }

    set displayScale(scale: number) {
        this._displayScale = scale;
        this._stage.scaleX = scale;
        this._stage.scaleY = scale;

        let canvas = <HTMLCanvasElement>this._stage.canvas;
        canvas.width = Game.DISPLAY_WIDTH * scale;
        canvas.height = Game.DISPLAY_HEIGHT * scale;
    }

    protected _stage: createjs.Stage;
    protected _canvasContext: CanvasRenderingContext2D;

    protected _displayScale: number;

    protected _preloaderQueue: createjs.LoadQueue;
    protected _preloaderItemsTotal: number;
    protected _preloaderItemsLoaded: number;

    constructor(canvas_id: string) {
        this._stage = new createjs.Stage(canvas_id);
        this.init();
    }

    init(): void {
        this.displayScale = Game.DEFAULT_DISPLAY_SCALE;

        let canvas = <HTMLCanvasElement>this._stage.canvas;
        canvas.style.backgroundColor = Game.BACKGROUND_COLOR;

        this._canvasContext = canvas.getContext("2d");
        let context = this._canvasContext;
        // Pixelate
        context.imageSmoothingEnabled = false;
        context.oImageSmoothingEnabled = false;
        context.mozImageSmoothingEnabled = false;
        context.webkitImageSmoothingEnabled = false;
        context.msImageSmoothingEnabled = false;

        // Bind event handlers to the game instance
        this._onPreloadFileLoad = this._onPreloadFileLoad.bind(this);
        this._onPreloadError = this._onPreloadError.bind(this);
        this._onPreloadFontLoad = this._onPreloadFontLoad.bind(this);
        this._onPreloadFontInactive = this._onPreloadFontInactive.bind(this);
        this._onPreloadComplete = this._onPreloadComplete.bind(this);
        this._onTick = this._onTick.bind(this);

        createjs.Ticker.setFPS(Game.FPS);
        createjs.Ticker.addEventListener("tick", this._onTick);

        this._preload();
    }

    /**
     * Creates a new CSS font-face and adds it to the head of the document
     */
    protected _createFontFace(name: string, url: string, format: string): void {
        let font_face = "@font-face { font-family: '" + name + "'; src: url('" + url + "') format('" + format + "'); }";
        let style_el = document.createElement("style");
        style_el.type = "text/css";
        style_el.appendChild(document.createTextNode(font_face));
        document.head.appendChild(style_el);
    }

    protected _preload(): void {
        createjs.Sound.alternateExtensions = ["mp3"];
        this.on("preloadcomplete", this._onPreloadComplete, null, true);

        if (Game.Assets) {
            // Assets are already loaded (presumably)
            this.dispatchEvent(new createjs.Event("preloadcomplete", false, false));
        }
        else {
            Game.Assets = {};

            this._showPreloaderDisplay();

            this._preloaderQueue = new createjs.LoadQueue(PREFER_XHR);
            let load_queue = this._preloaderQueue;
            load_queue.addEventListener("fileload", this._onPreloadFileLoad);
            load_queue.on("error", this._onPreloadError, null, true);

            let manifest = ASSET_MANIFESTS.images.concat(ASSET_MANIFESTS.sounds);
            this._preloaderItemsTotal = ASSET_MANIFESTS.fonts.length + manifest.length;
            this._preloaderItemsLoaded = 0;
            load_queue.loadManifest(manifest);

            let web_font_config = {
                custom: {
                    families: new Array<string>()
                },
                fontactive: this._onPreloadFontLoad,
                fontinactive: this._onPreloadFontInactive
            };
            for (let font of ASSET_MANIFESTS.fonts) {
                // Add all fonts to the document and the web font config
                this._createFontFace(font.name, font.src, font.format);
                web_font_config.custom.families.push(font.name);
            }

            WebFont.load(web_font_config);
        }
    }

    protected _incrementPreloaderItemCount(): void {
        ++this._preloaderItemsLoaded;
        if (this._preloaderItemsLoaded >= this._preloaderItemsTotal) {
            this.dispatchEvent(new createjs.Event("preloadcomplete", false, false));
        }

        let preloader_bar = this._stage.getChildByName("preloader_bar");
        if (preloader_bar) {
            preloader_bar.scaleX = this._preloaderItemsLoaded / this._preloaderItemsTotal;
        }
    }

    protected _cancelPreloading(): void {
        if (this._preloaderQueue) {
            // Only run this code once
            this._preloaderQueue.cancel();
            this._preloaderQueue = null;

            this._stage.removeAllChildren();
            let error_text = new createjs.Text("ERROR LOADING ASSETS", "12px monospace", colors.GB_COLOR_DARKEST_GREEN);
            let error_text_bounds = error_text.getBounds();
            error_text.x = Game.CENTER_X - Math.floor(error_text_bounds.width / 2);
            error_text.y = Game.CENTER_Y - Math.floor(error_text_bounds.height / 2);
            this._stage.addChild(error_text);
        }
    }

    protected _showPreloaderDisplay(): void {
        let preloader_border = new createjs.Shape();
        preloader_border.graphics.beginStroke(colors.GB_COLOR_DARKEST_GREEN);
        preloader_border.graphics.setStrokeStyle(1);
        preloader_border.graphics.drawRect(0, 0, PRELOADER_DISPLAY_WIDTH, PRELOADER_DISPLAY_HEIGHT);
        preloader_border.x = Game.CENTER_X - Math.floor(PRELOADER_DISPLAY_WIDTH / 2);
        preloader_border.y = Game.CENTER_Y - Math.floor(PRELOADER_DISPLAY_HEIGHT / 2);

        let preloader_bar = new createjs.Shape();
        preloader_bar.name = "preloader_bar";
        preloader_bar.graphics.beginFill(colors.GB_COLOR_DARKEST_GREEN);
        preloader_bar.graphics.drawRect(0, 0, PRELOADER_DISPLAY_WIDTH, PRELOADER_DISPLAY_HEIGHT);
        preloader_bar.x = preloader_border.x;
        preloader_bar.y = preloader_border.y;
        preloader_bar.scaleX = 0;
        this._stage.addChild(preloader_bar);
        this._stage.addChild(preloader_border);
    }

    protected _onPreloadFileLoad(event: createjs.Event): void {
        Game.Assets[event.item.id] = event.result;
        this._incrementPreloaderItemCount();
    }

    protected _onPreloadError(event: createjs.ErrorEvent): void {
        console.log("Preloading error: ", event);
        this._cancelPreloading();
    }

    protected _onPreloadFontLoad(familyName: string, fvd: string): void {
        this._incrementPreloaderItemCount();
    }

    protected _onPreloadFontInactive(familyName: string, fvd: string): void {
        console.log("Error loading font family: '" + familyName + "'");
        this._cancelPreloading();
    }

    protected _onPreloadComplete(event: createjs.Event): void {
        if (this._preloaderQueue) {
            this._preloaderQueue.destroy();
            this._preloaderQueue = null;
            this._showTitleScreen();
        }
    }

    protected _showTitleScreen(): void {
        console.log("showTitleScreen");
        this._stage.removeAllChildren();
    }

    protected _onTick(event: createjs.TickerEvent): void {
        if (!event.paused) {
            this._stage.update();
        }
    }
}

// Add event dispatcher methods to the class
createjs.EventDispatcher.initialize(Game.prototype);
export interface Game extends IEventDispatcher {
}

// Add to global scope
window.TheFurthDimension = Game;
