/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { BaseScreen } from ".";
import { Buttons } from "..";
import { Game } from "../Main";     // Needs to be separate for some reason
import { TextMenu } from "../ui/TextMenu";
import * as colors from "../Colors";

export class TitleScreen extends BaseScreen {
    protected _textMenu: TextMenu;

    handleKeyDown(key_code: number): void {
        if (key_code === Buttons.DOWN) {
            this._textMenu.selectNextRow();
        }
        else if (key_code === Buttons.UP) {
            this._textMenu.selectPrevRow();
        }
    }

    handleKeyUp(key_code: number): void {
    }

    update(delta: number): void {
    }

    protected _init(): void {
        this.container.addChild(new createjs.Bitmap(Game.Assets["img_title_screen"]));

        let text_menu = new TextMenu(48, 85, colors.GB_COLOR_LIGHT_GREEN, 5);
        text_menu.addItem("new_game", "New Game");
        text_menu.addItem("continue_game", "Continue");
        text_menu.addItem("options", "Options");
        this._textMenu = text_menu;

        this.container.addChild(text_menu.container);
        let bounds = text_menu.container.getBounds();
    }
}
