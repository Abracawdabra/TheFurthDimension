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
    weaponType: WeaponType;

    power: number;
    // Range is every 2 pixels
    range: number;

    // Optional stat increase/decrease properties
    maxHealth?: number;
    defense?: number;
    speed?: number;
    luck?: number;
}

export var Weapons: { [id: string]: IWeapon } = {
    "dagger": {
        name: "Dagger",
        power: 6,
        range: 4,
        speed: 2,
        luck: 0.2,
        weaponType: WeaponType.DAGGER
    },
    "sword": {
        name: "Sword",
        power: 15,
        range: 6,
        luck: 0.15,
        weaponType: WeaponType.SWORD
    },
    "greatsword": {
        name: "Greatsword",
        power: 30,
        range: 10,
        speed: -1,
        luck: 0.10,
        weaponType: WeaponType.SWORD
    },
    "great_greatsword": {
        name: "Great Greatsword",
        power: 50,
        range: 17,
        speed: -2,
        luck: 0.05,
        weaponType: WeaponType.SWORD
    },
    "soulshredder": {
        name: "Soulshredder",
        power: 75,
        range: 14,
        maxHealth: 50,
        speed: 1,
        weaponType: WeaponType.SWORD
    },
    "bow": {
        name: "Bow",
        power: 30,
        range: 50,
        speed: 1,
        luck: 0.15,
        weaponType: WeaponType.BOW
    }
}
