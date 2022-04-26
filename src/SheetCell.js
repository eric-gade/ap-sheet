/**
 * SheetCell Web Component
 * -----------------------
 * This class repesents individual cell
 * elements of a sheet. Designed to be used
 * in TableElementFrame and GridElementFrame
 */
const templateString = `
<style>
    :host {
        --col-start-name: cell-col-start;
        --row-start-name: cell-row-start;
    }
</style>
<slot></slot>
`;

class SheetCell extends HTMLElement {
    constructor(){
        super();
        this.template = document.createElement('template');
        this.template.innerHTML = templateString;
        this.attachShadow({mode: 'open'});
        this.shadowRoot.append(
            this.template.content.cloneNode(true)
        );

        this.isCell = true;
        this.row = 0;
        this.column = 0;
        this.relativeRow = 0;
        this.relativeColumn = 0;

        // Bind methods
        this.updateRow = this.updateRow.bind(this);
        this.updateColumn = this.updateColumn.bind(this);
    }

    connectedCallback(){
        if(this.isConnected){

            // Event listeners

            
        }
    }

    disconnectedCallback(){
     
    }

    attributeChangedCallback(name, oldVal, newVal){
        if(name == 'data-x'){
            this.updateColumn(newVal);
        } else if(name == 'data-relative-x'){
            this.updateColumn(newVal, true);
        } else if(name == 'data-y'){
            this.updateRow(newVal);
        } else if(name == 'data-relative-y'){
            this.updateRow(newVal, true);
        }
    }

    updateRow(strVal, isRelative=false){
        let num = parseInt(strVal);
        if(num < 0){
            return;
        }
        if (isRelative) {
            this.relativeRow = num;
        } else {
            this.row = num;
            let suffix = num == 0 ? `` : ` ${num + 1}`;
            this.style.setProperty("--row-start", `var(--row-start-name)${suffix}`);
        }
    }

    updateColumn(strVal, isRelative=false){
        let num = parseInt(strVal);
        if(num < 0){
            return;
        }
        if(isRelative){
            this.relativeColumn = num;
        } else {
            this.column = num;
            let suffix = num == 0 ? `` : ` ${num + 1}`;
            
            this.style.setProperty("--col-start", `var(--col-start-name)${suffix}`);
        }
    }

    static get observedAttributes(){
        return [
            'data-x',
            'data-y',
            'data-relative-x',
            'data-relative-y'
        ];
    }
};

window.customElements.define('sheet-cell', SheetCell);

