/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { BaseScreen, PauseScreen } from ".";
import * as tiled from "../tiled";
import { Game, DISPLAY_WIDTH, DISPLAY_HEIGHT } from "../Main";
import { Direction, Button, SpatialGrid, BaseMapObject, SpawnPointWithEndPoint, Weapons, WeaponType } from "..";
import { INPCSettings, NPC, Character, Enemy, IEnemySettings, Sign } from "../entities";
import { DialogBox, BitmapText } from "../ui";
import { DeathScreen } from "../screens";
import * as colors from "../Colors";
import * as utils from "../Utils";

// Player hitboxes
const PLAYER_HITBOX = new createjs.Rectangle(1, 8, 10, 10);
const PLAYER_PROJECTILES_HITBOX = new createjs.Rectangle(1, 4, 10, 14);

// Maximum distance in pixels of an object to be interacted with
const MAX_INTERACTION_DISTANCE = 15;

// Base XP for leveling
const BASE_XP = 33;
// How much required levelling xp increases per level
const LEVEL_XP_INCREASE_RATIO = 1.5;

const BATTLE_REWARDS_BONES_BASE_MULTIPLIER = 30;
const BATTLE_REWARDS_BONES_LEVEL_MULTIPLIER = 0.3;

const BATTLE_REWARDS_XP_BASE_MULTIPLIER = 100;
const BATTLE_REWARDS_XP_LEVEL_MULTIPLIER = 0.3;

// Amount of time the rewards text should be visible for (seconds)
const REWARDS_TEXT_VISIBILITY_DURATION = 3.5;

// For the screen spin effect
const SCREEN_SPIN_FRAME_DURATION = 25;

export enum Axes {
    X = 1,
    Y = 2
}

export class GameScreen extends BaseScreen {
    protected _map: tiled.Map;

    protected _background: createjs.Shape;

    // Number of tiles to draw across the screen
    protected _numOfXTiles: number;
    protected _numOfYTiles: number;

    // Tile position of the top-left corner in the view area
    protected _scrollXPos: number;
    protected _scrollYPos: number;

    protected _scrollDir: number;

    // Stored map area for rendering, checking collisions, etc.
    protected _mapArea: tiled.IMapAreaLayer[];

    // Hash object for layer names to indices (for faster lookup)
    protected _mapLayerIndices: { [name: string]: number };

    // For storing objects that are currently in draw distance
    protected _activeObjects: { [layer: string]: BaseMapObject[] };

    // Current NPCs in draw distance to save on frame workload (Scraped from _activeObjects)
    protected _activeNPCs: { [layer: string]: NPC[] };

    // Spatial grid layers for the current map
    protected _spatialGrids: { [layer: string]: SpatialGrid };

    // A special spatial grid for spawn points with end points
    protected _spawnPointSpatialGrid: SpatialGrid;

    // Indicates the player just teleported and to ignore the end point until the player steps off of it
    protected _ignoreEndPoint: boolean;

    // Container for map tiles
    protected _tileContainer: createjs.Container;

    // Container for map objects
    protected _objectContainer: createjs.Container;

    // The player
    protected _player: Character;

    // Enables/disables player input
    protected _inputEnabled: boolean;

    // Dialog box for uh, dialog
    protected _dialogBox: DialogBox;

    protected _rewardsText: BitmapText;
    protected _rewardsTextVisibilityEndTime: number;

    // Shake screen effect
    protected _screenIsShaking: boolean;
    // The duration of a screen shake "frame" in milliseconds
    protected _screenShakeFrameDuration: number;
    // The time until the next shake frame occurs
    protected _screenShakeFrameTime: number;
    // Intensity multiplier for moving the container (correlates to tile dimensions)
    protected _screenShakeIntensity: number;
    // How long the effect will last
    protected _screenShakeDuration: number;

    // Spin screen effect
    protected _screenIsSpinning: boolean;
    // The time until the next spin frame
    protected _screenSpinFrameTime: number;

    // Global x position of the viewport
    get viewportX(): number {
        return (this._scrollXPos * this._map.tileWidth) - this._tileContainer.x;
    }

    // Global y position of the viewport
    get viewportY(): number {
        return (this._scrollYPos * this._map.tileHeight) - this._tileContainer.y;
    }

    handleKeyDown(key_code: number): void {
        if (key_code === Button.START) {
            this.gameInstance.pushScreen(new PauseScreen(this.gameInstance, this));

            // Stop any walking characters or their animations will keep going while they're paused
            for (let layer in this._activeNPCs) {
                if (this._activeNPCs.hasOwnProperty(layer)) {
                    for (let npc of this._activeNPCs[layer]) {
                        if (npc.isWalking) {
                            npc.isWalking = false;
                        }
                    }
                }
            }

            // Stop the player also
            if (this._player.isWalking) {
                this._player.isWalking = false;
                // Don't resume scrolling or the direction button becomes "stuck"
                this._scrollDir = 0;
            }
        }
        else if (this._inputEnabled) {
            if (this._dialogBox && key_code === Button.B) {
                if (this._dialogBox.isTransitioning()) {
                    // Double the speeeeed
                    this._dialogBox.textSpeed = this.gameInstance.settings.textSpeed * 2;
                }
                else if (!this._dialogBox.showNext()) {
                    // Dialog is finished
                    this.container.removeChild(this._dialogBox);
                    let owner = this._dialogBox.owner;
                    if (owner instanceof NPC) {
                        if (owner.canWander()) {
                            owner.wander = true;
                        }
                    }
                    this._dialogBox = null;

                    for (let enemy of <Enemy[]>this._activeNPCs["Enemies"]) {
                        // Unpause attacking enemies
                        if (enemy.isAggrovated) {
                            enemy.pauseAggro = false;
                        }
                    }

                    this.dispatchEvent(new createjs.Event("finished_dialog", false, true));
                }
            }
            else if (!this._dialogBox && this._player.isAlive) {
                switch (key_code) {
                    case Button.LEFT:
                        this._scrollDir |= Direction.LEFT;
                        this._player.direction = this._scrollDir;
                        break;
                    case Button.RIGHT:
                        this._scrollDir |= Direction.RIGHT;
                        this._player.direction = this._scrollDir;
                        break;
                    case Button.UP:
                        this._scrollDir |= Direction.UP;
                        this._player.direction = this._scrollDir;
                        break;
                    case Button.DOWN:
                        this._scrollDir |= Direction.DOWN;
                        this._player.direction = this._scrollDir;
                        break;
                    case Button.B:
                        let interactive_obj = this._getInteractiveObject();
                        if (interactive_obj) {
                            for (let enemy of <Enemy[]>this._activeNPCs["Enemies"]) {
                                // Pause attacking enemies so that the player isn't killed while in dialog
                                if (enemy.isAggrovated) {
                                    enemy.pauseAggro = true;
                                }
                            }

                            if (interactive_obj instanceof NPC) {
                                if (interactive_obj.wander) {
                                    interactive_obj.wander = false;
                                }

                                if (interactive_obj.faceWhenTalking) {
                                    interactive_obj.direction = utils.getOppositeDirection(this._player.direction);
                                }

                                if (this.gameInstance.gameState.isHuman) {
                                    this.showDialog(interactive_obj, "AWOOOOOOOO!");
                                }
                                else {
                                    interactive_obj.interact(this._player);
                                }
                            }
                            else {
                                interactive_obj.interact(this._player);
                            }
                        }
                        break;
                    case Button.A:
                            this.performCharacterAttack(this._player);
                }
            }
        }
    }

    handleKeyUp(key_code: number): void {
        switch (key_code) {
            case Button.LEFT:
                this._scrollDir &= ~Direction.LEFT;
                this._player.direction = this._scrollDir;
                break;
            case Button.RIGHT:
                this._scrollDir &= ~Direction.RIGHT;
                this._player.direction = this._scrollDir;
                break;
            case Button.UP:
                this._scrollDir &= ~Direction.UP;
                this._player.direction = this._scrollDir;
                break;
            case Button.DOWN:
                this._scrollDir &= ~Direction.DOWN;
                this._player.direction = this._scrollDir;
                break;
            case Button.A:
                if (this._dialogBox && this._dialogBox.isTransitioning()) {
                    this._dialogBox.textSpeed = this.gameInstance.settings.textSpeed;
                }
                break;
        }
    }

    update(delta: number): void {
        if (this._mapArea) {
            if (this._scrollDir) {
                let x_movement = 0;
                let y_movement = 0;
                let scroll_speed = delta / 1000 * this._player.stats.speed;
                if (this._scrollDir & Direction.LEFT) {
                    x_movement = -scroll_speed;
                }
                else if (this._scrollDir & Direction.RIGHT) {
                    x_movement = scroll_speed;
                }

                if (this._scrollDir & Direction.UP) {
                    y_movement = -scroll_speed;
                }
                else if (this._scrollDir & Direction.DOWN) {
                    y_movement = scroll_speed;
                }

                if (x_movement !== 0 || y_movement !== 0) {
                    let player_x_pos = this._player.x + x_movement;
                    let player_y_pos = this._player.y + y_movement;
                    let axes = (this.gameInstance.enableNoClip) ? (Axes.X | Axes.Y) : this.canMoveToPos(this._player, player_x_pos, player_y_pos);
                    if (axes) {
                        if (!this._player.isWalking) {
                            this._player.isWalking = true;
                        }

                        // Flip the directions for the tile container
                        x_movement = (x_movement < 0) ? Math.abs(x_movement) : x_movement * -1;
                        y_movement = (y_movement < 0) ? Math.abs(y_movement) : y_movement * -1;
                        if (axes & Axes.X) {
                            this._tileContainer.x += x_movement;
                            this._player.x = player_x_pos;
                        }

                        if (axes & Axes.Y) {
                            this._tileContainer.y += y_movement;
                            this._player.y = player_y_pos;
                        }

                        // Check if player stepped on a spawn point with an end point
                        let player_hitbox = this._player.getHitbox();
                        let spawn_points = <SpawnPointWithEndPoint[]>this._spawnPointSpatialGrid.getObjects(player_hitbox);
                        if (spawn_points.length > 0 && !this._ignoreEndPoint) {
                            let spawn_point = spawn_points[0];
                            this._ignoreEndPoint = true;
                            if ("map" in spawn_point.endPoint && spawn_point.endPoint.map !== this._map.name) {
                                this.loadMap(spawn_point.endPoint.map, spawn_point.endPoint.spawnPoint);
                            }
                            else {
                                this.gotoSpawnPoint(spawn_point.endPoint.spawnPoint);
                            }
                        }
                        else {
                            if (this._ignoreEndPoint && spawn_points.length === 0) {
                                this._ignoreEndPoint = false;
                            }

                            for (let layer in this._activeObjects) {
                                if (this._activeObjects.hasOwnProperty(layer)) {
                                    // Move map objects on screen
                                    for (let obj of this._activeObjects[layer]) {
                                        let sprite = obj.getSprite();
                                        sprite.x = obj.localX;
                                        sprite.y = obj.localY;
                                        obj.setHitboxOutlinePos(sprite.x, sprite.y);
                                    }
                                }
                            }

                            this._scrollMap();
                        }
                    }
                    else if (this._player.isWalking) {
                        this._player.isWalking = false;
                    }
                }
            }
            else if (this._player.isWalking) {
                this._player.isWalking = false;
            }

            for (let layer in this._activeNPCs) {
                if (this._activeNPCs.hasOwnProperty(layer)) {
                    for (let npc of this._activeNPCs[layer]) {
                        npc.update(delta);
                    }
                }
            }

            this._player.update(delta);
        }

        if (this._dialogBox) {
            this._dialogBox.update(delta);

            if (this._rewardsText.visible) {
                // "Pause" the rewards text if a dialog box is present
                this._rewardsTextVisibilityEndTime += delta;
            }
        }
        else if (this._screenIsShaking && createjs.Ticker.getTime() >= this._screenShakeFrameTime) {
            // Screen shake effect
            if (this._screenShakeDuration > 0 && createjs.Ticker.getTime() >= this._screenShakeDuration) {
                this.stopScreenShake();
            }
            else {
                if (this._screenIsSpinning) {
                    this.container.x = (DISPLAY_WIDTH / 2) - (Math.random() * this._map.tileWidth * this._screenShakeIntensity);
                    this.container.y = (DISPLAY_HEIGHT / 2) - (Math.random() * this._map.tileHeight * this._screenShakeIntensity);
                }
                else {
                    this.container.x = Math.random() * this._map.tileWidth * this._screenShakeIntensity * -1;
                    this.container.y = Math.random() * this._map.tileHeight * this._screenShakeIntensity * -1;
                }
                this._screenShakeFrameTime = createjs.Ticker.getTime() + this._screenShakeFrameDuration;
            }
        }

        if (this._rewardsText.visible && createjs.Ticker.getTime() >= this._rewardsTextVisibilityEndTime) {
            this._rewardsText.visible = false;
        }

        if (this._screenIsSpinning && createjs.Ticker.getTime() >= this._screenSpinFrameTime) {
            // Screen spin effect
            this.container.rotation += 1;
            this._screenSpinFrameTime = createjs.Ticker.getTime() + SCREEN_SPIN_FRAME_DURATION;
        }
    }

    getPlayer(): Character {
        return this._player;
    }

    getMap(): tiled.Map {
        return this._map;
    }

    loadMap(name: string, spawn_point: string | createjs.Point = "default", player_dir?: Direction): boolean {
        let map: tiled.IMap;
        if (name.substr(0, 4) === "map_" && name in Game.Assets) {
            this.gameInstance.gameState.map = name;
            map = Game.Assets[name];

            this._inputEnabled = false;
            this._player.destroySprite();

            this._map = new tiled.Map(name, map);
            // One extra row/column on each axis for scrolling, and another for fixing screen effects (like shaking)
            this._numOfXTiles = Math.ceil(DISPLAY_WIDTH / map.tilewidth) + 2;
            this._numOfYTiles = Math.ceil(DISPLAY_HEIGHT / map.tileheight) + 2;

            this._scrollXPos = 0;
            this._scrollYPos = 0;

            this._mapLayerIndices = {};
            this._spatialGrids = {};

            // Remove previous background if it exists
            let stage = this.gameInstance.getStage();
            if (this._background) {
                stage.removeChild(this._background);
            }

            this._tileContainer.removeAllChildren();
            this._objectContainer.removeAllChildren();
            let empty_spritesheet = new createjs.SpriteSheet({});
            for (let layer_index=0; layer_index<map.layers.length; ++layer_index) {
                // Process each map layer
                let layer = map.layers[layer_index];
                this._mapLayerIndices[layer.name] = layer_index;
                if (layer.type === "tilelayer") {
                    // Populate the tile container with reusable sprites to fill the screen
                    let start_index = layer_index * this._numOfXTiles * this._numOfYTiles;
                    for (let row=0; row<this._numOfYTiles; ++row) {
                        for (let col=0; col<this._numOfXTiles; ++col) {
                            let sprite = new createjs.Sprite(empty_spritesheet);
                            sprite.x = col * this._map.tileWidth;
                            sprite.y = row * this._map.tileHeight;
                            this._tileContainer.addChildAt(sprite, start_index + (row * this._numOfXTiles) + col);
                        }
                    }
                }
                else if (layer.type === "objectgroup") {
                    let grid = new SpatialGrid(map.tilewidth, map.tileheight, map.width, map.height);
                    if (layer.name === "Spawn Points") {
                        // Spawn points with end points have their own spatial grid separate from the rest
                        for (let obj of layer.objects) {
                            if (obj.properties && obj.properties.endPoint) {
                                let parsed = (<string>obj.properties.endPoint).split(" ");
                                let map_name = parsed[0];
                                if (parsed.length === 1 && map_name.substr(0, 3) === "sp_") {
                                    // Local end point
                                    console.log("Spawn point '" + obj.name + "' has local end point '" + obj.properties.endPoint + "'");
                                    grid.addObject(new SpawnPointWithEndPoint(obj.x, obj.y, obj.width, obj.height, { spawnPoint: parsed[0] }));
                                }
                                else {
                                    // Global end point
                                    console.log("Spawn point '" + obj.name + "' has global end point '" + obj.properties.endPoint + "'");
                                    grid.addObject(new SpawnPointWithEndPoint(obj.x, obj.y, obj.width, obj.height, {
                                        map: map_name,
                                        spawnPoint: parsed[1]
                                    }));
                                }
                            }
                        }
                        this._spawnPointSpatialGrid = grid;
                    }
                    else {
                        for (let obj of layer.objects) {
                            if (obj.type === "spawn_point") {
                                // Don't add spawn points to the spatial grids (if they happen to not be on their own special layer)
                                continue;
                            }

                            grid.addObject(this._createMapObject(obj, grid));
                        }
                        this._spatialGrids[layer.name] = grid;
                    }
                }
            }

            let background = new createjs.Shape();
            background.graphics.beginFill(this._map.backgroundColor);
            background.graphics.drawRect(0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT);
            // Add the background behind this screen's container so that
            // screen effects don't need to worry about it moving
            stage.addChildAt(background, stage.getChildIndex(this.container));
            this._background = background;

            this.container.addChild(this._player.getSprite());
            this._player.showHitbox(this.gameInstance.renderHitboxes);

            if (player_dir !== undefined) {
                this._player.direction = player_dir;
            }

            let success = this.gotoSpawnPoint(spawn_point);
            this._inputEnabled = true;
            return success;
        }
        else {
            console.log("Map '" + name + "' not found.");
            return false;
        }
    }

    gotoSpawnPoint(point: string | createjs.Point): boolean {
        let player_bounds = this._player.getSprite().getBounds();
        let spawn_point: { x: number, y: number, width: number, height: number };
        if (typeof point === "string") {
            spawn_point = this._map.getSpawnPoint(point);
        }
        else {
            spawn_point = {
                // Offset the coordinates since it centers the player on
                // the spawn point later on.
                x: point.x + Math.floor(player_bounds.width / 2),
                y: point.y + Math.floor(player_bounds.height / 2),
                width: 0,
                height: 0
            };
        }

        if (spawn_point) {
            // Check if the player is going to be past the map's boundaries
            let spawn_point_x = spawn_point.x;
            let spawn_point_y = spawn_point.y;
            let map_right_edge = this._map.width * this._map.tileWidth;
            let map_bottom_edge = this._map.height * this._map.tileHeight;

            if (spawn_point_x + player_bounds.width >= map_right_edge) {
                spawn_point_x = map_right_edge - player_bounds.width;
            }

            if (spawn_point_y + player_bounds.height >= map_bottom_edge) {
                spawn_point_y = map_bottom_edge - player_bounds.height;
            }

            // Convert spawn point coordinates to tile coordinates
            let sp_tile_x = Math.floor(spawn_point_x / this._map.tileWidth);
            let sp_tile_y = Math.floor(spawn_point_y / this._map.tileHeight);

            // For checking if the spawn point spans multiple tiles
            let sp_tile_x_right = Math.floor((spawn_point_x + spawn_point.width) / this._map.tileWidth);
            let sp_tile_y_bottom = Math.floor((spawn_point_y + spawn_point.height) / this._map.tileHeight);

            // Stretch out to the top left corner of the screen
            let num_of_x_tiles = this._numOfXTiles - 2;
            if (sp_tile_x !== sp_tile_x_right) {
                // Spawn point spans multiple X tiles
                this._scrollXPos = sp_tile_x_right - Math.round(num_of_x_tiles / 2);
                this._tileContainer.x = (num_of_x_tiles % 2 === 0) ? 0 : Math.floor(this._map.tileWidth / -2);
            }
            else {
                this._scrollXPos = sp_tile_x - Math.round(num_of_x_tiles / 2);
                this._tileContainer.x = Math.floor(this._map.tileWidth / -2);
            }

            let num_of_y_tiles = this._numOfYTiles - 2;
            if (sp_tile_y !== sp_tile_y_bottom) {
                // Spawn point spans multiple Y tiles
                this._scrollYPos = sp_tile_y_bottom - Math.round(num_of_y_tiles / 2);
                this._tileContainer.y = (num_of_y_tiles % 2 === 0) ? 0 : Math.floor(this._map.tileWidth / -2);
            }
            else {
                this._scrollYPos = sp_tile_y - Math.round(num_of_y_tiles / 2);
                this._tileContainer.y = Math.floor(this._map.tileHeight / -2);
            }

            // Center the player on the spawn point
            this._player.x = spawn_point_x - Math.floor(player_bounds.width / 2) + Math.floor(spawn_point.width / 2);
            this._player.y = spawn_point_y - Math.floor(player_bounds.height / 2) + Math.floor(spawn_point.height / 2);

            this._updateMapArea(this._scrollXPos, this._scrollYPos, this._numOfXTiles, this._numOfYTiles);
            this.redrawMapArea();
            return true;
        }
        else {
            console.log("Could not find spawn point '" + name + "'");
            return false;
        }
    }

    redrawMapArea(): void {
        let objects_to_remove = this._objectContainer.children.slice();

        // For negative scroll positions (which should only occur here with spawn points)
        let offset_col = (this._scrollXPos < 0) ? Math.abs(this._scrollXPos) : 0;
        let offset_row = (this._scrollYPos < 0) ? Math.abs(this._scrollYPos) : 0;
        for (let layer_index=0; layer_index<this._mapArea.length; ++layer_index) {
            let area_layer = this._mapArea[layer_index];
            if (area_layer.layer.type === "tilelayer") {
                let layer_start_index = layer_index * this._numOfYTiles * this._numOfXTiles;
                for (let row=0; row<this._numOfYTiles; ++row) {
                    let data_row = row - offset_row;
                    for (let col=0; col<this._numOfXTiles; ++col) {
                        let data_col = col - offset_col;
                        let sprite = <createjs.Sprite>this._tileContainer.getChildAt(layer_start_index + (row * this._numOfXTiles) + col);
                        if (row < offset_row || col < offset_col                                                 // Fix for spawn points that are near the top or left edge of the map
                        || data_row >= area_layer.data.length || data_col >= area_layer.data[data_row].length    // Past last row or column
                        || (!this.gameInstance.renderInvisibleLayers && !area_layer.layer.visible))             // Invisible layer without cheat enabled
                        {
                            sprite.alpha = 0.0;
                        }
                        else {
                            let gid = area_layer.data[data_row][data_col];
                            let tileset = this._map.getTileset(gid);
                            if (tileset) {
                                sprite.spriteSheet = tileset.getSpriteSheet();
                                sprite.gotoAndStop(tileset.getTileFrame(gid));
                                sprite.alpha = 1.0;
                            }
                            else {
                                sprite.alpha = 0.0;
                            }
                        }
                    }
                }
            }
            else if (area_layer.layer.type === "objectgroup" && area_layer.layer.name !== "Spawn Points") {
                for (let obj of this._activeObjects[area_layer.layer.name]) {
                    // Render objects that haven't been rendered yet
                    let sprite = this._objectContainer.getChildByName(obj.spriteName);
                    if (!sprite) {
                        sprite = obj.getSprite();
                        // I'm going to cheat here because otherwise it's a pain in
                        // in the ass and probably less efficient to make a hash
                        // object just to call destroySprite()
                        (<any>sprite).mapObject = obj;
                        this._objectContainer.addChild(sprite);

                        if (this.gameInstance.renderHitboxes) {
                            obj.showHitbox(true);
                        }
                    }

                    objects_to_remove.splice(objects_to_remove.indexOf(sprite), 1);
                }
            }
        }

        for (let sprite of <any[]>objects_to_remove) {
            if (sprite.mapObject) {
                // Remove objects that are no longer in draw distance
                sprite.mapObject.destroySprite();
            }
        }
    }

    /**
     * Returns what axes the object can move on
     */
    canMoveToPos(obj: Character, x: number, y: number): number {
        let hitbox = obj.getHitbox();
        let hitbox_left = x + (hitbox.x - obj.x);
        let hitbox_top = y + (hitbox.y - obj.y);
        let hitbox_right = hitbox_left + hitbox.width;
        let hitbox_bottom = hitbox_top + hitbox.height;

        let axes = (Axes.X | Axes.Y);

        // Map edges
        let map_right = this._map.width * this._map.tileWidth;
        let map_bottom = this._map.height * this._map.tileHeight;
        if (hitbox_left < 0 || hitbox_right > map_right) {
            axes = (axes & ~Axes.X);
        }

        if (hitbox_top < 0 || hitbox_bottom > map_bottom) {
            axes = (axes & ~Axes.Y);
        }

        // Collision tiles
        let start_col = Math.floor(hitbox_left / this._map.tileWidth);
        let end_col = Math.floor(hitbox_right / this._map.tileWidth);
        let start_row = Math.floor(hitbox_top / this._map.tileHeight);
        let end_row = Math.floor(hitbox_bottom / this._map.tileHeight);
        let collision_layer_index = this._mapLayerIndices["Collisions"];
        let moving_on_both_axes = ((obj.direction & Direction.LEFT) || (obj.direction & Direction.RIGHT)) && ((obj.direction & Direction.UP) || (obj.direction & Direction.DOWN));
        for (let row=start_row; row<=end_row; ++row) {
            for (let col=start_col; col<=end_col; ++col) {
                if (this._map.getGID(collision_layer_index, row, col) !== 0) {
                    // Collision
                    let tile_left = col * this._map.tileWidth;
                    let tile_top = row * this._map.tileHeight;
                    let tile_right = tile_left + this._map.tileWidth;
                    let tile_bottom = tile_top + this._map.tileHeight;

                    if (moving_on_both_axes) {
                        // Check which path works
                        let can_move_x = ((obj.direction & Direction.UP) && this._map.getGID(collision_layer_index, row + 1, col) === 0)
                                            || ((obj.direction & Direction.DOWN) && this._map.getGID(collision_layer_index, row - 1, col) === 0);
                        let can_move_y = ((obj.direction & Direction.LEFT) && this._map.getGID(collision_layer_index, row, col + 1) === 0)
                                            || ((obj.direction & Direction.RIGHT) && this._map.getGID(collision_layer_index, row, col - 1) === 0);
                        if (can_move_x && !can_move_y) {
                            axes = (axes & ~Axes.Y);
                        }
                        else if (!can_move_x && can_move_y) {
                            axes = (axes & ~Axes.X);
                        }
                        else if (can_move_x && can_move_y) {
                            if (Math.floor(hitbox.x / this._map.tileWidth) === col || Math.floor((hitbox.x + hitbox.width) / this._map.tileHeight) === col) {
                                // If on same column, don't move on Y
                                axes = (axes & ~Axes.Y);
                            }
                            if (Math.floor(hitbox.y / this._map.tileHeight) === row || Math.floor((hitbox.y + hitbox.height) / this._map.tileHeight) === row) {
                                // If on same row, don't move on X
                                axes = (axes & ~Axes.X);
                            }
                        }
                        else {
                            axes = 0;
                        }
                    }
                    else {
                        // Moving on one axis, don't move
                        axes = 0;
                    }

                    if (!axes) {
                        // No axes left to eliminate
                        return axes;
                    }
                }
            }
        }

        // Object collisions
        // A bounds Rectangle object to reuse for minimalizing the instantiation
        // and destruction of a bunch of Rectangle objects.
        let bounds_rect = new createjs.Rectangle(hitbox_left, hitbox_top, hitbox.width, hitbox.height);
        for (let layer in this._activeObjects) {
            if (this._activeObjects.hasOwnProperty(layer)) {
                for (let active_obj of this._activeObjects[layer]) {
                    if (obj === active_obj || !active_obj.collisionsEnabled || (active_obj === this._player && this.gameInstance.enableNoClip)) {
                        // Don't check against itself, or a collision disabled object, or clip with the player when noclip is enabled
                        continue;
                    }

                    let active_obj_bounds = active_obj.getHitbox();
                    if (active_obj_bounds.intersects(bounds_rect)) {
                        if (moving_on_both_axes) {
                            // Check which path works
                            let can_move_x = !bounds_rect.setValues(hitbox_left, hitbox.y, hitbox.width, hitbox.height).intersects(active_obj_bounds);
                            let can_move_y = !bounds_rect.setValues(hitbox.x, hitbox_top, hitbox.width, hitbox.height).intersects(active_obj_bounds);
                            if (can_move_x && !can_move_y) {
                                axes = (axes & ~Axes.Y);
                            }
                            else if (!can_move_x && can_move_y) {
                                axes = (axes & ~Axes.X);
                            }
                            else {
                                axes = 0;
                            }
                        }
                        else {
                            // Moving on one axis, don't move
                            axes = 0;
                        }

                        // Reset bounds_rect to original value
                        bounds_rect.setValues(hitbox_left, hitbox_top, hitbox.width, hitbox.height);
                    }

                    if (!axes) {
                        // No axes left to eliminate
                        return axes;
                    }
                }
            }
        }

        return axes;
    }

    showDialog(owner: BaseMapObject, message: string, finished_callback?: any, data?: any): void {
        if (this._dialogBox) {
            this.container.removeChild(this._dialogBox);
        }

        this._dialogBox = new DialogBox(message, this.gameInstance.settings.textSpeed, owner, colors.DARKEST, colors.LIGHTEST, 0, 0);
        this._dialogBox.y = DISPLAY_HEIGHT - this._dialogBox.getBounds().height;
        if (finished_callback) {
            this.on("finished_dialog", finished_callback, owner, true, data);
        }
        this.container.addChild(this._dialogBox);
        this._dialogBox.showNext();
    }

    performCharacterAttack(character: Character): void {
        if (createjs.Ticker.getTime() >= character.availableAttackTime && character.currentWeaponID && character.currentWeaponID in Weapons) {
            let character_bounds = character.getSprite().getBounds();
            let weapon = Weapons[character.currentWeaponID];
            let sprite: createjs.Sprite;
            let hit_area: createjs.Rectangle;
            switch (weapon.weaponType) {
                case WeaponType.DAGGER:
                    sprite = this._getWeaponSprite(character, "ss_daggers");
                    hit_area = this._getWeaponHitArea(character, 4, weapon.range);
                    break;
                case WeaponType.SWORD:
                    sprite = this._getWeaponSprite(character, "ss_swords");
                    hit_area = this._getWeaponHitArea(character, weapon.range * 2, weapon.range);
                    break;
                case WeaponType.BOW:
                    sprite = this._getWeaponSprite(character, "ss_bows");
                    /** @todo Implement arrow */
            }

            if ("Enemies" in this._activeNPCs) {
                for (let enemy of <Enemy[]>this._activeNPCs["Enemies"]) {
                    if (enemy === character) {
                        // Can't hit self
                        continue;
                    }

                    if (enemy.getHitbox().intersects(hit_area)) {
                        let is_crit = (Math.random() <= character.stats.luck);
                        let damage = is_crit ? character.stats.power * Math.floor(utils.randBetween(1.5, 2.0)) : character.stats.power;
                        enemy.inflictDamage(damage);
                        if (!enemy.isAlive) {
                            if (character === this._player) {
                                // Rewards
                                let game_state = this.gameInstance.gameState;
                                let bones = this._getBoneRewardsAmount(character, enemy);
                                let xp = this._getXPRewardsAmount(character, enemy);
                                game_state.bones += bones;
                                game_state.xp += xp;
                                let xp_difference: number;
                                let times_levelled = 0;
                                do {
                                    // Level up player as many times as needed
                                    xp_difference = game_state.xp - this.getXPRequiredForLevel(game_state.level + times_levelled + 1);
                                    if (xp_difference >= 0) {
                                        ++times_levelled;
                                        // The xp difference doesn't go away from levelling
                                        game_state.xp = xp_difference;
                                    }
                                } while (xp_difference > 0);

                                if (times_levelled) {
                                    game_state.level += times_levelled;
                                    this._player.updateCalculatedStats();
                                    this.showDialog(character, "You've reached level " + game_state.level + "!");
                                }

                                this._rewardsText.setText(xp + " XP\n" + bones + " BONES");
                                this._rewardsText.visible = true;
                                this._rewardsTextVisibilityEndTime = createjs.Ticker.getTime() + (REWARDS_TEXT_VISIBILITY_DURATION * 1000);
                            }

                            this._activeNPCs["Enemies"].splice(this._activeNPCs["Enemies"].indexOf(enemy), 1);
                            this._activeObjects["Enemies"].splice(this._activeObjects["Enemies"].indexOf(enemy), 1);
                            enemy.destroy();
                        }
                    }
                }
            }

            if (character !== this._player && this._player.getHitbox().intersects(hit_area)) {
                let is_crit = (Math.random() <= character.stats.luck);
                let damage = is_crit ? character.stats.power * Math.floor(utils.randBetween(1.5, 2.0)) : character.stats.power;
                this._player.inflictDamage(damage);
            }

            character.availableAttackTime = createjs.Ticker.getTime() + character.attackDelay;
        }
    }

    getXPRequiredForLevel(level: number): number {
        // Since we're starting at level 1, offset it so that level 2 requires
        // only the base amount of xp + increase ratio.
        return Math.ceil((level - 1) * BASE_XP * LEVEL_XP_INCREASE_RATIO);
    }

    showDeathScreen(): void {
        this.gameInstance.pushScreen(new DeathScreen(this.gameInstance, this));
    }

    toggleSpecies(): void {
        if (this._inputEnabled) {
            this._inputEnabled = false;
        }

        if (this._player.isWalking) {
            this._player.isWalking = false;
            this._scrollDir = 0;
        }

        let sprite = this._player.getSprite();
        if (this.gameInstance.gameState.isHuman) {
            sprite.gotoAndPlay("transform");
            sprite.on("animationend", function(event: createjs.Event): void {
                this._player.spriteSheet = Game.SpriteSheets["ss_victor"];
                // Force sprite to goto standing animation
                this._player.direction = this._player.direction;
                this.gameInstance.gameState.isHuman = false;
                this._inputEnabled = true;
            }, this, true);
        }
        else {
            this._player.spriteSheet = Game.SpriteSheets["ss_human_victor"];
            sprite.gotoAndPlay("transform");
            sprite.on("animationend", function(event: createjs.Event): void {
                // Force sprite to goto standing animation
                this._player.direction = this._player.direction;
                this.gameInstance.gameState.isHuman = true;
                this._inputEnabled = true;
            }, this, true);
        }
    }

    showHitboxes(show: boolean): void {
        this._player.showHitbox(show);

        for (let layer in this._activeObjects) {
            if (this._activeObjects.hasOwnProperty(layer)) {
                for (let obj of this._activeObjects[layer]) {
                    obj.showHitbox(show);
                }
            }
        }
    }

    /**
     * Starts a screen shake effect
     * @param {number} frame_duration Duration of each shake frame in milliseconds
     * @param {number} intensity Percentage of tile dimensions to move the container
     * @param {number} [max_duration] How long the effect lasts in milliseconds
     */
    startScreenShake(frame_duration: number, intensity: number, duration?: number): void {
        this._screenIsShaking = true;
        this._screenShakeFrameDuration = frame_duration;
        this._screenShakeIntensity = intensity;
        this._screenShakeFrameTime = createjs.Ticker.getTime() + frame_duration;
        this._screenShakeDuration = duration ? createjs.Ticker.getTime() + duration : 0;
    }

    stopScreenShake(): void {
        this._screenIsShaking = false;
        if (this._screenIsSpinning) {
            this.container.x = DISPLAY_WIDTH / 2;
            this.container.y = DISPLAY_HEIGHT / 2;
        }
        else {
            this.container.x = 0;
            this.container.y = 0;
        }
    }

    startScreenSpin(): void {
        this._screenIsSpinning =true;
        this.container.regX = DISPLAY_WIDTH / 2;
        this.container.regY = DISPLAY_HEIGHT / 2;
        this.container.x = this.container.regX;
        this.container.y = this.container.regY;
        this._screenSpinFrameTime = createjs.Ticker.getTime() + SCREEN_SPIN_FRAME_DURATION;
    }

    stopScreenSpin(): void {
        this._screenIsSpinning = false;
        this.container.regX = 0;
        this.container.regY = 0;
        this.container.x = 0;
        this.container.y = 0;
        this.container.rotation = 0;
    }

    protected _init(): void {
        this._tileContainer = new createjs.Container();
        this._tileContainer.tickChildren = false;
        this.container.addChild(this._tileContainer);

        this._objectContainer = new createjs.Container();
        this.container.addChild(this._objectContainer);

        let player_sprite_sheet = this.gameInstance.gameState.isHuman ? "ss_human_victor" : "ss_victor";
        this._player = new Character(this, "Victor", 0, 0, "player",  Game.SpriteSheets[player_sprite_sheet], PLAYER_HITBOX, PLAYER_PROJECTILES_HITBOX);
        this._player.setBaseStats({
            maxHealth: 150,
            power: 4,
            defense: 2,
            speed: 4,
            luck: 0.1
        });
        // Connect the player to the game state
        this._player.inventory = this.gameInstance.gameState.inventory;
        this._player.consumedItems = this.gameInstance.gameState.consumedItems;
        this._player.updateCalculatedStats();

        let rewards_text = new BitmapText(" ", "7px Rewards", undefined, 8);
        rewards_text.x = 2;
        rewards_text.y = DISPLAY_HEIGHT - 17;
        rewards_text.visible = false;
        this.container.addChild(rewards_text);
        this._rewardsText = rewards_text;
        this._rewardsText.visible = false;
        this._rewardsTextVisibilityEndTime = 0;

        this._inputEnabled = false;

        this._screenIsShaking = false;
        this._screenIsSpinning = false;

        // Remove the background since it's not in this container
        this.container.on("removed", this._onRemoved, this, true);
    }

    protected _onRemoved(event: createjs.Event): void {
        if (this._background) {
            this.gameInstance.getStage().removeChild(this._background);
        }
    }

    protected _scrollMap(): void {
        let scrolling_left = (this._tileContainer.x > 0) && (this._scrollXPos > 0);
        let scrolling_right = (this._tileContainer.x <= -this._map.tileWidth) && ((this._scrollXPos + this._numOfXTiles) < this._map.width);
        let scrolling_up = (this._tileContainer.y > 0) && (this._scrollYPos > 0);
        let scrolling_down = (this._tileContainer.y <= -this._map.tileHeight) && ((this._scrollYPos + this._numOfYTiles) < this._map.height);

        let x_tiles_moved = 0;
        let y_tiles_moved = 0;
        if (scrolling_left) {
            x_tiles_moved = Math.ceil(this._tileContainer.x / this._map.tileWidth);
            this._scrollXPos -= x_tiles_moved;
            this._tileContainer.x = (this._tileContainer.x % this._map.tileWidth) - this._map.tileWidth;
        }
        else if (scrolling_right) {
            x_tiles_moved = Math.ceil(this._tileContainer.x / this._map.tileWidth);
            this._scrollXPos += Math.abs(x_tiles_moved);
            this._tileContainer.x = this._tileContainer.x % this._map.tileWidth;
        }

        if (scrolling_up) {
            y_tiles_moved = Math.ceil(this._tileContainer.y / this._map.tileHeight);
            this._scrollYPos -= y_tiles_moved;
            this._tileContainer.y = (this._tileContainer.y % this._map.tileHeight) - this._map.tileHeight;
        }
        else if (scrolling_down) {
            y_tiles_moved = Math.ceil(this._tileContainer.y / this._map.tileHeight);
            this._scrollYPos += Math.abs(y_tiles_moved);
            this._tileContainer.y = this._tileContainer.y % this._map.tileHeight;
        }

        if (scrolling_left || scrolling_right || scrolling_up || scrolling_down) {
            this._updateMapArea(this._scrollXPos, this._scrollYPos, this._numOfXTiles, this._numOfYTiles);
            this.redrawMapArea();
        }
    }

    protected _updateMapArea(x: number, y: number, width: number, height: number): void {
        this._mapArea = this._map.getArea(x, y, width, height);

        // Convert to pixel coordinates for spatial grids
        let rect = new createjs.Rectangle(x * this._map.tileWidth, y * this._map.tileHeight, width * this._map.tileWidth, height * this._map.tileHeight);
        this._activeObjects = { __PLAYER__: [this._player] };
        this._activeNPCs = {};
        for (let area_layer of this._mapArea) {
            if (area_layer.layer.type === "objectgroup" && area_layer.layer.name !== "Spawn Points") {
                this._activeObjects[area_layer.layer.name] = <BaseMapObject[]>this._spatialGrids[area_layer.layer.name].getObjects(rect);

                this._activeNPCs[area_layer.layer.name] = [];
                for (let obj of this._activeObjects[area_layer.layer.name]) {
                    if (obj instanceof NPC) {
                        // Add active NPCs
                        this._activeNPCs[area_layer.layer.name].push(obj);
                    }
                }
            }
        }
    }

    protected _getMapAreaLayer(name: string): tiled.IMapAreaLayer {
        if (name in this._mapLayerIndices) {
            return this._mapArea[this._mapLayerIndices[name]];
        }

        return null;
    }

    protected static _generateTileName(layer_name: string, row: number, col: number): string
    {
        return layer_name + "_y" + row + "_x" + col;
    }

    /**
     * Processes a map object and returns a new one created through type specific constructors
     * @todo Implement all map object types
     */
    protected _createMapObject(obj: tiled.IObject, spatial_grid: SpatialGrid): any {
        if (obj.type === "npc" || obj.type === "enemy") {
            let hitbox: createjs.Rectangle;
            let projectiles_hitbox: createjs.Rectangle;
            if ("hitbox" in obj.properties) {
                hitbox = utils.rectangleFromStr(obj.properties.hitbox);
                projectiles_hitbox = ("projectilesHitbox" in obj.properties) ? utils.rectangleFromStr(obj.properties.projectilesHitbox) : hitbox;
            }

            let settings: INPCSettings = {};
            if ("walkSpeed" in obj.properties) {
                settings.walkSpeed = obj.properties.walkSpeed;
            }

            if ("wander" in obj.properties) {
                settings.wander = obj.properties.wander;
            }

            if ("wanderBounds" in obj.properties) {
                settings.wanderBounds = utils.rectangleFromStr(obj.properties.wanderBounds);
            }

            if ("wanderMinDirDuration" in obj.properties) {
                settings.wanderMinDirDuration = obj.properties.wanderMinDirDuration;
            }

            if ("wanderMaxDirDuration" in obj.properties) {
                settings.wanderMaxDirDuration = obj.properties.wanderMaxDirDuration;
            }

            if ("faceWhenTalking" in obj.properties) {
                settings.faceWhenTalking = true;
            }

            if ("dialog" in obj.properties) {
                settings.dialog = obj.properties.dialog;
            }

            if (obj.type === "npc") {
                return new NPC(this, spatial_grid, obj.properties.name, obj.x, obj.y, obj.name, Game.SpriteSheets[obj.properties.spriteSheet], hitbox, projectiles_hitbox, obj.properties.interactionID, settings);
            }
            else {
                let enemy_settings = <IEnemySettings>settings;
                enemy_settings.stats = {
                    maxHealth: obj.properties.maxHealth,
                    power: obj.properties.power,
                    defense: obj.properties.defense,
                    speed: obj.properties.speed,
                    luck: obj.properties.luck
                };

                enemy_settings.level = obj.properties.level;
                enemy_settings.weaponID = obj.properties.weaponID;

                return new Enemy(this, spatial_grid, obj.properties.name, obj.x, obj.y, obj.name, Game.SpriteSheets[obj.properties.spriteSheet], this._player, hitbox, projectiles_hitbox, obj.properties.interactionID, enemy_settings);
            }
        }
        else if (obj.type === "sign") {
            return new Sign(this, spatial_grid, obj.properties.name, obj.x, obj.y, obj.name, obj.properties.signType, obj.properties.dialog, obj.properties.interactionID);
        }
    }

    protected _getInteractiveObject(): BaseMapObject {
        let player_hitbox = this._player.getHitbox();
        let interaction_test_box: createjs.Rectangle;
        let dir = this._player.direction;
        if (dir & Direction.LEFT) {
            interaction_test_box = new createjs.Rectangle(player_hitbox.x - player_hitbox.width, player_hitbox.y + Math.floor(player_hitbox.height / 2), MAX_INTERACTION_DISTANCE, 1);
        }
        else if (dir & Direction.RIGHT) {
            interaction_test_box = new createjs.Rectangle(player_hitbox.x + player_hitbox.width, player_hitbox.y + Math.floor(player_hitbox.height / 2), MAX_INTERACTION_DISTANCE, 1);
        }
        else if (dir & Direction.UP) {
            interaction_test_box = new createjs.Rectangle(player_hitbox.x + Math.floor(player_hitbox.width / 2), player_hitbox.y - player_hitbox.height, 1, MAX_INTERACTION_DISTANCE);
        }
        else if (dir & Direction.DOWN) {
            interaction_test_box = new createjs.Rectangle(player_hitbox.x + Math.floor(player_hitbox.width / 2), player_hitbox.y + player_hitbox.height, 1, MAX_INTERACTION_DISTANCE);
        }

        for (let layer in this._activeObjects) {
            if (this._activeObjects.hasOwnProperty(layer)) {
                for (let obj of this._activeObjects[layer]) {
                    if (obj !== this._player && obj.getHitbox().intersects(interaction_test_box)) {
                        return obj;
                    }
                }
            }
        }

        return null;
    }

    protected _getWeaponSprite(character: Character, sprite_sheet_id: string): createjs.Sprite {
        let character_bounds = character.getSprite().getBounds();
        let sprite = new createjs.Sprite(Game.SpriteSheets[sprite_sheet_id]);
        sprite.gotoAndStop(character.currentWeaponID + "_attack");
        sprite.rotation = utils.directionToRotation(character.direction);

        let sprite_bounds = sprite.getBounds();
        if (character.direction & Direction.LEFT) {
            sprite.x = character.localX + Math.floor(character_bounds.width / 2) + 4;
            sprite.y = character.localY - Math.floor(sprite_bounds.width / 2) + Math.floor(character_bounds.height / 2);
        }
        else if (character.direction & Direction.RIGHT) {
            sprite.x = character.localX + Math.floor(character_bounds.width / 2) - 4;
            sprite.y = character.localY + Math.floor(sprite_bounds.width / 2) + Math.floor(character_bounds.height / 2);
        }
        else if (character.direction & Direction.UP) {
            sprite.x = character.localX + Math.floor(sprite_bounds.width / 2) + Math.floor(character_bounds.width / 2);
            sprite.y = character.localY + Math.floor(character_bounds.height / 2) + 4;
        }
        else if (character.direction & Direction.DOWN) {
            sprite.x = character.localX - Math.floor(sprite_bounds.width / 2) + Math.floor(character_bounds.width / 2);
            sprite.y = character.localY + Math.floor(character_bounds.height / 2) - 4;
        }

        character.weaponSprite = sprite;
        if (character.direction & Direction.UP) {
            if (character === this._player) {
                this.container.addChildAt(sprite, this.container.getChildIndex(character.getSprite()));
            }
            else {
                this._objectContainer.addChildAt(sprite, this._objectContainer.getChildIndex(character.getSprite()));
            }
        }
        else {
            this._objectContainer.addChild(sprite);
        }
        sprite.play();
        return sprite;
    }

    protected _getWeaponHitArea(character: Character, width: number, height: number): createjs.Rectangle {
        if (character.direction & Direction.LEFT) {
            return new createjs.Rectangle(character.x - height, character.y - Math.floor(width / 2) + Math.floor(character.height / 2), height, width);
        }
        else if (character.direction & Direction.RIGHT) {
            return new createjs.Rectangle(character.x + character.width, character.y - Math.floor(width / 2) + Math.floor(character.height / 2), height, width);
        }
        else if (character.direction & Direction.UP) {
            return new createjs.Rectangle(character.x - Math.floor(width / 2) + Math.floor(character.width / 2), character.y - height, width, height);
        }
        else {
            return new createjs.Rectangle(character.x - Math.floor(width / 2) + Math.floor(character.width / 2), character.y + character.height, width, height);
        }
    }

    protected _getBoneRewardsAmount(character: Character, enemy: Enemy): number {
        let game_state = this.gameInstance.gameState;
        return Math.max(Math.ceil(
                // The higher the level difference between the enemy, the more bones
                Math.max(enemy.level - game_state.level, 1)
                * BATTLE_REWARDS_BONES_BASE_MULTIPLIER
                // The higher the player's level, the higher the rewards
                * game_state.level * BATTLE_REWARDS_BONES_LEVEL_MULTIPLIER
                // Random chance, but the higher the luck, the higher the percentage of bones
                * Math.min(Math.random() + character.stats.luck, 1.0)
                ), 1);
    }

    protected _getXPRewardsAmount(character: Character, enemy: Enemy): number {
        let game_state = this.gameInstance.gameState;
        return Math.ceil(
                // The higher the level difference between the enemy, the more XP
                Math.max(enemy.level - game_state.level, 1)
                * BATTLE_REWARDS_XP_BASE_MULTIPLIER
                // The higher the player's level, the higher the rewards
                * game_state.level * BATTLE_REWARDS_XP_LEVEL_MULTIPLIER
                // Random percentage no lower than 80%
                * utils.randBetween(0.8, 1)
                );
    }
}
