import { SelectionElement } from "./SelectionElement.js";

class LockedRowsElement extends SelectionElement {
    constructor() {
        super();
    }

    updateFromSelector(aSelector) {
        this.updateFromRelativeFrame(
            aSelector.primaryFrame.relativeLockedRowsFrame
        );
        this.updateFromViewFrame(aSelector.primaryFrame.lockedRowsFrame);
    }
}

class LockedColumnsElement extends SelectionElement {
    constructor() {
        super();
    }

    updateFromSelector(aSelector) {
        this.updateFromRelativeFrame(
            aSelector.primaryFrame.relativeLockedColumnsFrame
        );
        this.updateFromViewFrame(aSelector.primaryFrame.lockedColumnsFrame);
    }
}

export { LockedRowsElement, LockedColumnsElement };
