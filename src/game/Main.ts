/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { IEventDispatcher } from "./IEventDispatcher";
import { ASSET_MANIFESTS } from "./AssetManifests";

// Set to false for local testing in order to fix
// preloading issues. Set to true for production.
const PREFER_XHR = false;

export class Game {
    static readonly DISPLAY_WIDTH = 160;
    static readonly DISPLAY_HEIGHT = 144;
    static readonly DEFAULT_DISPLAY_SCALE = 2;

    static readonly CENTER_X = Math.floor(Game.DISPLAY_WIDTH / 2);
    static readonly CENTER_Y = Math.floor(Game.DISPLAY_HEIGHT / 2);

    static readonly BACKGROUND_COLOR = "#8bac0f";

    static readonly FPS = 59.7;

    static Assets: { [id: string]: any };

    protected _stage: createjs.Stage;
    protected _canvasContext: CanvasRenderingContext2D;
    protected _displayScale: number;
    get displayScale(): number {
        return this._displayScale;
    }
    set displayScale(scale: number) {
        this._displayScale = scale;
        this._stage.scaleX = scale;
        this._stage.scaleY = scale;
    }

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
        canvas.width = Game.DISPLAY_WIDTH * this._displayScale;
        canvas.height = Game.DISPLAY_HEIGHT * this._displayScale;
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
        this.onPreloadFileLoad = this.onPreloadFileLoad.bind(this);
        this.onPreloadError = this.onPreloadError.bind(this);
        this.onPreloadFontLoad = this.onPreloadFontLoad.bind(this);
        this.onPreloadFontInactive = this.onPreloadFontInactive.bind(this);
        this.onPreloadComplete = this.onPreloadComplete.bind(this);
        this.onTick = this.onTick.bind(this);

        createjs.Ticker.setFPS(Game.FPS);
        createjs.Ticker.addEventListener("tick", this.onTick);

        this.preload();
    }

    /**
     * Creates a new CSS font-face and adds it to the head of the document
     */
    protected createFontFace(name: string, url: string, format: string): void {
        let font_face = "@font-face { font-family: '" + name + "'; src: url('" + url + "') format('" + format + "'); }";
        let style_el = document.createElement("style");
        style_el.type = "text/css";
        style_el.appendChild(document.createTextNode(font_face));
        document.head.appendChild(style_el);
    }

    protected preload(): void {
        createjs.Sound.alternateExtensions = ["mp3"];

        this._preloaderQueue = new createjs.LoadQueue(PREFER_XHR);
        let load_queue = this._preloaderQueue;
        load_queue.addEventListener("fileload", this.onPreloadFileLoad);
        load_queue.addEventListener("error", this.onPreloadError);
        this.on("preloadcomplete", this.onPreloadComplete, null, true);

        if (Game.Assets) {
            // Assets are already loaded (presumably)
            this.dispatchEvent(new createjs.Event("preloadcomplete", false, false));
        }
        else {
            Game.Assets = {};
            let manifest = ASSET_MANIFESTS.images.concat(ASSET_MANIFESTS.sounds);
            this._preloaderItemsTotal = ASSET_MANIFESTS.fonts.length + manifest.length;
            this._preloaderItemsLoaded = 0;
            load_queue.loadManifest(manifest);

            let web_font_config = {
                custom: {
                    families: new Array<string>()
                },
                fontactive: this.onPreloadFontLoad,
                fontinactive: this.onPreloadFontInactive
            };
            for (let font of ASSET_MANIFESTS.fonts) {
                // Add all fonts to the document and the web font config
                this.createFontFace(font.name, font.src, font.format);
                web_font_config.custom.families.push(font.name);
            }

            WebFont.load(web_font_config);
        }
    }

    protected increasePreloaderItemCount(): void {
        ++this._preloaderItemsLoaded;
        if (this._preloaderItemsLoaded >= this._preloaderItemsTotal) {
            this.dispatchEvent(new createjs.Event("preloadcomplete", false, false));
        }
    }

    protected onPreloadFileLoad(event: createjs.Event): void {
        Game.Assets[event.item.id] = event.result;
        this.increasePreloaderItemCount();
    }

    protected onPreloadError(event: createjs.ErrorEvent): void {
        console.log("Preloading error: ", event);
    }

    protected onPreloadFontLoad(familyName: string, fvd: string): void {
        this.increasePreloaderItemCount();
    }

    protected onPreloadFontInactive(familyName: string, fvd: string): void {
        console.log("Error loading font family: '" + familyName + "'");
    }

    protected onPreloadComplete(event: createjs.Event): void {
        this._preloaderQueue.removeAllEventListeners();
        this._preloaderQueue = null;
        this.showTitleScreen();
    }

    protected showTitleScreen(): void {
        console.log("showTitleScreen");
    }

    protected onTick(event: createjs.TickerEvent): void {
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
