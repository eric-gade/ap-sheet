#!/bin/bash
for filename in ./tests/*.js; do
    npx mocha --require ./utils/test-setup.js $filename
done
