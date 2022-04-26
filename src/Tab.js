class RowReference extends Object {
    constructor(index, sheet, label){
        this.index = index;
        this.sheet = sheet;
        this.label = label;
    }
};

const letters = [
    "A","B","C","D","E","F","G","H",
    "I","J","K","L","M","N","O","P",
    "Q","R","S","T","U","V","W","X",
    "Y","Z"
];


const rowTabTemplateString = `
<style>
    :host {
        border: 1px solid rgba(150, 150, 150, 0.4);
        border-bottom: none;
        box-sizing: border-box;
        border-top-left-radius: 5px;
        border-bottom-left-radius: 5px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    :host(:last-child){
        border-bottom: 1px solid rgba(150, 150, 150, 0.4);
    }
</style>
<span id="label">
</span>
`;

class RowTab extends HTMLElement {
    constructor(){
        super();
        this.template = document.createElement('template');
        this.template.innerHTML = rowTabTemplateString;
        this.attachShadow({mode: 'open'});
        this.shadowRoot.append(
            this.template.content.cloneNode(true)
        );

        this.row = 0;
        this.relativeRow = 0;

        // Bind instance methods
        this.setLabel = this.setLabel.bind(this);
    }

    attributeChangedCallback(name, oldVal, newVal){
        if(name == 'data-y'){
            this.row = parseInt(newVal);
        } else if(name == 'data-relative-y'){
            this.relativeRow = parseInt(newVal);
            this.setLabel(this.relativeRow);
        }
    }

    setLabel(num){
        this.shadowRoot.getElementById('label').innerText = num.toString();
    }

    static get observedAttributes(){
        return [
            'data-y',
            'data-relative-y',
            'highlighted'
        ];
    }
};


const columnTabTemplateString = `
<style>
    :host {
        border: 1px solid rgba(150, 150, 150, 0.4);
        border-bottom: none;
        box-sizing: border-box;
        border-top-left-radius: 5px;
        border-bottom-left-radius: 5px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
</style>
<span id="label"></span>
`;
class ColumnTab extends HTMLElement {
    constructor(){
        super();
        this.template = document.createElement('template');
        this.template.innerHTML = columnTabTemplateString;
        this.attachShadow({mode: 'open'});
        this.shadowRoot.append(
            this.template.content.cloneNode(true)
        );

        this.column = 0;
        this.relativeColumn = 0;

        // Bind instance methods
        this.setLabel = this.setLabel.bind(this);
    }

    attributeChangedCallback(name, oldVal, newVal){
        if(name == 'data-x'){
            this.column = parseInt(newVal);
        } else if(name == 'data-relative-x'){
            this.relativeColumn = parseInt(newVal);
            this.setLabel(this.relativeColumn);
        }
    }

    setLabel(num){
        let index = num - 1;
        let remainder, diviz;
        let label = "";
        if(index < letters.length){
            label = letters[index];
        } else {
            diviz = Math.floor(index / letters.length);
            remainder = index % letters.length;
            let letter = letters[remainder];
            let times = diviz + 1;
            for(let i = 0; i < times; i++){
                label += letter;
            }
        }
        this.shadowRoot.getElementById('label').innerText = label;
    }

    static get observedAttributes(){
        return [
            'data-x',
            'data-relative-x'
        ];
    }
};

export {
    RowTab,
    ColumnTab
};
