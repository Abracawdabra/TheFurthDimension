/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { BaseScreen } from ".";
import { Buttons } from "..";
import { Game } from "../Main";     // Needs to be separate for some reason

export class TitleScreen extends BaseScreen {
    handleKeyDown(key_code: number): void {
    }

    handleKeyUp(key_code: number): void {

    }

    update(delta: number): void {

    }

    protected _init(): void {
        this.container.addChild(new createjs.Bitmap(Game.Assets["img_title_screen"]));
    }
}
