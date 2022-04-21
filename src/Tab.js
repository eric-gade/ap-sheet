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
        border: 1px solid green;
        background-color: blue;
    }
</style>
`;

class RowTab extends HTMLElement {
    constructor(){
        super();
    }
};

export {
    RowTab
};
