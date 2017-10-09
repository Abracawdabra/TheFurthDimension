/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

export interface IConsumable {
    name: string;
    // How long its effects last in seconds
    duration: number;
    attack?: number;
    defense?: number;
    speed?: number;
    range?: number;
}

export var Consumables: { [id: string]: IConsumable } = {
}
