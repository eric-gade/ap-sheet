/**
 * APSheet DataFrame data loading/copying tests
 * --------------------------------------------
 * This module tests the loading (from arrays)
 * and projecting (to arrays) of data from a
 * DataFrame
 */
import { Frame } from "../src/Frame.js";
import { DataFrame } from "../src/DataFrame.js";
import { Point } from "../src/Point.js";
import sinon from "sinon";
import chai from "chai";
import { expect } from "chai";
const assert = chai.assert;

// Add a special test case for comparing Points
assert.pointsEqual = function (firstPoint, secondPoint, msg) {
    const test = chai.Assertion(null, null, chai.assert, true);
    test.assert(
        firstPoint.equals(secondPoint),
        `Expected ${firstPoint} to equal ${secondPoint}`,
        `Expected ${firstPoint} to not equal ${secondPoint}`,
        secondPoint,
        firstPoint,
        true
    );
};

describe("DataFrame data tests", () => {
    describe.skip("Basic loadFromArray tests", () => {
        describe("2x3 Source Array", () => {
            let sourceArray = [
                [1, 2, 3],
                [4, 5, 6],
            ];
            let dataFrame = new DataFrame([0, 0], [99, 99]);
            before(async () => {
                await dataFrame.loadFromArray(sourceArray);
            });
            it("Has the correct size", () => {
                assert.isFalse(true);
            });
        });
    });
    describe("Projecting total source frame to dest frame", () => {
        let sourceFrame = new DataFrame([0, 0], [1000, 1000]);
        sourceFrame.forEachPoint((aPoint) => {
            sourceFrame.putAt(aPoint, aPoint);
        });
        let destFrame = new DataFrame([0, 0], [2000, 2000]);
        let desiredSubframe = new Frame([50, 30], [100, 100]);

        it("Can output array data of correct size", async () => {
            let arrayData = await sourceFrame.getDataArrayForFrame(
                desiredSubframe
            );

            assert.equal(arrayData.length, desiredSubframe.size.y);
            assert.equal(arrayData[0].length, desiredSubframe.size.x);
        });

        it("Can load the arrayed data correctly into the dest data frame", async () => {
            let arrayData = await sourceFrame.getDataArrayForFrame(
                desiredSubframe
            );
            await destFrame.loadFromArray(arrayData, desiredSubframe.origin);

            assert.pointsEqual(
                sourceFrame.getAt(desiredSubframe.origin),
                destFrame.getAt(desiredSubframe.origin)
            );

            assert.pointsEqual(
                sourceFrame.getAt(desiredSubframe.corner),
                destFrame.getAt(desiredSubframe.corner)
            );
        });
    });
    describe("copy one frame into another", () => {
        let sourceFrame;
        before(() => {
            sourceFrame = new DataFrame([10, 10], [12, 12]);
            sourceFrame.putAt([10, 10], "TEST_1010");
            sourceFrame.putAt([10, 11], "TEST_1010");
            sourceFrame.putAt([11, 10], "TEST_1110");
            sourceFrame.putAt([11, 11], "TEST_1111");
        });
        it("target frame has the correct value", async () => {
            const targetFrame = new DataFrame([0, 0], [100, 100]);
            const expectedFrame = new DataFrame([0, 0], [100, 100]);
            expectedFrame.putAt([5, 5], "TEST_1010");
            expectedFrame.putAt([5, 6], "TEST_1010");
            expectedFrame.putAt([6, 5], "TEST_1110");
            expectedFrame.putAt([6, 6], "TEST_1111");
            await targetFrame.copyFrom(sourceFrame, [5, 5]);
            assert.deepEqual(expectedFrame.store, targetFrame.store);
        });
        it("target frame has the correct value with default copy from origin", async () => {
            const targetFrame = new DataFrame([0, 0], [100, 100]);
            const expectedFrame = new DataFrame([0, 0], [100, 100]);
            expectedFrame.putAt([0, 0], "TEST_1010");
            expectedFrame.putAt([0, 1], "TEST_1010");
            expectedFrame.putAt([1, 0], "TEST_1110");
            expectedFrame.putAt([1, 1], "TEST_1111");
            await targetFrame.copyFrom(sourceFrame);
            assert.deepEqual(expectedFrame.store, targetFrame.store);
        });
        it("target will throw error if too small to accept copy", async () => {
            const targetFrame = new DataFrame([0, 0], [10, 10]);
            expect(await targetFrame.copyFrom(sourceFrame, [5, 5])).to.throw();
        });
        it("source must be a data frame", async () => {
            const targetFrame = new DataFrame([0, 0], [10, 10]);
            expect(await targetFrame.copyFrom([1, 2, 3])).to.throw();
        });
    });
    describe("Sub-DataFrame", () => {
        let frame;
        before(() => {
            frame = new DataFrame([0, 0], [1000, 1000]);
            frame.putAt([10, 10], "TEST_1010");
            frame.putAt([10, 11], "TEST_1010");
            frame.putAt([11, 10], "TEST_1110");
            frame.putAt([11, 11], "TEST_1111");
        });
        it("Sub-DataFrame has the correct frame and store", async () => {
            const subframe = await frame.getDataSubFrame([10, 10], [20, 20]);
            const expected = new DataFrame([10, 10], [20, 20]);
            expected.putAt([10, 10], "TEST_1010");
            expected.putAt([10, 11], "TEST_1010");
            expected.putAt([11, 10], "TEST_1110");
            expected.putAt([11, 11], "TEST_1111");
            assert.isTrue(expected.equals(subframe));
            assert.deepEqual(expected.store, subframe.store);
        });
        it("Both origin and corner must be in frame to get Sub-DataFrame", async () => {
            expect(
                await frame.getDataSubFrame([10, 10], [2000, 20])
            ).to.throw();
            expect(
                await frame.getDataSubFrame([2000, 10], [2000, 20])
            ).to.throw();
        });
    });
    describe("Operators", () => {
        it("Apply with function that return same value doens't change frame", () => {
            const frame = new DataFrame([0, 0], [100, 100]);
            frame.forEachPoint((p) => {
                frame.putAt(p, p.x + p.y, false);
            });
            const expected = frame.copy();
            expected.store = frame.store;
            frame.apply((item) => {
                return item;
            });
            assert.isTrue(expected.equals(frame));
            assert.deepEqual(expected.store, frame.store);
        });
        it("Apply with a more interesting function", () => {
            const frame = new DataFrame([0, 0], [100, 100]);
            frame.forEachPoint((p) => {
                frame.putAt(p, p.x + p.y, false);
            });
            const expected = new DataFrame([0, 0], [100, 100]);
            expected.forEachPoint((p) => {
                expected.putAt(p, p.x + p.y + "_item", false);
            });
            frame.apply((item) => {
                return item + "_item";
            });
            assert.isTrue(expected.equals(frame));
            assert.deepEqual(expected.store, frame.store);
        });
        it("Add two data frames", () => {
            const frame = new DataFrame([0, 0], [100, 100]);
            frame.forEachPoint((p) => {
                frame.putAt(p, p.x + p.y, false);
            });
            const another = new DataFrame([10, 10], [110, 110]);
            another.forEachPoint((p) => {
                another.putAt(p, "_item", false);
            });
            const expected = new DataFrame([0, 0], [100, 100]);
            expected.forEachPoint((p) => {
                expected.putAt(p, p.x + p.y + "_item", false);
            });
            frame.add(another);
            assert.isTrue(expected.equals(frame));
            assert.deepEqual(expected.store, frame.store);
        });
        it("Must be dimensionally aligned to add", () => {
            const frame = new DataFrame([0, 0], [100, 100]);
            frame.forEachPoint((p) => {
                frame.putAt(p, p.x + p.y, false);
            });
            const another = new DataFrame([10, 10], [100, 100]);
            expect(() => {
                frame.add(another);
            }).to.throw();
        });
    });
    describe("toArray / loadFromArray idempotency", () => {
        let sourceFrame = new DataFrame([0, 0], [1000, 1000]);
        beforeEach(() => {
            sourceFrame.clear();
        });
        it("Has identical store when using defined values (example1)", () => {
            sourceFrame.putAt([4, 1], "TEST");
            sourceFrame.putAt([2, 3], "TEST");
            let dataArray = sourceFrame.toArray();
            let newFrame = new DataFrame(
                sourceFrame.origin,
                sourceFrame.corner
            );
            newFrame.loadFromArray(dataArray);
            assert.deepEqual(newFrame.store, sourceFrame.store);
        });
    });
    describe("loadFromArray callback and resizing", () => {
        it("expands to greater dimension when loading data that goes beyond existing corner", () => {
            let sourceFrame = new DataFrame([0, 0], [30, 30]);
            let newFrame = new DataFrame([0, 0], [20, 20]);
            const callback = sinon.spy();
            newFrame.callback = callback;
            newFrame.loadFromArray(sourceFrame.toArray());
            assert.isTrue(callback.calledOnce);
            assert.isTrue(callback.calledWithMatch(sinon.match.any, true));
            assert.equal(newFrame.corner.x, 30);
            assert.equal(newFrame.corner.y, 30);
        });
        it("expands to greater dimension when 'appending' rows", () => {
            let sourceFrame = new DataFrame([0, 0], [30, 30]);
            let newFrame = new DataFrame([0, 0], [20, 20]);
            const callback = sinon.spy();
            newFrame.callback = callback;
            const origin = [0, 21];
            newFrame.loadFromArray(sourceFrame.toArray(), origin);
            assert.isTrue(callback.calledOnce);
            assert.isTrue(callback.calledWithMatch(sinon.match.any, true));
            assert.equal(newFrame.corner.x, 30);
            assert.equal(newFrame.corner.y, 51);
        });
        it("expands to greater dimension when 'appending' columns", () => {
            let sourceFrame = new DataFrame([0, 0], [30, 30]);
            let newFrame = new DataFrame([0, 0], [20, 20]);
            const callback = sinon.spy();
            newFrame.callback = callback;
            const origin = [21, 0];
            newFrame.loadFromArray(sourceFrame.toArray(), origin);
            assert.isTrue(callback.calledOnce);
            assert.isTrue(callback.calledWithMatch(sinon.match.any, true));
            assert.equal(newFrame.corner.x, 51);
            assert.equal(newFrame.corner.y, 30);
        });
        it("errors when expanding with gaps", () => {
            let sourceFrame = new DataFrame([0, 0], [30, 30]);
            let newFrame = new DataFrame([0, 0], [20, 20]);
            const callback = sinon.spy();
            newFrame.callback = callback;
            const origin = [22, 0];
            expect(() => {
                newFrame.loadFromArray(sourceFrame.toArray(), origin);
            }).to.throw();
        });
    });
});

after(() => {
    resetDOM();
});
