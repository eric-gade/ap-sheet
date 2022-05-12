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
        this.isEditing = false;
        this.row = 0;
        this.column = 0;
        this.relativeRow = 0;
        this.relativeColumn = 0;

        // Bind methods
        this.updateRow = this.updateRow.bind(this);
        this.updateColumn = this.updateColumn.bind(this);
        this.startEditing = this.startEditing.bind(this);
        this.stopEditing = this.stopEditing.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    connectedCallback(){
        if(this.isConnected){

            // Event listeners
            this.addEventListener('cell-edited', this.onCellEdited);
            
        }
    }

    disconnectedCallback(){
        this.removeEventListener('cell-edited', this.onCellEdited);
    }

    onCellEdited(event){
        console.log(event.bubbles);
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
        } else if(name == 'editing'){
            if(newVal === "true"){
                this.startEditing();
            } else {
                this.stopEditing();
            }
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

    startEditing(){
        this.isEditing = true;
        this.setAttribute('contenteditable', true);
        this.focus();
        let sel = document.getSelection();
        sel.removeAllRanges();
        let range = document.createRange();
        range.selectNodeContents(this);
        sel.addRange(range);
        sel.collapseToEnd();
        this.addEventListener('keydown', this.handleKeyDown);
    }

    stopEditing(){
        this.isEditing = false;
        this.removeAttribute('contenteditable');
        this.blur();
        this.removeEventListener('keydown', this.handleKeyDown);
    }

    handleKeyDown(event){
        event.stopPropagation();
        console.log(event);
        if(event.key == 'Enter' && !event.shiftKey){
            event.preventDefault();
            this.removeAttribute('editing');
            let newEvent = new CustomEvent('cell-edited', {
                detail: {
                    element: this,
                    content: this.textContent
                },
                bubbles: true
            });
            this.dispatchEvent(newEvent);
        }
    }

    static get observedAttributes(){
        return [
            'data-x',
            'data-y',
            'data-relative-x',
            'data-relative-y',
            'editing'
        ];
    }
};

window.customElements.define('sheet-cell', SheetCell);

