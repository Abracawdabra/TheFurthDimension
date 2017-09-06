/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

// Game Boy button mapping and codes

import { KeyboardKeys } from ".";

interface IButtons {
    [button: string]: number;
    A: number;
    B: number;
    START: number;
    SELECT: number;
    LEFT: number;
    RIGHT: number;
    UP: number;
    DOWN: number;
}

export var Buttons: IButtons = {
    A: KeyboardKeys.Z,
    B: KeyboardKeys.X,
    START: KeyboardKeys.ENTER,
    SELECT: KeyboardKeys.SHIFT,
    LEFT: KeyboardKeys.ARROWLEFT,
    RIGHT: KeyboardKeys.ARROWRIGHT,
    UP: KeyboardKeys.ARROWUP,
    DOWN: KeyboardKeys.ARROWDOWN
};

export var CheatTextboxCode: number[] = [Buttons.SELECT, Buttons.SELECT, Buttons.B, Buttons.SELECT];
