/**
 * APSheet DataFrame Generic Tests
 * ------------------------------------
 */
import jsdomglobal from "jsdom-global";
jsdomglobal();
import {Frame} from "../src/Frame.js";
import {DataFrame} from "../src/DataFrame.js";
import {Point} from "../src/Point.js";
import chai from "chai";
const assert = chai.assert;

describe("DataFrame Generic Tests", () => {
    let sourceFrame = new DataFrame([0,0], [1000, 1000]);
    beforeEach(() => {
        sourceFrame.clear();
    });
    it("Should produce only the minimal data needed when getting data array (from origin)", () => {
        /**
         * We would like to extract only the following Data:
         * [ [0,0] [1,0] [2,0] [3,0] [4,0] [...]
         *   [0,1] [1,1] [2,1] [3,1] [TEST][...]
         *   [0,2] [1,2] [2,2] [3,2] [4,2] [...]
         *   [0,3] [1,3] [TEST][3,3] [4,3] [...]
         *   [...] [...] [...] [...] [...] [...]
         * ]
         * Resulting in:
         * [ [0,0] [1,0] [2,0] [3,0] [4,0]
         *   [0,1] [1,1] [2,1] [3,1] [TEST]
         *   [0,2] [1,2] [2,2] [3,2] [4,2]
         *   [0,3] [1,3] [TEST][3,3] [4,3]
         * ]
         */
        sourceFrame.putAt([4,1], "TEST");
        sourceFrame.putAt([2,3], "TEST");
        let expectedRowLength = 5;
        let expectedColumnLength = 4;
        let dataArray = sourceFrame.getDataArrayForFrame(
            sourceFrame.minFrameFromOrigin
        );
        assert.equal(expectedRowLength, dataArray[0].length);
        assert.equal(expectedColumnLength, dataArray.length);
    });
    it("Should produce only the minimal data needed when getting a data array (strict)", () => {
        /**
         * We would like to extract only the following Data:
         * [ [0,0] [1,0] [2,0] [3,0] [4,0] [...]
         *   [0,1] [1,1] [2,1] [3,1] [TEST][...]
         *   [0,2] [1,2] [2,2] [3,2] [4,2] [...]
         *   [0,3] [1,3] [TEST][3,3] [4,3] [...]
         *   [...] [...] [...] [...] [...] [...]
         * ]
         * Resulting in:
         * [
         *   [2,1] [3,1] [TEST]
         *   [2,2] [3,2] [4,2]
         *   [TEST][3,3] [4,3]
         * ]
         */
        sourceFrame.putAt([4,1], "TEST");
        sourceFrame.putAt([2,3], "TEST");
        let dataArray = sourceFrame.getDataArrayForFrame(
            sourceFrame.minFrame
        );
        let expectedRowLength = 3;
        let expectedColumnLength = 3;
        assert.equal(expectedRowLength, dataArray[0].length);
        assert.equal(expectedColumnLength, dataArray.length);
    });
});
