import sinon from "sinon";
import chai from "chai";
import { expect } from "chai";
import "../src/GridSheet.js";
import { Point } from "../src/Point.js";
import { DataFrame } from "../src/DataFrame.js";
const assert = chai.assert;

describe("GridSheet Element Tests", () => {
    describe("Resize Custom Event Handling", () => {
        const handler = sinon.spy();
        let gridElement = document.createElement("my-grid");
        before(() => {
            document.body.append(gridElement);
            gridElement.addEventListener("data-frame-resized", handler);
        });

        after(() => {
            gridElement.removeEventListener("data-frame-resized", handler);
            gridElement.remove();
        });
        it("sheet element dataFrame has callback attached", () => {
            assert.exists(gridElement.dataFrame.callback);
        });
        it("updates the dataFrame to a larger size, as needed", async () => {
            const newData = await new DataFrame(
                [0, 0],
                [
                    gridElement.dataFrame.corner.x + 10,
                    gridElement.dataFrame.corner.y + 15,
                ]
            ).toArray();
            await gridElement.dataFrame.loadFromArray(newData);
            assert.equal(gridElement.dataFrame.corner.x, 1010);
            assert.equal(gridElement.dataFrame.corner.y, 1015);
        });
        it("calls the handler when loaded data expands the dataFrame", () => {
            assert.isTrue(handler.calledOnce);
        });
    });
    describe("Can clear the primary selector using Delete key", () => {
        let gridElement;
        beforeEach(() => {
            gridElement = document.createElement("my-grid");
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
                assert.equal(gridElement.dataFrame.at(aPoint), undefined);
            });
        });
        it("should delete 0,0 to 50,50 on Backspace keydown", () => {
            const keyEvent = new KeyboardEvent("keydown", { key: "Backspace" });
            gridElement.dispatchEvent(keyEvent);

            assert.isFalse(gridElement.selector.selectionFrame.isEmpty);
            gridElement.selector.selectionFrame.forEachPoint((aPoint) => {
                assert.equal(gridElement.dataFrame.at(aPoint), undefined);
            });
        });
    });
});

after(() => {
    resetDOM();
});
