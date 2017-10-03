/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { BorderBox, BitmapText } from ".";
import * as colors from "../Colors";
import { Game, DISPLAY_WIDTH, DISPLAY_HEIGHT } from "../Main";
import { BaseMapObject } from "..";
import * as utils from "../Utils";

const BOX_HORIZONTAL_PADDING = 12;
const BOX_VERTICAL_PADDING  = 12;
const LINE_HEIGHT = 12;

const CLEAR_CHAR = "\u2742";

// Blink duration in milliseconds
const TEXT_CONTINUE_MARKER_BLINK_DURATION = 500;

export class DialogBox extends createjs.Container {
    static get BOX_WIDTH(): number {
        return DISPLAY_WIDTH - 2;
    }

    static get BOX_HEIGHT(): number {
        return Math.floor(DISPLAY_HEIGHT / 2.3);
    }

    box: BorderBox;
    bitmapText: BitmapText;
    textSpeed: number;
    owner: BaseMapObject;

    // The text split into word wrapped lines
    protected _splitTextLines: string[];
    protected _currentLineIndex: number;
    // Current character index of the current line
    protected _currentCharIndex: number;

    // Max number of lines that can be displayed at one time
    protected _maxLines: number;

    protected _transitioning: boolean;
    // Number that adds update deltas until greater than or equal to 1,
    // at which point it resets to 0.
    protected _transitionCharDelta: number;

    protected _textContinueMarker: createjs.Bitmap;
    // The desired point in time for the text continue marker to blink on or off
    protected _textContinueMarkerBlinkTime: number;

    constructor(text: string, text_speed: number, owner: BaseMapObject, text_color: string = colors.DARKEST, fill_color: string = colors.LIGHTEST, border_start_x: number = 0, border_start_y: number = 0) {
        super();
        this.textSpeed = text_speed;
        this.owner = owner;

        this.box = new BorderBox(Game.Assets["ui_border_boxes"], DialogBox.BOX_WIDTH, DialogBox.BOX_HEIGHT, fill_color, border_start_x, border_start_y, 12, 12);
        this.x = 1;
        this.addChild(this.box);

        let txt = new BitmapText("", "8px 'Press Start'", text_color);
        txt.x = BOX_HORIZONTAL_PADDING;
        txt.y = BOX_VERTICAL_PADDING;
        txt.color = text_color;
        txt.lineHeight = LINE_HEIGHT;
        this.addChild(txt);
        this.bitmapText = txt;

        this._processText(text);
        this._currentLineIndex = -1;
        this._transitioning = false;
        this._transitionCharDelta = 0;

        let marker = new createjs.Bitmap(Game.Assets["ui_marker"]);
        let marker_bounds = marker.getBounds();
        marker.x = this.x + DialogBox.BOX_WIDTH - 12 - marker_bounds.width;
        marker.y = this.y + DialogBox.BOX_HEIGHT - 12;
        marker.rotation = 90;
        marker.filters = [
            new createjs.ColorFilter(utils.hexToInt(text_color.substr(1, 2)) / 255, utils.hexToInt(text_color.substr(3, 2)) / 255, utils.hexToInt(text_color.substr(5, 2)) / 255)
        ]
        marker.cache(0, 0, marker_bounds.width, marker_bounds.height);
        this._textContinueMarker = marker;
        this._textContinueMarkerBlinkTime = 0;
    }

    isTransitioning(): boolean {
        return this._transitioning;
    }

    /**
     * Begins the transition of the next bit of text.
     * Returns whether there is any text left to show.
     */
    showNext(): boolean {
        if (this._currentLineIndex < this._splitTextLines.length - 1) {
            ++this._currentLineIndex;
            if (this._splitTextLines[this._currentLineIndex] === CLEAR_CHAR) {
                this.bitmapText.text = "";
                this._splitTextLines = this._splitTextLines.slice(this._currentLineIndex + 1);
                this._currentLineIndex = 0;
            }
            else if (this._currentLineIndex > 0 && this._maxLines > 1) {
                let start_line_index = (this._currentLineIndex >= this._maxLines) ? this._currentLineIndex - this._maxLines + 1 : 0;
                this.bitmapText.setText(this._splitTextLines.slice(start_line_index, this._currentLineIndex).join("\n") + "\n");
            }

            this._currentCharIndex = 0;
            this._transitioning = true;
            this._transitionCharDelta = 0;
            this.removeChild(this._textContinueMarker);
            this._textContinueMarkerBlinkTime = 0;
            return true;
        }
        else {
            // Nothing left
            return false;
        }
    }

    update(delta: number): void {
        if (this._transitioning) {
            this._transitionCharDelta += delta;
            let num_of_chars = Math.floor(this._transitionCharDelta / 1000 * this.textSpeed);
            if (num_of_chars > 0) {
                this.bitmapText.setText(this.bitmapText.text + this._splitTextLines[this._currentLineIndex].substr(this._currentCharIndex, num_of_chars));
                this._currentCharIndex += num_of_chars;
                this._transitionCharDelta = 0;
                if (this._currentCharIndex >= this._splitTextLines[this._currentLineIndex].length) {
                    // At the end of the line
                    if (this._currentLineIndex < this._splitTextLines.length - 1 && this._currentLineIndex < this._maxLines - 1 && this._splitTextLines[this._currentLineIndex + 1] !== CLEAR_CHAR) {
                        // Haven't filled the dialog box yet and there was no clear screen character
                        this.showNext();
                    }
                    else {
                        this._transitioning = false;
                        this._textContinueMarker.visible = true;
                        this.addChild(this._textContinueMarker);
                        this._textContinueMarkerBlinkTime = createjs.Ticker.getTime() + TEXT_CONTINUE_MARKER_BLINK_DURATION;
                    }
                }
            }
        }
        else if (this._textContinueMarkerBlinkTime > 0 && createjs.Ticker.getTime() >= this._textContinueMarkerBlinkTime) {
            // Make text continue marker blink
            this._textContinueMarker.visible = !this._textContinueMarker.visible;
            this._textContinueMarkerBlinkTime = createjs.Ticker.getTime() + TEXT_CONTINUE_MARKER_BLINK_DURATION;
        }
    }

    protected _processText(text: string): void {
        let max_chars_per_line = Math.floor((DialogBox.BOX_WIDTH - (BOX_HORIZONTAL_PADDING * 2)) / 8);
        this._maxLines = Math.floor((DialogBox.BOX_HEIGHT - (BOX_VERTICAL_PADDING * 2)) / LINE_HEIGHT);
        this._splitTextLines = [];
        this._currentLineIndex = 0;
        if (this._transitioning) {
            this._transitioning = false;
        }

        let index = 0;
        while (index + max_chars_per_line < text.length) {
            while (text[index] === " ") {
                // Strip heading space without counting towards the character limit
                ++index;
            }

            let end = index + max_chars_per_line;
            let line = text.substring(index, end);
            let clear_char_index = line.indexOf(CLEAR_CHAR);
            if (clear_char_index > -1) {
                if (clear_char_index > 0) {
                    this._splitTextLines.push(line.substring(0, clear_char_index).trim());
                }

                this._splitTextLines.push(CLEAR_CHAR);
                index += clear_char_index + 1;
                end = index + max_chars_per_line;
                line = text.substring(index, end);
            }

            if (end < text.length && line[line.length - 1] !== " " && text[end] !== " ") {
                // Word wrap required
                let old_index = index;
                for (let i=line.length - 1; i>-1; --i) {
                    if (line[i] === " ") {
                        line = line.substring(0, i + 1);
                        index += i + 1;
                        break;
                    }
                }

                if (index === old_index) {
                    // Word breaking
                    line = line.substring(0, line.length - 1) + "-";
                    index += line.length - 1;
                }
            }
            else {
                // No word wrap
                index += max_chars_per_line;
            }

            this._splitTextLines.push(line.trim());
        }

        if (index < text.length - 1) {
            // Left over text the loop didn't cover
            this._splitTextLines.push(text.substring(index).trim());
        }
    }
}
