/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { Game } from "./Main";

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
