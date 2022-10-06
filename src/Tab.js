class RowReference extends Object {
    constructor(index, sheet, label) {
        this.index = index;
        this.sheet = sheet;
        this.label = label;
    }
}

const letters = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
];

const rowTabTemplateString = `
<style>
    :host {
        position: relative;
        border: 1px solid rgba(150, 150, 150, 0.4);
        border-bottom: none;
        box-sizing: border-box;
        border-top-left-radius: 5px;
        border-bottom-left-radius: 5px;
        display: flex;
        align-items: center;
        justify-content: center;
        --tracking-highlight-color: rgba(240, 240, 240, 0.8);
    }
    :host(:last-child){
        border-bottom: 1px solid rgba(150, 150, 150, 0.4);
    }
    :host([highlighted]){
        background-color: var(--tracking-highlight-color);
    }
    :host(:hover){
        cursor: pointer;
    }

    host * {
        pointer-events: none;

    }
    .adjuster {
        display: block;
        position: absolute;
        width: 100%;
        height: 8px;
        left: 0;
    }
    .adjuster:hover {
        cursor: row-resize;
        background-color: rgba(100, 100, 100, 0.5);
    }
    #bottom-adjuster {
        bottom: -4px;
    }
   
</style>
<span id="label">
</span>
<div id="bottom-adjuster" class="adjuster"></div>
`;

class RowTab extends HTMLElement {
    constructor() {
        super();
        this.template = document.createElement("template");
        this.template.innerHTML = rowTabTemplateString;
        this.attachShadow({ mode: "open" });
        this.shadowRoot.append(this.template.content.cloneNode(true));

        this.row = 0;
        this.relativeRow = 0;

        this.isRowTab = true;

        // a Cached version of the measurment
        this._cachedHeight = null;
        this._cachedMouseY = 0;

        // Bind instance methods
        this.setLabel = this.setLabel.bind(this);
        this.onAdjusterMouseDown = this.onAdjusterMouseDown.bind(this);
        this.onAdjusterMouseUp = this.onAdjusterMouseUp.bind(this);
        this.onAdjusterMouseMove = this.onAdjusterMouseMove.bind(this);
        this.onAdjusterClick = this.onAdjusterClick.bind(this);
    }

    connectedCallback() {
        if (this.isConnected) {
            // Event listeners
            let adjuster = this.shadowRoot.querySelector(".adjuster");
            adjuster.addEventListener("mousedown", this.onAdjusterMouseDown);
        }
    }

    disconnectedCallback() {
        let adjuster = this.shadowRoot.querySelector(".adjuster");
        adjuster.removeEventListener("mousedown", this.onAdjusterMouseDown);
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (name == "data-y") {
            this.row = parseInt(newVal);
        } else if (name == "data-relative-y") {
            this.relativeRow = parseInt(newVal);
            this.setLabel(this.relativeRow);
        }
    }

    onAdjusterMouseDown(event) {
        document.addEventListener("mousemove", this.onAdjusterMouseMove);
        document.addEventListener("mouseup", this.onAdjusterMouseUp);
        this.addEventListener("click", this.onAdjusterClick);
        // Get the initial measurment for the width of the column
        this._cachedHeight = this.getBoundingClientRect().height;
        this._cachedMouseY = event.clientY;
    }

    onAdjusterMouseUp(event) {
        document.removeEventListener("mousemove", this.onAdjusterMouseMove);
        document.removeEventListener("mouseup", this.onAdjusterMouseUp);
        event.stopPropagation();
    }

    onAdjusterMouseMove(event) {
        let diff = event.clientY - this._cachedMouseY;
        let newEvent = new CustomEvent("row-adjustment", {
            detail: {
                newHeight: this._cachedHeight + diff,
            },
        });
        this.dispatchEvent(newEvent);
    }

    onAdjusterClick(event) {
        event.stopPropagation();
        this.removeEventListener("click", this.onAdjusterClick);
    }

    setLabel(num) {
        this.shadowRoot.getElementById("label").innerText = (
            num + 1
        ).toString();
    }

    static get observedAttributes() {
        return ["data-y", "data-relative-y", "highlighted"];
    }
}

const columnTabTemplateString = `
<style>
    :host {
        position: relative;
        border: 1px solid rgba(150, 150, 150, 0.4);
        border-bottom: none;
        box-sizing: border-box;
        border-top-left-radius: 5px;
        border-bottom-left-radius: 5px;
        display: flex;
        align-items: center;
        justify-content: center;
        --tracking-highlight-color: rgba(240, 240, 240, 0.8);
    }
    :host([highlighted]){
        background-color: var(--tracking-highlight-color);
    }
    :host(:hover){
        cursor: pointer;
    }

    .adjuster {
        display: block;
        position: absolute;
        width: 30px;
        height: 100%;
        top: 0;
    }
    .adjuster:hover {
        cursor: col-resize;
        background-color: rgba(100, 100, 100, 0.5);
    }
    #right-adjuster {
        right: -15px;
    }
    
</style>
<span id="label"></span>
<div id="right-adjuster" class="adjuster"></div>
`;
class ColumnTab extends HTMLElement {
    constructor() {
        super();
        this.template = document.createElement("template");
        this.template.innerHTML = columnTabTemplateString;
        this.attachShadow({ mode: "open" });
        this.shadowRoot.append(this.template.content.cloneNode(true));

        this.column = 0;
        this.relativeColumn = 0;

        this.isColumnTab = true;

        // a Cached version of the measurment
        this._cachedWidth = null;
        this._cachedMouseX = 0;

        // Bind instance methods
        this.setLabel = this.setLabel.bind(this);
        this.onAdjusterMouseDown = this.onAdjusterMouseDown.bind(this);
        this.onAdjusterMouseUp = this.onAdjusterMouseUp.bind(this);
        this.onAdjusterMouseMove = this.onAdjusterMouseMove.bind(this);
        this.onAdjusterClick = this.onAdjusterClick.bind(this);
    }

    connectedCallback() {
        if (this.isConnected) {
            // Event listeners
            let rightAdjuster =
                this.shadowRoot.getElementById("right-adjuster");
            rightAdjuster.addEventListener(
                "mousedown",
                this.onAdjusterMouseDown
            );
        }
    }

    disconnectedCallback() {
        let rightAdjuster = this.shadowRoot.getElementById("right-adjuster");
        rightAdjuster.removeEventListener(
            "mousedown",
            this.onAdjusterMouseDown
        );
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (name == "data-x") {
            this.column = parseInt(newVal);
        } else if (name == "data-relative-x") {
            this.relativeColumn = parseInt(newVal);
            this.setLabel(this.relativeColumn + 1);
        }
    }

    setLabel(num) {
        let index = num - 1;
        let remainder, diviz;
        let label = "";
        if (index < letters.length) {
            label = letters[index];
        } else {
            diviz = Math.floor(index / letters.length);
            remainder = index % letters.length;
            let letter = letters[remainder];
            let times = diviz + 1;
            for (let i = 0; i < times; i++) {
                label += letter;
            }
        }
        this.setAttribute("data-label", label);
        this.shadowRoot.getElementById("label").innerText = label;
    }

    onAdjusterMouseDown(event) {
        document.addEventListener("mousemove", this.onAdjusterMouseMove);
        document.addEventListener("mouseup", this.onAdjusterMouseUp);
        this.addEventListener("click", this.onAdjusterClick);
        // Get the initial measurment for the width of the column
        this._cachedWidth = this.getBoundingClientRect().width;
        this._cachedMouseX = event.clientX;
    }

    onAdjusterMouseMove(event) {
        let diff = event.clientX - this._cachedMouseX;
        let newEvent = new CustomEvent("column-adjustment", {
            detail: {
                newWidth: this._cachedWidth + diff,
            },
        });
        this.dispatchEvent(newEvent);
    }

    onAdjusterMouseUp(event) {
        document.removeEventListener("mousemove", this.onAdjusterMouseMove);
        document.removeEventListener("mouseup", this.onAdjusterMouseUp);
        event.stopPropagation();
    }

    onAdjusterClick(event) {
        event.stopPropagation();
        this.removeEventListener("click", this.onAdjusterClick);
    }

    static get observedAttributes() {
        return ["data-x", "data-relative-x"];
    }
}

export { RowTab, ColumnTab };
