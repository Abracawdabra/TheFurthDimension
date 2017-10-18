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
    level: number;
}

export class Enemy extends NPC {
    // Only used in calculating rewards for player
    level: number;

    // Used to pause aggrovated enemies from attacking while the player is busy
    pauseAggro: boolean;

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
            if (this._wanderBounds) {
                this.wander = true;
            }
        }
        this._isAggrovated = value;
    }

    // A reference to the player for following and stuff
    protected _player: Character;

    constructor(parent: GameScreen, spatial_grid: SpatialGrid, name: string, x: number, y: number, sprite_name: string, sprite_sheet: createjs.SpriteSheet, player: Character, hitbox?: createjs.Rectangle, projectiles_hitbox?: createjs.Rectangle, interaction_id?: string, settings?: IEnemySettings) {
        super(parent, spatial_grid, name, x, y, sprite_name, sprite_sheet, hitbox, projectiles_hitbox, interaction_id, settings);
        this.level = settings.level;
        this.isAggrovated = false;
        this.pauseAggro = false;
        this._player = player;
        this._baseStats = settings.stats;
        this.updateCalculatedStats();
    }

    /** @override */
    update(delta: number): void {
        super.update(delta);
        if (this._isAggrovated && this._isAlive && !this.pauseAggro) {
        }
    }

    /** @override */
    inflictDamage(amount: number): void {
        super.inflictDamage(amount);
        if (!this.isAggrovated && this.isAlive) {
            // Getting hit triggers aggro
            this.isAggrovated = true;
        }
    }

    /** @override */
    updateCalculatedStats(): void {
        let stats = this._calculatedStats;
        let base_stats = this._baseStats;
        stats.maxHealth = base_stats.maxHealth;
        if (typeof this.health !== "number") {
            // Health wasn't set yet
            this.health = stats.maxHealth;
        }
        stats.power = base_stats.power * 10;
        stats.defense = base_stats.defense * 10;
        stats.speed = base_stats.speed * 10;
        stats.luck = base_stats.luck;
    }

    /**
     * Destroys the sprite and removes itself from the spatial grid
     */
    destroy(): void {
        this.destroySprite();
        this._spatialGrid.removeObject(this);
    }

    protected _attack(): void {
        this.parent.performCharacterAttack(this);
    }
}
