import sinon from "sinon";
import chai from "chai";
import { expect } from "chai";
import "../src/GridSheet.js";
import Frame from "../src/Frame.js";
import { Point } from "../src/Point.js";
import { IdiotDataStore } from "../src/IdiotDataStore.js";
import DataStore from "../src/DataStore.js";
const assert = chai.assert;

const sleep = (milliseconds) => {
    return new Promise((resolve) => {
        setTimeout(resolve, milliseconds);
    });
};

describe("#setDataStore tests", () => {
    let gridElement;
    let initialDataStore;
    let stub;
    before(() => {
        gridElement = document.createElement("my-grid");
        document.body.append(gridElement);
    });

    beforeEach(() => {
        gridElement.setAttribute("rows", 12);
        gridElement.setAttribute("columns", 3);
        initialDataStore = gridElement.dataStore;
    });

    after(() => {
        resetDOM();
    });

    afterEach(() => {
        if (stub && stub.restore) {
            stub.restore();
        }
    });

    it("Renders the sheet with a plain DataStore", () => {
        expect(gridElement.dataStore.constructor).to.equal(DataStore);
        expect(gridElement.dataStore.isReady).to.equal(true);
    });

    it("Calls #detach on old dataStore when setting a new one", async () => {
        stub = sinon.stub(initialDataStore.detach);
        await gridElement.setDataStore(new DataStore());

        await sleep(60);
        expect(stub.calledOnce);
        expect(initialDataStore.isReady).to.equal(false);
    });

    it("Calls #init on new dataStore when setting a new one", async () => {
        const newStore = new DataStore();
        stub = sinon.stub(newStore.init);

        await gridElement.setDataStore(newStore);

        expect(stub.calledOnce);
    });

    it("Calls render once the new datastore has initialized", async () => {
        const expectedContent = "💩";
        let cellElements = Array.from(
            gridElement.querySelectorAll("sheet-cell")
        );
        stub = sinon.stub(gridElement.render);

        cellElements.forEach((element) => {
            expect(element.textContent).to.not.equal(expectedContent);
        });

        await gridElement.setDataStore(new IdiotDataStore(expectedContent));

        expect(gridElement.dataStore.constructor).to.equal(IdiotDataStore);
        expect(stub.calledTwice);
        expect(gridElement.dataStore.isReady).to.equal(true);
    });
});
