class RowReference extends Object {
    constructor(index, sheet, label){
        this.index = index;
        this.sheet = sheet;
        this.label = label;
    }
};


const rowTabTemplateString = `
<style>
    :host {
        border: 1px solid rgba(150, 150, 150, 0.4);
        border-bottom: none;
        box-sizing: border-box;
        border-top-left-radius: 5px;
        border-bottom-left-radius: 5px;
    }
</style>
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
    }
};

class ColumnTab extends HTMLElement {
    constructor(){
        super();
    }
};

export {
    RowTab,
    ColumnTab
};
