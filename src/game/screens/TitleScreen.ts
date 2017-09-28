/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import * as screens from ".";
import { Button } from "..";
import { Game } from "../Main";     // Needs to be separate for some reason
import { TextMenu } from "../ui/TextMenu";
import * as colors from "../Colors";

export class TitleScreen extends screens.BaseScreen {
    protected _textMenu: TextMenu;

    handleKeyDown(key_code: number): void {
        if (key_code === Button.DOWN) {
            this._textMenu.selectNextRow();
        }
        else if (key_code === Button.UP) {
            this._textMenu.selectPrevRow();
        }
        else if (key_code === Button.A) {
            let selection = this._textMenu.selectedItem;
            switch(selection) {
                case "new_game":
                    this.gameInstance.popScreen();
                    let game_screen = new screens.GameScreen(this.gameInstance);
                    this.gameInstance.pushScreen(game_screen);
                    game_screen.loadMap(Game.Assets["map_dongola_temple"]);
                    break;
                case "continue_game":
                    break;
                case "options":
                    this.gameInstance.pushScreen(new screens.OptionsScreen(this.gameInstance, this));
            }
        }
    }

    handleKeyUp(key_code: number): void {
    }

    update(delta: number): void {
    }

    protected _init(): void {
        this.container.addChild(new createjs.Bitmap(Game.Assets["img_title_screen"]));

        let text_menu = new TextMenu(50, 85, colors.GB_COLOR_LIGHT_GREEN, 5);
        text_menu.addItem("new_game", "New Game");
        if (localStorage.getItem("gameSave") === "1") {
            text_menu.addItem("continue_game", "Continue");
        }
        text_menu.addItem("options", "Options");
        this._textMenu = text_menu;

        this.container.addChild(text_menu.container);
    }
}
