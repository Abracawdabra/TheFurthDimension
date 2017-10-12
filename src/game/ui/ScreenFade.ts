/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import * as colors from "../Colors";
import { DISPLAY_WIDTH, DISPLAY_HEIGHT } from "../Main";

export class ScreenFade extends createjs.Shape {
    protected _frameDuration: number;
    get framerate(): number {
        return 1000 / this._frameDuration;
    }

    set framerate(value: number) {
        this._frameDuration = 1000 / value;
    }

    protected _colors: string[];
    protected _currentIndex: number;

    protected _deltaSum: number;

    constructor(fade_in = true, framerate = 5) {
        super();
        this.framerate = framerate;
        this._colors = fade_in ? [colors.LIGHTEST, colors.LIGHT, colors.DARK, colors.DARKEST] : [colors.DARKEST, colors.DARK, colors.LIGHT, colors.LIGHTEST];
        this._currentIndex = 0;
        this._deltaSum = 0;
        this._nextColor();

        this._onTick = this._onTick.bind(this);
        this.addEventListener("tick", this._onTick);
    }

    protected _onTick(event: createjs.Event): void {
        this._deltaSum += event.delta;
        let frames = Math.floor(this._deltaSum / this._frameDuration);
        if (frames > 0) {
            this._deltaSum = 0;
            this._currentIndex += Math.min(frames - 1, this._colors.length - 1);
            this._nextColor();
        }
    }

    protected _nextColor(): void {
        if (this._currentIndex < this._colors.length) {
            this.graphics.clear();
            this.graphics.beginFill(this._colors[this._currentIndex]);
            this.graphics.drawRect(0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT);
            ++this._currentIndex;
        }

        if (this._currentIndex >= this._colors.length) {
            this.removeEventListener("tick", this._onTick);
        }
    }
}
