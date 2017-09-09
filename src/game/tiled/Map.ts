/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import * as tiled from ".";
import { SpatialGrid } from "../SpatialGrid";

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
    protected _spatialGrids: { [layer: string]: SpatialGrid };

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

        this._layers = [];
        for (let layer of map.layers) {
            this._layers.push(new tiled.Layer(layer));
            if (layer.type === "objectgroup") {
                this._spatialGrids[layer.name] = new SpatialGrid(map.tilewidth, map.tileheight, map.width, map.height);
                for (let obj of this._layers[this._layers.length - 1].objects) {
                    if (obj.type === "spawn_point") {
                        // Don't add spawn points to the spatial grid
                        this._spawnPoints[obj.name] = obj;
                    }
                    else {
                        this._spatialGrids[layer.name].addObject(obj);
                    }
                }
            }
        }

        if (this.properties.defaultSpawnPoint in this._spawnPoints) {
            // Set the default spawn point
            this._spawnPoints.default == this._spawnPoints[this.properties.defaultSpawnPoint];
        }

        this._tilesets = [];
        for (let tileset of map.tilesets) {
            this._tilesets.push(new tiled.Tileset(tileset));
        }
    }

    getTileset(gid: number): tiled.Tileset {
        for (let tileset of this._tilesets) {
            if (tileset.hasGID(gid)) {
                return tileset;
            }
        }

        return null;
    }

    /**
     * Returns an area of tiles and objects from all layers
     * @param {createjs.Rectangle} area Area in tile coordinates and dimensions
     */
    getArea(area: createjs.Rectangle): tiled.IMapAreaLayer[] {
        // Bounds checks
        let end_col = area.x + area.width;
        if (area.x < 0) {
            // Clamp to the left edge
            area.width += area.x;
            area.x = 0;
        }
        else if (area.x >= this.width) {
            // Nothing to return
            return [];
        }

        if (end_col >= this.width) {
            // Clamp to the right edge
            area.width -= end_col - this.width;
            end_col = this.width;
        }

        let end_row = area.y + area.height;
        if (area.y < 0) {
            // Clamp to the top edge
            area.height += area.y;
            area.y = 0;
        }
        else if (area.y >= this.width) {
            // Nothing to return
            return [];
        }

        if (end_row >= this.height) {
            // Clamp to the bottom edge
            area.height -= end_row - this.height;
            end_row = this.height;
        }

        let result: tiled.IMapAreaLayer[] = [];
        // Convert from tile coordinates for the spatial grids
        let object_area = new createjs.Rectangle(area.x * this.tileWidth, area.y * this.tileHeight, area.width * this.tileWidth, area.height * this.tileHeight);
        for (let layer of this._layers) {
            let area_layer: tiled.IMapAreaLayer = { layer: layer };
            if (layer.type === "tilelayer") {
                area_layer.data = [];
                for (let row=area.y; row<end_row; ++row) {
                    area_layer.data.push([]);
                    for (let col=area.x; col<end_col; ++col) {
                        area_layer.data[row].push(layer.data[row][col]);
                    }
                }
            }
            else if (layer.type === "objectgroup") {
                area_layer.objects = <tiled.IObject[]>this._spatialGrids[layer.name].getObjects(object_area);
            }

            result.push(area_layer);
        }

        return result;
    }
}
