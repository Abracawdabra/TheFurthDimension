/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { GameScreen } from "./screens";
import { Game } from "./Main";

export abstract class BaseMapObject {
    parent: GameScreen;
    name: string;
    // Flag for checking if collisions are enabled for this object
    collisionsEnabled: boolean;
    // Only for spatial grids
    width: number;
    // Only for spatial grids
    height: number;

    protected _x: number;
    get x(): number {
        return this._x;
    }

    set x(value: number) {
        this._x = value;
        if (this._sprite) {
            this._sprite.x = this.localX;
        }
    }

    protected _y: number;
    get y(): number {
        return this._y;
    }

    set y(value: number) {
        this._y = value;
        if (this._sprite) {
            this._sprite.y = this.localY;
        }
    }

    get localX(): number {
        return this._x - this.parent.viewportX;
    }

    get localY(): number {
        return this._y - this.parent.viewportY;
    }

    /**
     * Reference to the sprite created by getSprite()
     * Call destroySprite() when no longer needed
     */
    protected _sprite: createjs.Sprite;

    protected _spriteSheet: createjs.SpriteSheet;

    protected _boundingBox: createjs.Rectangle;

    protected _spriteName: string;
    get spriteName(): string {
        return this._spriteName;
    }

    constructor(parent: GameScreen, name: string, x: number, y: number, sprite_name: string, sprite_sheet: createjs.SpriteSheet, frame: number | string = 0, collisions_enabled: boolean = true, bounding_box?: createjs.Rectangle) {
        this.parent = parent;
        this.name = name;

        this._spriteName = sprite_name;
        this._spriteSheet = sprite_sheet;

        this.x = x;
        this.y = y;

        let sprite_bounds = sprite_sheet.getFrameBounds(0);
        this.width = sprite_bounds.width;
        this.height = sprite_bounds.height;

        this.collisionsEnabled = collisions_enabled;
        if (bounding_box) {
            this._boundingBox = bounding_box;
        }
        else {
            this._boundingBox = sprite_bounds.clone();
        }

    }

    /**
     * Creates a sprite object if one doesn't exist yet, otherwise returns a reference to it
     */
    getSprite(): createjs.Sprite {
        if (!this._sprite) {
            this._sprite = new createjs.Sprite(this._spriteSheet);
            this._sprite.name = this._spriteName;
            this._sprite.gotoAndStop("stand_south");
            this._sprite.x = this.localX;
            this._sprite.y = this.localY;
        }

        return this._sprite;
    }

    /**
     * Returns newly calculated bounds
     */
    getBounds(): createjs.Rectangle {
        return new createjs.Rectangle(this._sprite.x + this._boundingBox.x, this._sprite.y + this._boundingBox.y, this._boundingBox.width, this._boundingBox.height);
    }

    /**
     * Removes the sprite from its parent and destroys the internal reference to it
     */
    destroySprite(): void {
        if (this._sprite) {
            this._sprite.parent.removeChild(this._sprite);
            this._sprite.removeAllEventListeners();
            this._sprite = null;
        }
    }
}
