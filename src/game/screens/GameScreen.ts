/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { BaseScreen } from "./BaseScreen";
import * as tiled from "../tiled";
import { Game } from "../Main";
import { Direction, Button } from "..";

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

    // Container for map tiles
    protected _tileContainer: createjs.Container;

    loadMap(map: tiled.IMap): void {
        this._map = new tiled.Map(map);
        this._numOfXTiles = Math.ceil(Game.DISPLAY_WIDTH / map.tilewidth) + 1;
        this._numOfYTiles = Math.ceil(Game.DISPLAY_HEIGHT / map.tileheight) + 1;

        this._scrollXPos = 0;
        this._scrollYPos = 0;

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
        this._tileContainer.removeAllChildren();
        for (let area_layer of this._mapArea) {
            if (!this._gameInstance.renderInvisibleLayers && !area_layer.layer.visible) {
                // Don't render invisible layers without cheat
                continue;
            }

            if (area_layer.layer.type === "tilelayer") {
                for (let row=0; row<area_layer.data.length; ++row) {
                    for (let col=0; col<area_layer.data[row].length; ++col) {
                        let gid = area_layer.data[row][col];
                        let tileset = this._map.getTileset(gid);
                        if (tileset) {
                            let sprite = tileset.getTileSprite(gid);
                            sprite.name = GameScreen._generateTileName(area_layer.layer.name, this._scrollYPos + row, this._scrollXPos + col);
                            sprite.x = col * this._map.tileWidth;
                            sprite.y = row * this._map.tileHeight;
                            this._tileContainer.addChild(sprite);
                        }
                    }
                }
            }
            else if (area_layer.layer.type === "objectgroup") {
            }
        }
    }

    protected _init(): void {
        this._tileContainer = new createjs.Container();
        this.container.addChild(this._tileContainer);
    }

    protected _gotoSpawnPoint(name: string): void {
        let spawn_point = this._map.getSpawnPoint(name);
        if (spawn_point) {
            this._tileContainer.removeAllChildren();

            // Convert spawn point coordinates to tile coordinates
            let sp_tile_x = Math.floor(spawn_point.x / this._map.tileWidth);
            let sp_tile_y = Math.floor(spawn_point.y / this._map.tileHeight);

            // Stretch out to the top left corner of the screen
            this._scrollXPos = sp_tile_x - Math.floor(this._numOfXTiles / 2);
            this._scrollYPos = sp_tile_y - Math.floor(this._numOfYTiles / 2);

            // Center the tiles on the screen
            this._tileContainer.x = Math.floor((Game.DISPLAY_WIDTH - (this._numOfXTiles * this._map.tileWidth)) / 2);
            this._tileContainer.y = Math.floor((Game.DISPLAY_HEIGHT - (this._numOfYTiles * this._map.tileHeight)) / 2);

            this._mapArea = this._map.getArea(new createjs.Rectangle(this._scrollXPos, this._scrollYPos, this._numOfXTiles, this._numOfYTiles));
            this.redrawMapArea();
        }
        else {
            console.log("Could not find spawn point '" + name + "'");
        }
    }


    protected _scrollMap(): void {
        let scrolling_left = (this._tileContainer.x > 0) && (this._scrollXPos > 0);
        let scrolling_right = (this._tileContainer.x <= -this._map.tileWidth) && (this._scrollXPos < this._map.width);
        let scrolling_up = (this._tileContainer.y > 0) && (this._scrollYPos > 0);
        let scrolling_down = (this._tileContainer.y <= -this._map.tileHeight) && (this._scrollYPos < this._map.height);

        if (scrolling_left) {
            this._scrollXPos -= Math.ceil(this._tileContainer.x / this._map.tileWidth);
            this._tileContainer.x = (this._tileContainer.x % this._map.tileWidth) - this._map.tileWidth;
        }
        else if (scrolling_right) {
            this._scrollXPos += Math.abs(Math.ceil(this._tileContainer.x / this._map.tileWidth));
            this._tileContainer.x = this._tileContainer.x % this._map.tileWidth;
        }

        if (scrolling_up) {
            this._scrollYPos -= Math.ceil(this._tileContainer.y / this._map.tileHeight);
            this._tileContainer.y = (this._tileContainer.y % this._map.tileHeight) - this._map.tileHeight;
        }
        else if (scrolling_down) {
            this._scrollYPos += Math.abs(Math.ceil(this._tileContainer.y / this._map.tileHeight));
            this._tileContainer.y = this._tileContainer.y % this._map.tileHeight;
        }

        if (scrolling_left || scrolling_right || scrolling_up || scrolling_down) {
            this._mapArea = this._map.getArea(new createjs.Rectangle(this._scrollXPos, this._scrollYPos, this._numOfXTiles, this._numOfYTiles));
            this.redrawMapArea();
        }
    }

    protected static _generateTileName(layer_name: string, row: number, col: number): string
    {
        return layer_name + "_y" + row + "_x" + col;
    }
}
