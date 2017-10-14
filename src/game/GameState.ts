/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { IInventorySlot, Direction, truncateFloat, compactInventorySlot, decompactInventorySlot } from ".";
import { IStats, compactStats, decompactStats } from "./entities";

export const VERSION = 0.31;

// The total number of keys in a game state object (UPDATE WHEN ADDING/DELETING KEYS!!)
const NUMBER_OF_KEYS = 11;

export interface IGameState {
    // Version of the save format
    version: number;
    // Player acquired the "fox hole" inventory
    hasInventory: boolean;
    // Player's inventory
    inventory: IInventorySlot[];
    // Items that have been consumed. { id: end_time } unless storing, then { id: time_ms_left }
    consumedItems: { [id: string]: number };
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
    // Character is human
    isHuman: boolean;
}

/**
 * Creates a new default game state object
 */
export function createDefaultGameState(): IGameState {
    return {
        version: VERSION,
        hasInventory: false,
        inventory: [],
        consumedItems: {},
        level: 1,
        xp: 0,
        baseStats: {
            // Default player attributes may be subject to change
            maxHealth: 100,
            power: 4,
            defense: 2,
            speed: 5,
            luck: 0.10
        },
        map: "map_dongola_temple",
        // Use default spawn point
        playerCoords: null,
        playerDir: Direction.DOWN,
        isHuman: true
    };
}

/**
 * Creates a compact version of a game state object for saving by using an array
 * instead of an object
 */
export function compactGameState(game_state: IGameState): any[] {
    let compact_inventory = [];
    for (let slot of game_state.inventory) {
        compact_inventory.push(compactInventorySlot(slot));
    }

    let consumed_items: { [id: string]: number } = {};
    for (let item in game_state.consumedItems) {
        if (game_state.consumedItems.hasOwnProperty(item)) {
            consumed_items[item] = Math.floor(game_state.consumedItems[item] - createjs.Ticker.getTime());
        }
    }

    return [
        game_state.version,
        game_state.hasInventory,
        compact_inventory,
        consumed_items,
        game_state.level,
        game_state.xp,
        compactStats(game_state.baseStats),
        game_state.map,
        { x: truncateFloat(game_state.playerCoords.x, 3), y: truncateFloat(game_state.playerCoords.y, 3) },
        game_state.playerDir,
        Number(game_state.isHuman)
    ];
}

/**
 * Decompacts a game state object that was previously compacted with the
 * compactGameState function.
 */
export function decompactGameState(game_state: any[]): IGameState {
    if (game_state === null || game_state.length !== NUMBER_OF_KEYS) {
        // Invalid
        return null;
    }

    let inventory = [];
    for (let slot of game_state[2]) {
        inventory.push(decompactInventorySlot(slot));
    }

    let consumed_items: { [id: string]: number } = {};
    for (let item in game_state[3]) {
        if (game_state[3].hasOwnProperty(item)) {
            consumed_items[item] = createjs.Ticker.getTime() + game_state[3][item];
        }
    }

    return {
        version: game_state[0],
        hasInventory: game_state[1],
        inventory: inventory,
        consumedItems: consumed_items,
        level: game_state[4],
        xp: game_state[5],
        baseStats: decompactStats(game_state[6]),
        map: game_state[7],
        playerCoords: game_state[8],
        playerDir: game_state[9],
        isHuman: Boolean(game_state[10])
    };
}
