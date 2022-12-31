import sinon from "sinon";
import chai from "chai";
import { expect } from "chai";
import "../src/APSheet.js";
import Frame from "../src/Frame.js";
import { Point } from "../src/Point.js";
import { DataStore } from "../src/DataStore.js";
const assert = chai.assert;

describe.skip("APSheet Element Tests", () => {
    describe("Resize Custom Event Handling", () => {
        const handler = sinon.spy();
        let gridElement = document.createElement("ap-sheet");
        before(() => {
            document.body.append(gridElement);
            gridElement.addEventListener("data-frame-resized", handler);
        });

        after(() => {
            gridElement.removeEventListener("data-frame-resized", handler);
            gridElement.remove();
        });
        it("DataStore has the sheet as a subscriber", () => {
            expect(gridElement.dataStore.subscribers).to.include(gridElement);
        });
        it("updates the baseFrame to a larger size, as needed", async () => {
            const newStore = new DataStore();
            const newFrame = new Frame(
                [0, 0],
                [
                    gridElement.baseFrame.corner.x + 10,
                    gridElement.baseFrame.corner.y + 15,
                ]
            );
            newFrame.forEachPoint((aPoint) => {
                newStore.putAt(aPoint, aPoint);
            });
            const newData = await newStore.getDataArray(
                [newFrame.origin.x, newFrame.origin.y],
                [newFrame.corner.x, newFrame.corner.y]
            );
            const expectedX = gridElement.baseFrame.corner.x + 10;
            const expectedY = gridElement.baseFrame.corner.y + 15;
            await gridElement.dataStore.loadFromArray(newData);

            assert.isTrue(handler.calledOnce);
            assert.equal(gridElement.baseFrame.corner.x, expectedX);
            assert.equal(gridElement.baseFrame.corner.y, expectedY);
        });
        it("calls the handler when loaded data expands the dataStore", () => {
            assert.isTrue(handler.calledOnce);
        });
    });
    describe("Can clear the primary selector using Delete key", () => {
        let gridElement;
        beforeEach(() => {
            gridElement = document.createElement("ap-sheet");
            document.body.append(gridElement);
            gridElement.selector.selectFromAnchorTo(new Point(50, 50));
        });

        afterEach(() => {
            gridElement.remove();
        });

        it("should delete 0,0 to 50,50 on Delete keydown", () => {
            const keyEvent = new KeyboardEvent("keydown", { key: "Delete" });
            gridElement.dispatchEvent(keyEvent);

            assert.isFalse(gridElement.selector.selectionFrame.isEmpty);
            gridElement.selector.selectionFrame.forEachPoint((aPoint) => {
                assert.equal(gridElement.dataStore.at(aPoint), undefined);
            });
        });
        it("should delete 0,0 to 50,50 on Backspace keydown", () => {
            const keyEvent = new KeyboardEvent("keydown", { key: "Backspace" });
            gridElement.dispatchEvent(keyEvent);

            assert.isFalse(gridElement.selector.selectionFrame.isEmpty);
            gridElement.selector.selectionFrame.forEachPoint((aPoint) => {
                assert.equal(gridElement.dataStore.at(aPoint), undefined);
            });
        });
    });
});

after(() => {
    resetDOM();
});
