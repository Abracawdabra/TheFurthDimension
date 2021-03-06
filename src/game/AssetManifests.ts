/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

export const BASE_URL = "assets/";
export const BASE_IMAGES_URL = BASE_URL + "images/";
export const BASE_MAPS_URL = BASE_URL + "maps/";
export const BASE_SOUNDS_URL = BASE_URL + "sounds/";

export const ASSET_MANIFESTS: { [type: string]: any } = {
    images: [
        { id: "img_title_screen", src: BASE_IMAGES_URL + "title_screen.png" },

        // UI
        { id: "ui_border_boxes", src: BASE_IMAGES_URL + "ui/border_boxes.png" },
        { id: "ui_marker", src: BASE_IMAGES_URL + "ui/marker.png" },
        { id: "ui_health_bar", src: BASE_IMAGES_URL + "ui/health_bar.png" },

        // Tilesets
        { id: "tileset_dongola_temple", src: BASE_IMAGES_URL + "tilesets/dongola_temple.png" },
        { id: "tileset_collision", src: BASE_IMAGES_URL + "tilesets/collision.png" },

        // Font Bitmaps
        { id: "font_8px_press_start", src: BASE_IMAGES_URL + "fonts/PressStart_8px.png" },
        { id: "font_7px_press_start", src: BASE_IMAGES_URL + "fonts/PressStart_7px.png" },
        { id: "font_7px_sucky_outline", src: BASE_IMAGES_URL + "fonts/SuckyOutline_7px.png" },

        // Sprite sheets
        { id: "ss_npc_testy", src: BASE_IMAGES_URL + "spritesheets/npc_testy.png" },
        { id: "ss_human_victor", src: BASE_IMAGES_URL + "spritesheets/human_victor.png" },
        { id: "ss_victor", src: BASE_IMAGES_URL + "spritesheets/victor.png" },
        { id: "ss_generic_npc", src: BASE_IMAGES_URL + "spritesheets/generic_npc.png" },
        { id: "ss_swords", src: BASE_IMAGES_URL + "spritesheets/swords.png" },
        { id: "ss_daggers", src: BASE_IMAGES_URL + "spritesheets/daggers.png" }
    ],

    sounds: [

    ],

    maps: [
        { id: "map_test", src: BASE_MAPS_URL + "test.json" },
        { id: "map_dongola_temple", src: BASE_MAPS_URL + "dongola_temple.json" }
    ]
};
