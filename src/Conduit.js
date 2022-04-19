import {Frame} from "./Frame.js";
/**
 * Conduit class
 * --------------------
 * I represent a directional link
 * between groups of cells in one table
 * to groups of cells in another (or the same)
 * table.
 */
class Conduit extends Object {
    constructor(fromSheet, fromFrame, toSheet, toFrame, transform){
        super();
        this.fromSheet = fromSheet;
        this.fromFrame = fromFrame;
        if(this.fromFrame.isPoint){
            this.fromFrame = new Frame(this.fromFrame, this.fromFrame);
        }
        this.toSheet = toSheet;
        this.toFrame = toFrame;
        if(this.toFrame.isPoint){
            this.toFrame = new Frame(this.toFrame, this.toFrame);
        }
        this.transform = transform;

        // Bind instance methods
        this.connect = this.connect.bind(this);
        this.disconnect = this.disconnect.bind(this);
        this.onDataUpdated = this.onDataUpdated.bind(this);
        this.send = this.send.bind(this);
    }

    connect(){
        this.fromSheet.addEventListener('data-updated', this.onDataUpdated);
        this.toSheet.addEventListener('conduit-data-received', this.onDataReceived);
    }

    disconnect(){
        this.fromSheet.removeEventListener('data-updated', this.onDataUpdated);
        this.toSheet.removeEventListener('conduit-data-received', this.onDataReceived);
    }

    onDataUpdated(event){
        console.log('Data was updated...');
        event.detail.frames.forEach(frame => {
            console.log(frame);
            let intersection = frame.intersection(this.fromFrame);
            if(!intersection.isEmpty){
                this.send(intersection, this.fromSheet);
            }
        });
    }

    send(frame, sheet){
        console.group('Conduit:');
        if(this.transform){
            console.log(this.transform(frame, sheet));
        } else {
            console.log(frame, sheet);
        }
        console.groupEnd();
        
        this.toSheet.dataFrame.loadFromArray([[500]], this.toFrame.origin);
    }
};

export {
    Conduit,
    Conduit as default
};
