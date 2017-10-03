/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { BaseMapObject } from ".";
import { Character } from "./entities";
import * as utils from "./Utils";

export var InteractionHandlers: { [id: string]: (interactor?: BaseMapObject) => void } = {
    "not_found": function() {
        console.log("Interaction handler '" + this.getInteractionID() + "' not found.");
    },
    "test_map_npc_testy": function(interactor: Character): void {
        interactor.parent.showDialog(this, "Hello I am a test NPC! AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
    }
}
