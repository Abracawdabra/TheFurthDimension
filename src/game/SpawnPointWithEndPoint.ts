/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { IMap } from "./tiled";

interface ISpawnPointEndPoint {
    map?: string;
    spawnPoint: string;
}

export class SpawnPointWithEndPoint extends createjs.Rectangle {
    endPoint: ISpawnPointEndPoint;

    constructor(x: number, y: number, width: number, height: number, end_point: ISpawnPointEndPoint) {
        super(x, y, width, height);
        this.endPoint = end_point;
    }
}