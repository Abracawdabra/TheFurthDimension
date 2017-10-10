/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { IWeapon, IArmorPiece, IConsumable } from ".";

export enum InventoryItemType {
    WEAPON,
    ARMOR_PIECE,
    CONSUMABLE
}

export interface IInventorySlot {
    item: IWeapon | IArmorPiece | IConsumable;
    type: InventoryItemType;
    quantity: number;
}
