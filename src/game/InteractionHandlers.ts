/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

export var InteractionHandlers: { [id: string]: (param: any) => void } = {
    "not_found": function() {
        console.log("Interaction handler '" + this.getInteractionID() + "' not found.");
    }
}
