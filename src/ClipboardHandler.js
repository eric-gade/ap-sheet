/**
 * SyntheticClipboardHandler class
 * -----------------------------------------
 * I am a handler whose responsibility mimicks
 * that of a clipboard when it comes to interacting
 * with parts of an attached sheet instance.
 * Because of the in-flux nature of the Clipboard API
 * in today's browsers, there is limited interaction
 * with OS-level copy and paste.
 * Instead, I copy information from the sheet's selector
 * and store it in myself, triggering `synthetic-copy`
 * and `synthetic-paste` events on the sheet as needed.
 * These events can be listened for by any consumers.
 * The basis handlers for them defined here copy and paste
 * SelectionFrame data.
 */

class SyntheticClipboardHandler extends Object {
    constructor(sheet){
        super(sheet);
        if(!sheet){
            throw new Error('You must initialize a ClipboardHandler with a valid sheet instance!');
        }
        this.sheet = sheet;
        this.contents = [];

        // Bind component methods
        this.connect = this.connect.bind(this);
        this.disconnect = this.disconnect.bind(this);
        this.onCopy = this.onCopy.bind(this);
        this.triggerCopyEvent = this.triggerCopyEvent.bind(this);
        this.onPaste = this.onPaste.bind(this);
        this.triggerPasteEvent = this.triggerPasteEvent.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.frameContentsAsCsv = this.frameContentsAsCsv.bind(this);
        this._manualCopy = this._manualCopy.bind(this);
    }

    connect(){
        this.sheet.addEventListener('keydown', this.handleKeyDown);
        this.sheet.addEventListener('synthetic-copy', this.onCopy);
        this.sheet.addEventListener('synthetic-paste', this.onPaste);
    }

    disconnect(){
        this.sheet.removeEventListener('keydown', this.handleKeyDown);
        this.sheet.removeEventListener('synthetic-copy', this.onCopy);
        this.sheet.removeEventListener('synthetic-paste', this.onPaste);
    }

    onCopy(event){
        // Here we attempt to put the synthetic clipboard
        // data into the real clipboard as CSV, so that
        // the information can be OS-level pasted into
        // other contexts.
        this.contents.push(event.detail);
        let csvString = this.frameContentsAsCsv(event.detail.data);
        this._manualCopy(csvString);
    }

    onPaste(event){
        event.detail.contents.forEach(clipboardItem => {
            let destOrigin = this.sheet.selector.selectionFrame.origin;
            if(this.sheet.selector.selectionFrame.isEmpty){
                destOrigin = this.sheet.selector.relativeCursor;
            }
            this.sheet.dataFrame.loadFromArray(clipboardItem.data, [destOrigin.x, destOrigin.y]);
        });
    }

    handleKeyDown(event){
        if(event.key == 'c' && event.ctrlKey){
            event.preventDefault();
            event.stopPropagation();
            this.triggerCopyEvent();
        } else if(event.key == 'v' && event.ctrlKey){
            event.preventDefault();
            event.stopPropagation();
            this.triggerPasteEvent();
        }
    }

    triggerCopyEvent(){
        let frame = this.sheet.selector.selectionFrame.copy();
        let data = this.sheet.dataFrame.getDataArrayForFrame(frame);
        let event = new CustomEvent('synthetic-copy', {
            detail: {
                type: 'frame-selection',
                frame: frame,
                data: data
            }
        });
        this.sheet.dispatchEvent(event);
    }

    triggerPasteEvent(){
        let event = new CustomEvent('synthetic-paste', {
            detail: {
                contents: this.contents.slice()
            }
        });
        this.sheet.dispatchEvent(event);
    }

    frameContentsAsCsv(arrayData){
        // Given a two-dimensional array
        // of Frame values (as extracted from a DataFrame),
        // respond with a string in CSV format
        return arrayData.map(row => {
            return row.map(item => {
                let value = item.toString();
                if (value.replace(/ /g, '').match(/[\s,"]/)) {
                    return '"' + value.replace(/"/g, '""') + '"';
                }
                return value;
            }).join(",");
        }).join("\n");
    }

    _manualCopy(text){
        // Use execCommand and a hidden element
        // to select and then copy the given text,
        // which is a CSV representation of the values
        // from a SelectionFrame
        let element = document.createElement('div');
        element.setAttribute("contenteditable", true);
        element.style.width = "0px";
        element.style.height = "0px";
        element.style.whiteSpace = "pre";
        element.textContent = text;
        document.body.append(element);
        let selection = document.getSelection();
        let range = document.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
        document.execCommand('copy');
        element.remove();
        this.sheet.focus();
    }
}

export {
    SyntheticClipboardHandler,
    SyntheticClipboardHandler as default
};
