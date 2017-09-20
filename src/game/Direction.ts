/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

export enum Direction {
    LEFT  = 1,
    RIGHT = 2,
    UP    = 4,
    DOWN  = 8
}

export function directionToString(dir: number): string {
    if (dir & Direction.LEFT) {
        return "west";
    }
    else if (dir & Direction.RIGHT) {
        return "east";
    }
    else if (dir & Direction.UP) {
        return "north";
    }
    else if (dir & Direction.DOWN) {
        return "south";
    }

    return "";
}
