/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { BaseScreen, OptionsScreen, GameScreen } from ".";
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

    protected _statsBox: BorderBox;

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
        else if (this._statsBox) {
            switch (key_code) {
                case Button.A:
                case Button.B:
                    this.container.removeChild(this._statsBox);
                    this._statsBox = null;
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
                            this._showStats();
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

    protected _showStats(): void {
        if (this._statsBox) {
            this.container.removeChild(this._statsBox);
        }

        let game_screen = <GameScreen>this.parent;
        let player = game_screen.getPlayer();

        let stats_box = new BorderBox(DISPLAY_WIDTH, 140, colors.LIGHTEST);
        let level_txt = new BitmapText("LVL: " + this.gameInstance.gameState.level, "7px Press Start", colors.DARKEST);
        level_txt.x = 12;
        level_txt.y = 12;
        stats_box.addChild(level_txt);

        let xp_label_txt = new BitmapText("XP:", "7px Press Start", colors.DARKEST);
        xp_label_txt.x = level_txt.x;
        xp_label_txt.y = level_txt.y + 10;
        let xp_txt = new BitmapText(this.gameInstance.gameState.xp + "/" + game_screen.getXPRequiredForLevel(this.gameInstance.gameState.level + 1), "7px Press Start", colors.DARKEST);
        xp_txt.x = 20;
        xp_txt.y = xp_label_txt.y + 9;
        stats_box.addChild(xp_label_txt);
        stats_box.addChild(xp_txt);

        let health_label_txt = new BitmapText("HEALTH:", "7px Press Start", colors.DARKEST);
        health_label_txt.x = level_txt.x;
        health_label_txt.y = xp_txt.y + 10;
        let health_txt = new BitmapText(player.health + "/" + player.stats.maxHealth, "7px Press Start", colors.DARKEST);
        health_txt.x = 20;
        health_txt.y = health_label_txt.y + 9;
        stats_box.addChild(health_label_txt);
        stats_box.addChild(health_txt);

        let power_label_txt = new BitmapText("POWER:", "7px Press Start", colors.DARKEST);
        power_label_txt.x = level_txt.x;
        power_label_txt.y = health_txt.y + 10;
        let power_txt = new BitmapText(Math.floor(player.stats.power / 10).toString(), "7px Press Start", colors.DARKEST);
        power_txt.x = 20;
        power_txt.y = power_label_txt.y + 9;
        stats_box.addChild(power_label_txt);
        stats_box.addChild(power_txt);

        let defense_label_txt = new BitmapText("DEFENSE:", "7px Press Start", colors.DARKEST);
        defense_label_txt.x = level_txt.x;
        defense_label_txt.y = power_txt.y + 10;
        let defense_txt = new BitmapText(Math.floor(player.stats.defense / 10).toString(), "7px Press Start", colors.DARKEST);
        defense_txt.x = 20;
        defense_txt.y = defense_label_txt.y + 9;
        stats_box.addChild(defense_label_txt);
        stats_box.addChild(defense_txt);

        let speed_label_txt = new BitmapText("SPEED:", "7px Press Start", colors.DARKEST);
        speed_label_txt.x = level_txt.x;
        speed_label_txt.y = defense_txt.y + 10;
        let speed_txt = new BitmapText(Math.floor(player.stats.speed / 10).toString(), "7px Press Start", colors.DARKEST);
        speed_txt.x = 20;
        speed_txt.y = speed_label_txt.y + 9;
        stats_box.addChild(speed_label_txt);
        stats_box.addChild(speed_txt);

        let luck_label_txt = new BitmapText("LUCK:", "7px Press Start", colors.DARKEST);
        luck_label_txt.x = level_txt.x;
        luck_label_txt.y = speed_txt.y + 10;
        let luck_txt = new BitmapText(Math.floor(player.stats.luck * 100) + "%", "7px Press Start", colors.DARKEST);
        luck_txt.x = 20;
        luck_txt.y = luck_label_txt.y + 9;
        stats_box.addChild(luck_label_txt);
        stats_box.addChild(luck_txt);

        this.container.addChild(stats_box);
        this._statsBox = stats_box;
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
