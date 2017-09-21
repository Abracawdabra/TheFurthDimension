/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

const CHARACTER_ANIMATIONS = {
    "stand_south": 0,
    "walk_south": [1, 0, 2, 0],
    "stand_west": 3,
    "walk_west": [4, 3, 5, 3],
    "stand_north": 6,
    "walk_north": [7, 6, 8, 6],
    "stand_east": 9,
    "walk_east": [10, 9, 11, 9]
}

interface ISpriteSheetData {
    frames: { width: number, height: number, regX: number, regY: number, count?: number };
    animations: { [name: string]: number | number[] };
}

export var SpriteSheetData: { [id: string]: ISpriteSheetData } = {
    "ss_npc_testy": {
        frames: { width: 16, height: 16, regX: 0, regY: 0, count: 12 },
        animations: CHARACTER_ANIMATIONS
    }
}
