class ResizeHandler extends Object {
    constructor(element, horizontal=false, vertical=false){
        super();
        this.sheet = element;
        this.horizontal = horizontal;
        this.vertical = vertical;
        this.isConnected = false;

        // Bound instance methods
        this.connect = this.connect.bind(this);
        this.disconnect = this.disconnect.bind(this);
        this.updateFromExpandsAttr = this.updateFromExpandsAttr.bind(this);
        this.onObservedResize = this.onObservedResize.bind(this);
        this.calcCurrentWidth = this.calcCurrentWidth.bind(this);
        this.calcCurrentHeight = this.calcCurrentHeight.bind(this);
        this._updateWidth = this._updateWidth.bind(this);
        this._updateHeight = this._updateHeight.bind(this);
    }
    
    connect(){
        this.observer = new ResizeObserver(this.onObservedResize.bind(this));
        let parentElement = this.sheet.parentElement;
        if(!parentElement){
            parentElement = this.sheet.getRootNode().host;
        }
        this.observer.observe(parentElement);
        this.isConnected = true;
    }

    disconnect(){
        let parentElement = this.sheet.parentElement;
        if(!parentElement){
            parentElement = this.sheet.getRootNode().host;
        }
        this.observer.unobserve(parentElement);
        this.observer.disconnect();
        this.isConnected = false;
    }

    updateFromExpandsAttr(aString){
        // Update the horizontal and/or
        // vertical properties based on the
        // incoming string, which comes from
        // the `expands=` attribute of the target
        // sheet.
        if(!["both", "rows", "columns"].includes(aString)){
            this.disconnect();
            return;
        }
        if(aString === "both"){
            this.vertical = true;
            this.horizontal = true;
        } else if(aString === "rows"){
            this.vertical = true;
            this.horizontal = false;
        } else if(aString === "columns"){
            this.vertical = false;
            this.horizontal = true;
        }

        // Finally, connect if we are
        // not already connected.
        if(!this.isConnected){
            this.connect();
        }
    }

    onObservedResize(info){
        // Attempt to re-set the number of columns and rows
        // based upon the available free space in the element.
        if(!this.horizontal && !this.vertical){
            return;
        }
        const roData = info[0];
        const rect = roData.target.getBoundingClientRect();
        if(this.horizontal){
            this._updateWidth(rect.width);
        }
        if(this.vertical){
            this._updateHeight(rect.height);
        }
        this.sheet.render();
    }

    _updateHeight(parentHeight){
        let currentHeight = this.calcCurrentHeight();
        let availableHeight = parentHeight - currentHeight;
        if(availableHeight > 0){
            // In this case we are expanding.
            // We will need to check the cache
            // of row settings to make sure that
            // the next available rows are explicitly
            // set to a width value, otherwise use
            // the default values for row height
            let currentLastRow = this.sheet.shadowRoot.querySelector(
                `row-tab:last-of-type`
            ).relativeRow;
            let numRowsToAdd = 0;
            let nextRowHeight = this.sheet.customRows[currentLastRow];
            if(nextRowHeight === undefined){
                nextRowHeight = this.sheet.cellHeight;
            }
            while(availableHeight >= nextRowHeight){
                availableHeight -= nextRowHeight;
                numRowsToAdd += 1;
                currentLastRow += 1;
                nextRowHeight = this.sheet.customRows[currentLastRow];
                if(nextRowHeight === undefined){
                    nextRowHeight = this.sheet.cellHeight;
                }
            }
            this.sheet.setAttribute('rows', this.sheet.numRows + numRowsToAdd);
        } else if(availableHeight < 0){
            // In this case, we are shrinking.
            // We need to remove rows one at a time
            // and make sure we get the available space
            // to be greater than or equal to zero.
            let numRowsToRemove = 0;
            let currentRowIndex = 1;
            let lastRow = this.sheet.shadowRoot.querySelector(
                `row-tab:nth-last-of-type(${currentRowIndex})`
            );
            let lastRowHeight = lastRow.getBoundingClientRect().height;
            while(availableHeight < 0){
                availableHeight += lastRowHeight;
                numRowsToRemove += 1;
                currentRowIndex += 1;
                lastRow = this.sheet.shadowRoot.querySelector(
                    `row-tab:nth-last-of-type(${currentRowIndex})`
                );
                lastRowHeight = lastRow.getBoundingClientRect().height;
            }

            // We always ensure that there is at least one row
            let newTotalRows = this.sheet.numRows - numRowsToRemove;
            if(newTotalRows <= 0){
                newTotalRows = 1;
            }
            this.sheet.setAttribute('rows', newTotalRows);
        }
    }

    _updateWidth(parentWidth){
        let currentWidth = this.calcCurrentWidth();
        let availableWidth = parentWidth - currentWidth;
        if(availableWidth > 0){
            // In this case, we are expanding.
            // We will need to check the cache
            // of column settings to make sure that
            // next available columns are explicitly
            // set to a width value, otherwise use
            // the default values for column width.
            let currentLastCol = this.sheet.shadowRoot.querySelector('column-tab:last-of-type').relativeColumn;
            let numColumnsToAdd = 0;
            let nextColumnWidth = this.sheet.customColumns[currentLastCol];
            if(nextColumnWidth === undefined){
                nextColumnWidth = this.sheet.cellWidth;
            }
            while(availableWidth >= nextColumnWidth){
                availableWidth -= nextColumnWidth;
                numColumnsToAdd += 1;
                currentLastCol += 1;
                nextColumnWidth = this.sheet.customColumns[currentLastCol];
                if(nextColumnWidth === undefined){
                    nextColumnWidth = this.sheet.cellWidth;
                }
            }
            this.sheet.setAttribute('columns', this.sheet.numColumns + numColumnsToAdd);
        } else if(availableWidth < 0){
            // In this case, we are shrinking.
            // We need to remove columns one at a time
            // and make sure we get the available space
            // to be greater than or equal to zero
            let numColumnsToRemove = 0;
            let currentColumnIndex = 1;
            let lastColumn = this.sheet.shadowRoot.querySelector(`column-tab:nth-last-of-type(${currentColumnIndex})`);
            let lastColumnWidth = lastColumn.getBoundingClientRect().width;
            while(availableWidth < 0){
                availableWidth += lastColumnWidth;
                numColumnsToRemove += 1;
                currentColumnIndex += 1;
                lastColumn = this.sheet.shadowRoot.querySelector(`column-tab:nth-last-of-type(${currentColumnIndex})`);
                lastColumnWidth = lastColumn.getBoundingClientRect().width;
            }
            let newTotalColumns = this.sheet.numColumns - numColumnsToRemove;
            if(newTotalColumns <= 0){
                newTotalColumns = 1;
            }
            this.sheet.setAttribute('columns', newTotalColumns);
        }
    }

    calcCurrentWidth(){
        // We use the top row's
        // rightmost cell
        let rightmostCellSelector = `sheet-cell[data-x="${this.sheet.numColumns - 1}"]`;
        let rightmostCell = this.sheet.querySelector(rightmostCellSelector);
        let right = rightmostCell.getBoundingClientRect().right;
        return Math.ceil(right);
    }

    calcCurrentHeight(){
        // We use the left column's
        // bottom sheet cell.
        let bottomCellSelector = `sheet-cell[data-y="${this.sheet.numRows - 1}"]`;
        let bottomCell = this.sheet.querySelector(bottomCellSelector);
        let bottom = bottomCell.getBoundingClientRect().bottom;
        return Math.ceil(bottom);
    }
}

export {
    ResizeHandler,
    ResizeHandler as default
};
