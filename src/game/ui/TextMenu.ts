/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

import { BaseMenu } from "./BaseMenu";

export class TextMenu extends BaseMenu<createjs.Text> {
    protected _textColor: string;

    protected _marker: createjs.Bitmap | createjs.Shape;
    protected _markerPos: { row: number, col: number };

    get textColor(): string {
        return this._textColor;
    }

    set textColor(color: string) {
        for (let col of this._items) {
            for (let item of col) {
                item.color = color;
            }
        }

        this._textColor = color;
    }

    /**
     * Returns name of selected item
     */
    get selectedItem(): string {
        let item = this._items[this._markerPos.col][this._markerPos.row];
        if (item) {
            return item.name;
        }

        return "";
    }

    /**
     * Sets selected item by name
     */
    set selectedItem(name: string) {
        for (let col=0; col<this._items.length; ++col) {
            for (let row=0; row<this._items[col].length; ++row) {
                if (this._items[col][row].name === name) {
                    this.setMarkerPos(row, col);
                    return;
                }
            }
        }
    }

    constructor(x: number, y: number, text_color: string, vertical_spacing: number, horizontal_margin?: number) {
        super(x, y, vertical_spacing, horizontal_margin);
        this._textColor = text_color;

        let marker = new createjs.Shape();
        marker.graphics.beginFill(text_color);
        marker.graphics.moveTo(0, 0);
        marker.graphics.lineTo(6, 3);
        marker.graphics.lineTo(0, 6);
        marker.graphics.lineTo(0, 0);
        marker.graphics.closePath();
        marker.setBounds(0, 0, 8, 8);
        this._marker = marker;
        this._markerPos = { row: 0, col: 0 };
    }

    addItem(name: string, text: string, next_column: boolean = false): void {
        let item = new createjs.Text(text, "8px 'Press Start'", this._textColor);
        this._addItem(name, item, next_column);

        if (this._items.length === 1 && this._items[0].length === 1) {
            // First insertion
            this._container.addChild(this._marker);
            this.setMarkerPos(0, 0);
        }
    }

    selectNextRow(): void {
        this.setMarkerPos(this._markerPos.row + 1, this._markerPos.col);
    }

    selectPrevRow(): void {
        this.setMarkerPos(this._markerPos.row - 1, this._markerPos.col);
    }

    selectNextColumn(): void {
        this.setMarkerPos(this._markerPos.row, this._markerPos.col + 1);
    }

    selectPrevColumn(): void {
        this.setMarkerPos(this._markerPos.row, this._markerPos.col - 1);
    }

    /**
     * Gets the x and y index positions of the marker
     */
    getMarkerPos(): { row: number, col: number } {
        return this._markerPos;
    }

    /**
     * Set x and y index positions of the marker
     */
    setMarkerPos(row: number, col: number): void {
        let marker_bounds = this._marker.getBounds();
        if (col >= 0 && col < this._items.length) {
            this._marker.x = (col * this._horizontalMargin) - (marker_bounds.width + 2);
            this._markerPos.col = col;
        }

        if (row >= 0 && row < this._items[this._markerPos.col].length) {
            let item_bounds = this._items[this._markerPos.col][row].getBounds();
            this._marker.y = row * (this._verticalSpacing + item_bounds.height);
            let height_diff = Math.floor((marker_bounds.height - item_bounds.height) / 2);
            if (marker_bounds.height > item_bounds.height) {
                this._marker.y += height_diff;
            }
            else if (marker_bounds.height < item_bounds.height) {
                this._marker.y += Math.abs(height_diff);
            }
            this._markerPos.row = row;
        }
    }

    showMarker(visible: boolean): void {
        this._marker.visible = visible;
    }
}
