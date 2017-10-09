/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import * as screens from ".";
import { Button } from "..";
import { Game } from "../Main";     // Needs to be separate for some reason
import { TextMenu, BorderBox, BitmapText } from "../ui";
import * as colors from "../Colors";

export class TitleScreen extends screens.BaseScreen {
    protected _textMenu: TextMenu;
    protected _confirmDeleteSaveBox: BorderBox;
    protected _confirmDeleteSaveMenu: TextMenu;

    handleKeyDown(key_code: number): void {
        if (this._confirmDeleteSaveMenu) {
            switch (key_code) {
                case Button.LEFT:
                    this._confirmDeleteSaveMenu.selectPrevColumn();
                    break;
                case Button.RIGHT:
                    this._confirmDeleteSaveMenu.selectNextColumn();
                    break;
                case Button.A:
                case Button.START:
                    if (this._confirmDeleteSaveMenu.selectedItem === "yes") {
                        this.gameInstance.deleteGameSave();
                    }
                    this.container.removeChild(this._textMenu.container);
                    this._generateMenu();
                    this.container.addChild(this._textMenu.container);
                case Button.B:
                    this.container.removeChild(this._confirmDeleteSaveBox);
                    this._confirmDeleteSaveBox = null;
                    this._confirmDeleteSaveMenu = null;
            }
        }
        else {
            switch (key_code) {
                case Button.A:
                case Button.START:
                    switch(this._textMenu.selectedItem) {
                        case "new_game":
                            this.gameInstance.startNewGame();
                            break;
                        case "continue_game":
                            this.gameInstance.continueGame();
                            break;
                        case "delete_save":
                            this._confirmDeleteSave();
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
    }

    handleKeyUp(key_code: number): void {
    }

    update(delta: number): void {
    }

    protected _init(): void {
        this.container.addChild(new createjs.Bitmap(Game.Assets["img_title_screen"]));

        this._generateMenu();

        this.container.addChild(this._textMenu.container);
    }

    protected _generateMenu(): void {
        let text_menu = new TextMenu(45, 85, colors.LIGHT, 5);
        text_menu.addItem("new_game", "New Game");
        if (localStorage.getItem("TFD_GAMESAVE") !== null) {
            text_menu.addItem("continue_game", "Continue");
            text_menu.addItem("delete_save", "Delete Save");
        }
        text_menu.addItem("options", "Options");
        this._textMenu = text_menu;
    }

    protected _confirmDeleteSave(): void {
        let confirm_text = new BitmapText("Delete save?", "8px Press Start", colors.DARKEST);
        let confirm_text_bounds = confirm_text.getBounds();
        let confirm_box = new BorderBox(confirm_text_bounds.width + 24, 44, colors.LIGHTEST);
        confirm_text.x = 12;
        confirm_text.y = 12;
        confirm_box.addChild(confirm_text);

        let confirm_box_bounds = confirm_box.getBounds();
        let confirm_menu = new TextMenu(0, confirm_text.y + 12, colors.DARKEST, 0, 40);
        confirm_menu.addItem("yes", "Yes");
        confirm_menu.addItem("no", "No", true);
        confirm_menu.selectedItem = "no";
        let confirm_menu_bounds = confirm_menu.container.getBounds();
        confirm_menu.container.x = Math.floor(confirm_box_bounds.width / 2) - Math.floor(confirm_menu_bounds.width / 2);
        confirm_box.addChild(confirm_menu.container);

        confirm_box.x = Game.CENTER_X - Math.floor(confirm_box_bounds.width / 2);
        confirm_box.y = Game.CENTER_Y - Math.floor(confirm_box_bounds.height / 2);
        this.container.addChild(confirm_box);

        this._confirmDeleteSaveBox = confirm_box;
        this._confirmDeleteSaveMenu = confirm_menu;
    }
}
