/**
 * APSheet GridElementsFrame
 * -------------------------
 * A kind of Frame whose points are made
 * up of elements designed to be used
 * inside of a grid displayed container.
 * It has the capability of mapping rows
 * and columns as needed
 */
import {Frame} from "./Frame.js";
import {
    isCoordinate,
    Point
} from "./Point.js";

class GridElementsFrame extends Frame {
    constructor(origin, corner, options){
        super(origin, corner);
        this.elements = [];
        this.initialBuild();

        // Bind instance methods
        this.initialBuild = this.initialBuild.bind(this);
    }

    initialBuild(){
        this.elements = [];
        this.forEachPointRow((row, rowIndex) => {
            row.forEach(point => {
                let element = document.createElement('div');
                element.setAttribute('data-y', point.y);
                element.setAttribute('data-x', point.x);
                element.setAttribute('data-relative-y', point.y);
                element.setAttribute('data-relative-x', point.x);
                element.point = point;
                this.elements.push(element);
            });
        });
    }

    /**
     * Returns the DOMElement that is mapped
     * to the given Point or coordinate in this
     * Frame.
     * @param {Array|Point} location - An array or
     * Point that should be mapped to a DOMElement.
     * @returns {DOMElement}
     */
    elementAt(location){
        let x, y;
        if(isCoordinate(location)){
            x = location[0];
            y = location[1];
        } else if(location.isPoint){
            x = location.x;
            y = location.y;
        } else {
            return null;
        }
        for(let i = 0; i < this.elements.length; i++){
            let element = this.elements[i];
            if(element.point.x == x && element.point.y == y){
                return element;
            }
        }
        return null;
    }

    /**
     * I respond with the corresponding point
     * of the passed-in element.
     * I will return null in the event
     * that the element is not one of my
     * contained td elements.
     * @param {HTMLElement} anElement - The
     * element for which we want to get the
     * corresponding point. Must be a td
     * element contained within my collection.
     */
    pointAtElement(anElement){
        if(!this.elements.includes(anElement)){
            return null;
        }
        let x = parseInt(anElement.dataset.x);
        let y = parseInt(anElement.dataset.y);
        return new Point([x,y]);
    }

    /**
     * Sets the innerText of the inner content
     * span element at the given location.
     * @param {Array|Point} location - An Array
     * or Point specifying the location of the
     * parent td element in this Frame
     * @param {String} content - The string
     * content to set the innerText as
     * @param {Boolean} allowNewlines - If false,
     * we first remove any newlines from the incoming
     * string, as these tend to mess up CSS styling
     * on sheet cells. Defaults to false.
     */
    setTextContentAt(location, content, allowNewlines=false){
        let el = this.elementAt(location);
        if(el){
            if(allowNewlines){
                el.innerText = content;
            } else {
                let cleanContent = content.split("\n").join("");
                el.innerText = cleanContent;
            }
        }
    }

    // For polymorphic compatibility
    // within PrimaryFrame
    get rowElements(){
        return this.elements;
    }
}

export {
    GridElementsFrame,
    GridElementsFrame as default
};
