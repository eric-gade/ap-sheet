// IndexedDB Worker
var window = self;
onmessage = function(event){
    switch(event.data.type){
    case '#initialConnect':
        openDbConnection(event.data.dbName);
        break;
    case '#initialData':
        storeInitialData(event.data.data, event.data.dbName);
        break;
    case '#retrieveAllData':
        retrieveAllData(event.data.dbName);
        break;
    }
};

const retrieveAllData = (dbName) => {
    let request = window.indexedDB.open(dbName);
    request.onsuccess = event => {
        let db = event.target.result;
        let objectStore = db.transaction("cells").objectStore("cells");
        objectStore.getAll().onsuccess = event => {
            postMessage({
                type: '#receiveData',
                points: event.target.result
            });
        };
    };
};

const storeInitialData = (data, dbName) => {
    let request = window.indexedDB.open(dbName);
    request.onsuccess = event => {
        let db = event.target.result;
        let objectStore = db.transaction("cells", "readwrite").objectStore("cells");
        data.forEach(dataPoint => {
            objectStore.add(dataPoint);
        });
        objectStore.transaction.oncomplete = event => {
            postMessage({
                type: '#dbInitialDataComplete'
            });
        };
    };
    request.onerror = event => {
        console.error(event);
    };
};

const openDbConnection = (name, version) => {
    let initRequest = window.indexedDB.open(name);
    initRequest.onsuccess = (event) => {
        console.log("Initial db request onsuccess");
        console.log(event);
    };
    initRequest.onerror = (event) => {
        console.log("Initial db request onerror");
        console.log(event);
    };
    initRequest.onupgradeneeded = (event) => {
        // This is the first time we are connecting
        // to this database, so we will need to create
        // the object store(s) etc.
        postMessage({
            type: '#dbUpgradeNeeded'
        });
        let db = event.target.result;
        let objectStore = db.createObjectStore("cells", {autoIncrement: true});
        objectStore.createIndex("point", "point", {unique: true});
        objectStore.transaction.oncomplete = (event) => {
            postMessage({
                type: '#dbCreated'
            });
        };
    };
};
