class SyntheticClipboardHandler extends Object {
    constructor(sheet){
        super();
        if(!sheet){
            throw new Error(`SyntheticClipboardHandler must be initialized with a sheet object!`);
        }

        this.sheet = sheet;

        // Bind instance methods
        this.connect = this.connect.bind(this);
        this.disconnect = this.disconnect.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.triggerSyntheticCopy = this.triggerSyntheticCopy.bind(this);
        this.triggerSyntheticPaste = this.triggerSyntheticPaste.bind(this);
        this.selectionToCsv = this.selectionToCsv.bind(this);
        this.dispatchSyntheticCopyWith = this.dispatchSyntheticCopyWith.bind(this);
    }

    connect(){
        this.sheet.addEventListener('keydown', this.handleKeyDown);
    }

    disconnect(){
        this.sheet.removeEventListener('keydown', this.handleKeyDown);
    }

    handleKeyDown(event){
        if(event.key == 'c' && event.ctrlKey){
            this.triggerSyntheticCopy();
            event.preventDefault();
            event.stopPropagation();
        } else if(event.key == 'v' && event.ctrlKey){
            this.triggerSyntheticPaste();
            event.preventDefault();
            event.stopPropagation();
        }
    }

    triggerSyntheticCopy(){
        let container = document.getElementById('hidden-clip-area');
        if(!container){
            container = document.createElement('textarea');
            container.style.position = "absolute";
            container.style.width = "0px";
            container.style.height = "0px";
            container.style.opacity = "0";
            container.style.overflow = "hidden";
            container.style.whiteSpace = "pre";
            document.body.append(container);
        }
        let csvText = this.selectionToCsv();
        container.value = csvText;
        container.textContent = csvText;
        let sel = document.getSelection();
        sel.removeAllRanges();
        let range = document.createRange();
        range.selectNodeContents(container);
        sel.addRange(range);
        document.execCommand('copy');
        this.dispatchSyntheticCopyWith(container.textContent);
        container.remove();

        // Update the clipboard contents
        this.constructor.contents = {
            data: this.sheet.dataFrame.getDataArrayForFrame(this.sheet.selector.selectionFrame)
        };
    }

    triggerSyntheticPaste(){
        if(this.constructor.contents){
            // Insert the data array into this sheet's DataFrame
            // at the provided origin point
            this.sheet.dataFrame.loadFromArray(
                this.constructor.contents.data,
                this.sheet.selector.relativeCursor
            );

            this.sheet.primaryFrame.updateCellContents();
        }
        let event = new CustomEvent('synthetic-paste', {
            detail: Object.assign({}, this.constructor.contents, { cursor: this.sheet.selector.relativeCursor})
        });
        this.sheet.dispatchEvent(event);
    }

    selectionToCsv(){
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
        return lines.join("\n");
    }

    dispatchSyntheticCopyWith(text){
        let clipboardObject = {
            origin: this.sheet.selector.selectionFrame.origin,
            data: this.sheet.dataFrame.getDataArrayForFrame(this.sheet.selector.selectionFrame),
            text: text
        };
        let event = new CustomEvent('synthetic-copy', {
            detail: clipboardObject
        });
        this.constructor.contents = clipboardObject;
        this.sheet.dispatchEvent(event);
    }
};


// We store the current clipboard value on
// the constructor object itself, so that we
// can access the same value across multiple
// clipboard handlers when copying/pasting
SyntheticClipboardHandler.contents = null;

export {
    SyntheticClipboardHandler,
    SyntheticClipboardHandler as default
};
