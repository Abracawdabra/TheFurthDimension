#!/usr/bin/env bash

echo "Cleaning..."
rm -rf ./build

echo
echo "Compiling TypeScript source..."
npm run tsc

echo
echo "Running browserify and minify..."
mkdir -p ./build/release
npm run browserify ./build/Main.js -o ./build/release/TheFurthDimension.js
npm run minify ./build/release/TheFurthDimension

echo
echo "Copying other files and assets"
cp ./src/index.html ./build/release
cp -rf ./assets ./build/release/assets

echo
echo "Finished"
