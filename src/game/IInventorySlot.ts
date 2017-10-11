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
    // ID that corresponds to one of the properties in Weapons/ArmorPieces/Consumables
    itemID: string;
    itemType: InventoryItemType;
    quantity: number;
    equipped?: boolean;
}

export function compactInventorySlot(slot: IInventorySlot): any[] {
    let compacted = [
        slot.itemID,
        slot.itemType,
        slot.quantity
    ];

    if ("equipped" in slot) {
        compacted.push(Number(slot.equipped));
    }

    return compacted;
}

export function decompactInventorySlot(compact_slot: any[]): IInventorySlot {
    let decompacted: IInventorySlot = {
        itemID: compact_slot[0],
        itemType: compact_slot[1],
        quantity: compact_slot[2]
    };

    if (compact_slot.length > 3) {
        decompacted.equipped = Boolean(compact_slot[3]);
    }

    return decompacted;
}
