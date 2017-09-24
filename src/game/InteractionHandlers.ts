/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { BaseMapObject } from ".";

export var InteractionHandlers: { [id: string]: (interactor?: BaseMapObject) => void } = {
    "not_found": function() {
        console.log("Interaction handler '" + this.getInteractionID() + "' not found.");
    }
}
