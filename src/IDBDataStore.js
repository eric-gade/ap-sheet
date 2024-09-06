import { DataStore } from "./DataStore.js";
import { openDB } from "../utils/idb.js";

class IDBDataStore extends DataStore {
    constructor(origin, corner, dbName) {
        super(origin, corner);
        if (!dbName || dbName === undefined) {
            dbName = "defaultDB";
        }
        this.dbName = dbName;
        this.db = null;

        this.setup();

        // Bound methods
        this.setup = this.setup.bind(this);
        this.getDB = this.getDB.bind(this);
        this.loadAllFromExisting = this.loadAllFromExisting.bind(this);
    }

    async setup() {
        let dbExists = true;
        this.db = await openDB(this.dbName, 1, {
            upgrade(db) {
                dbExists = false;
                const store = db.createObjectStore("cells", {
                    keyPath: "id",
                    autoIncrement: false,
                });
                store.createIndex("x", "x");
                store.createIndex("y", "y");
            },
        });
        if (dbExists) {
            console.log(`Loading from existing database ${this.dbName}`);
            await this.loadAllFromExisting();
        } else {
            console.log(`Created new database ${this.dbName}`);
        }
        return this.db;
    }

    async getDB() {
        return await openDB(this.dbName, 1, {
            upgrade(db) {
                const store = db.createObjectStore("cells", {
                    keyPath: "id",
                    autoIncrement: false,
                });
                store.createIndex("x", "x");
                store.createIndex("y", "y");
            },
        });
    }

    async loadAllFromExisting() {
        this.db = await this.getDB();
        const transaction = this.db.transaction("cells", "readwrite");
        const all = await transaction.store.getAll();
        all.forEach((record) => {
            if (record.value !== undefined) {
                this._cache[record.id] = record.value;
            }
        });
        this.notify(this, true);
    }

    _locationToKey(location) {
        if (location.isPoint) {
            return `${location.x},${location.y}`;
        } else {
            return `${location[0]},${location[1]}`;
        }
    }

    async asyncPutRowsAt(rowIndex, rows, notify = true) {
        if (!this.db) {
            this.db = await this.getDB();
        }
        const transaction = this.db.transaction("cells", "readwrite");
        await Promise.all(
            rows.map(async (row, thisIdx) => {
                let y = rowIndex + thisIdx;
                let puts = [];
                for (let x = 0; x < row.length; x++) {
                    const value = row[x];
                    const key = this._locationToKey([x, y]);
                    const existing = await transaction.store.get(key);
                    if (existing) {
                        existing.value = value;
                        puts.push(transaction.store.put(existing));
                    } else {
                        puts.push(
                            transaction.store.add({
                                id: key,
                                x,
                                y,
                                value,
                            })
                        );
                    }
                }
                puts.push(transaction.done);
                return Promise.all(puts);
            })
        );
    }

    async persistentPutAt(location, value, notify = true) {
        if (!this.db) {
            this.db = await this.getDB();
        }
        const transaction = this.db.transaction("cells", "readwrite");
        const key = this._locationToKey(location);
        const existing = await transaction.store.get(key);
        if (existing) {
            existing.value = value;
            return await transaction.store.put(existing);
        } else {
            return await transaction.store.add({
                id: key,
                x: key.split(",")[0],
                y: key.split(",")[1],
                value: value,
            });
        }
    }

    async persistentGetAt(location, notify = true) {
        if (!this.db) {
            this.db = await this.getDB();
        }
        const transaction = this.db.transaction("cells");
        const key = this._locationToKey(location);
        const record = await transaction.store.get(key);
        if (record === undefined) {
            this._cache[key] = undefined;
        } else if (record.value !== undefined) {
            this._cache[key] = record.value;
        }
    }

    async clearPersistedData(startCoord, endCoord, notify = true) {
        const transaction = this.db.transaction("cells", "readwrite");
        const actions = [];
        for (let x = startCoord[0]; x <= endCoord[0]; x++) {
            for (let y = startCoord[1]; y <= endCoord[1]; y++) {
                const key = this._locationToKey([x, y]);
                actions.push(transaction.store.delete(key));
            }
        }
        await Promise.all(actions);
    }

    async clearAllPersisted(notify = true) {
        const transaction = this.db.transaction("cells", "readwrite");
        await transaction.store.clear();
    }

    async getMax() {}
}

export { IDBDataStore };
