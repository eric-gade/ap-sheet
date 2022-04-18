// Test grid webcomponent
const templateString = `
<style>
:host {
    display: grid;
    grid-template-columns: repeat(3, 150px);
}

::slotted(*) {
    background-color: green;
    border: 1px solid brown;
    width: 150px;
    height: 50px;
}
</style>
<slot></slot>
`;

class Grid extends HTMLElement {
    constructor(){
        super();
        this.template = document.createElement('template');
        this.template.innerHTML = templateString;
        this.attachShadow({mode: 'open'});
        this.shadowRoot.appendChild(
            this.template.content.cloneNode(true)
        );

        // Set up the mutation observer
        this.observer = new ResizeObserver(this.mutationCallback);

        // Bind methods to context
        this.mutationCallback = this.mutationCallback.bind(this);
    }

    mutationCallback(mutationList, observer){
        console.log(mutationList);
    }

    connectedCallback(){
        if(this.isConnected){
            this.observer.observe(this.parentElement);
        }
    }

    disconnectedCallback(){
        this.observer.disconnect();
    }
    
}

window.customElements.define('my-grid', Grid);
