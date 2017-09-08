/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import * as tiled from "./IObject";

export interface ILayer {
    width: number;
    height: number;
    name: string;
    type: "tilelayer" | "objectgroup" | "imagelayer";
    visible: boolean;
    x: number;
    y: number;
    data?: number[];
    objects?: tiled.IObject[];
    properties: { [key: string]: any };
    opacity: number;
    draworder: "topdown" | "index";
}

export class Layer {
    width: number;
    height: number;
    name: string;
    type: "tilelayer" | "objectgroup" | "imagelayer";
    visible: boolean;
    x: number;
    y: number;
    data?: number[][];
    objects?: tiled.IObject[];
    properties: { [key: string]: any };
    opacity: number;
    drawOrder: "topdown" | "index";

    constructor(layer: ILayer) {
        this.width = layer.width;
        this.height = layer.height;
        this.name = layer.name;
        this.type = layer.type;
        this.visible = layer.visible;
        this.x = layer.x;
        this.y = layer.y;
        this.opacity = layer.opacity;
        this.drawOrder = layer.draworder;

        this.properties = {};
        for (let key in layer.properties) {
            if (layer.properties.hasOwnProperty(key)) {
                this.properties[key] = layer.properties[key];
            }
        }

        if (layer.data) {
            // Copy to a 2-dimensional array for easier usage
            this.data = [];
            for (let row=0; row<layer.height; ++row) {
                this.data.push([]);
                let row_index = row * layer.width;
                for (let col=0; col<layer.width; ++col) {
                    this.data[row].push(layer.data[row_index + col]);
                }
            }
        }
        else if (layer.objects) {
            // Clone objects
            this.objects = [];
            for (let obj of layer.objects) {
                this.objects.push(tiled.cloneObject(obj));
            }
        }
    }
}
