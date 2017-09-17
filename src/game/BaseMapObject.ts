/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

export abstract class BaseMapObject {
    name: string;

    /** Only for spatial grids */
    width: number;
    /** Only for spatial grids */
    height: number;

    get x(): number {
        return this._sprite.x;
    }

    set x(value: number) {
        this._sprite.x = value;
    }

    get y(): number {
        return this._sprite.y;
    }

    set y(value: number) {
        this._sprite.y = value;
    }

    /**
     * Reference to the sprite created by getSprite()
     * Call destroySprite() when no longer needed
     */
    protected _sprite: createjs.Sprite;

    /**
     * Creates a sprite object if one doesn't exist yet, otherwise returns a reference to it
     */
    abstract getSprite(): createjs.Sprite;

    /**
     * Destroys the internal reference to the sprite object
     */
    destroySprite(): void {
        if (this._sprite) {
            this._sprite.removeAllEventListeners();
            this._sprite = null;
        }
    }
}
