/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

// Returning true from a handler method will kill the character immediately.

export var DeathHandlers: { [id: string]: () => boolean } = {
    "test_map_fightman": function(): boolean {
        this.parent.showDialog(this, "Oof! You beat me, you scoundrel!", function(): void {
            this.die(true);
            this.parent.removeEnemy(this);
        });
        return false;
    }
};
