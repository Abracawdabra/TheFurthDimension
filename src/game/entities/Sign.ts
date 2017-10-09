/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { BaseMapObject } from "..";
import { GameScreen } from "../screens";
import { Game } from "../Main";

const SIGN_FRAMES: { [type: string]: number } = {
    "normal": 0
};

export class Sign extends BaseMapObject {
    constructor(parent: GameScreen, name: string, x: number, y: number, sprite_name: string, type: string, dialog: string, interaction_id?: string) {
        super(parent, name, x, y, sprite_name, Game.SpriteSheets["ss_signs"], SIGN_FRAMES[type], true, undefined, interaction_id);
        this.dialog = dialog;
    }
}
