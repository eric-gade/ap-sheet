import {DataFrame} from "./DataFrame.js";
import {Selector} from "./Selector.js";
import PrimaryFrame from "./PrimaryGridFrame.js";
import {Point} from "./Point.js";

// Simple grid-based sheet component
const templateString = `
<style>
:host {
   display: grid;
}

:host(:focus){
    outline: none;
}

::slotted(*){
    color: green;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    text-overflow: ellipses;
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
</style>
<div id="edit-bar">
    <div id="info-area"><span>Cursor</span><span>&rarr;</span></div>
    <input id="edit-area" type="text" disabled="true"/>
</div>
<slot></slot>
`;

class GridSheet extends HTMLElement {
    constructor(){
        super();
        this.template = document.createElement('template');
        this.template.innerHTML = templateString;
        this.attachShadow({mode: 'open'});
        this.shadowRoot.appendChild(
            this.template.content.cloneNode(true)
        );

        // Default cell dimensions
        this.cellWidth = 150;
        this.cellHeight = 36;
        this.numRows = 1;
        this.numColumns = 1;

        // Set up the internal frames
        this.dataFrame = new DataFrame([0,0], [1000,1000]); // Default empty
        this.dataFrame.forEachPoint(point => {
            this.dataFrame.putAt(point, `${point.x}, ${point.y}`);
        });
        this.primaryFrame = new PrimaryFrame(this.dataFrame, [0,0]);
        this.selector = new Selector(this.primaryFrame);

        // Bind instace methods
        this.onObservedResize = this.onObservedResize.bind(this);
        this.onCellEdit = this.onCellEdit.bind(this);
        this.render = this.render.bind(this);
        this.dispatchSelectionChanged = this.dispatchSelectionChanged.bind(this);

        // Bind event handlers
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleSelectionChanged = this.handleSelectionChanged.bind(this);
        this.afterEditChange = this.afterEditChange.bind(this);
    }

    connectedCallback(){
        if(this.isConnected){
            // Stuff up here
            this.setAttribute('tabindex', '-1');

            // Set up the resizing observer
            this.observer = new ResizeObserver(this.onObservedResize);
            this.observer.observe(this.parentElement);
        }

        // Event listeners
        this.addEventListener('keydown', this.handleKeyDown);
        this.addEventListener('selection-changed', this.handleSelectionChanged);
    }

    disconnectedCallback(){
        this.observer.disconnect();
        this.removeEventListener('keydown', this.handleKeyDown);
        this.removeEventListener('selection-changed', this.handleSelectionChanged);
    }

    attributeChangedCallback(name, oldVal, newVal){
        if(name == "rows"){
            this.numRows = parseInt(newVal);
            this.updateNumRows();
        } else if(name == "columns"){
            this.numColumns = parseInt(newVal);
            this.updateNumColumns();
        }
    }

    onObservedResize(info){
        // Attempt to re-set the number of columns and rows
        // based upon the available free space in the element.
        // Note that for now, we only attempt this on the
        // horizontal (column) axis
        let rect = this.getBoundingClientRect();
        let currentCellWidth = this.cellWidth;
        let newColumns = Math.floor(rect.width / currentCellWidth);
        this.setAttribute('columns', newColumns);
        this.render();
    }

    onCellEdit(){
        let editArea = this.shadowRoot.getElementById('edit-area');
        let isDisabled = editArea.hasAttribute('disabled');
        if(isDisabled){
            // Highlight the cell that is being edited.
            let cell = this.primaryFrame.elementAt(this.selector.cursor);
            this.classList.add('editing-cell');
            cell.classList.add('editing');
            
            // Prep the editor input for editing
            // and focus on it automatically
            editArea.removeAttribute("disabled");
            editArea.select();
            editArea.focus();
            editArea.addEventListener('change', this.afterEditChange);
        }
        
    }

    afterEditChange(event){
        event.currentTarget.removeEventListener('change', this.afterEditChange);
        event.currentTarget.setAttribute('disabled', 'true');
        this.focus();

        // Remove styling from the cell that
        // was being edited
        let cell = this.primaryFrame.elementAt(this.selector.cursor);
        this.classList.remove('editing-cell');
        cell.classList.remove('editing');

        // Update the DataFrame and redraw view frame
        this.dataFrame.putAt(this.selector.relativeCursor, event.currentTarget.value);
        this.primaryFrame.updateViewElements();
    }

    updateNumRows(){
        this.render();
    }

    updateNumColumns(){
        this.render();
    }

    render(){
        this.innerHTML = "";
        this.style.gridTemplateColumns = `repeat(${this.numColumns}, ${this.cellWidth}px)`;
        let newCorner = new Point([this.numColumns-1, this.numRows-1]);
        this.primaryFrame = new PrimaryFrame(this.dataFrame, newCorner);
        this.primaryFrame.initialBuild();
        this.primaryFrame.labelElements();
        this.append(...this.primaryFrame.elements);
        this.primaryFrame.updateCellContents();
        this.selector.primaryFrame = this.primaryFrame;
        this.selector.drawCursor();
        this.selector.updateElements();
    }

    dispatchSelectionChanged(){
        let selectionEvent = new CustomEvent('selection-changed', {
            detail: {
                relativeCursor: this.selector.relativeCursor,
                cursor: new Point(this.selector.cursor.x, this.selector.cursor.y),
                frame: this.selector.selectionFrame,
                data: this.selector.dataAtCursor
            }
        });
        this.dispatchEvent(selectionEvent);
    }

    // Event Handling
    // Event Handling
    handleKeyDown(event){
        let isSelecting = event.shiftKey;

        // Arrow Key to the Right
        if(event.key == 'ArrowRight'){
            if(event.ctrlKey){
                this.selector.moveToRightEnd(isSelecting);
            } else {
                this.selector.moveRightBy(
                    1,
                    isSelecting
                );
            }
            event.preventDefault();
            event.stopPropagation();
            this.dispatchSelectionChanged();
        }

        // Arrow key to the left
        if(event.key == 'ArrowLeft'){
            if(event.ctrlKey){
                this.selector.moveToLeftEnd(isSelecting);
            } else {
                this.selector.moveLeftBy(
                    1,
                    isSelecting
                );
            }
            event.preventDefault();
            event.stopPropagation();
            this.dispatchSelectionChanged();
        }

        // Arrow key downward
        if(event.key == 'ArrowDown'){
            if(event.ctrlKey){
                this.selector.moveToBottomEnd(isSelecting);
            } else {
                this.selector.moveDownBy(
                    1,
                    isSelecting
                );
            }
            event.preventDefault();
            event.stopPropagation();
            this.dispatchSelectionChanged();
        }

        // Arrow key up
        if(event.key == 'ArrowUp'){
            if(event.ctrlKey){
                this.selector.moveToTopEnd(isSelecting);
            } else {
                this.selector.moveUpBy(
                    1,
                    isSelecting
                );
            }
            event.preventDefault();
            event.stopPropagation();
            this.dispatchSelectionChanged();
        }

        // Page up
        if(event.key == 'PageUp'){
            if(event.altKey){
                this.selector.pageLeft(isSelecting);
            } else {
                this.selector.pageUp(isSelecting);
            }
            event.preventDefault();
            event.stopPropagation();
            this.dispatchSelectionChanged();
        }

        // Page down
        if(event.key == 'PageDown'){
            if(event.altKey){
                this.selector.pageRight(isSelecting);
            } else {
                this.selector.pageDown(isSelecting);
            }
            event.preventDefault();
            event.stopPropagation();
            this.dispatchSelectionChanged();
        }

        // Enter key (for editing cell)
        if(event.key == "Enter" && this.selector.selectionFrame.isEmpty){
            this.onCellEdit();
        }
    }

    handleSelectionChanged(event){
        let infoArea = this.shadowRoot.getElementById('info-area');
        let editArea = this.shadowRoot.getElementById('edit-area');
        if(this.selector.selectionFrame.isEmpty){
            // In this case, the cursor is the lone selection.
            // update the info area to demonstrate that.
            infoArea.querySelector('span:first-child').innerText = "Cursor";
            editArea.value = this.dataFrame.getAt(this.selector.relativeCursor);
        } else {
            // Otherwise, we have selected multiple cells.
            // Display information about the bounds of the
            // selection and how many cells it contains
            let from = `(${this.selector.selectionFrame.origin.x}, ${this.selector.selectionFrame.origin.y})`;
            let to = `(${this.selector.selectionFrame.corner.x}, ${this.selector.selectionFrame.corner.y})`;
            let text = `from: ${from} to: ${to} (${this.selector.selectionFrame.area} total cells)`;
            infoArea.querySelector('span:first-child').innerText = "Selection";
            editArea.value = text;
        }
    }

    static get observedAttributes(){
        return [
            "rows",
            "columns"
        ];
    }
}

window.customElements.define("my-grid", GridSheet);
