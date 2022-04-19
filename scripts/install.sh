#!/bin/bash
#
# Install development environment.

set -e

./scripts/clean.sh

if ! which npm &> /dev/null; then
    sudo apt-get install npm
fi

npm --save-dev install \
    qunit \
    karma \
    karma-qunit \
    karma-coverage \
    karma-chrome-launcher \
    karma-viewport \
    karma-module-resolver-preprocessor \
    rollup \
    @rollup/plugin-node-resolve \
    rollup-plugin-cleanup \
    rollup-plugin-terser \
    sass


npm --save install \
    @tiptap/core \
    @tiptap/extension-document \
    @tiptap/extension-paragraph \
    @tiptap/extension-text \
    @tiptap/extension-dropcursor \
    @tiptap/extension-bullet-list \
    @tiptap/extension-ordered-list \
    @tiptap/extension-list-item \
    @tiptap/extension-underline \
    @tiptap/extension-text-style \
    @tiptap/extension-color \
    @tiptap/extension-heading \
    @tiptap/extension-blockquote \
    @tiptap/extension-bold \
    @tiptap/extension-italic \
    @tiptap/extension-code \
    @tiptap/extension-code-block \
    @tiptap/extension-image \
    @tiptap/extension-link


npm --no-save install https://github.com/jquery/jquery#main


python3 -m venv .
./bin/pip install wheel
./bin/pip install coverage
./bin/pip install yafowil[test]
./bin/pip install -e .[test]
