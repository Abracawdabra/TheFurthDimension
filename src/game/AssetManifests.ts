/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

export const BASE_URL = "assets/";

export const ASSET_MANIFESTS: { [type: string]: any } = {
    images: [
        { id: "img_title_screen", src: BASE_URL + "images/title_screen.png" },

        // Tilesets
        { id: "tileset_dongola_temple", src: BASE_URL + "images/tilesets/dongola_temple.png" },
        { id: "tileset_collision", src: BASE_URL + "images/tilesets/collision.png" },

        // Font Bitmaps
        { id: "font_8px_press_start", src: BASE_URL + "images/fonts/PressStart_8px.png" }
    ],

    sounds: [

    ],

    maps: [
        { id: "map_dongola_temple", src: BASE_URL + "maps/dongola_temple.json" }
    ]
};
