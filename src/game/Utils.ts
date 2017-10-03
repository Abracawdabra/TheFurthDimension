/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { Game } from "./Main";
import { Direction } from "./Direction";

/**
 * Returns if a two arrays are equal
 */
export function arraysAreEqual(arr1: any[], arr2: any[]): boolean {
    if (arr1.length != arr2.length) {
        return false;
    }

    for (let i=0; i<arr1.length; ++i) {
        if (Array.isArray(arr1[i])) {
            if (!Array.isArray(arr2[i]) || !arraysAreEqual(arr1[i], arr2[i])) {
                return false;
            }
        }

        if (arr1[i] !== arr2[i]) {
            return false;
        }
    }

    return true;
}

/**
 * Light sanitization for object key names that can be used without an indexer
 */
export function sanitizeKeyName(name: string): string {
    return name.toUpperCase().replace(/\s|-/g, "");
}

export function hexToInt(hex: string): number {
    hex = hex.replace("0x", "").replace("#", "").toUpperCase();
    const VALUES = "0123456789ABCDEF";
    let val = 0;
    for (let i=(hex.length - 1) * 4, char=0; i>=0; i -= 4, ++char) {
        val += VALUES.indexOf(hex[char]) << i;
    }

    return val;
}

/**
 * Returns a rectangle object given a string in the format of "[x] [y] [width] [height]"
 */
export function rectangleFromStr(rect_str: string): createjs.Rectangle {
    let parsed = rect_str.split(" ");
    return new createjs.Rectangle(parseInt(parsed[0], 10), parseInt(parsed[1], 10), parseInt(parsed[2], 10), parseInt(parsed[3], 10));
}

/**
 * Returns a random number between a range
 */
export function randBetween(min: number, max: number): number {
    return (Math.random() * (max - min)) + min;
}

export function getOppositeDirection(dir: number): Direction {
    if (dir & Direction.LEFT) {
        return Direction.RIGHT;
    }
    else if (dir & Direction.RIGHT) {
        return Direction.LEFT;
    }
    else if (dir & Direction.UP) {
        return Direction.DOWN;
    }
    else if (dir & Direction.DOWN) {
        return Direction.UP;
    }

    return Direction.LEFT;
}
