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
    }
    :host(:focus),
    input:focus {
        outline: none;
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
        input.removeEventListener('blur', this.handleInputBlur);
        input.blur();
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
            let input = this.shadowRoot.querySelector('input');
            this.textContent = input.value;
            let newEvent = new CustomEvent('cell-edited', {
                detail: {
                    element: this,
                    content: this.textContent
                },
                bubbles: true
            });
            this.dispatchEvent(newEvent);
        } else if(event.key.startsWith("Arrow")){
            event.stopPropagation();
        }
    }

    handleDoubleClick(event){
        if(!this.isEditing){
            this.setAttribute('editing', true);
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

