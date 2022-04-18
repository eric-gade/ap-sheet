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

        // Set up the resizing observer
        this.observer = new ResizeObserver(this.onObservedResize);

        // Bind instace methods
        this.onObservedResize = this.onObservedResize.bind(this);
        this.render = this.render.bind(this);
    }

    connectedCallback(){
        if(this.isConnected){
            // Stuff up here

            // init observer
            this.observer.observe(this.parentElement);
        }
    }

    disconnectedCallback(){
        this.observer.disconnect();
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
        console.log(info);
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

    static get observedAttributes(){
        return [
            "rows",
            "columns"
        ];
    }
}

window.customElements.define("my-grid", GridSheet);
