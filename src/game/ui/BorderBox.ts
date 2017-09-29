/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

const FRAME_TOP_LEFT_CORNER      = 0;
const FRAME_TOP_EDGE             = 1;
const FRAME_TOP_RIGHT_CORNER     = 2;
const FRAME_MIDDLE_LEFT_EDGE     = 3;
const FRAME_MIDDLE_RIGHT_EDGE    = 4;
const FRAME_BOTTOM_LEFT_CORNER   = 5;
const FRAME_BOTTOM_EDGE          = 6;
const FRAME_BOTTOM_RIGHT_CORNER  = 7;

export class BorderBox extends createjs.Container {
    protected _width: number;
    get width(): number {
        return this._width;
    }

    set width(value: number) {
        this._width = value;
        this.setBounds(this.x, this.y, this._width, this._height);
        this._redraw();
    }

    protected _height: number;
    get height(): number {
        return this._height;
    }

    set height(value: number) {
        this._height = value;
        this.setBounds(this.x, this.y, this._width, this._height);
        this._redraw();
    }

    protected _image: HTMLImageElement;
    get image(): HTMLImageElement {
        return this._image;
    }

    set image(img: HTMLImageElement) {
        this._image = img;
        this._redraw();
    }

    protected _color: string;
    protected _startX: number;
    protected _startY: number;
    protected _frameWidth: number;
    protected _frameHeight: number;

    constructor(image: HTMLImageElement, width: number, height: number, color: string, start_x: number = 0, start_y: number = 0, frame_width?: number, frame_height?: number) {
        super();
        if (width < (frame_width * 2) || height < (frame_height * 2)) {
            throw new Error("Width and height cannot be less than the size of 2 frames.");
        }

        this._image = image;
        this._width = width;
        this._height = height;
        this._color = color;
        this._startX = start_x;
        this._startY = start_y;
        this._frameWidth = frame_width || Math.floor(image.width / 8);
        this._frameHeight = frame_height || image.height;

        this.setBounds(this.x, this.y, this._width, this._height);
        this._redraw();
    }

    protected _redraw(): void {
        this.removeAllChildren();
        let total_rows = Math.floor((this._height - (2 * this._frameHeight)) / this._frameHeight);
        let remainder_row_height = (this._height - (2 * this._frameHeight)) % this._frameHeight;
        let total_cols = Math.floor((this._width - (2 * this._frameWidth)) / this._frameWidth);
        let remainder_col_width = (this._width - (2 * this._frameWidth)) % this._frameWidth;
        let right_edge_x = ((total_cols + 1) * this._frameWidth) + remainder_col_width;
        let bottom_edge_y = ((total_rows + 1) * this._frameHeight) + remainder_row_height;

        let shape = new createjs.Shape();
        shape.graphics.beginFill(this._color);
        shape.graphics.drawRect(0, 0, (total_cols * this._frameWidth) + remainder_col_width, (total_rows * this._frameHeight) + remainder_row_height);
        shape.graphics.endFill();
        shape.x = this._frameWidth;
        shape.y = this._frameHeight;
        this.addChild(shape);

        // Top border
        this._addCell(0, 0, FRAME_TOP_LEFT_CORNER);
        for (let col=0; col<total_cols; ++col) {
            this._addCell((col + 1) * this._frameWidth, 0, FRAME_TOP_EDGE);
        }
        if (remainder_col_width > 0) {
            this._addCell((total_cols + 1) * this._frameWidth, 0, FRAME_TOP_EDGE, remainder_col_width);
        }
        this._addCell(right_edge_x, 0, FRAME_TOP_RIGHT_CORNER);

        // Middle border
        for (let row=0; row<total_rows; ++row) {
            let row_y = (row + 1) * this._frameHeight;
            this._addCell(0, row_y, FRAME_MIDDLE_LEFT_EDGE);
            this._addCell(right_edge_x, row_y, FRAME_MIDDLE_RIGHT_EDGE);
        }
        if (remainder_row_height > 0) {
            let row_y = (total_rows + 1) * this._frameHeight;
            this._addCell(0, row_y, FRAME_MIDDLE_LEFT_EDGE, this._frameWidth, remainder_row_height);
            this._addCell(right_edge_x, row_y, FRAME_MIDDLE_RIGHT_EDGE, this._frameWidth, remainder_row_height);
        }

        // Bottom border
        this._addCell(0, bottom_edge_y, FRAME_BOTTOM_LEFT_CORNER);
        for (let col=0; col<total_cols; ++col) {
            this._addCell((col + 1) * this._frameWidth, bottom_edge_y, FRAME_BOTTOM_EDGE);
        }
        if (remainder_col_width) {
            this._addCell((total_cols + 1) * this._frameWidth, bottom_edge_y, FRAME_BOTTOM_EDGE, remainder_col_width);
        }
        this._addCell(right_edge_x, bottom_edge_y, FRAME_BOTTOM_RIGHT_CORNER);
    }

    protected _addCell(x: number, y: number, frame: number, width?: number, height?: number): void {
        let bitmap = new createjs.Bitmap(this._image);
        bitmap.x = x;
        bitmap.y = y;
        bitmap.sourceRect = new createjs.Rectangle(this._startX + (frame * this._frameWidth), this._startY, width || this._frameWidth, height || this._frameHeight);
        this.addChild(bitmap);
    }
}
