import {DataFrame} from "./DataFrame.js";
import {Selector} from "./Selector.js";
import PrimaryFrame from "./PrimaryGridFrame.js";
import {Point} from "./Point.js";

// Simple grid-based sheet component
const templateString = `
<style>
:host {
   display: grid;
   border: 1px red;
   align-items: center;
   justify-content: center;
}

::slotted(*){
    color: green;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    text-overflow: ellipses;
}
</style>
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
        this.render = this.render.bind(this);
        this.dispatchSelectionChanged = this.dispatchSelectionChanged.bind(this);

        // Bind event handlers
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    connectedCallback(){
        if(this.isConnected){
            // Stuff up here
            this.setAttribute('tabindex', '-1');

            // Set up the resizing observer
            this.observer = new ResizeObserver(this.onObservedResize);
            this.observer.observe(this.parentElement);
        }

        this.addEventListener('keydown', this.handleKeyDown);
    }

    disconnectedCallback(){
        this.observer.disconnect();
        this.removeEventListener('keydown', this.handleKeyDown);
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
        console.log('resize');
        let rect = this.getBoundingClientRect();
        let currentCellWidth = this.cellWidth;
        let newColumns = Math.floor(rect.width / currentCellWidth);
        this.setAttribute('columns', newColumns);
        this.render();
    }

    updateNumRows(){
        console.log(`Set to ${this.numRows} rows!`);
        this.render();
    }

    updateNumColumns(){
        console.log(`Set to ${this.numColumns} columns!`);
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
        console.log(event);
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
    }

    static get observedAttributes(){
        return [
            "rows",
            "columns"
        ];
    }
}

window.customElements.define("my-grid", GridSheet);
