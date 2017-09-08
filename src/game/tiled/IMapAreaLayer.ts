/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { Layer, IObject } from ".";

export interface IMapAreaLayer {
    layer: Layer;
    data?: number[][];
    objects?: IObject[];
}
