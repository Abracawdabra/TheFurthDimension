/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import * as screens from ".";
import { Button } from "..";
import { Game, TextSpeed, DISPLAY_WIDTH, DISPLAY_HEIGHT } from "../Main";     // Needs to be separate for some reason
import { TextMenu } from "../ui/TextMenu";
import * as colors from "../Colors";
import { BitmapText } from "../ui/BitmapText";

const SELECTED_TEXT_BLINK_INTERVAL = 500;

enum Option {
    NONE,
    DISPLAY_SCALE,
    TEXT_SPEED
}

export class OptionsScreen extends screens.BaseScreen {
    protected _displayScaleMenu: TextMenu;

    protected _txtTextSpeed: BitmapText;
    protected _textSpeedBlinkTime: number;

    protected _currentOption: Option;

    handleKeyDown(key_code: number): void {
        switch (key_code) {
            case Button.B:
                this.gameInstance.saveSettings();
                this.gameInstance.popScreen();
                break;
            case Button.A:
            case Button.DOWN:
                switch (this._currentOption) {
                    case Option.DISPLAY_SCALE:
                        this._currentOption = Option.TEXT_SPEED;
                        this._displayScaleMenu.showMarker(false);
                        this._textSpeedBlinkTime = createjs.Ticker.getTime() + SELECTED_TEXT_BLINK_INTERVAL;
                        break;
                    case Option.TEXT_SPEED:
                        this._currentOption = Option.DISPLAY_SCALE;
                        this._displayScaleMenu.showMarker(true);
                        this._txtTextSpeed.visible = true;
                        this._textSpeedBlinkTime = 0;
                }
                break;
            case Button.LEFT:
                switch (this._currentOption) {
                    case Option.DISPLAY_SCALE:
                        this._displayScaleMenu.selectPrevColumn();
                        let scale = this._displayScaleMenu.selectedItem;
                        this.gameInstance.setDisplayScale(parseInt(scale.substring(0, scale.length - 1), 10));
                        break;
                    case Option.TEXT_SPEED:
                        this._txtTextSpeed.visible = true;
                        this._textSpeedBlinkTime = createjs.Ticker.getTime() + SELECTED_TEXT_BLINK_INTERVAL;
                        switch (this.gameInstance.settings.textSpeed) {
                            case TextSpeed.MEDIUM:
                                this._setTextSpeed(TextSpeed.SLOW);
                                break;
                            case TextSpeed.FAST:
                                this._setTextSpeed(TextSpeed.MEDIUM);
                                break;
                            case TextSpeed.ULTRA:
                                this._setTextSpeed(TextSpeed.FAST);
                        }

                }
            break;
            case Button.RIGHT:
                switch (this._currentOption) {
                    case Option.DISPLAY_SCALE:
                        this._displayScaleMenu.selectNextColumn();
                        let scale = this._displayScaleMenu.selectedItem;
                        this.gameInstance.setDisplayScale(parseInt(scale.substring(0, scale.length - 1), 10));
                        break;
                    case Option.TEXT_SPEED:
                        this._txtTextSpeed.visible = true;
                        this._textSpeedBlinkTime = createjs.Ticker.getTime() + SELECTED_TEXT_BLINK_INTERVAL;
                        switch (this.gameInstance.settings.textSpeed) {
                            case TextSpeed.SLOW:
                                this.gameInstance.settings.textSpeed = TextSpeed.MEDIUM;
                                this._setTextSpeed(TextSpeed.MEDIUM);
                                break;
                            case TextSpeed.MEDIUM:
                                this._setTextSpeed(TextSpeed.FAST);
                                break;
                            case TextSpeed.FAST:
                                this._setTextSpeed(TextSpeed.ULTRA);
                        }
                }
            break;
            case Button.UP:
                switch (this._currentOption) {
                    case Option.DISPLAY_SCALE:
                        this._currentOption = Option.TEXT_SPEED;
                        this._displayScaleMenu.showMarker(false);
                        this._txtTextSpeed.visible = true;
                        this._textSpeedBlinkTime = createjs.Ticker.getTime() + SELECTED_TEXT_BLINK_INTERVAL;
                        break;
                    case Option.TEXT_SPEED:
                        this._currentOption = Option.DISPLAY_SCALE;
                        this._displayScaleMenu.showMarker(true);
                        this._txtTextSpeed.visible = true;
                        this._textSpeedBlinkTime = 0;
                }

        }

    }

    handleKeyUp(key_code: number): void {
    }

    update(delta: number): void {
        let time = createjs.Ticker.getTime();
        if (this._textSpeedBlinkTime && time >= this._textSpeedBlinkTime) {
            this._txtTextSpeed.visible = !this._txtTextSpeed.visible;
            this._textSpeedBlinkTime = time + SELECTED_TEXT_BLINK_INTERVAL;
        }
    }

    protected _init(): void {
        let background = new createjs.Shape();
        background.graphics.beginFill(colors.LIGHTEST);
        background.graphics.drawRect(0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT);
        this.container.addChild(background);
        let txt_title = this.container.addChild(new BitmapText("Options", "8px 'Press Start'", colors.DARKEST));
        txt_title.x = 2;
        txt_title.y = 2;

        let height = txt_title.getBounds().height;

        let txt_display = this.container.addChild(new BitmapText("Display:", "8px 'Press Start'", colors.DARKEST));
        txt_display.x = 2;
        txt_display.y = txt_title.y + height + 8;
        let display_scale_menu = new TextMenu(80, txt_display.y, colors.DARKEST, 0, 30);
        display_scale_menu.addItem("1x", "1x");
        display_scale_menu.addItem("2x", "2x", true);
        display_scale_menu.addItem("4x", "4x", true);
        this.container.addChild(display_scale_menu.container);
        switch (this.gameInstance.settings.displayScale) {
            case 1:
                display_scale_menu.selectedItem = "1x";
                break;
            case 2:
                display_scale_menu.selectedItem = "2x";
                break;
            case 4:
                display_scale_menu.selectedItem = "4x";
        }
        this._displayScaleMenu = display_scale_menu;

        let txt_text_speed = this.container.addChild(new BitmapText("Text Speed:", "8px 'Press Start'", colors.DARKEST));
        txt_text_speed.x = 2;
        txt_text_speed.y = txt_display.y + height + 4;
        let txt_text_speed_value = this.container.addChild(new BitmapText(OptionsScreen._getTextSpeedStr(this.gameInstance.settings.textSpeed), "8px 'Press Start'", colors.DARKEST));
        txt_text_speed_value.x = 102;
        txt_text_speed_value.y = txt_text_speed.y;
        this._txtTextSpeed = txt_text_speed_value;

        this._currentOption = Option.DISPLAY_SCALE;

        this._textSpeedBlinkTime = 0;
    }

    protected static _getTextSpeedStr(speed: TextSpeed): string {
        switch (speed) {
            case TextSpeed.SLOW:
                return "Slow";
            case TextSpeed.MEDIUM:
                return "Medium";
            case TextSpeed.FAST:
                return "Fast";
            case TextSpeed.ULTRA:
                return "Ultra";
        }

        return "";
    }

    protected _setTextSpeed(speed: TextSpeed): void {
        this.gameInstance.settings.textSpeed = speed;
        this._txtTextSpeed.setText(OptionsScreen._getTextSpeedStr(speed));
    }
}
