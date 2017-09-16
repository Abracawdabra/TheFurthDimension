/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { Game } from "../Main";
import { IEventDispatcher } from "..";

export abstract class BaseScreen {
    container: createjs.Container;
    parent: BaseScreen;

    protected _gameInstance: Game;

    constructor(game_instance: Game, parent?: BaseScreen) {
        this._gameInstance = game_instance;
        this.parent = parent;
        this.container = new createjs.Container();
        this.container.setBounds(0, 0, Game.DISPLAY_WIDTH, Game.DISPLAY_HEIGHT);
        this._init();
    }

    abstract handleKeyDown(key_code: number): void;
    abstract handleKeyUp(key_code: number): void;

    abstract update(delta: number): void;

    protected abstract _init(): void;
}

// Add event dispatcher methods to the class
createjs.EventDispatcher.initialize(BaseScreen.prototype);
export interface BaseScreen extends IEventDispatcher {}
