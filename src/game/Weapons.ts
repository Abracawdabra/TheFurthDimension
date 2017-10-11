/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

export enum WeaponType {
    DAGGER,     // Stabby
    SWORD,      // Slashy
    BOW         // Pewwy
}

export interface IWeapon {
    name: string;
    type: WeaponType;

    power: number;
    // Range is every 2 pixels
    range: number;

    // Optional stat increase/decrease properties
    maxHealth?: number;
    defense?: number;
    speed?: number;
    critChance?: number;
}

export var Weapons: { [id: string]: IWeapon } = {
    "dagger": {
        name: "Dagger",
        power: 6,
        range: 4,
        speed: 2,
        critChance: 0.2,
        type: WeaponType.DAGGER
    },
    "sword": {
        name: "Sword",
        power: 15,
        range: 6,
        critChance: 0.15,
        type: WeaponType.SWORD
    },
    "greatsword": {
        name: "Greatsword",
        power: 30,
        range: 10,
        speed: -1,
        critChance: 0.10,
        type: WeaponType.SWORD
    },
    "great_greatsword": {
        name: "Great Greatsword",
        power: 50,
        range: 17,
        speed: -2,
        critChance: 0.05,
        type: WeaponType.SWORD
    },
    "soulshredder": {
        name: "Soulshredder",
        power: 75,
        range: 14,
        maxHealth: 50,
        speed: 1,
        type: WeaponType.SWORD
    },
    "bow": {
        name: "Bow",
        power: 30,
        range: 50,
        speed: 1,
        critChance: 0.15,
        type: WeaponType.BOW
    }
}
