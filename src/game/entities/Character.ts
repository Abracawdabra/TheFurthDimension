/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { Direction, directionToString, BaseMapObject, IInventorySlot, IWeapon, IArmorPiece, IConsumable, InventoryItemType, truncateFloat } from "..";
import { GameScreen } from "../screens";

// Pixels per second
const DEFAULT_WALK_SPEED = 40;

// Damage blinking frame duration (milliseconds)
const BLINKING_EFFECT_FRAME_DURATION = 250;
// Damage blinking duration (milliseconds)
const BLINKING_EFFECT_DURATION = 2500;

export interface IStats {
    // Maximum possible health
    maxHealth: number;
    // Attack power
    power: number;
    // Defensive power
    defense: number;
    // Walking speed (x * 10 pixels per second)
    speed: number;
    // Critical hit chance percentage (0-1)
    critChance: number;
}

/**
 * Compacts a stats object for local storage
 */
export function compactStats(stats: IStats): any[] {
    return [
        stats.maxHealth,
        stats.power,
        stats.defense,
        stats.speed,
        truncateFloat(stats.critChance, 3)
    ];
}

export function decompactStats(compact_stats: any[]): IStats {
    if (!compact_stats) {
        return null;
    }

    return {
        maxHealth: compact_stats[0],
        power: compact_stats[1],
        defense: compact_stats[2],
        speed: compact_stats[3],
        critChance: compact_stats[4]
    }
}

export class Character extends BaseMapObject {
    protected _health: number;
    get health(): number {
        return this._health;
    }

    protected _isAlive: boolean;
    get isAlive(): boolean {
        return this._isAlive;
    }

    // Base stats
    protected _baseStats: IStats;
    get baseStats(): IStats {
        return this._baseStats;
    }

    set baseStats(value: IStats) {
        this._baseStats = value;
        this.updateStats();
    }

    // Cached calculated stats
    protected _calculatedStats: IStats;
    get stats(): IStats {
        return this._calculatedStats;
    }

    // Blinking effect when damaged
    protected _isBlinking: boolean;
    protected _blinkingFrameTime: number;
    protected _blinkingEndTime: number;

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
        this._projectilesHitbox = projectiles_hitbox || this._hitbox;
        this._isWalking = false;
        this._direction = Direction.DOWN;
        this._calculatedStats = {
            maxHealth: 0,
            power: 0,
            defense: 0,
            // If character has no base stats, they still need walk speed defined
            speed: DEFAULT_WALK_SPEED,
            critChance: 0
        };
        this._isAlive = true;
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

    /**
     * Updates cached calculated stats
     * @param {IInventoryType[]} [used_items] Only items that are equipped or consumed
     */
    updateStats(used_items?: IInventorySlot[]): void {
        let stats = this._calculatedStats;
        let base_stats = this._baseStats;

        // Reset to base stats
        stats.maxHealth = base_stats.maxHealth * 10;
        stats.power = base_stats.power * 10;
        stats.defense = base_stats.defense * 10;
        stats.speed = base_stats.speed * 10;
        stats.critChance = base_stats.critChance * 10;

        if (used_items) {
            // A hash to make sure only one of each item is accounted for
            let accounted_items: { [id: string]: boolean } = {};
            for (let slot of used_items) {
                if (slot.item.name in accounted_items) {
                    continue;
                }

                accounted_items[slot.item.name] = true;;
                switch (slot.type) {
                    case InventoryItemType.WEAPON:
                        let weapon = <IWeapon>slot.item;
                        stats.power += weapon.power * 10;
                        if (weapon.defense) {
                            stats.defense += weapon.defense * 10;
                        }

                        if (weapon.maxHealth) {
                            stats.maxHealth += weapon.maxHealth * 10;
                        }

                        if (weapon.speed) {
                            stats.speed += weapon.speed * 10;
                        }
                        break;
                    case InventoryItemType.ARMOR_PIECE:
                        let armor = <IArmorPiece>slot.item;
                        stats.defense += armor.defense * 10;

                        if (armor.speed) {
                            stats.speed += armor.speed * 10;
                        }
                        break;
                    case InventoryItemType.CONSUMABLE:
                        let consumable = <IConsumable>slot.item;
                        if (consumable.power) {
                            stats.power += consumable.power * 10;
                        }

                        if (consumable.defense) {
                            stats.defense += consumable.defense * 10;
                        }

                        if (consumable.speed) {
                            stats.speed += consumable.speed * 10;
                        }

                        if (consumable.maxHealth) {
                            stats.maxHealth += consumable.maxHealth * 10;
                        }
                }
            }
        }
    }

    update(delta: number): void {
        if (this._isBlinking && this._isAlive && this._sprite) {
            let time = createjs.Ticker.getTime();
            if (time >= this._blinkingEndTime) {
                this._sprite.alpha = 1.0;
                this._isBlinking = false;
            }
            else if (time >= this._blinkingFrameTime) {
                this._sprite.alpha = Number(!this._sprite.alpha);
                this._blinkingFrameTime = createjs.Ticker.getTime() + BLINKING_EFFECT_FRAME_DURATION;
            }
        }
    }

    inflictDamage(amount: number): void {
        if (this._baseStats && this._isAlive) {
            // They are killable
            let damage = Math.max(amount - this.stats.defense, 1);
            this._health = Math.max(this._health - damage, 0);
            if (this._health === 0) {
                this.die();
            }
            else {
                this._isBlinking = true;
                this._blinkingFrameTime = createjs.Ticker.getTime() + BLINKING_EFFECT_FRAME_DURATION;
                this._blinkingEndTime = createjs.Ticker.getTime() + BLINKING_EFFECT_DURATION;
            }
        }
    }

    die(): void {
        this._isAlive = false;
        if (this._sprite) {
            this._sprite.alpha = 0.0;
        }
    }
}
