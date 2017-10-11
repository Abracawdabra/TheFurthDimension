/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

interface IFontData {
    characters: string;
    size: number;
    frames: any;
    animations?: { [name: string]: number };
}

export var FontData: { [name: string]: IFontData } = {
    "font_8px_press_start": {
        characters: "abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890.:,;'\"(!?)+-*/=%",
        frames: { width: 8, height: 8, regX: 0, regY: 0 },
        size: 8
    },
    "font_7px_press_start": {
        characters: "abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890.:,;'\"(!?)+-*/=%",
        frames: { width: 7, height: 7, regX: 0, regY: 0 },
        size: 7
    }
};

function generateFrameData(data: IFontData): void {
    data.animations = {};
    for (let frame=0; frame<data.characters.length; ++frame) {
        data.animations[data.characters[frame]] = frame;
    }
}

generateFrameData(FontData["font_8px_press_start"]);
generateFrameData(FontData["font_7px_press_start"]);
