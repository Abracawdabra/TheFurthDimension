/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { GameScreen } from "./screens";
import { Game } from "./Main";
import { InteractionHandlers } from ".";

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
            if (this._boundingBoxOutline) {
                this._boundingBoxOutline.x = this._sprite.x;
            }
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
            if (this._boundingBoxOutline) {
                this._boundingBoxOutline.y = this._sprite.y;
            }
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

    protected _boundingBoxOutline: createjs.Shape;

    // Interaction handler ID which corresponds to properties in src/game/InteractionHandlers.ts
    protected _interactionID: string;

    protected _spriteName: string;
    get spriteName(): string {
        return this._spriteName;
    }

    constructor(parent: GameScreen, name: string, x: number, y: number, sprite_name: string, sprite_sheet: createjs.SpriteSheet, frame: number | string = 0, collisions_enabled: boolean = true, bounding_box?: createjs.Rectangle, interaction_id?: string) {
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
            this._boundingBox = new createjs.Rectangle(0, 0, sprite_bounds.width, sprite_bounds.height);;
        }

        this._interactionID = interaction_id;
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
        return new createjs.Rectangle(this._x + this._boundingBox.x, this._y + this._boundingBox.y, this._boundingBox.width, this._boundingBox.height);
    }

    getInteractionID(): string {
        return this._interactionID;
    }

    interact(interactor: BaseMapObject): void {
        if (this._interactionID && this._interactionID in InteractionHandlers) {
            InteractionHandlers[this._interactionID].call(this, interactor);
        }
        else {
            InteractionHandlers["not_found"].call(this);
        }
    }

    showBoundingBox(show: boolean): void {
        if (this._sprite) {
            if (show && this._boundingBoxOutline) {
                this.parent.container.addChild(this._boundingBoxOutline);
            }
            else if (show) {
                let outline = new createjs.Shape();
                outline.graphics.beginStroke("#7B68EE");
                outline.graphics.setStrokeStyle(1.5);
                outline.graphics.drawRect(this._boundingBox.x, this._boundingBox.y, this._boundingBox.width, this._boundingBox.height);
                outline.graphics.endStroke();
                outline.x = this._sprite.x;
                outline.y = this._sprite.y;
                outline.cache(this._boundingBox.x, this._boundingBox.y, this._boundingBox.width, this._boundingBox.height);
                this.parent.container.addChild(outline);
                this._boundingBoxOutline = outline;
            }
            else {
                this._boundingBoxOutline.uncache();
                this.parent.container.removeChild(this._boundingBoxOutline);
                this._boundingBoxOutline = null;
            }
        }
    }

    setBoundingBoxOutlinePos(x: number, y: number): void {
        if (this._boundingBoxOutline) {
            this._boundingBoxOutline.x = x;
            this._boundingBoxOutline.y = y;
        }
    }

    /**
     * Removes the sprite from its parent and destroys the internal reference to it
     */
    destroySprite(): void {
        if (this._sprite) {
            if (this._boundingBoxOutline) {
                this.showBoundingBox(false);
            }

            this._sprite.parent.removeChild(this._sprite);
            this._sprite.removeAllEventListeners();
            this._sprite = null;
        }
    }
}
