#!/bin/sh

set -e

./bin/coverage run \
    --source src/yafowil/widget/tiptap \
    --omit src/yafowil/widget/tiptap/example.py \
    -m yafowil.widget.tiptap.tests
./bin/coverage report
./bin/coverage html
