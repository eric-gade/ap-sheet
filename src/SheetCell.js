/**
 * SheetCell Web Component
 * -----------------------
 * This class repesents individual cell
 * elements of a sheet. Designed to be used
 * in TableElementFrame and GridElementFrame
 */
const templateString = `
<style>

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

    }

    connectedCallback(){
        if(this.isConnected){

            // Event listeners
     
        }
    }

    disconnectedCallback(){
     
    }
};

window.customElements.define('sheet-cell', SheetCell);

