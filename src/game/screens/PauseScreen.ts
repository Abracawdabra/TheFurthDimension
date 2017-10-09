/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { BaseScreen, OptionsScreen } from ".";
import { BorderBox, TextMenu, MessageBox, BitmapText } from "../ui";
import { Game, DISPLAY_HEIGHT, DISPLAY_WIDTH } from "../Main";
import { Button } from "../Buttons";
import * as colors from "../Colors";

const MENU_WIDTH = 84;
const MENU_HEIGHT = 74;

// Game save message box duration in milliseconds
const GAME_SAVE_MESSAGE_BOX_DURATION = 1500;

export class PauseScreen extends BaseScreen {
    protected _mainMenu: TextMenu;
    protected _mainBackground: BorderBox;

    protected _confirmQuitBox: BorderBox;
    protected _confirmQuitMenu: TextMenu;

    protected _gameSavedMessageBox: MessageBox;
    protected _gameSavedMessageBoxEndTime: number;

    handleKeyDown(key_code: number): void {
        if (this._confirmQuitMenu) {
            switch (key_code) {
                case Button.A:
                    if (this._confirmQuitMenu.selectedItem === "yes") {
                        this.gameInstance.quitGame();
                    }
                case Button.B:
                    this.container.removeChild(this._confirmQuitBox);
                    this._confirmQuitBox = null;
                    this._confirmQuitMenu = null;
                    break;
                case Button.LEFT:
                    this._confirmQuitMenu.selectPrevColumn();
                    break;
                case Button.RIGHT:
                    this._confirmQuitMenu.selectNextColumn();
                    break;
                case Button.START:
                    this.gameInstance.popScreen();
            }
        }
        else {
            switch (key_code) {
                case Button.UP:
                    this._mainMenu.selectPrevRow();
                    break;
                case Button.DOWN:
                    this._mainMenu.selectNextRow();
                    break;
                case Button.A:
                    switch(this._mainMenu.selectedItem) {
                        case "stats":
                            /** @todo Implement */
                            break;
                        case "inventory":
                            /** @todo Implement */
                            break;
                        case "save_game":
                            this._saveGame();
                            break;
                        case "options":
                            this.gameInstance.pushScreen(new OptionsScreen(this.gameInstance, this));
                            break;
                        case "quit":
                            this._quit();
                    }
                    break;
                case Button.B:
                case Button.START:
                    this.gameInstance.popScreen();
            }
        }
    }

    handleKeyUp(key_code: number): void {
    }

    update(delta: number): void {
        if (this._gameSavedMessageBox && this._gameSavedMessageBoxEndTime !== 0 && createjs.Ticker.getTime() >= this._gameSavedMessageBoxEndTime) {
            this.container.removeChild(this._gameSavedMessageBox);
            this._gameSavedMessageBox = null;
            this._gameSavedMessageBoxEndTime = 0;
        }
    }

    protected _init(): void {
        let main_bg = new BorderBox(MENU_WIDTH, MENU_HEIGHT - 8);
        main_bg.x = DISPLAY_WIDTH - MENU_WIDTH;
        this.container.addChild(main_bg);
        this._mainBackground = main_bg;

        let main_menu = new TextMenu(main_bg.x + 18, main_bg.y + 12, colors.DARKEST, 3);
        main_menu.addItem("stats", "Stats");
        if (this.gameInstance.gameState.hasInventory) {
            main_menu.addItem("inventory", "Inv.");
            main_bg.height = MENU_HEIGHT;
        }
        main_menu.addItem("save_game", "Save");
        main_menu.addItem("options", "Options");
        main_menu.addItem("quit", "Quit");
        this.container.addChild(main_menu.container);
        this._mainMenu = main_menu;

        this._gameSavedMessageBoxEndTime = 0;
    }

    protected _saveGame(): void {
        if (this._gameSavedMessageBox) {
            this.container.removeChild(this._gameSavedMessageBox);
        }

        this.gameInstance.saveGame();

        let message_box = new MessageBox("Game saved!");
        let mb_bounds = message_box.getBounds();
        message_box.x = Math.floor(DISPLAY_WIDTH / 2) - Math.floor(mb_bounds.width / 2);
        message_box.y = Math.floor(DISPLAY_HEIGHT / 2) - Math.floor(mb_bounds.height / 2);
        this.container.addChild(message_box);
        this._gameSavedMessageBox = message_box;
        this._gameSavedMessageBoxEndTime = createjs.Ticker.getTime() + GAME_SAVE_MESSAGE_BOX_DURATION;
    }

    protected _quit(): void {
        let confirm_text = new BitmapText("Are you sure you\n want to quit?", "8px Press Start", colors.DARKEST);
        let confirm_text_bounds = confirm_text.getBounds();
        let confirm_box = new BorderBox(confirm_text_bounds.width + (12 * 2), confirm_text_bounds.height + (12 * 2) + 12);
        let confirm_box_bounds = confirm_box.getBounds();
        confirm_box.x = Math.floor(DISPLAY_WIDTH / 2) - Math.floor(confirm_box_bounds.width / 2);
        confirm_box.y = Math.floor(DISPLAY_HEIGHT / 2) - Math.floor(confirm_box_bounds.height / 2);
        confirm_text.x = 12;
        confirm_text.y = 12;
        confirm_box.addChild(confirm_text);
        this._confirmQuitBox = confirm_box;

        let confirm_menu = new TextMenu(0, confirm_text.y + confirm_text_bounds.height + 8, colors.DARKEST, 0, 40);
        confirm_menu.addItem("yes", "YES");
        confirm_menu.addItem("no", "NO", true);
        confirm_menu.selectedItem = "no";
        confirm_menu.container.x = Math.floor(confirm_box_bounds.width / 2) - Math.floor(confirm_menu.container.getBounds().width / 2);
        confirm_box.addChild(confirm_menu.container);
        this._confirmQuitMenu = confirm_menu;

        this.container.addChild(confirm_box);
    }
}
