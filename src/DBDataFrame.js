import {DataFrame} from "./DataFrame.js";

/**
 * DBDataFrame class
 * --------------------------------
 * I am a kind of DataFrame whose operations
 * asyncronously interact with an IndexedDB
 * browser storage instance for persistence.
 */
class DBDataFrame extends DataFrame {
    constructor(origin, corner, dbName){
        super(origin, corner);
        this.dbName = dbName;
        this.db = null;

        // Bind instance methods
        this.onRequestError = this.onRequestError.bind(this);
        this.onTransactionError = this.onTransactionError.bind(this);
        this.onRequestSuccess = this.onRequestSuccess.bind(this);
        this.onTransactionSuccess = this.onTransactionSuccess.bind(this);
        this.onUpgradeNeeded = this.onUpgradeNeeded.bind(this);
        this.setupHandlers = this.setupHandlers.bind(this);

        // Open the initial connection
        console.log('attempting to open db connection...');
        this.request = window.indexedDB.open(dbName);
        this.setupHandlers();
    }

    setupHandlers(){
        this.request.onsuccess = this.onRequestSuccess;
        this.request.onerror = this.onRequestError;
        this.request.onupgradeneeded = this.onUpgradeNeeded;
    }

    onRequestSuccess(event){

    }

    onRequestError(event){
        console.error(event.result);
    }

    onTransactionSuccess(event){
        console.log('Transaction success!');
        console.log(event);
    }

    onTransactionError(event){
        console.error('Transaction error!');
        console.log(event);
    }

    onUpgradeNeeded(event){
        console.log('IndexedDB Upgrade needed triggered');
        this.db = event.target.result;
        let objectStore = this.db.createObjectStore("cells", {keyPath: "point"});
        objectStore.createIndex("point", "point", {unique: true});
        // This is an initial load of the data,
        // which should create entries for all points in the frame
        // and set the values to undefined.
        console.log(Object.keys(this.store).length);
        objectStore.transaction.oncomplete = event => {
            console.log("Object store created");
            var pointObjectStore = this.db.transaction("cells", "readwrite").objectStore("cells");
            Object.keys(this.store).forEach(key => {
                pointObjectStore.add({point: key, value: this.store[key]});
            });
            pointObjectStore.transaction.oncomplete = compEvent => {
                console.log('Initial loading of data completed!');
            };
        };
        
        
    }  
}

export {
    DBDataFrame,
    DBDataFrame as default
};
