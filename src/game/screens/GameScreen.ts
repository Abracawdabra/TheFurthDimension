/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { BaseScreen } from "./BaseScreen";
import * as tiled from "../tiled";
import { Game } from "../Main";
import { Direction, Button, SpatialGrid, BaseMapObject } from "..";

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

    // Array for storing objects that are currently in draw distance
    protected _activeObjects: { [layer: string]: BaseMapObject[] };

    // Spatial grid layers for the current map
    protected _spatialGrids: { [layer: string]: SpatialGrid };

    // Container for map tiles
    protected _tileContainer: createjs.Container;

    // Container for map objects
    protected _objectContainer: createjs.Container;

    loadMap(map: tiled.IMap): void {
        this._map = new tiled.Map(map);
        this._numOfXTiles = Math.ceil(Game.DISPLAY_WIDTH / map.tilewidth) + 1;
        this._numOfYTiles = Math.ceil(Game.DISPLAY_HEIGHT / map.tileheight) + 1;

        this._scrollXPos = 0;
        this._scrollYPos = 0;

        this._mapLayerIndices = {};
        this._spatialGrids = {};
        this._tileContainer.removeAllChildren();

        let empty_spritesheet = new createjs.SpriteSheet({});
        for (let layer_index=0; layer_index<map.layers.length; ++layer_index) {
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
            else if (layer.type === "objectgroup") {
                let grid = new SpatialGrid(map.tilewidth, map.tileheight, map.width, map.height);
                for (let obj of layer.objects) {
                    if (obj.type === "spawn_point") {
                        // Don't add spawn points to the spatial grids
                        continue;
                    }

                    grid.addObject(GameScreen._createMapObject(obj));
                }
                this._spatialGrids[layer.name] = grid;
            }
        }

        this._activeObjects = {};

        let background = new createjs.Shape();
        background.graphics.beginFill(this._map.backgroundColor);
        background.graphics.drawRect(0, 0, Game.DISPLAY_WIDTH, Game.DISPLAY_HEIGHT);
        this.container.addChildAt(background, 0);

        this._gotoSpawnPoint("default");
    }

    handleKeyDown(key_code: number): void {
        if (key_code === Button.LEFT) {
            this._scrollDir |= Direction.LEFT;
        }
        else if (key_code === Button.RIGHT) {
            this._scrollDir |= Direction.RIGHT;
        }
        else if (key_code === Button.UP) {
            this._scrollDir |= Direction.UP;
        }
        else if (key_code === Button.DOWN) {
            this._scrollDir |= Direction.DOWN;
        }
    }

    handleKeyUp(key_code: number): void {
        if (key_code === Button.LEFT) {
            this._scrollDir &= ~Direction.LEFT;
        }
        else if (key_code === Button.RIGHT) {
            this._scrollDir &= ~Direction.RIGHT;
        }
        else if (key_code === Button.UP) {
            this._scrollDir &= ~Direction.UP;
        }
        else if (key_code === Button.DOWN) {
            this._scrollDir &= ~Direction.DOWN;
        }
    }

    update(delta: number): void {
        if (this._mapArea && this._scrollDir) {
            /** @todo Implement collision checking */
            let x_movement = 0;
            let y_movement = 0;
            let scroll_speed = delta / 1000 * this._gameInstance.walkSpeed;
            if (this._scrollDir & Direction.LEFT) {
                x_movement = scroll_speed;
            }
            else if (this._scrollDir & Direction.RIGHT) {
                x_movement = -scroll_speed;
            }

            if (this._scrollDir & Direction.UP) {
                y_movement = scroll_speed;
            }
            else if (this._scrollDir & Direction.DOWN) {
                y_movement = -scroll_speed;
            }

            this._tileContainer.x += x_movement;
            this._tileContainer.y += y_movement;
            this._scrollMap();
        }
    }

    redrawMapArea(): void {
        for (let layer_index=0; layer_index<this._mapArea.length; ++layer_index) {
            let area_layer = this._mapArea[layer_index];
            if (area_layer.layer.type === "tilelayer") {
                let layer_start_index = layer_index * this._numOfYTiles * this._numOfXTiles;
                for (let row=0; row<this._numOfYTiles; ++row) {
                    for (let col=0; col<this._numOfXTiles; ++col) {
                        let sprite = <createjs.Sprite>this._tileContainer.getChildAt(layer_start_index + (row * this._numOfXTiles) + col);
                        if (row >= area_layer.data.length || col >= area_layer.data[row].length || (!this._gameInstance.renderInvisibleLayers && !area_layer.layer.visible)) {
                            // Past the last row or column in the layer data, or layer is invisible without cheat enabled
                            sprite.alpha = 0.0;
                        }
                        else {
                            let gid = area_layer.data[row][col];
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
            else if (area_layer.layer.type === "objectgroup") {
                let objects_to_remove = this._objectContainer.children.slice();
                for (let obj of this._activeObjects[area_layer.layer.name]) {
                    // Render objects that haven't been rendered yet
                    let sprite = this._objectContainer.getChildByName(obj.name);
                    if (!sprite) {
                        sprite = obj.getSprite();
                        // I'm going to cheat here because otherwise it's a pain in
                        // in the ass and probably less efficient to make a hash
                        // object just to call destroySprite()
                        (<any>sprite).mapObject = obj;
                        this._objectContainer.addChild(sprite);
                    }

                    objects_to_remove.splice(objects_to_remove.indexOf(sprite), 1);
                }

                for (let sprite of objects_to_remove) {
                    // Remove objects that are no longer in draw distance
                    this._objectContainer.removeChild(sprite);
                    (<any>sprite).mapObject.destroySprite();
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
    }

    protected _gotoSpawnPoint(name: string): void {
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

            this._updateMapArea(this._scrollXPos, this._scrollYPos, this._numOfXTiles, this._numOfYTiles);
            this.redrawMapArea();
        }
        else {
            console.log("Could not find spawn point '" + name + "'");
        }
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
        this._activeObjects = {};
        for (let area_layer of this._mapArea) {
            if (area_layer.layer.type === "objectgroup") {
                this._activeObjects[area_layer.layer.name] = <BaseMapObject[]>this._spatialGrids[area_layer.layer.name].getObjects(rect);
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
     * @todo Implement
     */
    protected static _createMapObject(obj: tiled.IObject): any {
    }
}
