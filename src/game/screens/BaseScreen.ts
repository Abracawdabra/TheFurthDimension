/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { Game, DISPLAY_WIDTH, DISPLAY_HEIGHT } from "../Main";
import { IEventDispatcher } from "..";

export abstract class BaseScreen {
    container: createjs.Container;
    parent: BaseScreen;

    gameInstance: Game;

    constructor(game_instance: Game, parent?: BaseScreen) {
        this.gameInstance = game_instance;
        this.parent = parent;
        this.container = new createjs.Container();
        this.container.setBounds(0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT);
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
