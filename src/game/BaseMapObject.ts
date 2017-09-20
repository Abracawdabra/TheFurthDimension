/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

export abstract class BaseMapObject {
    name: string;

    /** Flag for checking if collisions are enabled for this object */
    collisionsEnabled: boolean;

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

    protected _spriteSheet: createjs.SpriteSheet;

    protected _boundingBox: createjs.Rectangle;

    constructor(name: string, sprite_sheet: createjs.SpriteSheet, frame: number | string = 0, collisions_enabled: boolean = true, bounding_box?: createjs.Rectangle) {
        this.name = name;

        this._sprite = new createjs.Sprite(sprite_sheet);
        this._sprite.gotoAndStop(frame);
        this._spriteSheet = sprite_sheet;

        let sprite_bounds = this._sprite.getBounds();
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
