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
        this.subscribe = this.subscribe.bind(this);
        this.notify = this.notify.bind(this);
        this.loadFromArray = this.loadFromArray.bind(this);
        this.putAt = this.putAt.bind(this);
        this.asyncPutAt = this.asyncPutAt.bind(this);
        this.getAt = this.getAt.bind(this);
        this.asyncGetAt = this.asyncGetAt.bind(this);
        this.copyFrom = this.copyFrom.bind(this);
        this.getDataArrayForFrame = this.getDataArrayForFrame.bind(this);
        this.getDataSubFrame = this.getDataSubFrame.bind(this);
    }

    /**
     * Add a subscriber object to this DataFrame's
     * Set of known subscribers. Whenever data is
     * changed, the subscriber will attempt to call
     * the `onDataChanged` callback on the given
     * object.
     */
    subscribe(anObject) {
        this.subscribers.add(anObject);
    }

    /**
     * Attempt to notify all known subscriber
     * objects that the data in this DataFrame
     * has changed
     */
    notify(...args) {
        this.subscribers.forEach((subscriber) => {
            if (subscriber.onDataChanged) {
                this.subscriber.onDataChanged(...args);
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
            throw "Invalid Point or Coordinate";
        }

        // We do not actually store undefined
        // as a value
        if (value === undefined) {
            delete this.store[key];
        } else {
            this.store[key] = value;
        }
        if (checkAsync) {
            this.asyncPutAt(location, value);
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
    async asyncPutAt(location, value, notify = true) {
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
                throw `${location} outside of DataFrame`;
            }
            key = location.toString();
        } else if (location.isPoint) {
            if (!this.contains(location)) {
                throw `${location} outside of DataFrame`;
            }
            key = `${location.x},${location.y}`;
        } else {
            throw "Invalid Point or Coordinate";
        }
        if (this.store[key] === undefined && checkAsync) {
            this.asyncGetAt(location);
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
    async asyncGetAt(location, notify = true) {
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
    async loadFromArray(data, origin = [0, 0], notify = true) {
        // work with Points for sanity
        origin = new Point(origin);
        if (!this.contains(origin)) {
            // need to check if this simply an extension of the DF, ie
            // we are adding rows or columns
            // Note: appending must continue the row/columns, ie no jumps
            const appendRows = origin.x == 0 && origin.y == this.size.y;
            const appendColumns = origin.y == 0 && origin.x == this.size.x;
            if (!appendRows && !appendColumns) {
                throw `${origin} not contained in this DataFrame and is not an append of rows or columns`;
            }
        }
        let wasResized = false;
        let rowMax = data.length - 1;
        let colMax = data[0].length - 1; // Assume all are equal
        let corner = new Point([colMax + origin.x, rowMax + origin.y]);
        let comparisonFrame = new Frame(origin, corner);
        if (!this.contains(comparisonFrame)) {
            const unionFrame = comparisonFrame.union(this);
            this.origin = unionFrame.origin;
            this.corner = unionFrame.corner;
            wasResized = true;
        }
        await Promise.all(
            data.map((row, y) => {
                return row.map(async (value, x) => {
                    let adjustedCoord = [
                        x + comparisonFrame.origin.x,
                        y + comparisonFrame.origin.y,
                    ];
                    this.putAt(adjustedCoord, value, false, false);
                    return await this.asyncPutAt(adjustedCoord, value, false);
                });
            })
        );
        if (notify) {
            this.notify(comparisonFrame, wasResized);
        }
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
    async getDataArrayForFrame(aFrame) {
        if (!this.contains(aFrame)) {
            throw `Frame is not contained within DataFrame!`;
        }
        let result = await Promise.all(
            aFrame.mapEachCoordinateRow(async (row) => {
                return await row.map(async (coordinates) => {
                    let cachedVal = this.getAt(coordinates, false, false);
                    if (cachedVal === undefined) {
                        cachedVal = await this.asyncGetAt(
                            coordinates,
                            false,
                            false
                        );
                    }
                });
            })
        );
        return result;
    }

    /**
     * I return a DataFrame which contains the points (and data)
     * of this frame starting at the specified (new) origin and corner.
     */
    async getDataSubFrame(origin, corner) {
        const subframe = new DataFrame(origin, corner);
        return await this.getDataArrayForFrame(subframe);
        return subframe;
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
    }

    /**
     * Clear out the intersection of the passed in
     * Frame instance and any data within this Frame
     */
    clearFrame(aFrame, notify = true) {
        const intersectionFrame = this.intersection(aFrame);
        if (!intersectionFrame.isEmpty) {
            intersectionFrame.forEachPoint((point) => {
                const key = `${point.x},${point.y}`;
                delete this.store[key];
            });
            if (notify) {
                this.notify(intersectionFrame);
            }
        }
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
    add(df) {
        if (!this.size.equals(df.size)) {
            throw "DataFrames must be equal size to add";
        }
        // TODO: dumping DS's to arrays like this might cause performance issues
        // we should consider something that will simulatenously iterate over points
        // in both frames respecting the order
        const this_array = this.toArray();
        const df_array = df.toArray();
        this_array.forEach((row, ridx) => {
            this_array[ridx].forEach((value, cidx) => {
                this_array[ridx][cidx] = value + df_array[ridx][cidx];
            });
        });
        this.loadFromArray(this_array, this.origin);
    }

    /**
     * I take a new frame and copy it into this DataFrame
     * starting with the specified origin. If the frame doesn't
     * "fit" ie if the intersection of frame with this DataFrame
     * does not contain the frame then I throw an error.
     **/
    copyFrom(frame, origin = [0, 0]) {
        if (!(frame instanceof DataFrame)) {
            throw "You must pass in a data frame to copy from";
        }
        if (!this.intersection(frame).contains(frame)) {
            throw "DataFrame too small to copy from frame at origin";
        }
        this.loadFromArray(frame.toArray(), (origin = origin));
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
            throw "Passed Frame is not contained within DataFrame!";
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
