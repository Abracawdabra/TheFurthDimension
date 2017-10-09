/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { IInventoryItem, Direction } from ".";
import { IStats } from "./entities";

export const VERSION = 0.1;

export interface IGameState {
    // Version of the save format
    version: number;
    // Player acquired the "fox hole" inventory
    hasInventory: boolean;
    // Player's inventory
    inventory: IInventoryItem[];
    // Player's stats
    stats: IStats;
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
        stats: {
            // Default player attributes may be subject to change
            health: 100,
            maxHealth: 100,
            strength: 4,
            defense: 2,
            speed: 0,
            critChance: 0
        },
        map: "map_dongola_temple",
        // Use default spawn point
        playerCoords: null,
        playerDir: Direction.DOWN
    };
}
