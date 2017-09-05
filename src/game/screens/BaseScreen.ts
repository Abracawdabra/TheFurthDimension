/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { Game, IEventDispatcher, KeyboardKeys } from "../";

export abstract class BaseScreen {
    container: createjs.Container;
    parent: BaseScreen;

    protected _gameInstance: Game;

    constructor(game_instance: Game, parent: BaseScreen) {
        this._gameInstance = game_instance;
        this.parent = parent;
        this.container = new createjs.Container();
    }

    abstract handleKeyDown(keycode: number): void;
    abstract handleKeyUp(keycode: number): void;

    abstract update(delta: number): void;
}

// Add event dispatcher methods to the class
createjs.EventDispatcher.initialize(BaseScreen.prototype);
export interface BaseScreen extends IEventDispatcher {}
