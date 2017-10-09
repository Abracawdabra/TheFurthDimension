/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

const CHARACTER_ANIMATIONS = {
    "stand_south": 0,
    "walk_south": {
        frames: [1, 0, 2, 0]
    },
    "stand_west": 3,
    "walk_west": {
        frames: [4, 3, 5, 3]
    },
    "stand_east": 6,
    "walk_east": {
        frames: [7, 6, 8, 6]
    },
    "stand_north": 9,
    "walk_north": {
        frames: [10, 9, 11, 9]
    }
}

const CHARACTER_ANIMATION_FRAMERATE = 20;
const SWORD_ANIMATION_FRAMERATE = 35;

interface ISpriteSheetData {
    frames: { width: number, height: number, regX: number, regY: number, count?: number };
    animations: {
        [name: string]: number | number[] | {
            frames: number[],
            next?: string,
            speed?: number
        }
    };
    framerate?: number;
}

export var SpriteSheetData: { [id: string]: ISpriteSheetData } = {
    "ss_npc_testy": {
        frames: { width: 16, height: 16, regX: 0, regY: 0, count: 12 },
        animations: CHARACTER_ANIMATIONS,
        framerate: CHARACTER_ANIMATION_FRAMERATE
    },
    "ss_victor": {
        frames: { width: 12, height: 18, regX: 0, regY: 0, count: 12 },
        animations: CHARACTER_ANIMATIONS,
        framerate: CHARACTER_ANIMATION_FRAMERATE
    },
    "ss_generic_npc": {
        frames: { width: 12, height: 12, regX: 0, regY: 0, count: 12 },
        animations: CHARACTER_ANIMATIONS,
        framerate: CHARACTER_ANIMATION_FRAMERATE
    },
    "ss_swords": {
        frames: { width: 60, height: 40, regX: 0, regY: 0, count: 25 },
        animations: {
            "dagger_unsheathed": 0,
            "dagger_attack": [0, 4],
            "sword_unsheathed": 5,
            "sword_attack": [5, 9],
            "greatsword_unsheathed": 10,
            "greatsword_attack": [10, 14],
            "great_greatsword_unsheathed": 15,
            "great_greatsword_attack": [15, 19],
            "soulshredder_unsheathed": 20,
            "soulshredder_attack": [20, 24]
        },
        framerate: SWORD_ANIMATION_FRAMERATE
    }
}
