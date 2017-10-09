/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { NPC, INPCSettings, Character, IStats } from ".";
import { GameScreen } from "../screens";
import { SpatialGrid } from "..";

export interface IEnemySettings extends INPCSettings {
    stats: IStats;
}

export class Enemy extends NPC {
    protected _isAggrovated: boolean;
    get isAggrovated(): boolean {
        return this._isAggrovated;
    }

    set isAggrovated(value: boolean) {
        if (value) {

        }
        else {
            this.isWalking = false;
        }
        this._isAggrovated = value;
    }

    // A reference to the player for following and stuff
    protected _player: Character;

    constructor(parent: GameScreen, name: string, x: number, y: number, sprite_name: string, sprite_sheet: createjs.SpriteSheet, player: Character, hitbox?: createjs.Rectangle, projectiles_hitbox?: createjs.Rectangle, interaction_id?: string, settings?: IEnemySettings) {
        super(parent, name, x, y, sprite_name, sprite_sheet, hitbox, projectiles_hitbox, interaction_id, settings);
        this.isAggrovated = false;
        this._player = player;
    }

    update(delta: number, spatial_grid: SpatialGrid): void {
        if (this._isAggrovated) {

        }
        else {
            super.update(delta, spatial_grid);
        }
    }

    protected _attack(): void {
        this.parent.performCharacterAttack(this);
    }
}
