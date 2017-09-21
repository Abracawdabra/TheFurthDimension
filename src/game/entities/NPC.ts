/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { Character } from "./Character";
import { Direction, InteractionHandlers } from "..";
import { GameScreen } from "../screens";

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
    // Interaction handler ID which corresponds to properties in src/game/InteractionHandlers.ts
    interactionID?: string;
}

export class NPC extends Character {
    parent: GameScreen;

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
                || !this._wanderBounds || this._wanderBounds.x > tile_x || this.wanderBounds.y > tile_y) {
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

    // Interaction handler ID which corresponds to properties in src/game/InteractionHandlers.ts
    protected _interactionID: string;

    constructor(parent: GameScreen, name: string, x: number, y: number, sprite_name: string, sprite_sheet: createjs.SpriteSheet, bounding_box?: createjs.Rectangle, settings?: INPCSettings) {
        super(parent, name, x, y, sprite_name, sprite_sheet, bounding_box);

        if (settings) {
            this.walkSpeed = ("walkSpeed" in settings) ? settings.walkSpeed : this.walkSpeed;
            this.wanderMinDirDuration = ("wanderMinDirDuration" in settings) ? settings.wanderMinDirDuration : 0.0;
            this.wanderMaxDirDuration = ("wanderMaxDirDuration" in settings) ? settings.wanderMaxDirDuration : 0.0;
            this._interactionID = ("interactionID" in settings) ? settings.interactionID : null;

            if ("wanderBounds" in settings) {
                this.wanderBounds = settings.wanderBounds;
            }

            this.wander = ("wander" in settings) ? settings.wander : false;
        }
    }

    getInteractionID(): string {
        return this._interactionID;
    }

    protected _startWandering(): void {
        this._wander = true;
        this._wanderDirDurationEndTime = createjs.Ticker.getTime() + this._getRandomWanderDirDuration();
        this.direction = this._getRandomDirection();
    }

    protected _stopWandering(): void {
        this._wander = false;
        this._wanderDirDurationEndTime = 0;
        this.isWalking = false;
    }

    interact(): void {
        if (this._interactionID in InteractionHandlers) {
            InteractionHandlers[this._interactionID].call(this);
        }
        else {
            InteractionHandlers["not_found"].call(this);
        }
    }

    protected _getRandomWanderDirDuration(): number {
        return (Math.random() * (this._wanderMaxDirDuration - this._wanderMinDirDuration)) + this._wanderMinDirDuration;
    }

    protected _getRandomDirection(): Direction {
        return [Direction.LEFT, Direction.RIGHT, Direction.UP, Direction.DOWN].indexOf(Math.floor(Math.random() * 3.9999));
    }
}
