/* A dumb DataStore that returns the configured label for all values */
import DataStore from "./DataStore.js";

export class IdiotDataStore extends DataStore {
    constructor(label, ...args) {
        super(...args);
        this.label = label || "💩";
    }

    init() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve((this.isReady = true));
            }, 1500);
        });
    }

    getAt(location, checkAsync = true) {
        return this.label;
    }

    getDataArray(startCoord, endCoord) {
        let result = [];
        for (let x = startCoord[0]; x <= endCoord[0]; x++) {
            let list = [];
            for (let y = startCoord[1]; y <= endCoord[1]; y++) {
                list.push(this.label);
            }
            result.push(list);
        }
        return result;
    }
}

export default IdiotDataStore;
