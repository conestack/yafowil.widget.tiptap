#!/bin/bash
#
# Install development environment.

set -e

./scripts/clean.sh

if ! which npm &> /dev/null; then
    sudo apt-get install npm
fi

npm --prefix . --save-dev install \
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


npm --prefix . --save install \
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


npm --prefix . --no-save install https://github.com/jquery/jquery#main

function install {
    local interpreter=$1
    local target=$2

    if [ -x "$(which $interpreter)" ]; then
        virtualenv --clear -p $interpreter $target
        ./$target/bin/pip install wheel coverage
        ./$target/bin/pip install https://github.com/conestack/webresource/archive/master.zip
        ./$target/bin/pip install https://github.com/conestack/yafowil/archive/master.zip
        ./$target/bin/pip install -e .[test]
    else
        echo "Interpreter $interpreter not found. Skip install."
    fi
}

install python2 py2
install python3 py3
install pypy3 pypy3
