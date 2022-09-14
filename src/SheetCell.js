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
        position: relative;
        --col-start-name: cell-col-start;
        --row-start-name: cell-row-start;
        white-space: nowrap;
        overflow: pre;
        pointer-event: initial;
    }
    :host(:focus),
    input:focus {
        outline: none;
    }

    span {
        text-align: center;
        width: 100%;
        pointer-events: none;
    }

    input {
        display: none;
        box-sizing: border-box;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border: inherit;
        font-family: inherit;
        font-size: inherit;
        text-align: inherit;
        background-color: white;
        color: inherit;
        padding: inherit;
        margin: inherit;
    }
    input.show {
        display: inline-flex;
        align-items: center;
    }
</style>
<input type="text"/>
<span>
    <slot></slot>
</span>
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
        this.focusParentSheet = this.focusParentSheet.bind(this);
        this.triggerCellEdited = this.triggerCellEdited.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleDoubleClick = this.handleDoubleClick.bind(this);
        this.handleInputBlur = this.handleInputBlur.bind(this);
    }

    connectedCallback(){
        if(this.isConnected){

            // Event listeners
            this.addEventListener('dblclick', this.handleDoubleClick);
        }
    }

    disconnectedCallback(){
        this.removeEventListener('dblclick', this.handleDoubleClick);
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
        let input = this.shadowRoot.querySelector('input');
        input.classList.add('show');
        input.value = this.textContent;
        input.addEventListener('keydown', this.handleKeyDown);
        input.addEventListener('blur', this.handleInputBlur);
        input.focus();
    }

    stopEditing(){
        this.isEditing = false;
        let input = this.shadowRoot.querySelector('input');
        input.removeEventListener('keydown', this.handleKeyDown);
        input.classList.remove('show');
        this.triggerCellEdited();
        input.removeEventListener('blur', this.handleInputBlur);
        input.blur();
        this.focusParentSheet();
    }

    triggerCellEdited(){
        let input = this.shadowRoot.querySelector('input');
        if(this.textContent === input.value){
            return;
        }
        this.textContent = input.value;
        let newEvent = new CustomEvent('cell-edited', {
            detail: {
                relativeCoordinate: [
                    parseInt(this.dataset.relativeX),
                    parseInt(this.dataset.relativeY)
                ],
                element: this,
                content: this.textContent
            },
            bubbles: true
        });
        this.dispatchEvent(newEvent);
    }

    handleInputBlur(event){
        if(this.isEditing){
            this.removeAttribute('editing');
        }
    }

    handleKeyDown(event){
        if(event.key == 'Enter' && !event.shiftKey){
            event.preventDefault();
            event.stopPropagation();
            this.removeAttribute('editing');
        } else if(event.key == "Escape"){
            let cachedContent = this.textContent;
            this.removeAttribute('editing');
            this.textContent = cachedContent;
        } else if(event.key.startsWith("Arrow")){
            event.stopPropagation();
        }
    }

    handleDoubleClick(event){
        if(!this.isEditing){
            this.setAttribute('editing', true);
        }
    }

    focusParentSheet(){
        // Attempt to find an ancestor that
        // is a sheet element. Focus it if found.
        if(this.parentElement && this.parentElement.isSheet){
            this.parentElement.focus();
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

