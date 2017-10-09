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
    power: number;
    // Range is every 2 pixels
    range: number;
    type: WeaponType;
}

export var Weapons: { [id: string]: IWeapon } = {
    "dagger": {
        name: "Dagger",
        power: 6,
        range: 4,
        type: WeaponType.DAGGER
    },
    "sword": {
        name: "Sword",
        power: 15,
        range: 6,
        type: WeaponType.SWORD
    },
    "greatsword": {
        name: "Greatsword",
        power: 30,
        range: 10,
        type: WeaponType.SWORD
    },
    "great_greatsword": {
        name: "Great Greatsword",
        power: 50,
        range: 17,
        type: WeaponType.SWORD
    },
    "soulshredder": {
        name: "Soulshredder",
        power: 85,
        range: 14,
        type: WeaponType.SWORD
    },
    "bow": {
        name: "Bow",
        power: 30,
        range: 50,
        type: WeaponType.BOW
    }
}
