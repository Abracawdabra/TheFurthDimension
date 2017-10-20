/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { NPC, INPCSettings, Character, IStats } from ".";
import { GameScreen } from "../screens";
import { SpatialGrid, DeathHandlers } from "..";
import { HealthBar } from "../ui";
import { DISPLAY_WIDTH, DISPLAY_HEIGHT } from "../Main";
import { getRandomSpecies } from "../Utils";

export interface IEnemySettings extends INPCSettings {
    stats: IStats;
    level: number;
    weaponID: string;
    deathHandlerID: string;
    species: string;
}

export class Enemy extends NPC {
    // Only used in calculating rewards for player
    level: number;

    // Used to pause aggrovated enemies from attacking while the player is busy
    pauseAggro: boolean;

    // ID for handler method when the enemy dies
    deathHandlerID: string;

    // Specified species (randomized if not set)
    species: string;

    // Health bar for this enemy
    protected _healthBar: HealthBar;
    get healthBar(): HealthBar {
        return this._healthBar;
    }

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
        this.level = settings.level || 1;
        this.isAggrovated = false;
        this.pauseAggro = false;
        this.deathHandlerID = settings.deathHandlerID;
        this.species = settings.species || getRandomSpecies();
        this._currentWeaponID = settings.weaponID;
        this._player = player;
        this._baseStats = settings.stats;

        this._healthBar = new HealthBar(this.name, (this.species !== "?") ? this.species : undefined, "center");
        let health_bar_bounds = this._healthBar.getBounds();
        this._healthBar.x = DISPLAY_WIDTH - health_bar_bounds.width - 2;
        this._healthBar.y = DISPLAY_HEIGHT - health_bar_bounds.height - 2;
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
        this._healthBar.value = (this.health / this.stats.maxHealth) * 100;
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

    /** @override */
    die(override_handler?: boolean): void {
        if (!override_handler && this.deathHandlerID && this.deathHandlerID in DeathHandlers) {
            // Ensure player gets rewarded by this enemy indicating it died
            this._isAlive = false;

            // Blinking effect will stop updating when "dead", so make the sprite visible
            this._isBlinking = false;
            this._sprite.alpha = 1.0;

            if (DeathHandlers[this.deathHandlerID].call(this)) {
                super.die();
            }
        }
        else {
            super.die();
        }
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
