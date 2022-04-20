// DataStore class
class DataStore extends Object {
    constructor(aDataFrame){
        super();
        if(!aDataFrame){
            throw new Error(`DataStore must be initialized with a DataFrame instance!`);
        }
        this.dataFrame = aDataFrame;

        // Bind instance methods
        this.initWorker = this.initWorker.bind(this);
        this.initialConnect = this.initialConnect.bind(this);
        this.sendInitialData = this.sendInitialData.bind(this);
        this.retrieveAllData = this.retrieveAllData.bind(this);
        this.onMessage = this.onMessage.bind(this);

        this.initWorker();
    }

    initWorker(){
        this.worker = new Worker('/src/persistence/idb-worker.js', {type: "module"});
        this.worker.onmessage = this.onMessage;
        this.initialConnect();
    }

    onMessage(event){
        if(!event.data.type){
            return console.log('Received unknown message:');
            console.log(event.data);
        }
        switch(event.data.type){
        case '#dbUpgradeNeeded':
            console.log(`Received ${event.data.type}`);
            console.log('Sending initial data...');
            this.sendInitialData();
            break;
        case '#dbCreated':
            console.log(event.data);
            break;
        case '#dbInitialDataComplete':
            console.log(event.data);
            this.retrieveAllData();
            break;
        case '#receiveData':
            console.log(event.data.type);
            this.receiveData(event.data.points);
            break;
        default:
            console.log(`Received ${event.data.type}`);
        }
    }

    receiveData(pointsInfo){
        pointsInfo.forEach(pointDatum => {
            this.dataFrame.store[pointDatum.point] = pointDatum.value;
        });
    }

    retrieveAllData(){
        this.worker.postMessage({
            type: '#retrieveAllData',
            dbName: 'default'
        });
    }
    
    initialConnect(){
        this.worker.postMessage({
            type: '#initialConnect',
            dbName: 'default'
        });
    }

    sendInitialData(){
        let data = this.dataFrame.coordinates.map(coord => {
            let key = `${coord[0]},${coord[1]}`;
            let value = `x:${coord[0]} y:${coord[1]}`;
            return {point: key, value: value};
        });
        this.worker.postMessage({
            type: '#initialData',
            data: data,
            dbName: 'default'
        });
    }
};

export {
    DataStore,
    DataStore as default
};
