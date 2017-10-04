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
        switch (key_code) {
            case Button.A:
            case Button.START:
                switch(this._textMenu.selectedItem) {
                    case "new_game":
                        this.gameInstance.popScreen();
                        let game_screen = new screens.GameScreen(this.gameInstance);
                        this.gameInstance.pushScreen(game_screen);
                        /** @todo Show intro screen before the map */
                        game_screen.loadMap(Game.Assets["map_dongola_temple"]);
                        break;
                    case "continue_game":
                        /** @todo Implement */
                        break;
                    case "options":
                        this.gameInstance.pushScreen(new screens.OptionsScreen(this.gameInstance, this));
                }
                break;
            case Button.UP:
                this._textMenu.selectPrevRow();
                break;
            case Button.DOWN:
                this._textMenu.selectNextRow();
        }
    }

    handleKeyUp(key_code: number): void {
    }

    update(delta: number): void {
    }

    protected _init(): void {
        this.container.addChild(new createjs.Bitmap(Game.Assets["img_title_screen"]));

        let text_menu = new TextMenu(50, 85, colors.LIGHT, 5);
        text_menu.addItem("new_game", "New Game");
        if (localStorage.getItem("gameSave") === "1") {
            text_menu.addItem("continue_game", "Continue");
        }
        text_menu.addItem("options", "Options");
        this._textMenu = text_menu;

        this.container.addChild(text_menu.container);
    }
}
