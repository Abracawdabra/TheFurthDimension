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
            if (this._hitboxOutline) {
                this._hitboxOutline.x = this._sprite.x;
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
            if (this._hitboxOutline) {
                this._hitboxOutline.y = this._sprite.y;
            }
        }
    }

    get localX(): number {
        return this._x - this.parent.viewportX;
    }

    get localY(): number {
        return this._y - this.parent.viewportY;
    }

    // Shorthand for characters that only talk when interacted with
    dialog: string;

    /**
     * Reference to the sprite created by getSprite()
     * Call destroySprite() when no longer needed
     */
    protected _sprite: createjs.Sprite;

    protected _spriteSheet: createjs.SpriteSheet;
    set spriteSheet(value: createjs.SpriteSheet) {
        this._spriteSheet = value;
        if (this._sprite) {
            this._sprite.spriteSheet = value;
        }
    }

    protected _hitbox: createjs.Rectangle;

    protected _hitboxOutline: createjs.Shape;

    // Interaction handler ID which corresponds to properties in src/game/InteractionHandlers.ts
    protected _interactionID: string;

    protected _spriteName: string;
    get spriteName(): string {
        return this._spriteName;
    }

    constructor(parent: GameScreen, name: string, x: number, y: number, sprite_name: string, sprite_sheet: createjs.SpriteSheet, frame: number | string = 0, collisions_enabled: boolean = true, hitbox?: createjs.Rectangle, interaction_id?: string) {
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
        if (hitbox) {
            this._hitbox = hitbox;
        }
        else {
            this._hitbox = new createjs.Rectangle(0, 0, sprite_bounds.width, sprite_bounds.height);;
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
            this._sprite.x = this.localX;
            this._sprite.y = this.localY;
        }

        return this._sprite;
    }

    /**
     * Returns global calculated hitbox bounds
     */
    getHitbox(): createjs.Rectangle {
        return new createjs.Rectangle(this._x + this._hitbox.x, this._y + this._hitbox.y, this._hitbox.width, this._hitbox.height);
    }

    getInteractionID(): string {
        return this._interactionID;
    }

    interact(interactor: BaseMapObject): void {
        let has_handler = this._interactionID && this._interactionID in InteractionHandlers;
        if (this.dialog) {
            if (has_handler) {
                this.parent.showDialog(this, this.dialog, InteractionHandlers[this._interactionID], { interactor: interactor } );
            }
            else {
                this.parent.showDialog(this, this.dialog);
                if (this._interactionID) {
                    InteractionHandlers["not_found"].call(this);
                }
            }
        }
        else if (has_handler) {
            InteractionHandlers[this._interactionID].call(this, interactor);
        }
        else if (this._interactionID) {
            InteractionHandlers["not_found"].call(this);
        }
    }

    showHitbox(show: boolean): void {
        if (this._sprite) {
            if (this._hitboxOutline) {
                if (show) {
                    this.parent.container.addChild(this._hitboxOutline);
                }
                else {
                    this._hitboxOutline.uncache();
                    this.parent.container.removeChild(this._hitboxOutline);
                    this._hitboxOutline = null;
                }
            }
            else if (show) {
                let outline = new createjs.Shape();
                outline.graphics.beginStroke("#7B68EE");
                outline.graphics.setStrokeStyle(1.5);
                outline.graphics.drawRect(this._hitbox.x, this._hitbox.y, this._hitbox.width, this._hitbox.height);
                outline.graphics.endStroke();
                outline.x = this._sprite.x;
                outline.y = this._sprite.y;
                outline.cache(this._hitbox.x, this._hitbox.y, this._hitbox.width, this._hitbox.height);
                this.parent.container.addChild(outline);
                this._hitboxOutline = outline;
            }
        }
    }

    setHitboxOutlinePos(x: number, y: number): void {
        if (this._hitboxOutline) {
            this._hitboxOutline.x = x;
            this._hitboxOutline.y = y;
        }
    }

    /**
     * Removes the sprite from its parent and destroys the internal reference to it
     */
    destroySprite(): void {
        if (this._sprite) {
            if (this._hitboxOutline) {
                this.showHitbox(false);
            }

            this._sprite.parent.removeChild(this._sprite);
            this._sprite.removeAllEventListeners();
            this._sprite = null;
        }
    }
}
