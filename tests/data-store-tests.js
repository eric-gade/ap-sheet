/**
 * APSheet DataFrame Generic Tests
 * ------------------------------------
 */
import { Frame } from "../src/Frame.js";
import { DataStore } from "../src/DataStore.js";
import { Point } from "../src/Point.js";
import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
const assert = chai.assert;
const expect = chai.expect;
chai.use(sinonChai);

describe("DataStore Method Tests", () => {
    describe(".getDataArray()", () => {
        let testStore = new DataStore();
        let sourceFrame = new Frame([0, 0], [10, 10]);
        beforeEach(() => {
            testStore.clear();
        });
        it("should produce values with the correct dimensions", async () => {
            /**
             * We would like to extract only the following Data:
             * [ [0,0] [1,0] [2,0] [3,0] [4,0] [...]
             *   [0,1] [1,1] [2,1] [3,1] [TEST][...]
             *   [0,2] [1,2] [2,2] [3,2] [4,2] [...]
             *   [0,3] [1,3] [TEST][3,3] [4,3] [...]
             *   [...] [...] [...] [...] [...] [...]
             * ]
             * Resulting in:
             * [ [0,0] [1,0] [2,0] [3,0] [4,0] [...]
             *   [0,1] [1,1] [2,1] [3,1] [TEST][...]
             *   [0,2] [1,2] [2,2] [3,2] [4,2] [...]
             *   [0,3] [1,3] [TEST][3,3] [4,3] [...]
             *   [...] [...] [...] [...] [...] [...]
             * ]
             */
            testStore.putAt([4, 1], "TEST");
            testStore.putAt([2, 3], "TEST");
            let dataArray = await testStore.getDataArray(
                [sourceFrame.origin.x, sourceFrame.origin.y],
                [sourceFrame.corner.x, sourceFrame.corner.y]
            );
            let expectedRowLength = sourceFrame.size.y;
            let expectedColumnLength = sourceFrame.size.x;

            assert.equal(dataArray[0].length, expectedRowLength);
            assert.equal(dataArray.length, expectedColumnLength);
            assert.equal(dataArray[1][4], "TEST");
            assert.equal(dataArray[3][2], "TEST");
        });
    });
    describe(".putAt()", () => {
        let store = new DataStore();
        let mockSubscriber;
        beforeEach(() => {
            store.clear();
            store.subscribers.clear();
            mockSubscriber = { onDataChanged: sinon.spy() };
            store.subscribers.add(mockSubscriber);
            sinon.stub(store, "persistentPutAt");
        });
        afterEach(() => {
            sinon.restore();
        });
        it("can store a Point in the local cache", () => {
            store.putAt(new Point([1, 10]), "TEST");
            const actual = store._cache["1,10"];
            assert.equal(actual, "TEST");
        });
        it("notifies subscriber by default with correct value", () => {
            store.putAt([2, 3], "TEST");
            expect(mockSubscriber.onDataChanged).to.have.been.calledWith([
                2, 3,
            ]);
        });
        it("does not notify the subscriber when set to false", () => {
            store.putAt([2, 3], "TEST", false);
            expect(mockSubscriber.onDataChanged).to.not.have.been.called;
        });
        it("calls the async version by default", () => {
            store.putAt([2, 3], "TEST");
            expect(store.persistentPutAt).to.have.been.called;
        });
        it("does not call async version if set to false", () => {
            store.putAt([2, 3], "TEST", undefined, false);
            expect(store.persistentPutAt).to.not.have.been.called;
        });
    });
    describe(".getAt()", () => {
        let store = new DataStore();
        beforeEach(() => {
            store._cache["2,3"] = "TEST";
            sinon.stub(store, "persistentGetAt");
        });
        afterEach(() => {
            sinon.restore();
        });
        it("can retrieve a value when given a Point", () => {
            const result = store.getAt(new Point([2, 3]));
            assert.equal(result, "TEST");
        });
        it("can retrieve a value when given a coordinate", () => {
            const result = store.getAt([2, 3]);
            assert.equal(result, "TEST");
        });
        it("calls persistentGetAt if the incoming value is undefined", () => {
            store.getAt([0, 0]);
            expect(store.persistentGetAt).to.have.been.called;
        });
        it("does not call persistentGetAt if there is a store value", () => {
            store.getAt([2, 3]);
            expect(store.persistentGetAt).to.not.have.been.called;
        });
        it("does not call persistentGetAt if value is undefined and argument is false", () => {
            store.getAt([0, 0], false);
            expect(store.persistentGetAt).to.not.have.been.called;
        });
    });
    describe(".loadFromArray()", () => {
        let store = new DataStore();
        let mockSubscriber;
        let dummyData = [
            [1, 4, 7],
            [2, 5, 8],
            [3, 6, 9],
        ];
        beforeEach(() => {
            store.clear();
            store.subscribers.clear();
            mockSubscriber = { onDataChanged: sinon.spy() };
            store.subscribers.add(mockSubscriber);
        });
        it("Loads data correctly at 0,0 by default", async () => {
            await store.loadFromArray(dummyData);

            dummyData.forEach((col, y) => {
                col.forEach((expected, x) => {
                    assert.equal(store._cache[`${x},${y}`], expected);
                });
            });
        });
        it("Loads data correctly at an arbitrary point", async () => {
            const loadLocation = [300, 214];
            await store.loadFromArray(dummyData, loadLocation);

            dummyData.forEach((col, y) => {
                col.forEach((expected, x) => {
                    let key = `${x + loadLocation[0]},${y + loadLocation[1]}`;
                    assert.equal(store._cache[key], expected);
                });
            });
        });
        it("notifies by default with the corrrect information", async () => {
            await store.loadFromArray(dummyData);

            expect(mockSubscriber.onDataChanged).to.have.been.called;
            expect(mockSubscriber.onDataChanged).to.have.been.calledWith(
                [0, 0],
                [2, 2]
            );
        });
        it("does not notify at all if the argument is set to false", async () => {
            await store.loadFromArray(dummyData, [0, 0], false);

            expect(mockSubscriber.onDataChanged).to.not.have.been.called;
        });
    });
    describe(".getDataArray()", () => {
        let store;
        let loadedFrame;
        beforeEach(() => {
            store = new DataStore();
            loadedFrame = new Frame([0, 0], [99, 99]);
            loadedFrame.forEachPoint((aPoint) => {
                store.putAt(aPoint, [aPoint.x, aPoint.y]);
            });
        });
        it("Can retrieve the full contents of the store", async () => {
            const result = await store.getDataArray(
                [loadedFrame.origin.x, loadedFrame.origin.y],
                [loadedFrame.corner.x, loadedFrame.corner.y]
            );

            for (let x = 0; x < result.length; x++) {
                for (let y = 0; y < x.length; y++) {
                    const value = [x, y];
                    assert.isTrue(loadedFrame.contains(value));
                }
            }
        });
        it("Can retrieve partial contents from the store", async () => {
            const innerFrame = new Frame([5, 4], [9, 9]);
            const result = await store.getDataArray(
                [innerFrame.origin.x, innerFrame.origin.y],
                [innerFrame.corner.x, innerFrame.corner.y]
            );

            assert.equal(result.length, 6);
            assert.equal(result[0].length, 5);

            for (let x = 0; x < result.length; x++) {
                for (let y = 0; y < x.length; y++) {
                    const value = [x, y];
                    assert.isTrue(innerFrame.contains(value));
                }
            }
        });

        it("Can retrieve partial contents when requested dimensions overrun the max", async () => {
            const intersectingFrame = new Frame([5, 4], [149, 149]);
            const result = await store.getDataArray(
                [intersectingFrame.origin.x, intersectingFrame.origin.y],
                [intersectingFrame.corner.x, intersectingFrame.corner.y]
            );

            assert.equal(result.length, 146);
            assert.equal(result[0].length, 145);
        });

        it("Retrieves requested size ndArray if store is empty", async () => {
            let store = new DataStore();
            const requestFrame = new Frame([2000, 2000], [2002, 2003]);
            const result = await store.getDataArray(
                [requestFrame.origin.x, requestFrame.origin.y],
                [requestFrame.corner.x, requestFrame.corner.y]
            );

            assert.equal(result.length, 4);
            assert.equal(result[0].length, 3);
        });
    });
    describe(".clear()", () => {
        let store;
        let baseFrame;
        let mockSubscriber;
        beforeEach(() => {
            store = new DataStore();
            baseFrame = new Frame([0, 0], [99, 99]);
            baseFrame.forEachPoint((aPoint) => {
                store.putAt(aPoint, "X");
            });
            mockSubscriber = { onDataChanged: sinon.spy() };
            store.subscribers.add(mockSubscriber);
        });
        it("completely clears the cache when called", () => {
            store.clear();
            expect(store._cache).to.be.empty;
        });
        it("Calls notify by default when cleared", () => {
            store.clear();
            expect(mockSubscriber.onDataChanged).to.have.been.called;
        });
        it("Does not notify if the parameter is set to false", () => {
            store.clear(true, false);
            expect(mockSubscriber.onDataChanged).to.not.have.been.called;
        });
        it("Calls clearAllPersisted by default", () => {
            sinon.stub(store, "clearAllPersisted");
            store.clear();

            expect(store.clearAllPersisted).to.have.been.called;
        });
        it("Does not call clearAllPersisted if the param is false", () => {
            sinon.stub(store, "clearAllPersisted");
            store.clear(false);

            expect(store.clearAllPersisted).to.not.have.been.called;
        });
    });
    describe(".clearData()", () => {
        let store;
        let baseFrame;
        let mockSubscriber;
        beforeEach(() => {
            store = new DataStore();
            baseFrame = new Frame([0, 0], [99, 99]);
            baseFrame.forEachPoint((aPoint) => {
                store.putAt(aPoint, "X");
            });
            mockSubscriber = { onDataChanged: sinon.spy() };
            store.subscribers.add(mockSubscriber);
        });
        it("correctly clears out a subsection of the store", () => {
            const frameToClear = new Frame([5, 5], [10, 10]);
            store.clearData(
                [frameToClear.origin.x, frameToClear.origin.y],
                [frameToClear.corner.x, frameToClear.corner.y]
            );

            // Store should not hold any values for the
            // points in the cleared frame
            frameToClear.forEachPoint((aPoint) => {
                const key = `${aPoint.x},${aPoint.y}`;
                assert.equal(undefined, store._cache[key]);
            });
        });
        it("correctly retains values outside of the area that was cleared", () => {
            const frameToClear = new Frame([5, 5], [10, 10]);
            store.clearData(
                [frameToClear.origin.x, frameToClear.origin.y],
                [frameToClear.corner.x, frameToClear.corner.y]
            );

            // Store should still hold values for points
            // outside the cleared frame
            baseFrame.points
                .filter((basePoint) => {
                    return !frameToClear.contains(basePoint);
                })
                .forEach((aPoint) => {
                    const key = `${aPoint.x},${aPoint.y}`;
                    assert.equal("X", store._cache[key]);
                });
        });
        it("notifies by default with the correct values", () => {
            const clearedOrigin = [1, 1];
            const clearedCorner = [4, 4];
            store.clearData(clearedOrigin, clearedCorner);

            expect(mockSubscriber.onDataChanged).to.have.been.calledWith(
                clearedOrigin,
                clearedCorner
            );
        });
        it("Does not notify when the argument to do so is false", () => {
            const clearedOrigin = [1, 1];
            const clearedCorner = [4, 4];
            store.clearData(clearedOrigin, clearedCorner, false);

            expect(mockSubscriber.onDataChanged).to.not.have.been.called;
        });
        it("Calls the asynchronous persistedClearData by default with correct params", () => {
            const clearedOrigin = [1, 1];
            const clearedCorner = [4, 4];
            sinon.stub(store, "clearPersistedData");

            store.clearData(clearedOrigin, clearedCorner);

            expect(store.clearPersistedData).to.have.been.calledWith(
                clearedOrigin,
                clearedCorner,
                true
            );
        });
        it("Does not call clearPersistedData when the param is false", () => {
            const clearedOrigin = [1, 1];
            const clearedCorner = [4, 4];
            sinon.stub(store, "clearPersistedData");

            store.clearData(clearedOrigin, clearedCorner, true, false);

            expect(store.clearPersistedData).to.not.have.been.called;
        });
    });
    describe(".getMax", () => {
        let store = new DataStore();
        before(() => {
            store.putAt(new Point([70, 124]), "TEST");
        });
        it("returns the correct max stored value", async () => {
            const expected = [70, 124];
            const actual = await store.getMax();

            assert.equal(expected[0], actual[0]);
            assert.equal(expected[1], actual[1]);
        });
    });

    describe(".getMax (loadFromArray case)", () => {
        let store = new DataStore();
        before(async () => {
            const data = [];
            for(let rowNum = 1; rowNum <= 1000; rowNum++){
                let row = [];
                for(let charCode = 65; charCode <= 90; charCode++){
                    row.push(`${String.fromCharCode(charCode)}${rowNum}`);
                }
                data.push(row);
            }
            await store.loadFromArray(data, [0, 0]);
        });
        it("returns the correct max stored value", async () => {
            const expected = [25, 999];
            const actual = await store.getMax();

            assert.deepEqual(expected, actual);
        });
    });
});

after(() => {
    resetDOM();
});
