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
const DAGGER_ANIMATION_FRAMERATE = 30;
const SWORD_ANIMATION_FRAMERATE = 27;

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
    "ss_daggers": {
        frames: { width: 12, height: 22, regX: 0, regY: 0 },
        animations: {
            "dagger_unsheathed": 0,
            "dagger_attack": [0, 4]
        },
        framerate: DAGGER_ANIMATION_FRAMERATE
    },
    "ss_swords": {
        frames: { width: 60, height: 40, regX: 0, regY: 0 },
        animations: {
            "sword_unsheathed": 0,
            "sword_attack": [0, 3],
            "greatsword_unsheathed": 4,
            "greatsword_attack": [4, 7],
            "great_greatsword_unsheathed": 8,
            "great_greatsword_attack": [8, 11],
            "soulshredder_unsheathed": 12,
            "soulshredder_attack": [12, 15]
        },
        framerate: SWORD_ANIMATION_FRAMERATE
    }
}
