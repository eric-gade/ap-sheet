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
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);

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
    describe("Projecting total source frame to dest frame", () => {
        let sourceFrame = new DataFrame([0, 0], [1000, 1000]);
        sourceFrame.forEachPoint(async (aPoint) => {
            await sourceFrame.putAt(aPoint, aPoint);
        });
        let destFrame = new DataFrame([0, 0], [2000, 2000]);
        let desiredSubframe = new Frame([50, 30], [100, 100]);

        it("Can output array data of correct size", async () => {
            let arrayData = await sourceFrame.getDataArrayForFrame(
                desiredSubframe
            );

            assert.equal(arrayData.length, desiredSubframe.size.y + 1);
            assert.equal(arrayData[0].length, desiredSubframe.size.x + 1);
        });

        it("Can load the arrayed data correctly into the dest data frame", async () => {
            let arrayData = await sourceFrame.getDataArrayForFrame(
                desiredSubframe
            );
            await destFrame.loadFromArray(arrayData, desiredSubframe.origin);

            assert.pointsEqual(
                await sourceFrame.getAt(desiredSubframe.origin),
                await destFrame.getAt(desiredSubframe.origin)
            );

            assert.pointsEqual(
                await sourceFrame.getAt(desiredSubframe.corner),
                await destFrame.getAt(desiredSubframe.corner)
            );
        });
    });
    describe("copy one frame into another", () => {
        let sourceFrame;
        before(async () => {
            sourceFrame = new DataFrame([10, 10], [12, 12]);
            await sourceFrame.putAt([10, 10], "TEST_1010");
            await sourceFrame.putAt([10, 11], "TEST_1010");
            await sourceFrame.putAt([11, 10], "TEST_1110");
            await sourceFrame.putAt([11, 11], "TEST_1111");
        });
        it("target frame has the correct value", async () => {
            const targetFrame = new DataFrame([0, 0], [100, 100]);
            const expectedFrame = new DataFrame([0, 0], [100, 100]);
            await expectedFrame.putAt([5, 5], "TEST_1010");
            await expectedFrame.putAt([5, 6], "TEST_1010");
            await expectedFrame.putAt([6, 5], "TEST_1110");
            await expectedFrame.putAt([6, 6], "TEST_1111");
            await targetFrame.copyFrom(sourceFrame, [5, 5]);
            assert.deepEqual(expectedFrame.store, targetFrame.store);
        });
        it("target frame has the correct value with default copy from origin", async () => {
            const targetFrame = new DataFrame([0, 0], [100, 100]);
            const expectedFrame = new DataFrame([0, 0], [100, 100]);
            await expectedFrame.putAt([0, 0], "TEST_1010");
            await expectedFrame.putAt([0, 1], "TEST_1010");
            await expectedFrame.putAt([1, 0], "TEST_1110");
            await expectedFrame.putAt([1, 1], "TEST_1111");
            await targetFrame.copyFrom(sourceFrame);
            assert.deepEqual(expectedFrame.store, targetFrame.store);
        });
        it("target will throw error if too small to accept copy", async () => {
            const targetFrame = new DataFrame([0, 0], [10, 10]);
            await expect(targetFrame.copyFrom(sourceFrame, [5, 5])).to.be
                .rejected;
        });
        it("source must be a data frame", async () => {
            const targetFrame = new DataFrame([0, 0], [10, 10]);
            await expect(targetFrame.copyFrom([1, 2, 3])).to.be.rejected;
        });
    });
    describe("Sub-DataFrame", () => {
        const frame = new DataFrame([0, 0], [1000, 1000]);
        before(async () => {
            await frame.putAt([10, 10], "TEST_1010");
            await frame.putAt([10, 11], "TEST_1010");
            await frame.putAt([11, 10], "TEST_1110");
            await frame.putAt([11, 11], "TEST_1111");
        });
        it("Sub-DataFrame has the correct frame and store", async () => {
            const subframe = await frame.getDataSubFrame([10, 10], [20, 20]);
            const expected = new DataFrame([10, 10], [20, 20]);
            await expected.putAt([10, 10], "TEST_1010");
            await expected.putAt([10, 11], "TEST_1010");
            await expected.putAt([11, 10], "TEST_1110");
            await expected.putAt([11, 11], "TEST_1111");
            assert.isTrue(expected.equals(subframe));
            assert.deepEqual(expected.store, subframe.store);
        });
        it("Both origin and corner must be in frame to get Sub-DataFrame", async () => {
            await expect(frame.getDataSubFrame([10, 10], [2000, 20])).to.be
                .rejected;
            await expect(frame.getDataSubFrame([2000, 10], [2000, 20])).to.be
                .rejected;
        });
    });
    describe("Operators", () => {
        it("Apply with function that return same value doens't change frame", async () => {
            const frame = new DataFrame([0, 0], [100, 100]);
            frame.forEachPoint(async (p) => {
                await frame.putAt(p, p.x + p.y, false);
            });
            const expected = frame.copy();
            expected.store = frame.store;
            await frame.apply((item) => {
                return item;
            });
            assert.isTrue(expected.equals(frame));
            assert.deepEqual(expected.store, frame.store);
        });
        it("Apply with a more interesting function", async () => {
            const frame = new DataFrame([0, 0], [100, 100]);
            frame.forEachPoint(async (p) => {
                await frame.putAt(p, p.x + p.y, false);
            });
            const expected = new DataFrame([0, 0], [100, 100]);
            expected.forEachPoint(async (p) => {
                await expected.putAt(p, p.x + p.y + "_item", false);
            });
            await frame.apply((item) => {
                return item + "_item";
            });
            assert.isTrue(expected.equals(frame));
            assert.deepEqual(expected.store, frame.store);
        });
        it("Add two data frames", async () => {
            const frame = new DataFrame([0, 0], [100, 100]);
            frame.forEachPoint(async (p) => {
                await frame.putAt(p, p.x + p.y, false);
            });
            const another = new DataFrame([10, 10], [110, 110]);
            another.forEachPoint(async (p) => {
                await another.putAt(p, "_item", false);
            });
            const expected = new DataFrame([0, 0], [100, 100]);
            expected.forEachPoint(async (p) => {
                await expected.putAt(p, p.x + p.y + "_item", false);
            });
            await frame.add(another);
            assert.isTrue(expected.equals(frame));
            assert.deepEqual(expected.store, frame.store);
        });
        it("Must be dimensionally aligned to add", async () => {
            const frame = new DataFrame([0, 0], [100, 100]);
            frame.forEachPoint(async (p) => {
                await frame.putAt(p, p.x + p.y, false);
            });
            const another = new DataFrame([10, 10], [100, 100]);
            await expect(frame.add(another)).to.be.rejected;
        });
    });
    describe("toArray / loadFromArray idempotency", () => {
        let sourceFrame = new DataFrame([0, 0], [1000, 1000]);
        beforeEach(() => {
            sourceFrame.clear();
        });
        it("Has identical store when using defined values (example1)", async () => {
            await sourceFrame.putAt([4, 1], "TEST");
            await sourceFrame.putAt([2, 3], "TEST");
            let dataArray = await sourceFrame.toArray();
            let newFrame = new DataFrame(
                sourceFrame.origin,
                sourceFrame.corner
            );
            await newFrame.loadFromArray(dataArray);
            assert.deepEqual(newFrame.store, sourceFrame.store);
        });
    });
    describe("loadFromArray callback and resizing", () => {
        it("expands to greater dimension when loading data that goes beyond existing corner", async () => {
            let sourceFrame = new DataFrame([0, 0], [30, 30]);
            let newFrame = new DataFrame([0, 0], [20, 20]);
            const callback = sinon.spy();
            newFrame.callback = callback;
            await newFrame.loadFromArray(await sourceFrame.toArray());
            assert.isTrue(callback.calledOnce);
            assert.isTrue(callback.calledWithMatch(sinon.match.any, true));
            assert.equal(newFrame.corner.x, 30);
            assert.equal(newFrame.corner.y, 30);
        });
    });
});

after(() => {
    resetDOM();
});
