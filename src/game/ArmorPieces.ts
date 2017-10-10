/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

export enum ArmorPieceLocation {
    HEAD,
    TORSO,
    ARMS,
    LEGS
}

export interface IArmorPiece {
    name: string;
    location: ArmorPieceLocation;
    defense: number;

    // Optional stat increase/decrease properties
    speed?: number;
    critChance?: number;
}

export var ArmorPieces: { [id: string]: IArmorPiece } = {
    "helmet": {
        name: "Helmet",
        defense: 10,
        location: ArmorPieceLocation.HEAD
    },
    "breastplate": {
        name: "Breastplate",
        defense: 15,
        location: ArmorPieceLocation.TORSO
    },
    "multibreastplate": {
        name: "Multibreastplate",
        defense: 18,
        critChance: 0.15,
        location: ArmorPieceLocation.TORSO
    },
    "arm_bracers": {
        name: "Arm Bracers",
        defense: 6,
        location: ArmorPieceLocation.ARMS
    },
    "greaves": {
        name: "Greaves",
        defense: 4,
        location: ArmorPieceLocation.LEGS
    }
}
