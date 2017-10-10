/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { IInventorySlot, Direction } from ".";
import { IStats } from "./entities";

export const VERSION = 0.1;

export interface IGameState {
    // Version of the save format
    version: number;
    // Player acquired the "fox hole" inventory
    hasInventory: boolean;
    // Player's inventory
    inventory: IInventorySlot[];
    // Player's base stats
    baseStats: IStats;
    // Map the player is on
    map: string;
    // Player's location (only updated on save)
    playerCoords: { x: number, y: number };
    // Player's direction (only updated on save)
    playerDir: Direction;
}

/**
 * Creates a new default game state object
 */
export function createDefaultGameState(): IGameState {
    return {
        version: VERSION,
        hasInventory: false,
        inventory: [],
        baseStats: {
            // Default player attributes may be subject to change
            maxHealth: 10,
            power: 4,
            defense: 2,
            speed: 5,
            critChance: 0.10
        },
        map: "map_dongola_temple",
        // Use default spawn point
        playerCoords: null,
        playerDir: Direction.DOWN
    };
}
