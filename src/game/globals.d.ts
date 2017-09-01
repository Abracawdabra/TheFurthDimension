/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

declare interface Window {
    TheFurthDimension: any;
}

declare interface CanvasRenderingContext2D {
    msImageSmoothingEnabled: boolean;
}

declare interface IWebFont {
    load(config: any): void;
}

declare var WebFont: IWebFont;
