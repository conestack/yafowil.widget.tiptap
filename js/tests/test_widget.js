import {TiptapWidget} from '../src/widget.js';
import $ from 'jquery';

let elem = $('<div/>').addClass('tiptap-editor');
let widget;

QUnit.module('TiptapWidget', hooks => {

    hooks.before(() => {
        $('body').append('<div id="container" />');
    });
    hooks.beforeEach(() => {
        $('#container').append(elem);
    });
    // hooks.afterEach(() => {
    //     $('#container').empty();
    //     widget = null;
    // });
    // hooks.after(() => {
    //     $('#container').empty().remove();
    // });

    QUnit.test('initialize', assert => {
        assert.ok(true)
        TiptapWidget.initialize();
        widget = elem.data('tiptap-widget');
        console.log(widget.elem)
    });
});