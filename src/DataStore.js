/**
 * APSheet DataStore class
 * ------------------------------------
 * Represents a kind of Frame that can store
 * values at each of its Points.
 */
import Frame from "./Frame.js";
import { Point, isCoordinate } from "./Point.js";

class DataStore {
    constructor(...args) {
        // We store Point data as keys
        // composed of the values of each
        // Point
        this.store = {};

        // A set of subscriber objects that
        // will be notified whenever data changes
        this.subscribers = new Set();

        // Bind instance methods
        this.notify = this.notify.bind(this);
        this.loadFromArray = this.loadFromArray.bind(this);
        this.putAt = this.putAt.bind(this);
        this.persistentPutAt = this.persistentPutAt.bind(this);
        this.getAt = this.getAt.bind(this);
        this.persistentGetAt = this.persistentGetAt.bind(this);
        this.getDataArray = this.getDataArray.bind(this);
        this.clear = this.clear.bind(this);
        this.clearData = this.clearData.bind(this);
        this.clearAllPersisted = this.clearAllPersisted.bind(this);
        this.clearPersistedData = this.clearPersistedData.bind(this);
    }

    /**
     * Attempt to notify all known subscriber
     * objects that the data in this DataStore
     * has changed
     */
    notify(...args) {
        this.subscribers.forEach((subscriber) => {
            if (subscriber.onDataChanged) {
                subscriber.onDataChanged(...args);
            }
        });
    }

    /**
     * Loads the supplied value object
     * into the store at the location
     * specified by the Point or coordinate
     * array.
     * @param {Point|Array} location - The
     * Point or coordinate array at which
     * we will store the value
     * @param {Object} value - The object
     * to store.
     */
    putAt(location, value, notify = true, checkAsync = true) {
        let x, y, key;
        if (location.isPoint) {
            x = location.x;
            y = location.y;
            key = `${x},${y}`;
        } else if (isCoordinate(location)) {
            x = location[0];
            y = location[1];
            key = location.toString();
        } else {
            throw new Error("Invalid Point or Coordinate");
        }

        // We do not actually store undefined
        // as a value
        if (value === undefined) {
            delete this.store[key];
        } else {
            this.store[key] = value;
        }
        if (checkAsync) {
            this.persistentPutAt(location, value);
        }
        if (notify) {
            this.notify(location);
        }
    }

    /**
     * Asynchronously attempts to store a
     * value to some persistent or remote storage.
     * Is a no-op in this basic implementation.
     * Subclasses should override this methods and
     * redefine as needed.
     */
    async persistentPutAt(location, value, notify = true) {
        // No-op
    }

    /**
     * Retrieves a stored value at the given
     * Point or coordinate location. Will return
     * undefined for values that have not been set,
     * and will throw an error for locations that
     * are outside the bounds of the Frame.
     * @param {Array|Point} location - The location
     * from which we will retrieve the stored item.
     * @returns {Object|undefined} - The retrieved
     * item or undefined if there is no stored
     * value. Errors if the location is out of
     * scope of the frame.
     */
    getAt(location, checkAsync = true) {
        let key;
        if (isCoordinate(location)) {
            key = location.toString();
        } else if (location.isPoint) {
            key = `${location.x},${location.y}`;
        } else {
            throw new Error("Invalid Point or Coordinate");
        }
        if (this.store[key] === undefined && checkAsync) {
            this.persistentGetAt(location);
        }
        return this.store[key];
    }

    /**
     * Asynchronously attempts to retrieve a
     * value from some persistent or remote storage.
     * Is a no-op in this basic implementation.
     * Caches misses in the normal `getAt` will
     * call this asynchronous method in the background.
     * Subclasses should override this method and redefine
     * as needed
     */
    async persistentGetAt(location, notify = true) {
        // No-op
    }

    /**
     * Loads an array of arrays of data values
     * into the store at the appropriate point
     * values. The optional origin argument
     * specifies where in the current DataStore
     * to begin storing the values from (an offset).
     * NOTE: The array of arrays first dimension will be
     * rows (y values) whose elements are columns (x values)
     * @param {Array[Array]} data - An array of arrays
     * of data values that we will store.
     * @param {Point|Array} origin - The relative
     * from which to start loading the data into
     * this DataStore.
     * @param {Bool} notify - If true, will notify all subscribers
     * after **all** the data is loaded
     */
    async loadFromArray(data, startCoordinate = [0, 0], notify = true) {
        // Iterate over each row and value, calling putAt
        // without the async or notify callbacks.
        let maxLength = 0;
        for (let y = 0; y < data.length; y++) {
            let row = data[y];
            let newRow = [];
            maxLength = Math.max(row.length, maxLength);
            for (let x = 0; x < row.length; x++) {
                let value = row[x];
                let adjustedCoord = [
                    x + startCoordinate[0],
                    y + startCoordinate[1],
                ];
                this.putAt(adjustedCoord, value, false, false);
                newRow.push(value);
            }
            this.persistentPutRowsAt(startCoordinate[1], [newRow], notify);
        }

        // TODO:
        // Asynchronously pass the updated data matrix
        // to whatever async backend is needed

        if (notify) {
            const endCoordinate = [maxLength, data.length];
            this.notify(startCoordinate, endCoordinate);
        }

        return true;
    }

    /**
     * Asynchronously put the given rows of values
     * starting at the provided rowIndex
     */
    async persistentPutRowsAt(rowIndex, rows, notify = true) {
        // No-op
    }

    /**
     * Return an array of arrays (rows of columns,
     * ie y then x) of the values stored in this
     * DataStore.
     * @param {Frame} aFrame - The Frame instance
     * whose values we will pull out from the store
     * @returns {Array[Array]} A y-to-x (row to column)
     * array of array of stored values
     */
    async getDataArray(startCoordinate, endCoordinate) {
        let result = [];
        for (let y = startCoordinate[1]; y < endCoordinate[1]; y++) {
            let row = [];
            for (let x = startCoordinate[0]; x < endCoordinate[0]; x++) {
                let cachedVal = this.getAt([x, y], false, false);
                if (cachedVal === undefined) {
                    cachedVal = await this.persistentGetAt(
                        [x, y],
                        false,
                        false
                    );
                }
                row.push(cachedVal);
            }
            result.push(row);
        }

        return result;
    }

    /**
     * Clear out the cached dictionary of
     * points to values.
     */
    clear(clearPersisted = false, notify = true) {
        this.store = {};
        if (notify) {
            this.notify(new Frame(this.origin, this.corner));
        }
        if (clearPersisted) {
            this.clearAllPersisted(notify);
        }
    }

    /**
     * Asynchronously clear all persisted cells
     * from any backing datastore
     */
    async clearAllPersisted(notify = true) {
        this.clearPersistedFrame(this, notify);
    }

    /**
     * Clear out the intersection of the passed in
     * Frame instance and any data within this Frame
     */
    clearData(
        startCoordinate,
        endCoordinate,
        notify = true,
        clearPersisted = true
    ) {
        for (let y = startCoordinate[1]; y < endCoordinate[1]; y++) {
            for (let x = startCoordinate[0]; x < endCoordinate[0]; x++) {
                const key = `${x},${y}`;
                delete this.store[key];
            }
        }

        if (clearPersisted) {
            this.clearPersistedData(startCoordinate, endCoordinate, notify);
        }
        if (notify) {
            this.notify(startCoordinate, endCoordinate);
        }
    }

    /**
     * Clear the persisted stored values for
     * the given frame.
     */
    async clearPersistedData(startCoordinate, endCoordinate, notify = true) {
        // No-op for now.
        // subclasses should implement
    }

    /**
     * Asynchronously retrieve the maximum coordinate
     * that contains data
     */
    async getMax() {
        // Default implementation is to
        // cycle through the local store
        // cache.
        // Database variants should override.
        Object.keys(this.store).reduce(
            (key, current) => {
                let [x, y] = key.split(",").map((val) => parseInt(val));
                if (x > current[0] && y > current[1]) {
                    return [x, y];
                } else {
                    return current;
                }
            },
            [0, 0]
        );
    }
}

export { DataStore, DataStore as default };
