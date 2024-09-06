class ResizeHandler extends Object {
    constructor(element, horizontal = false, vertical = false) {
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
        this._updateWidth = this._updateWidth.bind(this);
        this._shrinkWidth = this._shrinkWidth.bind(this);
        this._fillWidth = this._fillWidth.bind(this);
        this._updateHeight = this._updateHeight.bind(this);
        this._shrinkHeight = this._shrinkHeight.bind(this);
        this._fillHeight = this._fillHeight.bind(this);
    }

    connect() {
        this.observer = new ResizeObserver(this.onObservedResize.bind(this));
        this.observer.observe(this.observedParentElement);
        this.isConnected = true;
    }

    disconnect() {
        this.observer.unobserve(this.observedParentElement);
        this.observer.disconnect();
        this.isConnected = false;
    }

    updateFromExpandsAttr(aString) {
        // Update the horizontal and/or
        // vertical properties based on the
        // incoming string, which comes from
        // the `expands=` attribute of the target
        // sheet.
        if (!["both", "rows", "columns"].includes(aString)) {
            this.disconnect();
            return;
        }
        if (aString === "both") {
            this.vertical = true;
            this.horizontal = true;
        } else if (aString === "rows") {
            this.vertical = true;
            this.horizontal = false;
        } else if (aString === "columns") {
            this.vertical = false;
            this.horizontal = true;
        }

        // Finally, connect if we are
        // not already connected.
        if (!this.isConnected) {
            this.connect();
        }
    }

    onObservedResize(info) {
        // Attempt to re-set the number of columns and rows
        // based upon the available free space in the element.
        if (this._cachedTimeoutId) {
            window.clearTimeout(this._cachedTimeoutId);
        }
        this._cachedTimeoutId = window.setTimeout(() => {
            if (!this.horizontal && !this.vertical) {
                return;
            }
            const roData = info[0];
            const containerRect = roData.target.getBoundingClientRect();
            const sheetRect = this.sheet.getBoundingClientRect();
            if (this.horizontal) {
                this._updateWidth(containerRect.width, sheetRect.width);
            }
            if (this.vertical) {
                this._updateHeight(containerRect.height, sheetRect.height);
            }
        }, 100);
    }

    _shrinkHeight(availableHeight) {
        let currentRowIndex = 1;
        let currentLastRow = this.sheet.shadowRoot.querySelector(
            `row-tab:nth-last-of-type(${currentRowIndex})`
        );
        let lastRowHeight = currentLastRow.getBoundingClientRect().height;
        let freespace = Math.floor(availableHeight) + lastRowHeight;
        let numRowsToRemove = 0;
        while (freespace < 0) {
            currentLastRow = this.sheet.shadowRoot.querySelector(
                `row-tab:nth-last-of-type(${currentRowIndex})`
            );
            if (!currentLastRow) {
                break;
            }
            lastRowHeight = currentLastRow.getBoundingClientRect().height;
            numRowsToRemove += 1;
            currentRowIndex += 1;
            freespace += lastRowHeight;
        }

        let newTotalRows = this.sheet.numRows - numRowsToRemove;
        if (newTotalRows < 1) {
            newTotalRows = 1;
        }
        this.sheet.setAttribute("rows", newTotalRows);
    }

    _fillHeight(availableHeight) {
        let freespace = Math.floor(availableHeight);
        let currentLastRow, nextRowHeight;
        let numRowsToAdd = 0;
        let rowHeightAdded = 0;
        while (freespace > 0) {
            currentLastRow =
                this.sheet.shadowRoot.querySelector(
                    `row-tab:last-of-type`
                ).relativeRow;
            nextRowHeight = this.sheet.customRows[currentLastRow];
            if (nextRowHeight === undefined) {
                nextRowHeight = this.sheet.cellHeight;
            }
            freespace = freespace - nextRowHeight;
            rowHeightAdded += nextRowHeight;
            numRowsToAdd += 1;
        }
        this.sheet.setAttribute("rows", this.sheet.numRows + numRowsToAdd);
    }

    _updateHeight(parentHeight, sheetHeight) {
        let availableHeight = parentHeight - sheetHeight;
        if (availableHeight > 0) {
            this._fillHeight(availableHeight);
        } else if (availableHeight < 0) {
            this._shrinkHeight(availableHeight);
        }
    }

    _fillWidth(availableWidth) {
        let freespace = Math.floor(availableWidth);
        let currentLastCol, nextColumnWidth;
        let numColumnsToAdd = 0;
        let totalWidthToAdd = 0;
        while (freespace > 0) {
            currentLastCol = this.sheet.shadowRoot.querySelector(
                "column-tab:last-of-type"
            ).relativeColumn;
            nextColumnWidth = this.sheet.customColumns[currentLastCol];
            if (nextColumnWidth === undefined) {
                nextColumnWidth = this.sheet.cellWidth;
            }
            freespace = freespace - nextColumnWidth;
            totalWidthToAdd += nextColumnWidth;
            numColumnsToAdd += 1;
        }
        this.sheet.setAttribute(
            "columns",
            this.sheet.numColumns + numColumnsToAdd
        );
    }

    _shrinkWidth(availableWidth) {
        let currentColumnIndex = 1;
        let currentLastCol = this.sheet.shadowRoot.querySelector(
            `column-tab:nth-last-of-type(${currentColumnIndex})`
        );
        let lastColWidth = currentLastCol.getBoundingClientRect().width;
        let freespace = Math.floor(availableWidth) + lastColWidth;
        let numColumnsToRemove = 0;
        let totalWidthToRemove = 0;
        while (freespace < 0) {
            currentLastCol = this.sheet.shadowRoot.querySelector(
                `column-tab:nth-last-of-type(${currentColumnIndex})`
            );
            if (!currentLastCol) {
                break;
            }
            lastColWidth = currentLastCol.getBoundingClientRect().width;
            freespace += lastColWidth;
            numColumnsToRemove += 1;
            currentColumnIndex += 1;
            totalWidthToRemove += lastColWidth;
        }

        let newTotalColumns = this.sheet.numColumns - numColumnsToRemove;
        if (newTotalColumns < 1) {
            newTotalColumns = 1;
        }
        this.sheet.setAttribute("columns", newTotalColumns);
    }

    _updateWidth(parentWidth, sheetWidth) {
        let availableWidth = parentWidth - sheetWidth;
        if (availableWidth > 0) {
            this._fillWidth(availableWidth);
        } else {
            this._shrinkWidth(availableWidth);
        }
    }

    get observedParentElement() {
        let parentElement = this.sheet.parentElement;
        if (!parentElement) {
            parentElement = this.sheet.getRootNode().host;
        }
        return parentElement;
    }
}

export { ResizeHandler, ResizeHandler as default };
