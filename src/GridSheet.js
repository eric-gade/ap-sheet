import { IDBDataFrame as DataFrame } from "./IDBDataFrame.js";
import { Selector } from "./Selector.js";
import PrimaryFrame from "./PrimaryGridFrame.js";
import { Point } from "./Point.js";
import { MouseHandler } from "./MouseHandler.js";
import { KeyHandler } from "./KeyHandler.js";
import { ResizeHandler } from "./ResizeHandler.js";
import { SyntheticClipboardHandler as ClipboardHandler } from "./SyntheticClipboardHandler.js";
import { Frame } from "./Frame.js";
import { RowTab, ColumnTab } from "./Tab.js";
import { SelectionElement } from "./SelectionElement.js";
import {
    LockedRowsElement,
    LockedColumnsElement,
} from "./LockedSelectionElement.js";
import { CursorElement } from "./CursorElement.js";

// Add any components
window.customElements.define("row-tab", RowTab);
window.customElements.define("column-tab", ColumnTab);
window.customElements.define("sheet-selection", SelectionElement);
window.customElements.define("locked-rows", LockedRowsElement);
window.customElements.define("locked-columns", LockedColumnsElement);
window.customElements.define("sheet-cursor", CursorElement);

// Simple grid-based sheet component
const templateString = `
<style>
:host {
   display: grid;
   user-select: none;
   overflow: hidden; /* For auto-resize without scrolling on */
}

:host(:focus){
    outline: none;
}

:host(:hover){
    cursor: cell;
}

::slotted(*){
    color: green;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    text-overflow: ellipses;
}

::slotted(sheet-cell){
    justify-content: flex-start;
    grid-column-start: var(--col-start);
    grid-column-end: span 1;
    grid-row-start: var(--row-start);
    grid-row-end: span 1;
}

#edit-bar {
    display: flex;
    width: 1fr;
    box-sizing: border-box;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
    border: 1px solid rgba(100, 100, 100, 0.4);
    background-color: white;
    grid-column: 1 / -1;
    align-items: baseline;
    justify-content: stretch;
}
#edit-area {
    flex: 1;
    padding: 2px;
    padding-right: 10px;
    outline: none;
    border: none;
    background-color: transparent;
    padding-right: 10px;
    font-family: inherit;
    font-size: inherit;
}
#info-area {
    height: 100%;
    display: flex;
    align-items: baseline;
    justify-content: center;
    margin-left: 10px;
}

#info-area span:last-child {
    font-size: 1.3em;
    margin-left: 8px;
    margin-right: 6px;
}

locked-rows {
    background-color: rgba(240, 240, 240, 0.2);
    border-bottom: 2px solid black;
}
locked-columns {
    background-color: rgba(240, 240, 240, 0.2);
    border-right: 2px solid black;
}

row-tab[locked="true"],
column-tab[locked="true"] {
    background-color: rgba(240, 240, 240, 0.8);
}

row-tab,
column-tab {
    font-family: monospace;
}

</style>
<div id="edit-bar" style="grid-column: 1 / -1; grid-row: span 1;">
    <div id="info-area"><span>Cursor</span><span>&rarr;</span></div>
    <input id="edit-area" type="text" disabled="true"/>
</div>
<slot></slot>
<sheet-selection id="main-selection"></sheet-selection>
<sheet-selection id="locked-rows-selection" class="empty"></sheet-selection>
<locked-rows id="locked-rows-selection" class="empty"></locked-rows>
<locked-columns id="locked-columns-selection" class="empty"></locked-columns>
<sheet-cursor id="cursor"></sheet-cursor>
`;

class GridSheet extends HTMLElement {
    constructor() {
        super();
        this.template = document.createElement("template");
        this.template.innerHTML = templateString;
        this.attachShadow({ mode: "open" });
        this.shadowRoot.appendChild(this.template.content.cloneNode(true));

        // Testers
        this.isSheet = true;

        // Default cell dimensions
        this.cellWidth = 150;
        this.cellHeight = 36;
        this.numRows = 1;
        this.numLockedRows = 0;
        this.numLockedColumns = 0;
        this.numColumns = 1;
        this.showRowTabs = true;
        this.showColumnTabs = true;

        // Default column and row
        // customizations
        this.customColumns = {};
        this.customRows = {};

        // Set up the internal frames
        this.dataFrame = new DataFrame([0, 0], [26 * 2, 100]);
        this.primaryFrame = new PrimaryFrame(this.dataFrame, [0, 0]);
        this.selector = new Selector(this.primaryFrame);
        this.selector.selectionChangedCallback =
            this.dispatchSelectionChanged.bind(this);

        // Bind instace methods
        this.onObservedResize = this.onObservedResize.bind(this);
        this.onDataChanged = this.onDataChanged.bind(this);
        this.onTabClick = this.onTabClick.bind(this);
        this.render = this.render.bind(this);
        this.renderGridTemplate = this.renderGridTemplate.bind(this);
        this.renderRowTabs = this.renderRowTabs.bind(this);
        this.renderColumnTabs = this.renderColumnTabs.bind(this);
        this.dispatchSelectionChanged =
            this.dispatchSelectionChanged.bind(this);
        this.dispatchViewShifted = this.dispatchViewShifted.bind(this);
        this.updateLockedRows = this.updateLockedRows.bind(this);
        this.updateLockedColumns = this.updateLockedColumns.bind(this);
        this.trackSelectionWithRowTabs =
            this.trackSelectionWithRowTabs.bind(this);
        this.trackSelectionWithColumnTabs =
            this.trackSelectionWithColumnTabs.bind(this);

        // Bind event handlers
        this.handleSelectionChanged = this.handleSelectionChanged.bind(this);
        this.handleViewShift = this.handleViewShift.bind(this);
        this.handleColumnAdjustment = this.handleColumnAdjustment.bind(this);
        this.handleRowAdjustment = this.handleRowAdjustment.bind(this);
        this.handleCellEdited = this.handleCellEdited.bind(this);
        this.handleDataFrameResized = this.handleDataFrameResized.bind(this);
    }

    connectedCallback() {
        if (this.isConnected) {
            // Stuff up here
            this.setAttribute("tabindex", "-1");

            // Set up the resizing handler
            // and perform an initial resizing if
            // needed based on current attribute value
            this.resizeHandler = new ResizeHandler(this);
            this.resizeHandler.connect();
            setTimeout(() => {
                this.resizeHandler.updateFromExpandsAttr(
                    this.getAttribute("expands")
                );
            }, 30);

            // Attach a MouseHandler to handle mouse
            // interaction and events
            this.mouseHandler = new MouseHandler(this);
            this.mouseHandler.connect();

            // Attach a KeyHandler to handle
            // keydown events
            this.keyHandler = new KeyHandler(this);
            this.keyHandler.connect();

            // Attach ClipboardHandler to handle
            // copy and paste
            this.clipboardHandler = new ClipboardHandler(this);
            this.clipboardHandler.connect();

            // Bind the PrimaryFrame's afterChange callback
            // to this instance's viewShifted handler.
            this.primaryFrame.afterChange = this.dispatchViewShifted.bind(this);
        }

        // Event listeners
        this.addEventListener("selection-changed", this.handleSelectionChanged);
        this.addEventListener("sheet-view-shifted", this.handleViewShift);
        this.addEventListener("cell-edited", this.handleCellEdited);

        // Add the sheet itself as a subscriber to its DataFrame
        this.dataFrame.subscribers.add(this);
    }

    disconnectedCallback() {
        this.resizeHandler.disconnect();
        this.mouseHandler.disconnect();
        this.keyHandler.disconnect();
        this.clipboardHandler.disconnect();
        this.removeEventListener(
            "selection-changed",
            this.handleSelectionChanged
        );
        this.removeEventListener("sheet-view-shifted", this.handleViewShift);
        this.removeEventListener("cell-edited", this.handleCellEdited);
        this.dataFrame.subscribers.delete(this);
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (name == "rows") {
            this.numRows = parseInt(newVal);
            this.updateNumRows();
        } else if (name == "columns") {
            this.numColumns = parseInt(newVal);
            this.updateNumColumns();
        } else if (name == "expands" && this.resizeHandler) {
            this.resizeHandler.updateFromExpandsAttr(newVal);
        } else if (name == "lockedrows") {
            this.numLockedRows = parseInt(newVal);
            this.updateLockedRows();
        } else if (name == "lockedcolumns") {
            this.numLockedColumns = parseInt(newVal);
            this.updateLockedColumns();
        }
    }

    onDataChanged(frame, wasResized = false) {
        if (frame.isPoint) {
            frame = new Frame(frame, frame);
        }
        let event = new CustomEvent("data-updated", {
            detail: {
                frames: [frame],
                wasResized,
            },
        });
        if (wasResized) {
            let resizeEvent = new CustomEvent("data-frame-resized", {
                detail: {
                    // Nothing for now
                },
            });
            console.log("dispatching data updated!");
            this.dispatchEvent(resizeEvent);
        }

        this.dispatchEvent(event);
        this.primaryFrame.updateCellContents();
    }

    onObservedResize(info) {
        // Attempt to re-set the number of columns and rows
        // based upon the available free space in the element.
        // Note that for now, we only attempt this on the
        // horizontal (column) axis
        const roData = info[0];
        const rect = roData.target.getBoundingClientRect();
        const currentCellWidth = this.cellWidth;
        const currentCellHeight = this.cellHeight;
        const newColumns = Math.floor(rect.width / currentCellWidth);
        const newRows = Math.floor(rect.height / currentCellHeight);
        this.setAttribute("columns", newColumns);
        this.setAttribute("rows", newRows);
        this.render();
    }

    updateNumRows() {
        if (this.numRows <= 0) {
            this.numRows = 1;
        }
        this.render();
    }

    updateLockedRows() {
        this.render();
        let element = this.shadowRoot.querySelector("locked-rows");
        if (element) {
            element.updateFromSelector(this.selector);
        }
    }

    updateNumColumns() {
        if (this.numColumns <= 0) {
            this.numColumns = 1;
        }
        this.render();
    }

    updateLockedColumns() {
        this.render();
        let element = this.shadowRoot.querySelector("locked-columns");
        if (element) {
            element.updateFromSelector(this.selector);
        }
    }

    render() {
        this.innerHTML = "";
        if (this.showRowTabs) {
            this.renderRowTabs();
        }
        if (this.showColumnTabs) {
            this.renderColumnTabs();
        }
        let newCorner = new Point([this.numColumns - 1, this.numRows - 1]);
        this.primaryFrame = new PrimaryFrame(this.dataFrame, newCorner);
        this.primaryFrame.initialBuild();
        this.primaryFrame.labelElements();
        this.append(...this.primaryFrame.elements);
        this.primaryFrame.lockRows(this.numLockedRows);
        this.primaryFrame.lockColumns(this.numLockedColumns);
        this.primaryFrame.afterChange = this.dispatchViewShifted.bind(this);
        this.selector.primaryFrame = this.primaryFrame;
        this.renderGridTemplate();

        // This is HACKY.
        // Issue: the elements have not yet finished appending
        // themselves to this GridSheet element by the time
        // updateCellContents() gets called, so it cannot find
        // elements!
        if (this.primaryFrame.elements.length == 0) {
            setTimeout(() => {
                this.primaryFrame.updateCellContents();
            }, 60);
        } else {
            this.primaryFrame.updateCellContents();
        }
    }

    renderGridTemplate() {
        // Column lines
        let relativeXValues = Array.from(this.querySelectorAll("sheet-cell"))
            .filter((element) => {
                return element.getAttribute("data-y") === "0";
            })
            .map((element) => {
                return parseInt(element.getAttribute("data-relative-x"));
            });
        let col = "";
        for (let i = 0; i < relativeXValues.length; i++) {
            let relativeX = relativeXValues[i];
            if (this.customColumns[relativeX]) {
                col += `[cell-col-start] ${this.customColumns[relativeX]}px `;
            } else {
                col += `[cell-col-start] ${this.cellWidth}px`;
            }
        }
        if (this.showRowTabs) {
            col = `[rtab-start] 3em ${col}`;
        }
        this.style.gridTemplateColumns = col;

        // Row lines
        let relativeYValues = Array.from(this.querySelectorAll("sheet-cell"))
            .filter((element) => {
                return element.getAttribute("data-x") === "0";
            })
            .map((element) => {
                return parseInt(element.getAttribute("data-relative-y"));
            });
        let row = "";
        for (let i = 0; i < relativeYValues.length; i++) {
            let relativeY = relativeYValues[i];
            if (this.customRows[relativeY]) {
                row += `[cell-row-start] ${this.customRows[relativeY]}px `;
            } else {
                row += `[cell-row-start] ${this.cellHeight}px`;
            }
        }
        if (this.showColumnTabs) {
            row = `[ctab-start] 1fr ${row}`;
        }
        row = `[header-start] 1fr ${row}`;
        this.style.gridTemplateRows = row;
    }

    renderRowTabs() {
        Array.from(this.shadowRoot.querySelectorAll("row-tab")).forEach(
            (tab) => {
                tab.remove();
            }
        );
        for (let i = 0; i < this.numRows; i++) {
            let tab = document.createElement("row-tab");
            tab.style.gridColumn = `rtab-start / span 1`;
            tab.style.gridRow = `cell-row-start ${i + 1} / span 1`;
            this.shadowRoot.append(tab);
            tab.setAttribute("data-y", i);
            tab.setAttribute("data-relative-y", i);

            // Mark any tabs appearing in a locked row
            // as locked
            if (i < this.numLockedRows) {
                tab.setAttribute("locked", true);
            }
            tab.addEventListener("click", this.onTabClick.bind(this));

            // Add event listener for row adjustment
            tab.addEventListener("row-adjustment", this.handleRowAdjustment);
        }
    }

    renderColumnTabs() {
        Array.from(this.shadowRoot.querySelectorAll("column-tab")).forEach(
            (tab) => {
                tab.remove();
            }
        );
        let previousNode = this.shadowRoot.querySelector("slot");
        for (let i = 0; i < this.numColumns; i++) {
            let tab = document.createElement("column-tab");
            tab.style.gridRow = "ctab-start / span 1";
            tab.style.gridColumn = `cell-col-start ${i + 1} / span 1`;
            this.shadowRoot.insertBefore(tab, previousNode);
            previousNode = tab;
            tab.setAttribute("data-x", i);
            tab.setAttribute("data-relative-x", i);

            // Mark any tabs appearing in a locked column
            // as locked
            if (i < this.numLockedColumns) {
                tab.setAttribute("locked", true);
            }

            tab.addEventListener("click", this.onTabClick.bind(this));

            // Add event listener for width adjustment
            tab.addEventListener(
                "column-adjustment",
                this.handleColumnAdjustment
            );
        }
    }

    onTabClick(event) {
        if (event.target.isRowTab && event.button === 0) {
            let rowOrigin = new Point([0, event.target.relativeRow]);
            let rowCorner = new Point([
                this.dataFrame.right,
                event.target.relativeRow,
            ]);
            this.selector.anchor = rowCorner;
            if (event.shiftKey) {
                if (rowCorner.y > this.selector.selectionFrame.origin.y) {
                    // The new row is "below" the current selection.
                    // Set anchor to top right corner of what will be
                    // the union frame.
                    this.selector.anchor = new Point([
                        this.dataFrame.right,
                        this.selector.selectionFrame.origin.y,
                    ]);
                } else if (
                    rowCorner.y < this.selector.selectionFrame.origin.y
                ) {
                    // The new row is "above" the current selection.
                    // The anchor should be set to the bottom right of
                    // what will be the union frame.
                    this.selector.anchor = new Point([
                        this.dataFrame.right,
                        this.selector.selectionFrame.corner.y,
                    ]);
                }
            }
            this.selector.selectFromAnchorTo(rowOrigin);
            this.selector.cursor = new Point([
                this.selector.cursor.x,
                event.target.row,
            ]);
            this.selector.triggerCallback();
        } else if (event.target.isColumnTab && event.button === 0) {
            let colOrigin = new Point([event.target.relativeColumn, 0]);
            let colCorner = new Point([
                event.target.relativeColumn,
                this.dataFrame.bottom,
            ]);
            this.selector.anchor = colCorner;
            if (event.shiftKey) {
                if (colCorner.x > this.selector.selectionFrame.origin.x) {
                    // The new column is to the right of the current selection.
                    // Set the anchor to the bottom left corner of what wil
                    // be the union frame.
                    this.selector.anchor = new Point([
                        this.selector.selectionFrame.origin.x,
                        this.dataFrame.bottom,
                    ]);
                } else if (
                    colCorner.x < this.selector.selectionFrame.origin.x
                ) {
                    // The new column is to the left of the current selection.
                    // The anchor should be set to the bottom right
                    // of what will be the union frame.
                    this.selector.anchor = new Point([
                        this.selector.selectionFrame.corner.x,
                        this.dataFrame.bottom,
                    ]);
                }
            }
            this.selector.selectFromAnchorTo(colOrigin);
            this.selector.cursor = new Point([
                event.target.column,
                this.selector.cursor.y,
            ]);
            this.selector.triggerCallback();
        }
    }

    dispatchSelectionChanged() {
        let selectionEvent = new CustomEvent("selection-changed", {
            detail: {
                relativeCursor: this.selector.relativeCursor,
                cursor: new Point(
                    this.selector.cursor.x,
                    this.selector.cursor.y
                ),
                frame: this.selector.selectionFrame,
                data: this.selector.dataAtCursor,
            },
        });
        this.dispatchEvent(selectionEvent);
    }

    dispatchViewShifted() {
        let viewShiftEvent = new CustomEvent("sheet-view-shifted", {
            detail: {
                view: this.primaryFrame.viewFrame,
                lockedColumns: this.primaryFrame.lockedColumnsFrame,
                lockedRows: this.primaryFrame.lockedRowsFrame,
                relativeView: this.primaryFrame.relativeViewFrame,
                relativeLockedColumns:
                    this.primaryFrame.relativeLockedColumnsFrame,
                relativeLockedRows: this.primaryFrame.relativeLockedRowsFrame,
                cursor: new Point([
                    this.selector.cursor.x,
                    this.selector.cursor.y,
                ]),
                relativeCursor: this.selector.relativeCursor,
            },
        });
        this.dispatchEvent(viewShiftEvent);
    }

    handleViewShift(event) {
        // Update row tabs, if we are showing them
        if (this.showRowTabs) {
            Array.from(this.shadowRoot.querySelectorAll("row-tab")).forEach(
                (tabElement) => {
                    let isInLockedRow =
                        tabElement.getAttribute("locked") === "true";
                    if (!isInLockedRow) {
                        tabElement.setAttribute(
                            "data-relative-y",
                            this.primaryFrame.dataOffset.y + tabElement.row
                        );
                    }
                }
            );
        }

        // Update column tabs, if we are showing them
        if (this.showColumnTabs) {
            Array.from(this.shadowRoot.querySelectorAll("column-tab")).forEach(
                (colElement) => {
                    let inLockedColumn =
                        colElement.getAttribute("locked") === "true";
                    if (!inLockedColumn) {
                        colElement.setAttribute(
                            "data-relative-x",
                            this.primaryFrame.dataOffset.x + colElement.column
                        );
                    }
                }
            );
        }

        // Update the grid template
        this.renderGridTemplate();
    }

    handleSelectionChanged(event) {
        let infoArea = this.shadowRoot.getElementById("info-area");
        let editArea = this.shadowRoot.getElementById("edit-area");
        if (this.selector.selectionFrame.isEmpty) {
            // In this case, the cursor is the lone selection.
            // update the info area to demonstrate that.
            infoArea.querySelector("span:first-child").innerText = "Cursor";
            editArea.value = this.dataFrame.getAt(this.selector.relativeCursor);
        } else {
            // Otherwise, we have selected multiple cells.
            // Display information about the bounds of the
            // selection and how many cells it contains
            let from = `(${this.selector.selectionFrame.origin.x}, ${this.selector.selectionFrame.origin.y})`;
            let to = `(${this.selector.selectionFrame.corner.x}, ${this.selector.selectionFrame.corner.y})`;
            let text = `from: ${from} to: ${to} (${this.selector.selectionFrame.area} total cells)`;
            infoArea.querySelector("span:first-child").innerText = "Selection";
            editArea.value = text;
        }

        // Update cursor
        let cursorElement = this.shadowRoot.getElementById("cursor");
        cursorElement.setAttribute("x", this.selector.cursor.x);
        cursorElement.setAttribute("y", this.selector.cursor.y);
        cursorElement.setAttribute(
            "relative-x",
            this.selector.relativeCursor.x
        );
        cursorElement.setAttribute(
            "relative-y",
            this.selector.relativeCursor.y
        );

        // Update the selection view element
        let sel = this.shadowRoot.getElementById("main-selection");
        if (this.selector.selectionFrame.isEmpty) {
            sel.hide();
        } else {
            sel.show();
            sel.updateFromRelativeFrame(event.detail.frame);
            sel.updateFromViewFrame(this.selector.absoluteSelectionFrame);
        }

        // Set any row or column tabs to highlight whether they
        // correspond to the selection or the cursor's y or x
        // locations, respectively
        this.trackSelectionWithRowTabs();
        this.trackSelectionWithColumnTabs();
    }

    handleColumnAdjustment(event) {
        this.customColumns[event.target.column] = event.detail.newWidth;
        this.renderGridTemplate();
    }

    handleRowAdjustment(event) {
        this.customRows[event.target.row] = event.detail.newHeight;
        this.renderGridTemplate();
    }

    handleCellEdited(event) {
        this.dataFrame.putAt(
            event.detail.relativeCoordinate,
            event.detail.content
        );
        this.focus();
    }

    handleDataFrameResized(event) {
        const maxRows = this.dataFrame.corner.y;
        const maxCols = this.dataFrame.corner.x;
        if (this.numRows > maxRows) {
            this.setAttribute("rows", maxRows);
        }
        if (this.numCols > maxCols) {
            this.setAttribute("columns", maxCols);
        }
    }

    trackSelectionWithRowTabs() {
        Array.from(this.shadowRoot.querySelectorAll("row-tab")).forEach(
            (rowTabEl) => {
                let dataStart = this.selector.selectionFrame.origin.y;
                let dataEnd = this.selector.selectionFrame.corner.y;
                let inSelection =
                    dataStart <= rowTabEl.relativeRow &&
                    rowTabEl.relativeRow <= dataEnd;
                if (inSelection && !this.selector.selectionFrame.isEmpty) {
                    rowTabEl.setAttribute("highlighted", true);
                } else if (
                    this.selector.relativeCursor.y == rowTabEl.relativeRow
                ) {
                    rowTabEl.setAttribute("highlighted", true);
                } else {
                    rowTabEl.removeAttribute("highlighted");
                }
            }
        );
    }

    trackSelectionWithColumnTabs() {
        Array.from(this.shadowRoot.querySelectorAll("column-tab")).forEach(
            (colTabEl) => {
                let dataStart = this.selector.selectionFrame.origin.x;
                let dataEnd = this.selector.selectionFrame.corner.x;
                let inSelection =
                    dataStart <= colTabEl.relativeColumn &&
                    colTabEl.relativeColumn <= dataEnd;
                if (inSelection && !this.selector.selectionFrame.isEmpty) {
                    colTabEl.setAttribute("highlighted", true);
                } else if (
                    this.selector.relativeCursor.x == colTabEl.relativeColumn
                ) {
                    colTabEl.setAttribute("highlighted", true);
                } else {
                    colTabEl.removeAttribute("highlighted");
                }
            }
        );
    }

    static get observedAttributes() {
        return ["rows", "columns", "lockedrows", "lockedcolumns", "expands"];
    }
}

window.customElements.define("my-grid", GridSheet);
