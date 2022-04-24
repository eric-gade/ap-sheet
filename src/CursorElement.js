const templateString = `
<style>
    :host {
        box-sizing: border-box;
        --col-start-name: cell-col-start;
        --row-start-name: cell-row-start;
        --col-start: 1;
        --row-start: 1;
        grid-column: var(--col-start-name) var(--col-start) / span 1;
        grid-row: var(--row-start-name) var(--row-start) / span 1;
        border: 3px solid black;
    }
</style>
`;

class CursorElement extends HTMLElement {
    constructor(){
        super();
        this.template = document.createElement('template');
        this.template.innerHTML = templateString;
        this.attachShadow({mode: 'open'});
        this.shadowRoot.append(
            this.template.content.cloneNode(true)
        );

        this.x = 0;
        this.y = 0;
        this.relativeX = 0;
        this.relativeY = 0;

        // Bind instance methods
        this.updatePosition = this.updatePosition.bind(this);
    }

    attributeChangedCallback(name, oldVal, newVal){
        if(name == 'x'){
            this.x = parseInt(newVal);
            this.updatePosition();
        } else if(name === 'y'){
            this.y= parseInt(newVal);
            this.updatePosition();
        } else if(name === 'relative-x'){
            this.relativeX = parseInt(newVal);
            this.updatePosition();
        } else if(this.name === 'relative-y'){
            this.relativeY = parseInt(newVal);
            this.updatePosition();
        }
    }

    updatePosition(){
        this.style.setProperty('--col-start', this.x + 1);
        this.style.setProperty('--row-start', this.y + 1);
    }
    
    static get observedAttributes(){
        return [
            'x',
            'y',
            'relative-x',
            'relative-y'
        ];
    }
};

export {
    CursorElement,
    CursorElement as default
};
