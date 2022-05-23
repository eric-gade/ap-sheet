 /**
 * KeyHandler class
 * ----------------
 * I am a controller object that
 * gets attached to and initialized on
 * a custom element serving as a sheet
 * instance.
 * My purpose is to configure and handle
 * all keyboard related events on the sheet
 */
class KeyHandler extends Object {
    constructor(sheet){
        super();
        if(!sheet){
            throw new Error('You must initialize a KeyHandler with a spreadsheet component instance!');
        }
        this.sheet = sheet;

        // A mapping of key names to handlers
        // that we will register in a dictionary
        // by those names.
        this.handlers = {};

        // Bind methods
        this.connect = this.connect.bind(this);
        this.disconnect = this.disconnect.bind(this);
        this.registerHandler = this.registerHandler.bind(this);
        this.deregisterHandler = this.deregisterHandler.bind(this);
        this.registerDefaults = this.registerDefaults.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    connect(){
        this.sheet.addEventListener('keydown', this.handleKeyDown);
        this.registerDefaults(); // Add default handlers
    }

    disconnect(){
        this.sheet.removeEventListener('keydown', this.handleKeyDown);
    }

    registerHandler(keyName, handlerFunction){
        this.handlers[keyName] = handlerFunction;
    }

    deregisterHandler(keyName){
        delete this.handlers[keyName];
    }

    handleKeyDown(event){
        let handler = this.handlers[event.key];
        if(handler){
            handler(event);
        } else if(event.key.length === 1 && !this.usesModifierKeys(event)){
            // If no specific handler was found,
            // check to see if this is a key that
            // will enter data into the cell and,
            // if so, enable live editing of the
            // cell.
            let cellElement = this.sheet.primaryFrame.elementAt(
                this.sheet.selector.cursor
            );
            if(!cellElement.hasAttribute('editing')){
                cellElement.setAttribute('editing', 'true');
            }
        }
    }

    registerDefaults(){
        this.registerHandler('ArrowRight', (event) => {
            if(event.ctrlKey){
                this.sheet.selector.moveToRightEnd(event.shiftKey);
            } else {
                this.sheet.selector.moveRightBy(
                    1,
                    event.shiftKey
                );
            }
            event.preventDefault();
            event.stopPropagation();
            this.sheet.dispatchSelectionChanged();
        });
        this.registerHandler('ArrowLeft', (event) => {
            if(event.ctrlKey){
                this.sheet.selector.moveToLeftEnd(event.shiftKey);
            } else {
                this.sheet.selector.moveLeftBy(
                    1,
                    event.shiftKey
                );
            }
            event.preventDefault();
            event.stopPropagation();
            this.sheet.dispatchSelectionChanged();
        });
        this.registerHandler('ArrowDown', (event) => {
            if(event.ctrlKey){
                this.sheet.selector.moveToBottomEnd(event.shiftKey);
            } else {
                this.sheet.selector.moveDownBy(
                    1,
                    event.shiftKey
                );
            }
            event.preventDefault();
            event.stopPropagation();
            this.sheet.dispatchSelectionChanged();
        });
        this.registerHandler('ArrowUp', (event) => {
            if(event.ctrlKey){
                this.sheet.selector.moveToTopEnd(event.shiftKey);
            } else {
                this.sheet.selector.moveUpBy(
                    1,
                    event.shiftKey
                );
            }
            event.preventDefault();
            event.stopPropagation();
            this.sheet.dispatchSelectionChanged();
        });
        this.registerHandler('PageUp', (event) => {
            if(event.altKey){
                this.sheet.selector.pageLeft(event.shiftKey);
            } else {
                this.sheet.selector.pageUp(event.shiftKey);
            }
            event.preventDefault();
            event.stopPropagation();
            this.sheet.dispatchSelectionChanged();
        });
        this.registerHandler('PageDown', (event) => {
            if(event.altKey){
                this.sheet.selector.pageRight(event.shiftKey);
            } else {
                this.sheet.selector.pageDown(event.shiftKey);
            }
            event.preventDefault();
            event.stopPropagation();
            this.sheet.dispatchSelectionChanged();
        });
        this.registerHandler('Enter', (event) => {
            if(this.sheet.selector.selectionFrame.isEmpty){
                let cellElement = this.sheet.primaryFrame.elementAt(
                    this.sheet.selector.cursor
                );
                if(!cellElement.isEditing){
                    cellElement.setAttribute('editing', true);
                    event.stopPropagation();
                }
            }
        });
    }

    usesModifierKeys(event){
        return (event.altKey || event.ctrlKey || event.metaKey);
    }
};

export {
    KeyHandler,
    KeyHandler as default
};
