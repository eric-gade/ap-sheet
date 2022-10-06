/**
 * MouseHandler class
 * ------------------
 * I am a controller object that gets
 * attached to and initialized on a custom
 * element that is serving as a sheet instance.
 * My purpose is to confgure and handle all mouse
 * and pointer events on the sheet, including
 * pointer-based selection.
 */

class MouseHandler extends Object {
    constructor(sheet) {
        super();
        if (!sheet) {
            throw new Error(
                "You must initialize a MouseHandler with a spreadsheet component instance"
            );
        }
        this.sheet = sheet;
        this.isSelecting = false;

        // Bind handlers and component methods
        this.addAllListeners = this.addAllListeners.bind(this);
        this.removeAllListeners = this.removeAllListeners.bind(this);
        this.onCellEnter = this.onCellEnter.bind(this);
        this.onCellLeave = this.onCellLeave.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        // this.onClick = this.onClick.bind(this);
        this.onDoubleClick = this.onDoubleClick.bind(this);
        this.connect = this.connect.bind(this);
        this.disconnect = this.disconnect.bind(this);
    }

    addAllListeners() {
        this.sheet.addEventListener("mouseover", this.onCellEnter);
        this.sheet.addEventListener("mousedown", this.onMouseDown);
        this.sheet.addEventListener("mouseup", this.onMouseUp);
        this.sheet.addEventListener("dblclick", this.onDoubleClick);
    }

    removeAllListeners() {
        this.sheet.removeEventListener("mouseover", this.onCellEnter);
        this.sheet.removeEventListener("mousedown", this.onMouseDown);
        this.sheet.removeEventListener("mouseup", this.onMouseUp);
        this.sheet.removeEventListener("dblclick", this.onDoubleClick);
    }

    onMouseDown(event) {
        if (event.target.isCell) {
            this.isSelecting = true;
            this.sheet.selector.setCursorToElement(event.target);
            this.sheet.selector.setAnchorToElement(event.target);
            this.sheet.dispatchSelectionChanged();
        }
    }

    onMouseUp(event) {
        this.isSelecting = false;
    }

    onCellEnter(event) {
        if (event.target.isCell && this.isSelecting) {
            this.sheet.selector.setCursorToElement(event.target);
            this.sheet.selector.selectFromAnchorTo(
                this.sheet.selector.relativeCursor
            );
            this.sheet.dispatchSelectionChanged();
        }
    }

    onCellLeave(event) {
        if (event.target.isCell && this.isSelecting) {
            console.log("leaving");
        }
    }

    onDoubleClick(event) {
        if (event.target.isCell) {
            this.sheet.selector.setCursorToElement(event.target);
            this.sheet.selector.setAnchorToElement(event.target);
            this.sheet.dispatchSelectionChanged();
        }
    }

    disconnect() {
        this.sheet.mouseHandler = undefined;
        this.removeAllListeners();
    }

    connect() {
        this.addAllListeners();
    }
}

export { MouseHandler, MouseHandler as default };
