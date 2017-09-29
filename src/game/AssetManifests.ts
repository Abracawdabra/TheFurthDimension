/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

export const BASE_URL = "assets/";

export const ASSET_MANIFESTS: { [type: string]: any } = {
    images: [
        { id: "img_title_screen", src: BASE_URL + "images/title_screen.png" },

        // UI
        { id: "ui_border_boxes", src: BASE_URL + "images/ui/border_boxes.png" },

        // Tilesets
        { id: "tileset_dongola_temple", src: BASE_URL + "images/tilesets/dongola_temple.png" },
        { id: "tileset_collision", src: BASE_URL + "images/tilesets/collision.png" },

        // Font Bitmaps
        { id: "font_8px_press_start", src: BASE_URL + "images/fonts/PressStart_8px.png" },

        // Sprite sheets
        { id: "ss_npc_testy", src: BASE_URL + "images/spritesheets/npc_testy.png" },
        { id: "ss_victor", src: BASE_URL + "images/spritesheets/victor.png" }
    ],

    sounds: [

    ],

    maps: [
        { id: "map_test", src: BASE_URL + "maps/test.json" },
        { id: "map_dongola_temple", src: BASE_URL + "maps/dongola_temple.json" }
    ]
};
