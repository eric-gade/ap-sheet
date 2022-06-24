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
        this.pause = this.pause.bind(this);
        this.restart = this.restart.bind(this);
        this.updateFromExpandsAttr = this.updateFromExpandsAttr.bind(this);
        this.onObservedResize = this.onObservedResize.bind(this);
        this.calcCurrentWidth = this.calcCurrentWidth.bind(this);
        this.calcCurrentHeight = this.calcCurrentHeight.bind(this);
        this._updateWidth = this._updateWidth.bind(this);
        this._updateHeight = this._updateHeight.bind(this);
    }
    
    connect(){
        this.observer = new ResizeObserver(this.onObservedResize.bind(this));
        this.observer.observe(this.observedParentElement);
        this.isConnected = true;
    }

    pause(){
        this.observer.unobserve(this.observedParentElement);
    }

    restart(){
        this.observer.observe(this.observedParentElement);
    }

    disconnect(){
        this.observer.unobserve(this.observedParentElement);
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
        if(this._cachedTimeoutId){
            window.clearTimeout(this._cachedTimeoutId);
        }
        this._cachedTimeoutId = window.setTimeout(() => {
            if(!this.horizontal && !this.vertical){
                return;
            }
            const roData = info[0];
            const containerRect = roData.target.getBoundingClientRect();
            const sheetRect = this.sheet.getBoundingClientRect();
            console.log(`clientHeight: ${roData.target.clientHeight} scrollHeight: ${roData.target.scrollHeight}`);
            if(this.horizontal){
                this._updateWidth(containerRect.width, sheetRect.width);
            }
            if(this.vertical){
                this._updateHeight(containerRect.height, sheetRect.height);
            }
            this.sheet.render();
        }, 250);
    }

    _shrinkHeight(availableHeight){}

    _fillHeight(availableHeight){
        let freespace = Math.floor(availableHeight);
        let currentLastRow, nextRowHeight;
        let numRowsToAdd = 0;
        let rowHeightAdded = 0;
        while(freespace > 0){
            currentLastRow = this.sheet.shadowRoot.querySelector(
                `row-tab:last-of-type`
            ).relativeRow;
            nextRowHeight = this.sheet.customRows[currentLastRow];
            if(nextRowHeight === undefined){
                nextRowHeight = this.sheet.cellHeight;
            }
            freespace = freespace - nextRowHeight;
            rowHeightAdded += nextRowHeight;
            numRowsToAdd += 1;
            console.log(`freespace: ${freespace}`);
        }
        console.log(`Adding ${numRowsToAdd} rows with collective height: ${rowHeightAdded}`);
        this.sheet.setAttribute('rows', this.sheet.numRows + numRowsToAdd);
        
    }

    _updateHeight(parentHeight, sheetHeight){
        let availableHeight = parentHeight - sheetHeight;
        console.log(`available height: ${availableHeight}`);
        if(availableHeight > 0){
            this._fillHeight(availableHeight);
        } else if(availableHeight < 0){
            this._shrinkHeight(availableHeight);
        }
        // let currentHeight = this.calcCurrentHeight();
        // let availableHeight = parentHeight - currentHeight;
        // if(availableHeight > 0){
        //     // In this case we are expanding.
        //     // We will need to check the cache
        //     // of row settings to make sure that
        //     // the next available rows are explicitly
        //     // set to a width value, otherwise use
        //     // the default values for row height
        //     let currentLastRow = this.sheet.shadowRoot.querySelector(
        //         `row-tab:last-of-type`
        //     ).relativeRow;
        //     let numRowsToAdd = 0;
        //     let nextRowHeight = this.sheet.customRows[currentLastRow];
        //     if(nextRowHeight === undefined){
        //         nextRowHeight = this.sheet.cellHeight;
        //     }
        //     while(availableHeight > 0){
        //         availableHeight -= nextRowHeight;
        //         numRowsToAdd += 1;
        //         currentLastRow += 1;
        //         nextRowHeight = this.sheet.customRows[currentLastRow];
        //         if(nextRowHeight === undefined){
        //             nextRowHeight = this.sheet.cellHeight;
        //         }
        //     }
        //     this.sheet.setAttribute('rows', this.sheet.numRows + numRowsToAdd);
        // } else if((availableHeight + this.sheet.cellHeight) < 0){
        //     // In this case, we are shrinking.
        //     // We need to remove rows one at a time
        //     // and make sure we get the available space
        //     // to be greater than or equal to zero.
        //     let numRowsToRemove = 0;
        //     let currentRowIndex = 1;
        //     let lastRow = this.sheet.shadowRoot.querySelector(
        //         `row-tab:nth-last-of-type(${currentRowIndex})`
        //     );
        //     let lastRowHeight = lastRow.getBoundingClientRect().height;
        //     while(availableHeight < 0 && this.sheet.numRows > 1){
        //         availableHeight += lastRowHeight;
        //         numRowsToRemove += 1;
        //         currentRowIndex += 1;
        //         lastRow = this.sheet.shadowRoot.querySelector(
        //             `row-tab:nth-last-of-type(${currentRowIndex})`
        //         );
        //         lastRowHeight = lastRow.getBoundingClientRect().height;
        //     }

        //     let newTotalRows = this.sheet.numRows - numRowsToRemove;
        //     this.sheet.setAttribute('rows', newTotalRows);
        // }
    }

    _updateWidth(parentWidth, sheetWidth){
        // let currentWidth = this.calcCurrentWidth();
        // let availableWidth = parentWidth - currentWidth;
        // if(availableWidth > 0){
        //     // In this case, we are expanding.
        //     // We will need to check the cache
        //     // of column settings to make sure that
        //     // next available columns are explicitly
        //     // set to a width value, otherwise use
        //     // the default values for column width.
        //     let currentLastCol = this.sheet.shadowRoot.querySelector('column-tab:last-of-type').relativeColumn;
        //     let numColumnsToAdd = 0;
        //     let nextColumnWidth = this.sheet.customColumns[currentLastCol];
        //     if(nextColumnWidth === undefined){
        //         nextColumnWidth = this.sheet.cellWidth;
        //     }
        //     while(availableWidth > 0){
        //         availableWidth -= nextColumnWidth;
        //         numColumnsToAdd += 1;
        //         currentLastCol += 1;
        //         nextColumnWidth = this.sheet.customColumns[currentLastCol];
        //         if(nextColumnWidth === undefined){
        //             nextColumnWidth = this.sheet.cellWidth;
        //         }
        //     }
        //     this.sheet.setAttribute('columns', this.sheet.numColumns + numColumnsToAdd);
        // } else if(availableWidth < 0){
        //     // In this case, we are shrinking.
        //     // We need to remove columns one at a time
        //     // and make sure we get the available space
        //     // to be greater than or equal to zero
        //     let numColumnsToRemove = 0;
        //     let currentColumnIndex = 1;
        //     let lastColumn = this.sheet.shadowRoot.querySelector(`column-tab:nth-last-of-type(${currentColumnIndex})`);
        //     let lastColumnWidth = lastColumn.getBoundingClientRect().width;
        //     while((availableWidth + this.sheet.cellWidth) < 0 && this.sheet.numColumns > 1){
        //         availableWidth += lastColumnWidth;
        //         numColumnsToRemove += 1;
        //         currentColumnIndex += 1;
        //         lastColumn = this.sheet.shadowRoot.querySelector(`column-tab:nth-last-of-type(${currentColumnIndex})`);
        //         lastColumnWidth = lastColumn.getBoundingClientRect().width;
        //     }
        //     let newTotalColumns = this.sheet.numColumns - numColumnsToRemove;
        //     this.sheet.setAttribute('columns', newTotalColumns);
        // }
    }

    calcCurrentWidth(){
        // We use the top row's
        // rightmost cell
        // let rightmostCellSelector = `sheet-cell[data-x="${this.sheet.numColumns - 1}"]`;
        // let rightmostCell = this.sheet.querySelector(rightmostCellSelector);
        // let right = rightmostCell.getBoundingClientRect().right;
        // return Math.ceil(right);
        return this.sheet.getBoundingClientRect().width;
    }

    calcCurrentHeight(){
        // We use the left column's
        // bottom sheet cell.
        // let bottomCellSelector = `sheet-cell[data-y="${this.sheet.numRows - 1}"]`;
        // let bottomCell = this.sheet.querySelector(bottomCellSelector);
        // let bottom = bottomCell.getBoundingClientRect().bottom;
        // return Math.ceil(bottom);
        return this.sheet.getBoundingClientRect().height;
    }

    get observedParentElement(){
        let parentElement = this.sheet.parentElement;
        if(!parentElement){
            parentElement = this.sheet.getRootNode().host;
        }
        return parentElement;
    }
}

export {
    ResizeHandler,
    ResizeHandler as default
};
