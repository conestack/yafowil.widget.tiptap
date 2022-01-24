import {TiptapWidget} from '../src/widget.js';

let elem = $('<input/>');
let widget;

QUnit.module('TiptapWidget', hooks => {

    hooks.before(() => {
        $('body').append('<div id="container" />');
    });
    hooks.beforeEach(() => {
        $('#container').append(elem);
    });
    hooks.afterEach(() => {
        $('#container').empty();
        widget = null;
    });
    hooks.after(() => {
        $('#container').empty().remove();
    });

    QUnit.test('initialize', assert => {
        assert.ok(true)
        widget = new TiptapWidget(elem);
    });
});