import sinon from "sinon";
import chai from "chai";
import { expect } from "chai";
import "../src/GridSheet.js";
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
        it("updates the dataFrame to a larger size, as needed", () => {
            const newData = new DataFrame(
                [0, 0],
                [
                    gridElement.dataFrame.corner.x + 10,
                    gridElement.dataFrame.corner.y + 15,
                ]
            ).toArray();
            gridElement.dataFrame.loadFromArray(newData);
            assert.equal(gridElement.dataFrame.corner.x, 1010);
            assert.equal(gridElement.dataFrame.corner.y, 1015);
        });
        it("calls the handler when loaded data expands the dataFrame", () => {
            assert.isTrue(handler.calledOnce);
        });
    });
});

after(() => {
    resetDOM();
});
