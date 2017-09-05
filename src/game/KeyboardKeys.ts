/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

interface IKeyboardKeys {
    [key: string]: number;
    X: number;
    Z: number;
    ENTER: number;
    SHIFT: number;
    ARROWLEFT: number;
    ARROWRIGHT: number;
    ARROWUP: number;
    ARROWDOWN: number;
    ESCAPE: number;
}

// Key code constants
export var KeyboardKeys: IKeyboardKeys = {
    Z: 90,
    X: 88,
    ENTER: 13,
    SHIFT: 16,
    ARROWLEFT: 37,
    ARROWRIGHT: 39,
    ARROWUP: 38,
    ARROWDOWN: 40,
    ESCAPE: 27
}
