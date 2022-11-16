/**
 * APSheet DataFrame class
 * ------------------------------------
 * Represents a kind of Frame that can store
 * values at each of its Points.
 */
import Frame from "./Frame.js";
import { Point, isCoordinate } from "./Point.js";

class DataFrame extends Frame {
    constructor(...args) {
        super(...args);

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
     * objects that the data in this DataFrame
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
            if (!this.contains(location)) {
                throw new Error(`${location} outside of DataFrame`);
            }
            key = location.toString();
        } else if (location.isPoint) {
            if (!this.contains(location)) {
                throw new Error(`${location} outside of DataFrame`);
            }
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
     * specifies where in the current DataFrame
     * to begin storing the values from (an offset).
     * NOTE: The array of arrays first dimension will be
     * rows (y values) whose elements are columns (x values)
     * @param {Array[Array]} data - An array of arrays
     * of data values that we will store.
     * @param {Point|Array} origin - The relative
     * from which to start loading the data into
     * this DataFrame.
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
     * DataFrame.
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
     * Respond with a 2d data array corresponding to
     * the contents of this DataFrame instance.
     * If `strict` is true, we use `minFrame` under the
     * hood. Otherwise use the expected `this`.
     */
    async toArray(strict = false) {
        if (strict) {
            return await this.getDataArrayForFrame(this.minFrame);
        } else {
            return await this.getDataArrayForFrame(this);
        }
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
     * Replace values in the DataFrame.store with the return of the
     * func applied to each value.
     * @param {function} func - A function
     * @param {boolean} notify - If true will try to call notify
     */
    apply(func, notify = false) {
        this.forEachPoint((p) => {
            this.putAt(p, func(this.getAt(p)), notify);
        });
    }

    /**
     * I do an (store) elemnent pairwise add operation for this and
     * the df DataFrame (in place)
     * NOTE: this and df must be equal as frames, ie their coordinates must match up
     * @param {DataFrame} df - The dataframe to be added
     * @param {boolean} notify - If true will try to call notify
     */
    async add(df) {
        if (!this.size.equals(df.size)) {
            throw new Error("DataFrames must be equal size to add");
        }
        // TODO: dumping DS's to arrays like this might cause performance issues
        // we should consider something that will simulatenously iterate over points
        // in both frames respecting the order
        const this_array = await this.toArray();
        const df_array = await df.toArray();
        this_array.forEach((row, ridx) => {
            this_array[ridx].forEach((value, cidx) => {
                this_array[ridx][cidx] = value + df_array[ridx][cidx];
            });
        });
        await this.loadFromArray(this_array, this.origin);
    }

    /**
     * A DataFrame is considered "full" if there
     * are stored values for each of its points.
     * This is equivalent to each point having a key
     * in the internal store dictionary.
     * To make matters even simpler, if the number of
     * keys is equivalent to the area of the DataFrame,
     * then something has been stored at each point value.
     */
    get isFull() {
        return this.area == Object.keys(this.store).length;
    }

    /**
     * Responds with a new Frame that represents the
     * smallest required Frame to represent the store
     * contents that have actual (defined) values.
     */
    get minFrame() {
        let keyCoords = Object.keys(this.store).map((keyString) => {
            return keyString.split(",").map((numStr) => {
                return parseInt(numStr);
            });
        });
        let xValues = keyCoords.map((coord) => coord[0]);
        let yValues = keyCoords.map((coord) => coord[1]);
        let origin = [Math.min(...xValues), Math.min(...yValues)];
        let corner = [Math.max(...xValues), Math.max(...yValues)];
        return new Frame(origin, corner);
    }

    /**
     * Like minFrame, but preserves the true
     * origin of the whole dataFrame, ie, responds
     * with the minimal frame encompassing all
     * defined values from the origin.
     */
    get minFrameFromOrigin() {
        let minFrame = this.minFrame;
        return new Frame(
            [this.origin.x, this.origin.y],
            [minFrame.corner.x, minFrame.corner.y]
        );
    }

    /**
     * Responds true if the given Frame,
     * relative to this DataFrame instance,
     * has a data value set for each of the
     * Points therein. Returns false otherwise.
     * This is a method for determining if,
     * for example, some given intersect on the
     * DataFrame is complete or incomplete.
     * Note we will also throw an Error in the
     * event that the given Frame is not contained
     * within this one.
     */
    hasCompleteDataForFrame(aFrame) {
        if (!this.contains(aFrame)) {
            throw new Error("Passed Frame is not contained within DataFrame!");
        }
        let points = aFrame.points;
        for (let i = 0; i < points.length; i++) {
            let thisPoint = points[i];
            if (this.getAt(thisPoint) == undefined) {
                return false;
            }
        }

        return true;
    }
}

export { DataFrame, DataFrame as default };
