/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { BaseMapObject } from ".";
import { Character } from "./entities";
import * as utils from "./Utils";

interface IInteractionHandler {
    (interactor?: BaseMapObject): void;
}

interface IEventHandler {
    (e: createjs.Event, data?: any): void;
}

export var InteractionHandlers: { [id: string]: IInteractionHandler | IEventHandler } = {
    "not_found": function() {
        console.log("Interaction handler '" + this.getInteractionID() + "' not found.");
    },
    "test_map_npc_testy": function(interactor: Character): void {
        interactor.parent.showDialog(this, "Hello I am a test NPC! AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
    },
    "test_map_npc_testy2": function(e: createjs.Event, data?: any): void {
        // This demonstrates that NPCs with the "dialog" and "interactionID"
        // properties set will have their interaction handlers executed after a
        // dialog box finishes. Notice the method signature is different, much
        // like a normal event handler.

        // data.interactor is the object interacting with this character

        // Make sure the dialog owner is this
        if (e.data.owner === this) {
            this.parent.showDialog(this, "Now I'm using an interaction handler to talk to you!", function(e: createjs.Event, data: any): void {
                console.log("Callback inside of test_map_npc_testy2 executed. this=", this);
                e.remove();
            });

            // Remember to call remove() on the event or the listener will still exist!
            e.remove();
        }
    },
    "activate_aggro": function(e: createjs.Event, data?: any): void {
        if (!this.isAggrovated) {
            this.isAggrovated = true;
        }
        e.remove();
    }
}
