/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

// Cell dimensions in tiles per cell
const CELL_WIDTH = 5;
const CELL_HEIGHT = 5;

interface ISpatialGridCellObject {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface ISpatialGridSpanData {
    startCol: number;
    endCol: number;
    startRow: number;
    endRow: number;
}

export class SpatialGrid {
    protected _tileWidth: number;
    protected _tileHeight: number;

    // 3-dimensional array because each cell can contain any number of objects
    protected _cells: ISpatialGridCellObject[][][];

    constructor(tile_width: number, tile_height: number, map_width: number, map_height: number) {
        this._tileWidth = tile_width;
        this._tileHeight = tile_height;

        let grid_width = Math.ceil(map_width / CELL_WIDTH);
        let grid_height = Math.ceil(map_height / CELL_HEIGHT);

        this._cells = [];
        // Make the grid cells
        for (let row=0; row<grid_height; ++row) {
            this._cells.push([]);
            for (let col=0; col<grid_width; ++col) {
                this._cells[row].push([]);
            }
        }
    }

    addObject(obj: ISpatialGridCellObject): void {
        let span_data = this._getSpanData(obj);
        if (span_data.startRow < this._cells.length && span_data.startCol < this._cells[0].length) {
            // Not out of bounds
            for (let row=span_data.startRow; row<=span_data.endRow; ++row) {
                for (let col=span_data.startCol; col<=span_data.endCol; ++col) {
                    this._cells[row][col].push(obj);
                }
            }
        }
    }

    /**
     * Removes object from the spatial grid
     * NOTE: Call this before updating the position of an object
     *       or this method will have to rigorously search for the
     *       cells the object is currently occupying. Or just use
     *       updateObjectPos() instead.
     */
    removeObject(obj: ISpatialGridCellObject): void {
        let span_data = this._getSpanData(obj);
        let updated_before_removing = false;
        if (span_data.startRow < this._cells.length && span_data.startCol < this._cells[0].length) {
            // Not out of bounds
            for (let row=span_data.startRow; row<=span_data.endRow; ++row) {
                for (let col=span_data.startCol; col<=span_data.endCol; ++col) {
                    let index = this._cells[row][col].indexOf(obj);
                    if (index > -1) {
                        this._cells[row][col].splice(index, 1);
                    }
                    else {
                        // This object's position was updated before removing it from the grid
                        updated_before_removing = true;
                        break;
                    }
                }

                if (updated_before_removing) {
                    break;
                }
            }

            if (updated_before_removing) {
                // Search the entire array for the starting cell for this object
                // NOTE: This is inefficient and should be noted that removing the object
                //       from the grid is advised before updating it's position.
                let end_row   = this._cells.length - 1;
                let start_col = -1;
                let end_col   = this._cells[0].length - 1;
                for (let row=0; row<=end_row; ++row) {
                    for (let col=Math.max(start_col, 0); col<=end_col; ++col) {
                        if (this._cells[row][col].indexOf(obj) > -1) {
                            if (start_col === -1) {
                                // Found the left edge
                                start_col = col;
                            }
                        }
                        else if (start_col > -1 && col === start_col) {
                            // Found bottom edge
                            end_row = row - 1;
                            break;
                        }
                        else if (start_col > -1 && end_col === -1) {
                            // Found the right edge
                            end_col = col - 1;
                            break;
                        }
                    }
                }
            }
        }
    }

    updateObjectPos(obj: ISpatialGridCellObject, x: number, y: number): void {
        let old_span_data = this._getSpanData(obj);
        let new_span_data = this._getSpanData({ x: x, y: y, width: obj.width, height: obj.height });
        if (old_span_data.startRow !== new_span_data.startRow
        || old_span_data.endRow !== new_span_data.endRow
        || old_span_data.startCol !== new_span_data.startCol
        || old_span_data.endCol !== new_span_data.endCol) {
            // Position needs to be updated
            this.removeObject(obj);
            obj.x = x;
            obj.y = y;
            this.addObject(obj);
        }
        else {
            obj.x = x;
            obj.y = y;
        }
    }

    getObjects(area: createjs.Rectangle): ISpatialGridCellObject[] {
        let results: ISpatialGridCellObject[] = [];
        let span_data = this._getSpanData(area);
        for (let row=span_data.startRow; row<=span_data.endRow; ++row) {
            for (let col=span_data.startCol; col<=span_data.endCol; ++col) {
                for (let obj of this._cells[row][col]) {
                    if (results.indexOf(obj) > -1) {
                        // Make sure this object isn't put into the results more than once
                        continue;
                    }

                    if (area.intersects(new createjs.Rectangle(obj.x, obj.y, obj.width, obj.height))) {
                        // Make sure the object is actually contained within the area
                        results.push(obj);
                    }
                }
            }
        }

        return results;
    }

    protected _getSpanData(obj: ISpatialGridCellObject): ISpatialGridSpanData {
        // Use these just in case they have to be adjusted
        let width = obj.width;
        let height = obj.height;

        let start_col = Math.floor(obj.x / (this._tileWidth * CELL_WIDTH));
        if (start_col < 0) {
            // Out of bounds, so clamp and subtract the difference
            width += start_col;
            start_col = 0;
        }

        let end_col = Math.floor((obj.x + width) / (this._tileWidth * CELL_WIDTH));
        if (end_col >= this._cells[0].length) {
            end_col = this._cells[0].length - 1;
        }

        let start_row = Math.floor(obj.y / (this._tileHeight * CELL_HEIGHT));
        if (start_row < 0) {
            // Out of bounds, so clamp and subtract the difference
            width += start_row;
            start_row = 0;
        }

        let end_row = Math.floor((obj.y + height) / (this._tileHeight * CELL_HEIGHT));
        if (end_row >= this._cells.length) {
            end_row = this._cells.length - 1;
        }

        return {
            startCol: start_col ,
            endCol: (end_col >= 0) ? end_col : 0,
            startRow: start_row ,
            endRow: (end_row >= 0) ? end_row : 0
        };
    }
}
