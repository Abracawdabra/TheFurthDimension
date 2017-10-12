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

/**
 * Polyfill for Number.isInteger
 */
export function isInteger(n: number): boolean {
    return isFinite(n) && Math.floor(n) === n;
}

/**
 * Truncates a float to a specified precision
 */
export function truncateFloat(n: number, digits: number): number {
    if (isInteger(n)) {
        return n;
    }

    let fixed = n.toFixed(digits);

    //  Remove trailing zeroes
    let end_pos: number;
    for (let i=fixed.length - 1; i>-1 && fixed[i] === "0"; ++i) {
        end_pos = i;
    }
    if (end_pos) {
        fixed = fixed.substring(0, end_pos);
    }

    return parseFloat(fixed);
}

/**
 * Returns a rotation given a direction (0 degrees is facing south unless offset is changed)
 */
export function directionToRotation(direction: number, offset = 0): number {
    if (direction & Direction.LEFT) {
        return offset + 90.0;
    }
    else if (direction & Direction.RIGHT) {
        return offset + 270.0;
    }
    else if (direction & Direction.UP) {
        return offset + 180.0;
    }
    else if (direction & Direction.DOWN) {
        return offset;
    }

    return 0.0;
}
