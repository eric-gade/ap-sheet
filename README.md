# APSheet #
A lazy-loading, spreadsheet-like Table

APSheet presents a Table that can be navigated like a spreadsheet, and whose underlying data can be loaded remotely.

## Building and Testing ##
The following build instructions assume a node environment that has already installed the dependencies listed in the [package file located here](../../package.json).

### Build Steps ###
1. Install Mocha globally within your node environment `npm install -g mocha`.
2. Install Webpack globalls within your node environment `npm install -g webpack-cli`
3. Build the bundle from the source files: `webpack`
4. Run the root directory of the repository in a local webserver, for example using `python3 -m http.server`
5. Load the example [webcomponent index page](http://localhost:8000/examples/index.html) (if using Python's `http.server`) in any browser

### Test Steps ###
Follow the build steps above, then run `npm test`

## About Demo Component ##
The Webcomponent (a Custom Element) used by the demo index.html file in this directory is currently only for testing and demonstration purposes
  
## Attribution ##
This repository was forked from a subset of A Priori Investment's [`object_database`](https://github.com/APrioriInvestments/object_database) repository, specfically [this portion](https://github.com/APrioriInvestments/object_database/tree/dev/object_database/web/content/webcomponents/sheet) concerning the sheet component.
