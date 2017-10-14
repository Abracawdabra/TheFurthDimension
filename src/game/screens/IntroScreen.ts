/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { BaseScreen } from ".";
import { ScreenFade, BitmapText } from "../ui";
import * as colors from "../Colors";
import { Button } from "..";
import { Game } from "../Main";

// Text transition frame duration (milliseconds)
const TEXT_TRANSITION_FRAME_DURATION = 320;

const COLORS = [colors.DARKEST, colors.DARK, colors.LIGHT, colors.LIGHTEST];

export class IntroScreen extends BaseScreen {
    protected _screenFade: ScreenFade;
    protected _text: BitmapText[];
    // Current index of the text array
    protected _currentTextIndex: number;
    protected _currentColorIndex: number;
    // Prevents input when transitioning
    protected _isTransitioning: boolean;
    // Text transition frame end time
    protected _textTransitionFrameEndTime: number;

    protected _isTextFadingOut: boolean;

    handleKeyDown(key_code: number): void {
        if (!this._isTransitioning) {
            switch (key_code) {
                case Button.A:
                case Button.START:
                case Button.B:
                    if (this._currentTextIndex > -1) {
                        --this._currentColorIndex;
                        this._isTextFadingOut = true;
                        this._isTransitioning = true;
                        this._textTransitionFrameEndTime = createjs.Ticker.getTime() + TEXT_TRANSITION_FRAME_DURATION;
                    }
            }
        }
    }

    handleKeyUp(key_up: number): void {
    }

    update(delta: number): void {
        if (this._isTransitioning && this._currentTextIndex > -1 && createjs.Ticker.getTime() >= this._textTransitionFrameEndTime) {
            this._text[this._currentTextIndex].color = COLORS[this._currentColorIndex];

            if (this._isTextFadingOut) {
                --this._currentColorIndex;
            }
            else {
                ++this._currentColorIndex;
            }

            if (this._currentColorIndex >= COLORS.length) {
                this._isTransitioning = false;
            }
            else if (this._currentColorIndex < 0) {
                this._isTextFadingOut = false;
                this.container.removeChild(this._text[this._currentTextIndex]);
                if (!this._showNextText()) {
                    // Prevent the update clause from executing again
                    this._currentTextIndex = -1;
                    let old_screen_fade = this._screenFade;
                    this._screenFade = new ScreenFade(false);
                    this._screenFade.on("fadeend", function(event: createjs.Event): void {
                        this.gameInstance.popScreen();
                    }, this, true);

                    this.container.addChild(this._screenFade);
                    this.container.removeChild(old_screen_fade);
                }
            }
            else {
                this._textTransitionFrameEndTime = createjs.Ticker.getTime() + TEXT_TRANSITION_FRAME_DURATION;
            }
        }
    }

    protected _init(): void {
        this._text = [
            new BitmapText("On the outskirts\nof Dongola, Sudan,\nan archaeologist\ndiscovers a small,\nisolated, buried\ntemple.", "8px Press Start", colors.DARKEST, 12),
            new BitmapText("After some\nexamination, he\nestimates the\ntemple is just\nover 12,000 years\nold.", "8px Press Start", colors.DARKEST, 12),
            new BitmapText("This would make it\nthe oldest temple\never found...", "8px Press Start", colors.DARKEST, 12)
        ];

        this._screenFade = new ScreenFade();
        this._screenFade.on("fadeend", this._onFadeEnd, this, true);
        this.container.addChild(this._screenFade);
        this._currentTextIndex = -1;
        this._isTransitioning = true;
    }

    protected _onFadeEnd(event: createjs.Event): void {
        this._showNextText();
    }

    protected _showNextText(): boolean {
        ++this._currentTextIndex;
        if (this._currentTextIndex >= this._text.length) {
            return false;
        }

        let text = this._text[this._currentTextIndex];
        let text_bounds = text.getBounds();
        text.x = Game.CENTER_X - Math.floor(text_bounds.width / 2);
        text.y = Game.CENTER_Y - Math.floor(text_bounds.height / 2);
        this.container.addChild(text);

        this._currentColorIndex = 0;
        this._isTransitioning = true;
        this._textTransitionFrameEndTime = createjs.Ticker.getTime() + TEXT_TRANSITION_FRAME_DURATION;
        return true;
    }
}