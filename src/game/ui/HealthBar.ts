/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { BitmapText } from ".";
import { Game } from "../Main";
import { Character } from "../entities";

const BAR_WIDTH = 44;
const BAR_HEIGHT = 6;

export class HealthBar extends createjs.Container {
    owner: Character;

    protected _border: createjs.Bitmap;
    protected _bar: createjs.Bitmap;
    protected _nameText: BitmapText;
    protected _speciesText: BitmapText;

    get value(): number {
        return Math.ceil((this._bar.sourceRect.width / BAR_WIDTH) * 100);
    }

    set value(percent: number) {
        let width = Math.ceil(BAR_WIDTH * (percent * 0.01));
        if (width <= 0) {
            this._bar.visible = false;
        }
        else {
            if (!this._bar.visible) {
                this._bar.visible = true;
            }
            this._bar.sourceRect.width = width;
        }
    }

    constructor(name?: string, species?: string, align = "right") {
        super();
        let border = new createjs.Bitmap(Game.Assets["ui_health_bar"]);
        border.setBounds(0, 0, BAR_WIDTH, BAR_HEIGHT);
        border.sourceRect = new createjs.Rectangle(0, 0, BAR_WIDTH, BAR_HEIGHT);
        this.addChild(border);
        this._border = border;

        let bar = new createjs.Bitmap(Game.Assets["ui_health_bar"]);
        bar.setBounds(0, 0, BAR_WIDTH, BAR_HEIGHT);
        bar.sourceRect = new createjs.Rectangle(0, BAR_HEIGHT, BAR_WIDTH, BAR_HEIGHT);
        this.addChild(bar);
        this._bar = bar;

        if (name) {
            let name_text = new BitmapText(name.toUpperCase(), "7px Sucky Outline");
            this._alignText(name_text, align);
            this.addChild(name_text);
            this._nameText = name_text;

            if (species) {
                name_text.y = 0
                let species_text = new BitmapText("THE " + species.toUpperCase(), "7px Sucky Outline");
                this._alignText(species_text, align);
                species_text.y = 9;
                this.addChild(species_text);
                this._speciesText = species_text;

                bar.y = border.y = 18;
            }
            else {
                bar.y = border.y = 9;
            }
        }
    }

    protected _alignText(text: BitmapText, align: string): void {
        let text_bounds = text.getBounds();
        if (align == "left") {
            text.x = this._border.x;
        }
        else if (align === "center") {
            text.x = this._border.x + Math.floor(BAR_WIDTH / 2) - Math.floor(text_bounds.width / 2);
        }
        else if (align === "right") {
            text.x = this._border.x + BAR_WIDTH - text_bounds.width;
        }
    }
}
