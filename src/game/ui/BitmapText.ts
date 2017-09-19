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
        this.updateCache();
    }

    setText(value: string): void {
        this.text = value;

        this.uncache();
        let bounds = this.getBounds();
        this.cache(0, 0, bounds.width, bounds.height);
    }

    constructor(text: string, font: string, color: string) {
        let font_id = "font_" + font.replace(/\s/g, "_").replace(/'/g, "").toLowerCase();
        if (!(font_id in Game.FontSpriteSheets)) {
            throw new Error("Sprite sheet not found for fond ID: " + font_id);
        }

        super(text, Game.FontSpriteSheets[font_id]);
        let bounds = this.getBounds();
        this.cache(0, 0, bounds.width, bounds.height);

        if (color) {
            this.color = color;
        }
    }
}
