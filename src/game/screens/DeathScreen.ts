/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { BaseScreen } from ".";
import { ScreenFade, BitmapText, TextMenu } from "../ui";
import * as colors from "../Colors";
import { Button } from "../Buttons";
import { Game } from "../Main";

export class DeathScreen extends BaseScreen {
    protected _screenFade: ScreenFade;
    protected _textMenu: TextMenu;

    handleKeyDown(key_code: number): void {
        if (this._textMenu) {
            switch (key_code) {
                case Button.A:
                case Button.START:
                    if (this._textMenu.selectedItem === "yes") {
                        this.gameInstance.continueGame();
                    }
                    else {
                        this.gameInstance.quitGame();
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
        this._screenFade = new ScreenFade();
        this._screenFade.on("fadeend", this._onFadeEnd, this, true);
        this.container.addChild(this._screenFade);
    }

    protected _onFadeEnd(event: createjs.Event): void {
        let text = new BitmapText("Try Again?", "8px Press Start", colors.LIGHTEST);
        text.x = Game.CENTER_X - Math.floor(text.getBounds().width / 2);
        text.y = Game.CENTER_Y - 8;
        this.container.addChild(text);

        let menu = new TextMenu(0, Game.CENTER_Y + 10, colors.LIGHTEST, 4);
        menu.addItem("yes", "Yes");
        menu.addItem("no", "No");
        menu.container.x = 68;
        menu.selectedItem = "yes";
        this.container.addChild(menu.container);
        this._textMenu = menu;
    }
}
