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
        it.skip("calls persistenPutRowsAt() under the hood", () => {});
    });
    describe.skip(".getDataArray()", () => {});
    describe.skip(".clear()", () => {});
    describe.skip(".clearData()", () => {});
    describe.skip(".getMax", () => {});
});

after(() => {
    resetDOM();
});
