/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { NPC, INPCSettings, Character, IStats } from ".";
import { GameScreen } from "../screens";
import { SpatialGrid } from "..";

export interface IEnemySettings extends INPCSettings {
    stats: IStats;
}

export class Enemy extends NPC {
    level: number;

    protected _isAggrovated: boolean;
    get isAggrovated(): boolean {
        return this._isAggrovated;
    }

    set isAggrovated(value: boolean) {
        if (value) {
            this.wander = false;
        }
        else {
            this.isWalking = false;
        }
        this._isAggrovated = value;
    }

    // A reference to the player for following and stuff
    protected _player: Character;

    constructor(parent: GameScreen, spatial_grid: SpatialGrid, name: string, x: number, y: number, sprite_name: string, sprite_sheet: createjs.SpriteSheet, player: Character, hitbox?: createjs.Rectangle, projectiles_hitbox?: createjs.Rectangle, interaction_id?: string, settings?: IEnemySettings) {
        super(parent, spatial_grid, name, x, y, sprite_name, sprite_sheet, hitbox, projectiles_hitbox, interaction_id, settings);
        this.isAggrovated = false;
        this._player = player;
    }

    /** @override */
    update(delta: number): void {
        super.update(delta);
        if (this._isAggrovated && this._isAlive) {
        }
    }

    /** @override */
    inflictDamage(amount: number): void {
        if (this._isAggrovated) {
            // Only take damage if aggrovated
            super.inflictDamage(amount);
        }
    }

    /**
     * Destroys the sprite and removes itself from the spatial grid
     */
    destroy() {
        this.destroySprite();
        this._spatialGrid.removeObject(this);
    }

    protected _attack(): void {
        this.parent.performCharacterAttack(this);
    }
}
