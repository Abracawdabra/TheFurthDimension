/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

interface ITerrains {
    name: string;
    tile: number;
}

export interface ITileset {
    firstgid: number;
    image: string;
    name: string;
    tilewidth: number;
    tileheight: number;
    tilecount: number;
    imagewidth: number;
    imageheight: number;
    properties: { [key: string]: any };
    margin: number;
    spacing: number;
    tileproperties: { [gid: string]: any };
    terrains?: ITerrains[];
    tiles?: { [gid: string]: any };
}

export class Tileset {
    name: string;
    margin: number;
    spacing: number;
    terrains: ITerrains[];
    properties: { [key: string]: any };

    protected _firstGID: number;
    protected _lastGID: number;
    protected _tileCount: number;
    protected _image: string;
    protected _imageWidth: number;
    protected _imageHeight: number;
    protected _tileWidth: number;
    protected _tileHeight: number;
    protected _tileProperties: { [gid: string]: any };
    protected _tiles: { [gid: string]: any };

    protected _spriteSheet: createjs.SpriteSheet;

    constructor(tileset: ITileset) {
        this.name = tileset.name;
        this.margin = tileset.margin;
        this.spacing = tileset.spacing;
        this.terrains = tileset.terrains;
        this.properties = tileset.properties;

        this._firstGID = tileset.firstgid;
        this._lastGID = tileset.firstgid + tileset.tilecount - 1;
        this._tileCount = tileset.tilecount;
        this._image = tileset.image;
        this._imageWidth = tileset.imagewidth;
        this._imageHeight = tileset.imageheight;
        this._tileWidth = tileset.tilewidth;
        this._tileHeight = tileset.tileheight;

        this._spriteSheet = new createjs.SpriteSheet({
            images: [tileset.image],
            frames: {
                width: tileset.tilewidth,
                height: tileset.tileheight,
                count: tileset.tilecount,
                regX: 0,
                regY: 0,
                margin: tileset.margin,
                spacing: tileset.spacing
            }
        });

        // Convert all local ids to global ids
        for (let id in tileset.tileproperties) {
            if (tileset.tileproperties.hasOwnProperty(id)) {
                this._tileProperties[parseInt(id, 10) + tileset.firstgid] = tileset.tileproperties[id];
            }
        }

        for (let id in tileset.tiles) {
            if (tileset.tiles.hasOwnProperty(id)) {
                this._tiles[parseInt(id, 10) + tileset.firstgid] = tileset.tiles[id];
            }
        }
    }

    hasGID(gid: number): boolean {
        return gid >= this._firstGID && gid <= this._lastGID;
    }

    getTileProperties(gid: number): { [id: string]: any } {
        if (this.hasGID(gid)) {
            return this._tileProperties[gid];
        }

        return null;
    }

    getTileSprite(gid: number): createjs.Sprite {
        if (this.hasGID(gid)) {
            let sprite = new createjs.Sprite(this._spriteSheet);
            sprite.gotoAndStop(gid - this._firstGID);
            return sprite;
        }

        return null;
    }
}
