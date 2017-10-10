/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { IInventorySlot, Direction, truncateFloat } from ".";
import { IStats, compactStats, decompactStats } from "./entities";

export const VERSION = 0.2;

export interface IGameState {
    // Version of the save format
    version: number;
    // Player acquired the "fox hole" inventory
    hasInventory: boolean;
    // Player's inventory
    inventory: IInventorySlot[];
    // Player's level
    level: number;
    // Player's current XP progress to next level
    xp: number;
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
        level: 1,
        xp: 0,
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

/**
 * Creates a compact version of a game state object for saving by using an array
 * instead of an object
 */
export function compactGameState(game_state: IGameState): any[] {
    return [
        game_state.version,
        game_state.hasInventory,
        game_state.inventory,
        game_state.level,
        game_state.xp,
        compactStats(game_state.baseStats),
        game_state.map,
        { x: truncateFloat(game_state.playerCoords.x, 3), y: truncateFloat(game_state.playerCoords.y, 3) },
        game_state.playerDir
    ];
}

/**
 * Decompacts a game state object that was previously compacted with the
 * compactGameState function.
 */
export function decompactGameState(game_state: any[]): IGameState {
    return {
        version: game_state[0],
        hasInventory: game_state[1],
        inventory: game_state[2],
        level: game_state[3],
        xp: game_state[4],
        baseStats: decompactStats(game_state[5]),
        map: game_state[6],
        playerCoords: game_state[7],
        playerDir: game_state[8]
    };
}
