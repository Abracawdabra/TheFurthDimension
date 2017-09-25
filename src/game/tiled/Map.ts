/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import * as tiled from ".";

export interface IMap {
    width: number;
    height: number;
    tilewidth: number;
    tileheight: number;
    oritentation: "orthogonal" | "isometric" | "staggered";
    backgroundcolor: string;
    renderorder: string;
    properties: { [key: string]: any };
    nextobjectid: number;
    layers: tiled.ILayer[];
    tilesets: tiled.ITileset[];
}

export class Map {
    width: number;
    height: number;
    tileWidth: number;
    tileHeight: number;
    oritentation: "orthogonal" | "isometric" | "staggered";
    backgroundColor: string;
    renderOrder: string;
    properties: { [key: string]: any };
    nextObjectID: number;

    protected _layers: tiled.Layer[];
    protected _tilesets: tiled.Tileset[];

    protected _spawnPoints: { [name: string]: tiled.IObject };

    constructor(map: IMap) {
        this.width = map.width;
        this.height = map.height;
        this.tileWidth = map.tilewidth;
        this.tileHeight = map.tileheight;
        this.oritentation = map.oritentation;
        this.backgroundColor = map.backgroundcolor;
        this.renderOrder = map.renderorder;
        this.nextObjectID = map.nextobjectid;

        this.properties = {};
        for (let key in map.properties) {
            if (map.properties.hasOwnProperty(key)) {
                this.properties[key] = map.properties[key];
            }
        }

        this._spawnPoints = {};
        this._layers = [];
        for (let layer of map.layers) {
            this._layers.push(new tiled.Layer(layer));
            if (layer.type === "objectgroup") {
                for (let obj of this._layers[this._layers.length - 1].objects) {
                    if (obj.type === "spawn_point") {
                        this._spawnPoints[obj.name] = obj;
                        console.log("Added spawn point '" + obj.name + "'");
                    }
                }
            }
        }

        if (this.properties.defaultSpawnPoint in this._spawnPoints) {
            // Set the default spawn point
            this._spawnPoints.default = this._spawnPoints[this.properties.defaultSpawnPoint];
        }

        this._tilesets = [];
        for (let tileset of map.tilesets) {
            this._tilesets.push(new tiled.Tileset(tileset));
        }
    }

    getGID(layer_index: number, row: number, column: number): number {
        if (row < this._layers[layer_index].data.length && column < this._layers[layer_index].data[row].length) {
            return this._layers[layer_index].data[row][column];
        }

        return 0;
    }

    getTileset(gid: number): tiled.Tileset {
        for (let tileset of this._tilesets) {
            if (tileset.hasGID(gid)) {
                return tileset;
            }
        }

        return null;
    }

    getSpawnPoint(name: string): tiled.IObject {
        if (name in this._spawnPoints) {
            return this._spawnPoints[name];
        }

        return null;
    }

    /**
     * Returns an area of tiles and objects from all layers
     * @param {createjs.Rectangle} area Area in tile coordinates and dimensions
     */
    getArea(x: number, y: number, width: number, height: number): tiled.IMapAreaLayer[] {
        // Bounds checks
        let end_col = x + width;
        if (x < 0) {
            // Clamp to the left edge
            width += x;
            x = 0;
        }
        else if (x >= this.width) {
            // Nothing to return
            return [];
        }

        if (end_col >= this.width) {
            // Clamp to the right edge
            width -= end_col - this.width;
            end_col = this.width;
        }

        let end_row = y + height;
        if (y < 0) {
            // Clamp to the top edge
            height += y;
            y = 0;
        }
        else if (y >= this.width) {
            // Nothing to return
            return [];
        }

        if (end_row >= this.height) {
            // Clamp to the bottom edge
            height -= end_row - this.height;
            end_row = this.height;
        }

        let result: tiled.IMapAreaLayer[] = [];
        for (let layer of this._layers) {
            let area_layer: tiled.IMapAreaLayer = { layer: layer };
            if (layer.type === "tilelayer") {
                area_layer.data = [];
                let num_of_rows = end_row - y;
                let num_of_cols = end_col - x;
                for (let row=0; row<num_of_rows; ++row) {
                    area_layer.data.push([]);
                    for (let col=0; col<num_of_cols; ++col) {
                        area_layer.data[row].push(layer.data[row + y][col + x]);
                    }
                }
            }

            result.push(area_layer);
        }

        return result;
    }
}
