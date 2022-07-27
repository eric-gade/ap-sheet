// Experimental Selection web component
import {Frame} from './Frame.js';

const templateString = `
<style>
    :host {
        --col-start-name: cell-col-start;
        --row-start-name: cell-row-start;
        --col-start: 1;
        --col-end: 1;
        --row-start: 1;
        --row-end: 1;
        grid-column: var(--col-start-name) var(--col-start) / var(--col-start-name) var(--col-end);
        grid-row: var(--row-start-name) var(--row-start) / var(--row-start-name) var(--row-end);
        grid-row: var(--row-start-name) var(--row-start) / span var(--row-end);
        grid-column: var(--col-start-name) var(--col-start) / span var(--col-end);
        background-color: rgba(0, 0, 100, 0.5);
        pointer-events: none;
    }
    :host(.empty){
        display: none;
    }
</style>
`;

class SelectionElement extends HTMLElement {
    constructor(){
        super();
        this.template = document.createElement('template');
        this.template.innerHTML = templateString;
        this.attachShadow({mode: 'open'});
        this.shadowRoot.append(
            this.template.content.cloneNode(true)
        );

        this.viewFrame = new Frame([0,0], [0,0]);
        this.relativeFrame = new Frame([0,0], [0,0]);


        // Bind instance methods
        this.updateGridPosition = this.updateGridPosition.bind(this);
        this.updateFromViewFrame = this.updateFromViewFrame.bind(this);
        this.updateFromRelativeFrame = this.updateFromRelativeFrame.bind(this);
        this.updateFromRelativeCoordinates = this.updateFromRelativeCoordinates.bind(this);
        this.updateFromSelector = this.updateFromSelector.bind(this);
        this.hide = this.hide.bind(this);
        this.show = this.show.bind(this);
    }

    attributeChangedCallback(name, oldVal, newVal){
        let needsGridUpdate = true;
        if(name == 'corner-x'){
            this.viewFrame.corner.x = parseInt(newVal);
        } else if(name == 'corner-y'){
            this.viewFrame.corner.y = parseInt(newVal);
        } else if(name == 'origin-x'){
            this.viewFrame.origin.x = parseInt(newVal);
        } else if(name == 'origin-y'){
            this.viewFrame.origin.y = parseInt(newVal);
        } else if(name == 'data-origin-x'){
            this.relativeFrame.origin.x = parseInt(newVal);
        } else if(name == 'data-origin-y'){
            this.relativeFrame.origin.y = parseInt(newVal);
        } else if(name == 'data-corner-x'){
            this.relativeFrame.corner.x = parseInt(newVal);
        } else if(name == 'data-corner-y'){
            this.relativeFrame.corner.y = parseInt(newVal);
        } else {
            needsGridUpdate = false;
        }
        if(needsGridUpdate){
            this.updateGridPosition();
        }
    }

    updateGridPosition(){
        // Set the appropriate CSS variables
        // such that this element will be laid out
        // in the correct places on a sheet cell grid
        if(this.viewFrame.isEmpty){
            this.classList.add('empty');
            return;
        }
        this.classList.remove('empty');
        //let frame = this.viewFrame.intersection(this.relativeFrame);
        let frame = this.viewFrame;
        this.style.setProperty('--col-start', frame.origin.x + 1);
        this.style.setProperty('--col-end', frame.size.x + 1);
        this.style.setProperty('--row-start', frame.origin.y + 1);
        this.style.setProperty('--row-end', frame.size.y + 1);
    }

    updateFromViewFrame(aFrame){
        if(aFrame === null){
            this.viewFrame.isEmpty = true;
            return;
        }
        this.viewFrame.corner.x = aFrame.corner.x;
        this.viewFrame.corner.y = aFrame.corner.y;
        this.viewFrame.origin.x = aFrame.origin.x;
        this.viewFrame.origin.y= aFrame.origin.y;
        this.viewFrame.isEmpty = aFrame.isEmpty;
        this.setAttribute('corner-x', aFrame.corner.x);
        this.setAttribute('corner-y', aFrame.corner.y);
        this.setAttribute('origin-x', aFrame.origin.x);
        this.setAttribute('origin-y', aFrame.origin.y);
    }

    updateFromRelativeFrame(aFrame){
        if(aFrame === null){
            this.relativeFrame.isEmpty = true;
            return;
        }
        this.relativeFrame.corner.x = aFrame.corner.x;
        this.relativeFrame.corner.y = aFrame.corner.y;
        this.relativeFrame.origin.x = aFrame.origin.x;
        this.relativeFrame.origin.y= aFrame.origin.y;
        this.relativeFrame.isEmpty = aFrame.isEmpty;
        this.setAttribute('data-corner-x', aFrame.corner.x);
        this.setAttribute('data-corner-y', aFrame.corner.y);
        this.setAttribute('data-origin-x', aFrame.origin.x);
        this.setAttribute('data-origin-y', aFrame.origin.y);
    }

    /* I take (data frame) relative coordinates, update the relative frame
       and the view frame for the data which is currently in view
       */
    updateFromRelativeCoordinates(origin, corner){
        const frame = new Frame(origin, corner);
        // this is part of the (data) frame those data is in view
        const relativeViewFrame = this.parentNode.host.primaryFrame.relativeViewFrame.intersection(frame);
        if(!relativeViewFrame.isEmpty){
            this.updateFromRelativeFrame(frame);
            const originX = this._getViewCoordinate(relativeViewFrame.origin.x, "x"); 
            const originY = this._getViewCoordinate(relativeViewFrame.origin.y, "y");
            const cornerX = this._getViewCoordinate(relativeViewFrame.corner.x, "x");
            const cornerY = this._getViewCoordinate(relativeViewFrame.corner.y, "y");
            const viewFrame = new Frame([originX, originY], [cornerX, cornerY]);
            this.updateFromViewFrame(viewFrame);
        }
    }

    updateFromSelector(aSelector){
        this.updateFromRelativeFrame(aSelector.primaryFrame.relativeViewFrame);
        this.updateFromViewFrame(aSelector.selectionFrame);
    }

    hide(){
        this.classList.add('empty');
    }

    show(){
        this.classList.remove('empty');
    }

    _getViewCoordinate(c, which){
        const cell = this.parentNode.host.querySelector(`sheet-cell[data-relative-${which}="${c}"]`);
        if(cell){
            return cell.getAttribute(`data-${which}`);
        }
        return null;
    }

    static get observedAttributes(){
        return [
            'origin-x',
            'origin-y',
            'corner-x',
            'corner-y',
            'data-origin-x',
            'data-origin-y',
            'data-corner-x',
            'data-corner-y'
        ];
    }
};

export {
    SelectionElement,
    SelectionElement as default
};
