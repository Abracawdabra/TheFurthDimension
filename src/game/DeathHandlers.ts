/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

// Returning true from a handler method will kill the character immediately.

export var DeathHandlers: { [id: string]: () => boolean } = {
    "test_map_fightman": function(): boolean {
        this.parent.showDialog(this, "Oof! You beat me, you scoundrel!", function(e: createjs.Event, data: any): void {
            // Make sure the dialog owner is this
            if (e.data.owner === this) {
                this.die(true);
                this.parent.removeEnemy(this);

                // Remember to call remove() on the event or the listener will still exist!
                e.remove();
            }
        });

        // Don't kill the enemy straight away by returning false
        return false;
    }
};
