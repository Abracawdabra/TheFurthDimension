/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import * as tiled from ".";
import { SpatialGrid } from "../SpatialGrid";

interface IMap {
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
                    this._spatialGrids[layer.name].addObject(obj);
                }
            }
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
        let result: tiled.IMapAreaLayer[] = [];
        // Convert from tile coordinates for the spatial grids
        let object_area = new createjs.Rectangle(area.x * this.tileWidth, area.y * this.tileHeight, area.width * this.tileWidth, area.height * this.tileHeight);
        for (let layer of this._layers) {
            let area_layer: tiled.IMapAreaLayer = { layer: layer };
            if (layer.type === "tilelayer") {
                area_layer.data = [];
                let end_row = area.y + area.height;
                let end_col = area.x + area.width;
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
