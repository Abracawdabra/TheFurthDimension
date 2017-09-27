/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { BaseScreen } from "./BaseScreen";
import * as tiled from "../tiled";
import { Game } from "../Main";
import { Direction, Button, SpatialGrid, BaseMapObject } from "..";
import { INPCSettings, NPC, Character } from "../entities";
import * as utils from "../Utils";

export enum Axes {
    X = 1,
    Y = 2
}

export class GameScreen extends BaseScreen {
    protected _map: tiled.Map;

    // Number of tiles to draw across the screen
    protected _numOfXTiles: number;
    protected _numOfYTiles: number;

    // Tile position of the top-left corner in the view area
    protected _scrollXPos: number;
    protected _scrollYPos: number;

    /** @todo Remove in favor of using player character's direction */
    protected _scrollDir: number;

    // Stored map area for rendering, checking collisions, etc.
    protected _mapArea: tiled.IMapAreaLayer[];

    // Hash object for layer names to indices (for faster lookup)
    protected _mapLayerIndices: { [name: string]: number };

    // For storing objects that are currently in draw distance
    protected _activeObjects: { [layer: string]: BaseMapObject[] };

    // Current NPCs in draw distance to save on frame workload (Scraped from _activeObjects)
    protected _activeNPCs: { [layer: string]: NPC[] };

    // Spatial grid layers for the current map
    protected _spatialGrids: { [layer: string]: SpatialGrid };

    // Container for map tiles
    protected _tileContainer: createjs.Container;

    // Container for map objects
    protected _objectContainer: createjs.Container;

    // The player
    protected _player: Character;

    // Global x position of the viewport
    get viewportX(): number {
        return (this._scrollXPos * this._map.tileWidth) - this._tileContainer.x;
    }

    // Global y position of the viewport
    get viewportY(): number {
        return (this._scrollYPos * this._map.tileHeight) - this._tileContainer.y;
    }

    handleKeyDown(key_code: number): void {
        if (key_code === Button.LEFT) {
            this._scrollDir |= Direction.LEFT;
            this._player.direction = this._scrollDir;
        }
        else if (key_code === Button.RIGHT) {
            this._scrollDir |= Direction.RIGHT;
            this._player.direction = this._scrollDir;
        }
        else if (key_code === Button.UP) {
            this._scrollDir |= Direction.UP;
            this._player.direction = this._scrollDir;
        }
        else if (key_code === Button.DOWN) {
            this._scrollDir |= Direction.DOWN;
            this._player.direction = this._scrollDir;
        }
    }

    handleKeyUp(key_code: number): void {
        if (key_code === Button.LEFT) {
            this._scrollDir &= ~Direction.LEFT;
            this._player.direction = this._scrollDir;
        }
        else if (key_code === Button.RIGHT) {
            this._scrollDir &= ~Direction.RIGHT;
            this._player.direction = this._scrollDir;
        }
        else if (key_code === Button.UP) {
            this._scrollDir &= ~Direction.UP;
            this._player.direction = this._scrollDir;
        }
        else if (key_code === Button.DOWN) {
            this._scrollDir &= ~Direction.DOWN;
            this._player.direction = this._scrollDir;
        }
    }

    update(delta: number): void {
        if (this._mapArea) {
            if (this._scrollDir) {
                let x_movement = 0;
                let y_movement = 0;
                let scroll_speed = delta / 1000 * this._gameInstance.walkSpeed;
                if (this._scrollDir & Direction.LEFT) {
                    x_movement = -scroll_speed;
                }
                else if (this._scrollDir & Direction.RIGHT) {
                    x_movement = scroll_speed;
                }

                if (this._scrollDir & Direction.UP) {
                    y_movement = -scroll_speed;
                }
                else if (this._scrollDir & Direction.DOWN) {
                    y_movement = scroll_speed;
                }

                if (x_movement !== 0 || y_movement !== 0) {
                    let player_x_pos = this._player.x + x_movement;
                    let player_y_pos = this._player.y + y_movement;
                    let axes = (this._gameInstance.enableNoClip) ? (Axes.X | Axes.Y) : this.canMoveToPos(this._player, player_x_pos, player_y_pos);
                    if (axes) {
                        // Flip the directions for the tile container
                        x_movement = (x_movement < 0) ? Math.abs(x_movement) : x_movement * -1;
                        y_movement = (y_movement < 0) ? Math.abs(y_movement) : y_movement * -1;
                        if (axes & Axes.X) {
                            this._tileContainer.x += x_movement;
                            this._player.x = player_x_pos;
                        }

                        if (axes & Axes.Y) {
                            this._tileContainer.y += y_movement;
                            this._player.y = player_y_pos;
                        }

                        for (let layer in this._activeObjects) {
                            if (this._activeObjects.hasOwnProperty(layer)) {
                                // Move map objects on screen
                                for (let obj of this._activeObjects[layer]) {
                                    let sprite = obj.getSprite();
                                    sprite.x = obj.localX;
                                    sprite.y = obj.localY;
                                    obj.setBoundingBoxOutlinePos(sprite.x, sprite.y);
                                }
                            }
                        }

                        this._scrollMap();
                    }
                }
            }

            for (let layer in this._activeNPCs) {
                if (this._activeNPCs.hasOwnProperty(layer)) {
                    for (let npc of this._activeNPCs[layer]) {
                        npc.update(delta, this._spatialGrids[layer]);
                    }
                }
            }
        }
    }

    getMap(): tiled.Map {
        return this._map;
    }

    loadMap(map: tiled.IMap): void {
        this._player.destroySprite();

        this._map = new tiled.Map(map);
        this._numOfXTiles = Math.ceil(Game.DISPLAY_WIDTH / map.tilewidth) + 1;
        this._numOfYTiles = Math.ceil(Game.DISPLAY_HEIGHT / map.tileheight) + 1;

        this._scrollXPos = 0;
        this._scrollYPos = 0;

        this._mapLayerIndices = {};
        this._spatialGrids = {};

        if (this.container.getChildIndex(this._tileContainer) !== 0) {
            // Remove previous background
            this.container.removeChildAt(0);
        }
        this._tileContainer.removeAllChildren();
        this._objectContainer.removeAllChildren();
        let empty_spritesheet = new createjs.SpriteSheet({});
        for (let layer_index=0; layer_index<map.layers.length; ++layer_index) {
            // Process each map layer
            let layer = map.layers[layer_index];
            this._mapLayerIndices[layer.name] = layer_index;
            if (layer.type === "tilelayer") {
                // Populate the tile container with reusable sprites to fill the screen
                let start_index = layer_index * this._numOfXTiles * this._numOfYTiles;
                for (let row=0; row<this._numOfYTiles; ++row) {
                    for (let col=0; col<this._numOfXTiles; ++col) {
                        let sprite = new createjs.Sprite(empty_spritesheet);
                        sprite.x = col * this._map.tileWidth;
                        sprite.y = row * this._map.tileHeight;
                        this._tileContainer.addChildAt(sprite, start_index + (row * this._numOfXTiles) + col);
                    }
                }
            }
            else if (layer.type === "objectgroup" && layer.name !== "Spawn Points") {
                // Don't make a spatial grid for a "Spawn Points" object layer
                let grid = new SpatialGrid(map.tilewidth, map.tileheight, map.width, map.height);
                for (let obj of layer.objects) {
                    if (obj.type === "spawn_point") {
                        // Don't add spawn points to the spatial grids (if they happen to not be on their own special layer)
                        continue;
                    }

                    grid.addObject(this._createMapObject(obj));
                }
                this._spatialGrids[layer.name] = grid;
            }
        }

        let background = new createjs.Shape();
        background.graphics.beginFill(this._map.backgroundColor);
        background.graphics.drawRect(0, 0, Game.DISPLAY_WIDTH, Game.DISPLAY_HEIGHT);
        this.container.addChildAt(background, 0);

        this.container.addChild(this._player.getSprite());
        this._player.showBoundingBox(this._gameInstance.renderBoundingBoxes);

        this.gotoSpawnPoint("default");
    }

    gotoSpawnPoint(name: string): boolean {
        let spawn_point = this._map.getSpawnPoint(name);
        if (spawn_point) {
            // Convert spawn point coordinates to tile coordinates
            let sp_tile_x = Math.floor(spawn_point.x / this._map.tileWidth);
            let sp_tile_y = Math.floor(spawn_point.y / this._map.tileHeight);

            // Stretch out to the top left corner of the screen
            this._scrollXPos = sp_tile_x - Math.floor(this._numOfXTiles / 2);
            this._scrollYPos = sp_tile_y - Math.floor(this._numOfYTiles / 2);

            // Center the tiles on the screen
            this._tileContainer.x = Math.floor((Game.DISPLAY_WIDTH - (this._numOfXTiles * this._map.tileWidth)) / 2);
            this._tileContainer.y = Math.floor((Game.DISPLAY_HEIGHT - (this._numOfYTiles * this._map.tileHeight)) / 2);

            this._player.x = spawn_point.x;
            this._player.y = spawn_point.y;

            this._updateMapArea(this._scrollXPos, this._scrollYPos, this._numOfXTiles, this._numOfYTiles);
            this.redrawMapArea();
            return true;
        }
        else {
            console.log("Could not find spawn point '" + name + "'");
            return false;
        }
    }

    redrawMapArea(): void {
        // For negative scroll positions (which should only occur here with spawn points)
        let offset_col = (this._scrollXPos < 0) ? Math.abs(this._scrollXPos) : 0;
        let offset_row = (this._scrollYPos < 0) ? Math.abs(this._scrollYPos) : 0;
        for (let layer_index=0; layer_index<this._mapArea.length; ++layer_index) {
            let area_layer = this._mapArea[layer_index];
            if (area_layer.layer.type === "tilelayer") {
                let layer_start_index = layer_index * this._numOfYTiles * this._numOfXTiles;
                for (let row=0; row<this._numOfYTiles; ++row) {
                    let data_row = row - offset_row;
                    for (let col=0; col<this._numOfXTiles; ++col) {
                        let data_col = col - offset_col;
                        let sprite = <createjs.Sprite>this._tileContainer.getChildAt(layer_start_index + (row * this._numOfXTiles) + col);
                        if (row < offset_row || col < offset_col                                                 // Fix for spawn points that are near the top or left edge of the map
                        || data_row >= area_layer.data.length || data_col >= area_layer.data[data_row].length    // Past last row or column
                        || (!this._gameInstance.renderInvisibleLayers && !area_layer.layer.visible))             // Invisible layer without cheat enabled
                        {
                            sprite.alpha = 0.0;
                        }
                        else {
                            let gid = area_layer.data[data_row][data_col];
                            let tileset = this._map.getTileset(gid);
                            if (tileset) {
                                sprite.spriteSheet = tileset.getSpriteSheet();
                                sprite.gotoAndStop(tileset.getTileFrame(gid));
                                sprite.alpha = 1.0;
                            }
                            else {
                                sprite.alpha = 0.0;
                            }
                        }
                    }
                }
            }
            else if (area_layer.layer.type === "objectgroup" && area_layer.layer.name !== "Spawn Points") {
                let objects_to_remove = this._objectContainer.children.slice();
                for (let obj of this._activeObjects[area_layer.layer.name]) {
                    // Render objects that haven't been rendered yet
                    let sprite = this._objectContainer.getChildByName(obj.spriteName);
                    if (!sprite) {
                        sprite = obj.getSprite();
                        // I'm going to cheat here because otherwise it's a pain in
                        // in the ass and probably less efficient to make a hash
                        // object just to call destroySprite()
                        (<any>sprite).mapObject = obj;
                        this._objectContainer.addChild(sprite);

                        if (this._gameInstance.renderBoundingBoxes) {
                            obj.showBoundingBox(true);
                        }
                    }

                    objects_to_remove.splice(objects_to_remove.indexOf(sprite), 1);
                }

                for (let sprite of objects_to_remove) {
                    // Remove objects that are no longer in draw distance
                    (<any>sprite).mapObject.destroySprite();
                }
            }
        }
    }

    /**
     * Returns what axes the object can move on
     */
    canMoveToPos(obj: Character, x: number, y: number): number {
        let bounding_box = obj.getBounds();
        let old_bb_left = bounding_box.x;
        let old_bb_top = bounding_box.y;
        let old_bb_right = old_bb_left + bounding_box.width;
        let old_bb_bottom = old_bb_top + bounding_box.height;

        let bb_left = x + (bounding_box.x - obj.x);
        let bb_top = y + (bounding_box.y - obj.y);
        let bb_right = bb_left + bounding_box.width;
        let bb_bottom = bb_top + bounding_box.height;

        let axes = (Axes.X | Axes.Y);

        // Map edges
        let map_right = this._map.width * this._map.tileWidth;
        let map_bottom = this._map.height * this._map.tileHeight;
        if (bb_left < 0 || bb_right > map_right) {
            axes = (axes & ~Axes.X);
        }

        if (bb_top < 0 || bb_bottom > map_bottom) {
            axes = (axes & ~Axes.Y);
        }

        // Collision tiles
        let start_col = Math.floor(bb_left / this._map.tileWidth);
        let end_col = Math.floor(bb_right / this._map.tileWidth);
        let start_row = Math.floor(bb_top / this._map.tileHeight);
        let end_row = Math.floor(bb_bottom / this._map.tileHeight);
        let collision_layer_index = this._mapLayerIndices["Collisions"];
        let moving_on_both_axes = ((obj.direction & Direction.LEFT) || (obj.direction & Direction.RIGHT)) && ((obj.direction & Direction.UP) || (obj.direction & Direction.DOWN));
        for (let row=start_row; row<=end_row; ++row) {
            for (let col=start_col; col<=end_col; ++col) {
                if (this._map.getGID(collision_layer_index, row, col) !== 0) {
                    // Collision
                    let tile_left = col * this._map.tileWidth;
                    let tile_top = row * this._map.tileHeight;
                    let tile_right = tile_left + this._map.tileWidth;
                    let tile_bottom = tile_top + this._map.tileHeight;

                    if (moving_on_both_axes) {
                        // Check which path works
                        let can_move_x = ((obj.direction & Direction.UP) && this._map.getGID(collision_layer_index, row + 1, col) === 0)
                                            || ((obj.direction & Direction.DOWN) && this._map.getGID(collision_layer_index, row - 1, col) === 0);
                        let can_move_y = ((obj.direction & Direction.LEFT) && this._map.getGID(collision_layer_index, row, col + 1) === 0)
                                            || ((obj.direction & Direction.RIGHT) && this._map.getGID(collision_layer_index, row, col - 1) === 0);
                        if (can_move_x && !can_move_y) {
                            axes = (axes & ~Axes.Y);
                        }
                        else if (!can_move_x && can_move_y) {
                            axes = (axes & ~Axes.X);
                        }
                        else if (can_move_x && can_move_y) {
                            if (Math.floor(bounding_box.x / this._map.tileWidth) === col || Math.floor((bounding_box.x + bounding_box.width) / this._map.tileHeight) === col) {
                                // If on same column, don't move on Y
                                axes = (axes & ~Axes.Y);
                            }
                            if (Math.floor(bounding_box.y / this._map.tileHeight) === row || Math.floor((bounding_box.y + bounding_box.height) / this._map.tileHeight) === row) {
                                // If on same row, don't move on X
                                axes = (axes & ~Axes.X);
                            }
                        }
                        else {
                            axes = 0;
                        }
                    }
                    else if ((obj.direction & Direction.LEFT) || (obj.direction & Direction.RIGHT)) {
                        axes = axes & ~Axes.X;
                    }
                    else if ((obj.direction & Direction.UP) || (obj.direction & Direction.DOWN)) {
                        axes = axes & ~Axes.Y;
                    }

                    if (!axes) {
                        // No axes left to eliminate
                        return axes;
                    }
                }
            }
        }

        // Object collisions
        // A bounds Rectangle object to reuse for minimalizing the instantiation
        // and destruction of a bunch of Rectangle objects.
        let bounds_rect = new createjs.Rectangle(bb_left, bb_top, bounding_box.width, bounding_box.height);
        for (let layer in this._activeObjects) {
            if (this._activeObjects.hasOwnProperty(layer)) {
                for (let active_obj of this._activeObjects[layer]) {
                    if (obj === active_obj || active_obj === this._player && this._gameInstance.enableNoClip) {
                        // Don't check against itself, or clip with player when noclip is enabled
                        continue;
                    }

                    let active_obj_bounds = active_obj.getBounds();
                    if (active_obj_bounds.intersects(bounds_rect)) {
                        // Check which path works
                        let can_move_x = !bounds_rect.setValues(bb_left, bounding_box.y, bounding_box.width, bounding_box.height).intersects(active_obj_bounds);
                        let can_move_y = !bounds_rect.setValues(bounding_box.x, bb_top, bounding_box.width, bounding_box.height).intersects(active_obj_bounds);
                        if (can_move_x && !can_move_y) {
                            axes = (axes & ~Axes.Y);
                        }
                        else if (!can_move_x && can_move_y) {
                            axes = (axes & ~Axes.X);
                        }
                        else {
                            axes = 0;
                        }

                        // Reset bounds_rect to original value
                        bounds_rect.setValues(bb_left, bb_top, bounding_box.width, bounding_box.height);
                    }

                    if (!axes) {
                        // No axes left to eliminate
                        return axes;
                    }
                }
            }
        }

        return axes;
    }

    showBoundingBoxes(show: boolean): void {
        this._player.showBoundingBox(show);

        for (let layer in this._activeObjects) {
            if (this._activeObjects.hasOwnProperty(layer)) {
                for (let obj of this._activeObjects[layer]) {
                    obj.showBoundingBox(show);
                }
            }
        }
    }

    protected _init(): void {
        this._tileContainer = new createjs.Container();
        this._tileContainer.tickChildren = false;
        this.container.addChild(this._tileContainer);

        this._objectContainer = new createjs.Container();
        this.container.addChild(this._objectContainer);

        this._player = new Character(this, "Victor", 0, 0, "player", Game.SpriteSheets["ss_victor"], new createjs.Rectangle(3, 4, 10, 12));
    }

    protected _scrollMap(): void {
        let scrolling_left = (this._tileContainer.x > 0) && (this._scrollXPos > 0);
        let scrolling_right = (this._tileContainer.x <= -this._map.tileWidth) && ((this._scrollXPos + this._numOfXTiles) < this._map.width);
        let scrolling_up = (this._tileContainer.y > 0) && (this._scrollYPos > 0);
        let scrolling_down = (this._tileContainer.y <= -this._map.tileHeight) && ((this._scrollYPos + this._numOfYTiles) < this._map.height);

        let x_tiles_moved = 0;
        let y_tiles_moved = 0;
        if (scrolling_left) {
            x_tiles_moved = Math.ceil(this._tileContainer.x / this._map.tileWidth);
            this._scrollXPos -= x_tiles_moved;
            this._tileContainer.x = (this._tileContainer.x % this._map.tileWidth) - this._map.tileWidth;
        }
        else if (scrolling_right) {
            x_tiles_moved = Math.ceil(this._tileContainer.x / this._map.tileWidth);
            this._scrollXPos += Math.abs(x_tiles_moved);
            this._tileContainer.x = this._tileContainer.x % this._map.tileWidth;
        }

        if (scrolling_up) {
            y_tiles_moved = Math.ceil(this._tileContainer.y / this._map.tileHeight);
            this._scrollYPos -= y_tiles_moved;
            this._tileContainer.y = (this._tileContainer.y % this._map.tileHeight) - this._map.tileHeight;
        }
        else if (scrolling_down) {
            y_tiles_moved = Math.ceil(this._tileContainer.y / this._map.tileHeight);
            this._scrollYPos += Math.abs(y_tiles_moved);
            this._tileContainer.y = this._tileContainer.y % this._map.tileHeight;
        }

        if (scrolling_left || scrolling_right || scrolling_up || scrolling_down) {
            this._updateMapArea(this._scrollXPos, this._scrollYPos, this._numOfXTiles, this._numOfYTiles);
            this.redrawMapArea();
        }
    }

    protected _updateMapArea(x: number, y: number, width: number, height: number): void {
        this._mapArea = this._map.getArea(x, y, width, height);

        // Convert to pixel coordinates for spatial grids
        let rect = new createjs.Rectangle(x * this._map.tileWidth, y * this._map.tileHeight, width * this._map.tileWidth, height * this._map.tileHeight);
        this._activeObjects = { __PLAYER__: [this._player] };
        this._activeNPCs = {};
        for (let area_layer of this._mapArea) {
            if (area_layer.layer.type === "objectgroup" && area_layer.layer.name !== "Spawn Points") {
                this._activeObjects[area_layer.layer.name] = <BaseMapObject[]>this._spatialGrids[area_layer.layer.name].getObjects(rect);

                this._activeNPCs[area_layer.layer.name] = [];
                for (let obj of this._activeObjects[area_layer.layer.name]) {
                    if (obj instanceof NPC) {
                        // Add active NPCs
                        this._activeNPCs[area_layer.layer.name].push(obj);
                    }
                }
            }
        }
    }

    protected _getMapAreaLayer(name: string): tiled.IMapAreaLayer {
        if (name in this._mapLayerIndices) {
            return this._mapArea[this._mapLayerIndices[name]];
        }

        return null;
    }

    protected static _generateTileName(layer_name: string, row: number, col: number): string
    {
        return layer_name + "_y" + row + "_x" + col;
    }

    /**
     * Processes a map object and returns a new one created through type specific constructors
     * @todo Implement all map object types
     */
    protected _createMapObject(obj: tiled.IObject): any {
        if (obj.type === "npc") {
            let bounding_box: createjs.Rectangle;
            if ("boundingBox" in obj.properties) {
                bounding_box = utils.rectangleFromStr(obj.properties.boundingBox);
            }

            let settings: INPCSettings = {};
            if ("walkSpeed" in obj.properties) {
                settings.walkSpeed = obj.properties.walkSpeed;
            }

            if ("wander" in obj.properties) {
                settings.wander = obj.properties.wander;
            }

            if ("wanderBounds" in obj.properties) {
                settings.wanderBounds = utils.rectangleFromStr(obj.properties.wanderBounds);
            }

            if ("wanderMinDirDuration" in obj.properties) {
                settings.wanderMinDirDuration = obj.properties.wanderMinDirDuration;
            }

            if ("wanderMaxDirDuration" in obj.properties) {
                settings.wanderMaxDirDuration = obj.properties.wanderMaxDirDuration;
            }

            return new NPC(this, obj.properties.name, obj.x, obj.y, obj.name, Game.SpriteSheets[obj.properties.spriteSheet], bounding_box, obj.properties.interactionID,  settings);
        }
    }
}
