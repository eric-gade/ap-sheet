/**
 * APSheet DataFrame Generic Tests
 * ------------------------------------
 */
import { Frame } from "../src/Frame.js";
import { DataStore } from "../src/DataStore.js";
import { Point } from "../src/Point.js";
import chai from "chai";
const assert = chai.assert;

describe("DataStore Generic Tests", () => {
    let testStore = new DataStore();
    let sourceFrame = new Frame([0, 0], [10, 10]);
    beforeEach(() => {
        testStore.clear();
    });
    it(".getDataArray() should produce only the full frame dim array (non-strict)", async () => {
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
        sourceFrame.putAt([4, 1], "TEST");
        sourceFrame.putAt([2, 3], "TEST");
        let dataArray = await testStore.getDataArray(
            sourceFrame.origin,
            sourceFrame.corner
        );
        let expectedRowLength = sourceFrame.size.y;
        let expectedColumnLength = sourceFrame.size.x;
        assert.equal(dataArray[0].length, expectedRowLength);
        assert.equal(dataArray.length, expectedColumnLength);
    });
});

after(() => {
    resetDOM();
});
