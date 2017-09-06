/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

export abstract class BaseMenu<T extends createjs.DisplayObject> {
    // Array of columns
    protected _items: T[][];

    protected _container: createjs.Container;
    get container(): createjs.Container {
        return this._container;
    }

    protected _horizontalMargin: number;
    get horizontalMargin(): number {
        return this._horizontalMargin;
    }

    set horizontalMargin(value: number) {
        for (let col=0; col<this._items.length; ++col) {
            for (let item of this._items[col]) {
                item.x = value * col;
            }
        }

        this._horizontalMargin = value;
    }

    protected _verticalSpacing: number;
    get verticalSpacing(): number {
        return this._verticalSpacing;
    }

    set verticalSpacing(value: number) {
        for (let col=0; col<this._items.length; ++col) {
            for (let row=0; row<this._items[col].length; ++row) {
                this._items[col][row].y = (this._items[col][row].getBounds().height * row) + (value * row);
            }
        }
    }

    constructor(x: number, y: number, vertical_spacing: number, horizontal_margin: number = 0) {
        this._items = [];
        this._items[0] = [];
        this._container = new createjs.Container();
        this._container.x = x;
        this._container.y = y;
        this._verticalSpacing = vertical_spacing;
        this._horizontalMargin = horizontal_margin;
    }


    protected _addItem(name: string, item: T, next_column = false): void {
        if (next_column) {
            this._items.push([]);
        }

        let col = this._items.length - 1;
        item.name = name;
        this._container.addChild(item);
        item.x = this._horizontalMargin * col;
        item.y = (item.getBounds().height * this._items[col].length) + (this._verticalSpacing * this._items[col].length);
        this._items[col].push(item);
    }
}
