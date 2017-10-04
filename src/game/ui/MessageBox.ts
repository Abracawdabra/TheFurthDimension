/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { BorderBox, BitmapText } from ".";
import { Game } from "../Main";
import * as colors from "../Colors";

export class MessageBox extends BorderBox {
    protected _text: BitmapText;

    constructor(message: string, font = "8px Press Start", bg_color = colors.LIGHTEST, text_color = colors.DARKEST, border_start_x = 0, border_start_y = 0, frame_width = 12, frame_height = 12) {
        let text = new BitmapText(message, font, text_color);
        text.x = frame_width;
        text.y = frame_height;
        let text_bounds = text.getBounds();
        super(text_bounds.width + (frame_width * 2), text_bounds.height + (frame_height * 2), bg_color, border_start_x, border_start_y);
        this._text = text;
        this.addChild(text);
    }
}
