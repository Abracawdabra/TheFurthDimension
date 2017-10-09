/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { BaseMapObject } from "../BaseMapObject";
import { Direction, directionToString } from "..";
import { GameScreen } from "../screens";

// Pixels per second
const DEFAULT_WALK_SPEED = 40;

export interface IStats {
    // Current health
    health: number;
    // Maximum possible health
    maxHealth: number;
    // Attack power
    strength: number;
    // Defensive power
    defense: number;
    // Increased speed
    speed: number;
    // Critical hit chance
    critChance: number;
}

export class Character extends BaseMapObject {
    // Pixels per second
    walkSpeed: number;

    // Calculated stats if any for this character
    stats: IStats;

    // Characters should have a different hitbox for projectiles or it would
    // be harder to shoot them by trying to guess where their normal hitbox is (usually near the bottom).
    protected _projectilesHitbox: createjs.Rectangle;

    protected _isWalking: boolean;
    get isWalking(): boolean {
        return this._isWalking;
    }

    set isWalking(value: boolean) {
        if (this._sprite) {
            this._sprite.gotoAndPlay((value ? "walk_" : "stand_") + directionToString(this._direction));
        }

        this._isWalking = value;
    }

    protected _direction: number;
    get direction(): number {
        return this._direction;
    }

    set direction(dir: number) {
        if (dir) {
            // Only change if dir is not 0 (That screws up the animations)
            this._direction = dir;
            if (this._sprite) {
                this._sprite.gotoAndPlay((this._isWalking ? "walk_" : "stand_") + directionToString(dir));
            }
        }
    }

    constructor(parent: GameScreen, name: string, x: number, y: number, sprite_name: string, sprite_sheet: createjs.SpriteSheet, hitbox?: createjs.Rectangle, projectiles_hitbox?: createjs.Rectangle, interaction_id?: string) {
        super(parent, name, x, y, sprite_name, sprite_sheet, "stand_south", true, hitbox, interaction_id);
        this.walkSpeed = DEFAULT_WALK_SPEED;
        this._projectilesHitbox = projectiles_hitbox || this._hitbox;
        this._isWalking = false;
        this._direction = Direction.DOWN;
    }

    /** @override */
    getSprite(): createjs.Sprite {
        let new_sprite = !this._sprite;
        super.getSprite();
        if (new_sprite) {
            this._sprite.gotoAndPlay((this._isWalking ? "walk_" : "stand_") + directionToString(this._direction));
        }

        return this._sprite;
    }

    getProjectilesHitbox(): createjs.Rectangle {
        return this._projectilesHitbox;
    }

    updateStats(): void {

    }
}
