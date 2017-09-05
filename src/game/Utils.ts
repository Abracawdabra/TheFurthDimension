/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

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
