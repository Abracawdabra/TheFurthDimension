/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { Game } from "../Main";
import * as utils from "../Utils";

export class BitmapText extends createjs.BitmapText {
    protected _color: string;
    get color(): string {
        return this._color;
    }

    set color(hex: string) {
        this.filters = [
                new createjs.ColorFilter(utils.hexToInt(hex.substr(1, 2)) / 255, utils.hexToInt(hex.substr(3, 2)) / 255, utils.hexToInt(hex.substr(5, 2)) / 255)
        ];

        if (this.getBounds()) {
            this.updateCache();
        }
    }

    setText(value: string): void {
        this.text = value;

        this.uncache();
        let bounds = this.getBounds();
        if (bounds) {
            this.cache(0, 0, bounds.width, bounds.height);
        }
    }

    constructor(text: string, font: string, color?: string, line_height?: number) {
        let font_id = "font_" + font.replace(/\s/g, "_").replace(/'/g, "").toLowerCase();
        if (!(font_id in Game.FontSpriteSheets)) {
            throw new Error("Sprite sheet not found for fond ID: " + font_id);
        }

        super(" ", Game.FontSpriteSheets[font_id]);
        this.lineHeight = line_height;
        // Force line height
        this.text = text;
        let bounds = this.getBounds();
        if (bounds) {
            this.cache(0, 0, bounds.width, bounds.height);
        }

        if (color) {
            this.color = color;
        }
    }
}
