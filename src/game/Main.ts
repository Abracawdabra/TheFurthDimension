/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { ASSET_MANIFESTS, IEventDispatcher, KeyboardKeys } from ".";
import { BaseScreen, TitleScreen } from "./screens";
import * as buttons from "./Buttons";
import * as utils from "./Utils";
import * as colors from "./Colors";

const PRELOADER_DISPLAY_WIDTH = 100;
const PRELOADER_DISPLAY_HEIGHT = 20;

const MAX_KEY_DOWN_QUEUE_LENGTH = 5;
const KEY_DOWN_QUEUE_TIMEOUT = 1500;      // Milliseconds

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

    keysDown: number[];
    // For keeping track of ordered key presses
    keyDownQueue: number[];

    protected _stage: createjs.Stage;
    protected _canvasContext: CanvasRenderingContext2D;

    // Settings
    textScrollSpeed: number;
    protected _displayScale: number;
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

    protected _preloaderQueue: createjs.LoadQueue;
    protected _preloaderItemsTotal: number;
    protected _preloaderItemsLoaded: number;

    protected _screens: BaseScreen[];
    protected _currentScreen: BaseScreen;

    protected _keyDownQueueTimeoutHandle: number;

    protected _cheatTextbox: HTMLInputElement;

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
        this._onKeyEvent = this._onKeyEvent.bind(this);
        this._onKeyDownQueueTimeout = this._onKeyDownQueueTimeout.bind(this);
        this._onCheatTextboxKeyDown = this._onCheatTextboxKeyDown.bind(this);

        this._screens = [];
        this._currentScreen = null;

        this._cheatTextbox = null;

        createjs.Ticker.setFPS(Game.FPS);
        createjs.Ticker.addEventListener("tick", this._onTick);

        this._preload();
    }

    pushScreen(screen: BaseScreen): void {
        this._stage.addChild(screen.container);
        this._screens.push(screen);
        this._currentScreen = screen;
    }

    popScreen(): BaseScreen {
        var screen = this._screens.pop();
        this._stage.removeChild(screen.container);
        this._currentScreen = (this._screens.length > 0) ? this._screens[this._screens.length - 1] : null;
        return screen;
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

    protected _addMainKeyEventListeners(): void {
        this.keysDown = [];
        this.keyDownQueue = [];
        window.addEventListener("keydown", this._onKeyEvent);
        window.addEventListener("keyup", this._onKeyEvent);
    }

    protected _removeMainKeyEventListeners(): void {
        window.removeEventListener("keydown", this._onKeyEvent);
        window.removeEventListener("keyup", this._onKeyEvent);
        this.keysDown = [];
        this.keyDownQueue = [];
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

            this._addMainKeyEventListeners();
            this._showTitleScreen();
        }
    }

    protected _showTitleScreen(): void {
        this._stage.removeAllChildren();
        this.pushScreen(new TitleScreen(this));
    }

    protected _onKeyEvent(event: KeyboardEvent): void {
        let key_code = event.keyCode;       // Fall back
        if (event.key) {
            // Support for KeyboardEvent.key
            let sanitized = utils.sanitizeKeyName(event.key);
            if (sanitized in KeyboardKeys) {
                // Convert key string to a key code using predefined constants
                key_code = KeyboardKeys[sanitized];
            }
        }

        if (key_code) {
            if (event.type === "keydown" && this.keysDown.indexOf(key_code) === -1) {
                // Only handle this key if it wasn't already down
                clearTimeout(this._keyDownQueueTimeoutHandle);
                if (this.keyDownQueue.length >= MAX_KEY_DOWN_QUEUE_LENGTH) {
                    this.keyDownQueue.shift();
                }
                this.keyDownQueue.push(key_code);
                if (utils.arraysAreEqual(this.keyDownQueue, buttons.CheatTextboxCode)) {
                    this._showCheatTextbox();
                    this.keyDownQueue = [];
                    return;
                }

                this.keysDown.push(key_code);

                if (this._currentScreen) {
                    this._currentScreen.handleKeyDown(key_code);
                }

                this._keyDownQueueTimeoutHandle = setTimeout(this._onKeyDownQueueTimeout, KEY_DOWN_QUEUE_TIMEOUT);
            }
            else if (event.type === "keyup") {
                let index = this.keysDown.indexOf(key_code)
                if (index > -1) {
                    this.keysDown.splice(index, 1);
                }

                if (this._currentScreen) {
                    this._currentScreen.handleKeyUp(key_code);
                }
            }
        }
    }

    protected _onKeyDownQueueTimeout(event: Event): void {
        this.keyDownQueue = [];
    }

    protected _onTick(event: createjs.TickerEvent): void {
        if (!event.paused) {
            if (this._currentScreen) {
                this._currentScreen.update(event.delta);
            }

            this._stage.update();
        }
    }

    protected _showCheatTextbox(): void {
        let cheat_textbox = document.createElement("input");
        cheat_textbox.type = "text";
        cheat_textbox.id = "cheat_textbox";
        cheat_textbox.className = "cheat-textbox";
        cheat_textbox.placeholder = "Enter cheat";
        cheat_textbox.style.top = (40 * this._displayScale).toString() + "px";
        cheat_textbox.style.fontSize = (8 * this._displayScale).toString() + "px";
        cheat_textbox.style.width = (8 * this._displayScale * 18).toString() + "px";
        cheat_textbox.addEventListener("keydown", this._onCheatTextboxKeyDown);
        (<HTMLCanvasElement>this._stage.canvas).parentElement.appendChild(cheat_textbox);
        cheat_textbox.focus();
        this._cheatTextbox = cheat_textbox;

        this._removeMainKeyEventListeners();
    }

    protected _removeCheatTextbox(): void {
        this._cheatTextbox.removeEventListener("keydown", this._onCheatTextboxKeyDown);
        this._cheatTextbox.parentElement.removeChild(this._cheatTextbox);
        this._cheatTextbox = null;

        this._addMainKeyEventListeners();
    }

    protected _onCheatTextboxKeyDown(event: KeyboardEvent): void {
        let key_code = event.keyCode;
        if (event.key) {
            // Support for KeyboardEvent.key
            let sanitized = utils.sanitizeKeyName(event.key);
            if (sanitized in KeyboardKeys) {
                // Convert KeyboardEvent.key to a key code using predefined constants
                key_code = KeyboardKeys[sanitized];
            }
        }

        if (key_code) {
            if (key_code === KeyboardKeys.ESCAPE) {
                this._removeCheatTextbox();
            }
            else if (key_code === KeyboardKeys.ENTER && this._cheatTextbox.value.trim() !== "") {
                this._processCheatCommand(this._cheatTextbox.value.trim());
                if (this._cheatTextbox) {
                    this._cheatTextbox.value = "";
                }
            }
        }
    }

    protected _processCheatCommand(command: string): void {
        let parsed = command.split(" ");
        let cmd = parsed[0].toLowerCase();
        let success = false;

        if (cmd === "exposeme") {
            // Add instance to the global scope
            window.gGameInstance = this;
            success = true;
        }

        else if (cmd === "killme" ) {
            // Harsh destroy of the instance
            if (window.gGameInstance) {
                window.gGameInstance = undefined;
            }

            this._cheatTextbox.removeEventListener("keydown", this._onCheatTextboxKeyDown);
            createjs.Ticker.reset();

            for (let prop in this) {
                delete this[prop];
            }

            success = true;
        }

        if (success) {
            console.log("Cheat '" + command + "' accepted.");
        }
    }
}

// Add event dispatcher methods to the class
createjs.EventDispatcher.initialize(Game.prototype);
export interface Game extends IEventDispatcher {}

// Add to global scope
window.TheFurthDimension = Game;
