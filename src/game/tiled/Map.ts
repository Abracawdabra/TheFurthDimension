/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import * as tiled from ".";

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
     */
    getArea(area: createjs.Rectangle): tiled.IMapAreaLayer[] {
    }
}
