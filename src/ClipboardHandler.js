class ClipboardHandler extends Object {
    constructor(sheet){
        super();
        if(!sheet){
            throw new Error('You must initialize a ClipboardHandler with a valid sheet instance!');
        }
        this.sheet = sheet;

        // Bind component methods
        this.connect = this.connect.bind(this);
        this.disconnect = this.disconnect.bind(this);
        this.onCopy = this.onCopy.bind(this);
        this.onPaste = this.onPaste.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
    }

    connect(){
        this.sheet.addEventListener('copy', this.onCopy);
        this.sheet.addEventListener('paste', this.onPaste);
        this.sheet.addEventListener('keydown', this.onKeyDown);
    }

    disconnect(){
        this.sheet.removeEventListener('copy', this.onCopy);
        this.sheet.removeEventListener('paste', this.onPaste);
        this.sheet.removeEventListener('keydown', this.onKeyDown);
    }

    onCopy(event){
        console.log(event);
    }

    onPaste(event){
        console.log(event);
    }

    onKeyDown(event){
        if(event.key == 'c' && event.ctrlKey){
            let hiddenEl = document.createElement('div');
            hiddenEl.style.display = "none";
            document.body.append(hiddenEl);
            // Set the textContent of the hidden el
            // to be the CSV of the selection area
            let lines = [];
            this.sheet.selector.selectionFrame.forEachPointRow(row => {
                let line = row.map(point => {
                    let value = this.sheet.dataFrame.getAt(point);
                    if (value.replace(/ /g, '').match(/[\s,"]/)) {
                        return '"' + value.replace(/"/g, '""') + '"';
                    }
                    return value;
                }).join(",");
                lines.push(line);
            });
            hiddenEl.textContent = lines.join("\n");
            let range = document.createRange();
            range.selectNodeContents(hiddenEl);
            let selection = document.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            document.execCommand('copy');
            hiddenEl.remove();
            event.preventDefault();
            event.stopPropagation();
        }
    }
}

export {
    ClipboardHandler,
    ClipboardHandler as default
};
