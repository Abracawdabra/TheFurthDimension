/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { Character } from "./Character";
import { Direction, InteractionHandlers, SpatialGrid, directionToString } from "..";
import { GameScreen, Axes } from "../screens";
import * as utils from "../Utils";

// How many seconds to wait between wander direction changes
const WANDER_DIR_CHANGE_PAUSE_DURATION = 2.0;

export interface INPCSettings {
    // Pixels per second
    walkSpeed?: number;
    // Enables/disables wandering
    wander?: boolean;
    // Bounds in local tile coordinates where the NPC will wander within
    wanderBounds?: createjs.Rectangle;
    // Minimum duration to wander in one direction (Seconds)
    wanderMinDirDuration?: number;
    // Maximum duration to wander in one direction (Seconds)
    wanderMaxDirDuration?: number;
}

export class NPC extends Character {
    // Bounds in local tile coordinates where the NPC will wander within
    protected _wanderBounds: createjs.Rectangle;
    get wanderBounds(): createjs.Rectangle {
        return this._wanderBounds.clone();
    }

    set wanderBounds(value: createjs.Rectangle) {
        if (value.x > 0 || value.y > 0) {
            console.log("Incorrect NPC wander bounds.");
        }
        else {
            // Convert to global pixel coordinates
            let map = this.parent.getMap();
            value.x = (Math.floor(this._x / map.tileWidth) + value.x) * map.tileWidth;
            value.y = (Math.floor(this._y / map.tileHeight) + value.y) * map.tileWidth;
            // Convert to pixel units
            value.width *= map.tileWidth;
            value.height *= map.tileHeight;
            this._wanderBounds = value;
        }
    }

    // Minimum duration to wander in one direction (Seconds)
    protected _wanderMinDirDuration: number;
    get wanderMinDirDuration(): number {
        return this._wanderMinDirDuration;
    }

    set wanderMinDirDuration(value: number) {
        this._wanderMinDirDuration = (value > 0) ? value : 0;
    }

    // Maximum duration to wander in one direction (Seconds)
    protected _wanderMaxDirDuration: number;
    get wanderMaxDirDuration(): number {
        return this._wanderMaxDirDuration;
    }

    set wanderMaxDirDuration(value: number) {
        if (!(value === 0.0 && this._wanderMinDirDuration === 0.0) && value <= this._wanderMinDirDuration) {
            console.log("NPC wander max direction duration is too low.");
        }
        else {
            this._wanderMaxDirDuration = value;
        }
    }

    // Time when the current wander duration ends
    protected _wanderDirDurationEndTime: number;

    protected _wander: boolean;
    get wander(): boolean {
        return this._wander;
    }

    set wander(value: boolean) {
        if (value) {
            let map = this.parent.getMap();
            let tile_x = Math.floor(this._x / map.tileWidth);
            let tile_y = Math.floor(this._y / map.tileHeight);
            if ((this._wanderMaxDirDuration > 0.0 && this.wanderMaxDirDuration <= this.wanderMinDirDuration)
                || !this._wanderBounds || Math.floor(this._wanderBounds.x / map.tileWidth) > tile_x || Math.floor(this.wanderBounds.y / map.tileHeight) > tile_y) {
                console.log("Invalid wander settings for NPC '" + this.name + "'.");
                if (this._wander) {
                    this._stopWandering();
                }
            }
            else {
                this._startWandering();
            }
        }
        else {
            this._stopWandering();
        }
    }

    // Pause between wander direction changes
    protected _wanderPause: boolean;

    constructor(parent: GameScreen, name: string, x: number, y: number, sprite_name: string, sprite_sheet: createjs.SpriteSheet, bounding_box?: createjs.Rectangle, interaction_id?: string, settings?: INPCSettings) {
        super(parent, name, x, y, sprite_name, sprite_sheet, bounding_box, interaction_id);

        if (settings) {
            this.walkSpeed = ("walkSpeed" in settings) ? settings.walkSpeed : this.walkSpeed;
            this.wanderMinDirDuration = ("wanderMinDirDuration" in settings) ? settings.wanderMinDirDuration : 0.0;
            this.wanderMaxDirDuration = ("wanderMaxDirDuration" in settings) ? settings.wanderMaxDirDuration : 0.0;

            if ("wanderBounds" in settings) {
                this.wanderBounds = settings.wanderBounds;
            }

            this.wander = ("wander" in settings) ? settings.wander : false;
        }
    }

    update(delta: number, spatial_grid: SpatialGrid): void {
        if (this._wander) {
            if (createjs.Ticker.getTime() > this._wanderDirDurationEndTime) {
                if (this._wanderPause) {
                    this._wanderPause = false;
                    this._changeWanderDirection();
                }
                else {
                    this._wanderPause = true;
                    this._wanderDirDurationEndTime = createjs.Ticker.getTime() + (WANDER_DIR_CHANGE_PAUSE_DURATION * 1000);
                    if (this._isWalking) {
                        this.isWalking = false;
                    }
                }
            }

            if (this._isWalking) {
                let move_amount = delta / 1000 * this.walkSpeed;
                let x_movement = 0;
                if (this._direction & Direction.LEFT) {
                    x_movement = -move_amount;
                }
                else if (this._direction & Direction.RIGHT) {
                    x_movement = move_amount;
                }

                let y_movement = 0;
                if (this._direction & Direction.UP) {
                    y_movement = -move_amount;
                }
                else if (this._direction & Direction.DOWN) {
                    y_movement = move_amount;
                }

                let new_x = this._x + x_movement;
                let new_y = this._y + y_movement;
                let bounding_box_left = new_x + this._boundingBox.x;
                let bounding_box_top = new_y + this._boundingBox.y;
                let bounding_box_right = bounding_box_left + this._boundingBox.width;
                let bounding_box_bottom = bounding_box_top + this._boundingBox.height;
                if (bounding_box_left >= this._wanderBounds.x
                && bounding_box_top >= this._wanderBounds.y
                && bounding_box_right <= this._wanderBounds.x + this._wanderBounds.width
                && bounding_box_bottom <= this._wanderBounds.y + this._wanderBounds.height) {
                    // Within wander bounds
                    let move_axes = (!this.collisionsEnabled) ? (Axes.X | Axes.Y) : this.parent.canMoveToPos(this, new_x, new_y);
                    if ((((this.direction & Direction.LEFT) || (this.direction & Direction.RIGHT)) && !(move_axes & Axes.X))
                    || (((this.direction & Direction.UP) || (this.direction & Direction.DOWN)) && !(move_axes & Axes.Y))) {
                        this.isWalking = false;
                    }
                    else {
                        if (move_axes & Axes.X && move_axes & Axes.Y) {
                            spatial_grid.updateObjectPos(this, new_x, new_y);
                        }
                        else if (move_axes & Axes.X) {
                            spatial_grid.updateObjectPos(this, new_x, this._y);
                        }
                        else if (move_axes & Axes.Y) {
                            spatial_grid.updateObjectPos(this, this._x, new_y);
                        }
                    }
                }
                else {
                    // Outside of wander bounds
                    this.isWalking = false;
                }
            }
        }
    }

    protected _startWandering(): void {
        this._wander = true;
        this._isWalking = true;
        this._changeWanderDirection();
    }

    protected _stopWandering(): void {
        this._wander = false;
        this._wanderDirDurationEndTime = 0;
        this.isWalking = false;
    }

    protected _changeWanderDirection(): void {
        if (!this._isWalking) {
            this._isWalking = true;
        }

        this._wanderDirDurationEndTime = createjs.Ticker.getTime() + (utils.randBetween(this._wanderMinDirDuration, this._wanderMaxDirDuration) * 1000);
        this.direction = NPC._getRandomDirection(this._direction);
    }

    protected static _getRandomDirection(exclude?: Direction): Direction {
        let directions = [Direction.LEFT, Direction.RIGHT, Direction.UP, Direction.DOWN];
        if (exclude) {
            directions.splice(directions.indexOf(exclude), 1);
        }

        return directions[Math.floor(Math.random() * directions.length - 0.01)];
    }
}
