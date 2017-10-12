/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { Direction, directionToString, BaseMapObject, IInventorySlot, Weapons, IWeapon, ArmorPieces, Consumables, InventoryItemType, truncateFloat } from "..";
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
    luck: number;
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
        truncateFloat(stats.luck, 3)
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
        luck: compact_stats[4]
    }
}

export class Character extends BaseMapObject {
    inventory: IInventorySlot[];
    consumedItems: { [id: string]: number };
    health: number;

    protected _isAlive: boolean;
    get isAlive(): boolean {
        return this._isAlive;
    }

    // Base stats
    protected _baseStats: IStats;

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

    // ID of the currently equipped weapon
    protected _currentWeaponID: string;
    get currentWeaponID(): string {
        return this._currentWeaponID;
    }

    // Reference to current weapon sprite when attacking
    protected _weaponSprite: createjs.Sprite;
    set weaponSprite(sprite: createjs.Sprite) {
        this._weaponSprite = sprite;
        sprite.on("animationend", this._onWeaponSpriteAnimEnd, this, true);
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
            luck: 0.0
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

    setBaseStats(base_stats: IStats): void {
        this._baseStats = base_stats;
    }

    /**
     * Equips an inventory item
     * @param {number|IInventorySlot} slot Inventory array index or slot object
     */
    equipItem(slot: number | IInventorySlot): boolean {
        if (!this.inventory) {
            return false;
        }

        let stats = this._calculatedStats;
        let slot_obj: IInventorySlot;
        if (typeof slot === "number") {
            if (slot < 0 || slot >= this.inventory.length) {
                return false;
            }

            slot_obj = this.inventory[slot];
        }
        else {
            slot_obj = slot;
        }

        switch (slot_obj.itemType) {
            case InventoryItemType.WEAPON:
                for (let inv_slot of this.inventory) {
                    // Unequip any other weapons
                    if (inv_slot.itemType === InventoryItemType.WEAPON && inv_slot.equipped) {
                        this.unequipItem(inv_slot);
                    }
                }

                slot_obj.equipped = true;
                let weapon = Weapons[slot_obj.itemID];
                this._currentWeaponID = slot_obj.itemID;
                stats.power += weapon.power * 10;
                if (weapon.defense) {
                    stats.defense += weapon.defense * 10;
                }

                if (weapon.maxHealth) {
                    stats.maxHealth += weapon.maxHealth;
                }

                if (weapon.speed) {
                    stats.speed += weapon.speed * 10;
                }

                if (weapon.luck) {
                    stats.luck = Math.min(stats.luck + weapon.luck, 1.0);
                }
                break;
            case InventoryItemType.ARMOR_PIECE:
                let armor_piece = ArmorPieces[slot_obj.itemID];
                for (let inv_slot of this.inventory) {
                    // Unequip any other armor pieces of this location type
                    if (inv_slot.itemType === InventoryItemType.ARMOR_PIECE
                    && ArmorPieces[inv_slot.itemID].location === armor_piece.location
                    && inv_slot.equipped) {
                        this.unequipItem(inv_slot);
                    }
                }

                slot_obj.equipped = true;
                stats.defense += armor_piece.defense * 10;

                if (armor_piece.speed) {
                    stats.speed += armor_piece.speed * 10;
                }

                if (armor_piece.luck) {
                    stats.luck = Math.min(stats.luck + armor_piece.luck, 1.0);
                }
        }
        return true;
    }

    /**
     * Unequips an inventory item
     * @param {number|IInventorySlot} slot Inventory array index or slot object
     */
    unequipItem(slot: number | IInventorySlot): boolean {
        if (this.inventory) {
            let slot_obj: IInventorySlot;
            if (typeof slot === "number") {
                if (slot < 0 || slot >= this.inventory.length) {
                    return false;
                }
                slot_obj = this.inventory[<number>slot];
            }
            else {
                slot_obj = slot;
            }

            slot_obj.equipped = false;
            let stats = this._calculatedStats;
            if (slot_obj.itemType === InventoryItemType.WEAPON) {
                this._currentWeaponID = null;
                let weapon = Weapons[slot_obj.itemID];
                stats.power -= weapon.power * 10;

                if (weapon.defense) {
                    stats.defense -= weapon.defense * 10;
                }

                if (weapon.maxHealth) {
                    stats.maxHealth -= weapon.maxHealth;
                }

                if (weapon.speed) {
                    stats.speed -= weapon.speed * 10;
                }

                if (weapon.luck) {
                    stats.luck = Math.max(stats.luck - weapon.luck, 0.0);
                }
            }
            else if (slot_obj.itemType === InventoryItemType.ARMOR_PIECE) {
                let armor_piece = ArmorPieces[slot_obj.itemID];
                stats.defense -= armor_piece.defense * 10;

                if (armor_piece.speed) {
                    stats.speed -= armor_piece.speed * 10;
                }

                if (armor_piece.luck) {
                    stats.luck = Math.max(stats.luck - armor_piece.luck, 0.0);
                }
            }
            return true;
        }

        return false;
    }

    /**
     * Consumes an inventory item
     * @param {number|IInventorySlot} slot Inventory array index or slot object
     */
    consumeItem(slot: number | IInventorySlot): boolean {
        let slot_obj: IInventorySlot;
        if (typeof slot === "number") {
            if (slot < 0 || slot >= this.inventory.length) {
                return false;
            }

            slot_obj = this.inventory[slot];
        }
        else {
            slot_obj = slot;
        }

        if (!(slot_obj.itemID in Consumables)) {
            return false;
        }

        if (slot_obj.itemID in this.consumedItems) {
            // Stack duration
            this.consumedItems[slot_obj.itemID] += Consumables[slot_obj.itemID].duration * 1000;
        }
        else {
            let stats = this._calculatedStats;
            let consumable = Consumables[slot_obj.itemID];
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
                stats.maxHealth += consumable.maxHealth;
            }

            if (consumable.luck) {
                stats.luck = Math.min(stats.luck + consumable.luck, 1.0);
            }

            this.consumedItems[slot_obj.itemID] = createjs.Ticker.getTime() + (consumable.duration * 1000);
        }
    }

    /**
     * Updates cached calculated stats
     */
    updateCalculatedStats(): void {
        let stats = this._calculatedStats;

        // Reset to base stats
        stats.maxHealth = this._baseStats.maxHealth;
        stats.power = this._baseStats.power * 10;
        stats.defense = this._baseStats.defense * 10;
        stats.speed = this._baseStats.speed * 10;
        stats.luck = this._baseStats.luck;

        if (this.inventory) {
            for (let slot of this.inventory) {
                if (slot.equipped) {
                    // A tiny hack to reuse code (albeit slower)
                    slot.equipped = false;
                    this.equipItem(slot);
                }
                else if (slot.itemType === InventoryItemType.CONSUMABLE && slot.itemID in this.consumedItems && slot.itemID in Consumables) {
                    let consumable = Consumables[slot.itemID];
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
                        stats.maxHealth += consumable.maxHealth;
                    }

                    if (consumable.luck) {
                        stats.luck = Math.min(stats.luck + consumable.luck, 1.0);
                    }
                }
            }
        }

        if (!this.health && this.health !== 0) {
            // Set health since it doesn't exist
            this.health = stats.maxHealth;
        }
    }

    update(delta: number): void {
        if (this._isAlive) {
            if (this.consumedItems) {
                let time = createjs.Ticker.getTime();
                let stats = this._calculatedStats;
                for (let item_id in this.consumedItems) {
                    if (this.consumedItems.hasOwnProperty(item_id) && this.consumedItems[item_id] <= time) {
                        delete this.consumedItems[item_id];
                        let item = Consumables[item_id];
                        if (item.maxHealth) {
                            stats.maxHealth -= item.maxHealth;
                            if (this.health > stats.maxHealth) {
                                this.health = stats.maxHealth;
                            }
                        }

                        if (item.power) {
                            stats.power -= item.power;
                        }

                        if (item.defense) {
                            stats.defense -= item.defense;
                        }

                        if (item.speed) {
                            stats.speed -= item.speed;
                        }

                        if (item.luck) {
                            stats.luck -= item.luck;
                        }
                    }
                }
            }

            if (this._isBlinking && this._sprite) {
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
    }

    inflictDamage(amount: number): void {
        if (this._baseStats && this._isAlive) {
            // They are killable
            let damage = Math.max(amount - this.stats.defense, 1);
            this.health = Math.max(this.health - damage, 0);
            if (this.health === 0) {
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

        if (this._weaponSprite) {
            this._weaponSprite.removeAllEventListeners();
            this._onWeaponSpriteAnimEnd();
        }
    }

    protected _onWeaponSpriteAnimEnd(event?: createjs.Event): void {
        this._weaponSprite.parent.removeChild(this._weaponSprite);
        this._weaponSprite = null;
    }
}
