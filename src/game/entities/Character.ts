/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { BaseMapObject } from "../BaseMapObject";
import { Direction, directionToString } from "../Direction";

export class Character extends BaseMapObject {
    /** Pixels per second */
    walkSpeed: number;

    protected _spriteSheet: createjs.SpriteSheet;

    protected _isWalking: boolean;
    get isWalking(): boolean {
        return this._isWalking;
    }

    set isWalking(value: boolean) {
        if (value) {
            this._sprite.gotoAndPlay("walk_" + directionToString(this._direction));
        }
        else {
            this._sprite.gotoAndStop("stand_" + directionToString(this._direction));
        }
    }

    protected _direction: number;
    get direction(): number {
        return this._direction;
    }

    set direction(dir: number) {
        this._direction = dir;
        if (this._sprite) {
            if (this._isWalking) {
                this._sprite.gotoAndPlay("walk_" + directionToString(dir));
            }
            else {
                this._sprite.gotoAndStop("stand_" + directionToString(dir));
            }
        }
    }

    constructor(name: string, walk_speed: number, sprite_sheet: createjs.SpriteSheet, bounding_box?: createjs.Rectangle) {
        super(name, sprite_sheet, "stand_west", true, bounding_box);
        this.walkSpeed = walk_speed;
    }

    getSprite(): createjs.Sprite {
        super.getSprite();
        this._sprite.gotoAndStop("stand_west");

        return this._sprite;
    }
}
