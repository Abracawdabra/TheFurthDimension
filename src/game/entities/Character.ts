/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { BaseMapObject } from "../BaseMapObject";
import { Direction, directionToString } from "../Direction";
import { GameScreen } from "../screens";

// Pixels per second
const DEFAULT_WALK_SPEED = 40;

export class Character extends BaseMapObject {
    // Pixels per second
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

        this._isWalking = value;
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

    constructor(parent: GameScreen, name: string, x: number, y: number, sprite_name: string, sprite_sheet: createjs.SpriteSheet, bounding_box?: createjs.Rectangle, interaction_id?: string) {
        super(parent, name, x, y, sprite_name, sprite_sheet, "stand_south", true, bounding_box, interaction_id);
        this.walkSpeed = DEFAULT_WALK_SPEED;
        this._isWalking = false;
    }

    getSprite(): createjs.Sprite {
        let new_sprite = !this._sprite;
        super.getSprite();
        if (new_sprite) {
            if (this._isWalking) {
                this._sprite.gotoAndPlay("walk_" + directionToString(this._direction));
            }
            else {
                this._sprite.gotoAndStop("stand_" + directionToString(this._direction));
            }
        }

        return this._sprite;
    }
}
