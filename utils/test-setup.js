// Preload file for JSDOM required tests
import { JSDOM } from "jsdom";
import ResizeObserver from "resize-observer-polyfill";

const dom = new JSDOM(
    "<!doctype html><html><head></head>/><body></body>/></html>"
);
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.customElements = dom.window.customElements;
globalThis.CustomEvent = dom.window.CustomEvent;
globalThis.ResizeObserver = ResizeObserver;
