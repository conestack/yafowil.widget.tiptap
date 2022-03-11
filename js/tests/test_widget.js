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
    hooks.afterEach(() => {
        $('#container').empty();
        widget = null;
    });
    hooks.after(() => {
        $('#container').empty().remove();
    });

    QUnit.test.skip('initialize/construct', assert => {
        TiptapWidget.initialize();
        widget = elem.data('tiptap-widget');
        assert.deepEqual(widget.elem, elem);
        assert.true(widget.textarea.is('textarea.ProseMirror', elem));
        assert.true(widget.controls.is('div.tiptap-controls', elem));
        assert.true(widget.editor instanceof tiptap.Editor);
        assert.strictEqual(widget.buttons.length, 15); 
        // buttons.length may change depending on parameters given
        // in initalize() function
        assert.ok(widget.swatches);
    });

    QUnit.test.skip('destroy', assert => {
        TiptapWidget.initialize();
        widget = elem.data('tiptap-widget');

        widget.destroy();
        assert.strictEqual($('> *', widget.elem).length, 0);
        assert.notOk(widget.buttons);
    });

    QUnit.test.skip('unload_all', assert => {
        widget = new TiptapWidget(elem, {heading: true});

        widget.buttons[0].dd_elem.show();
        $('body').trigger('click');
        assert.strictEqual(widget.buttons[0].dd_elem.css('display'), 'none');

        // unload all buttons
        widget.unload_all();
        widget.buttons[0].dd_elem.show();
        $('body').trigger('click');
        assert.strictEqual(widget.buttons[0].dd_elem.css('display'), 'block');
    });

    QUnit.test.skip('on_update', assert => {
        widget = new TiptapWidget(elem, {bullet_list: true, ordered_list: true, heading: true});

        let heading_button = widget.buttons[2];
        let bl_button = widget.buttons[0];
        let ol_button = widget.buttons[1];

        // show heading dropdown
        heading_button.dd_elem.show();

        // trigger click on bl
        bl_button.elem.trigger('click');
        assert.true(bl_button.active);
        assert.strictEqual(heading_button.dd_elem.css('display'), 'none');

        // trigger click on ol
        ol_button.elem.trigger('click');
        assert.true(ol_button.active);
        assert.false(bl_button.active);

        // trigger click on bl
        bl_button.elem.trigger('click');
        assert.true(bl_button.active);
        assert.false(ol_button.active);
    });

    QUnit.test.skip('on_selection_update', assert => {
        let opts = {
            heading: true,
            bold: true,
            italic: true,
            underline: true,
            bullet_list: true,
            ordered_list: true,
            colors: [
                { name: 'Default', color: 'rgb(51, 51, 51)'},
                { name: 'Blue', color: 'rgb(53 39 245)' }
            ]
        }
        widget = new TiptapWidget(elem, opts);

        /*
            Keyboard events are nearly impossible to fully simulate on input
            and textarea elements.
            Instead, we manually trigger selectionUpdate by changing caret
            position in ProseMirror
        */

        let headings = widget.buttons[0];
        let colors = widget.buttons[6];

        // set to Heading (h1)
        widget.editor.chain().focus().toggleHeading({level: 1}).run();
        widget.editor.commands.setTextSelection(2);
        assert.deepEqual(headings.active_item, headings.children[1]);

        // set to Paragraph and select range
        widget.editor.commands.setParagraph();
        widget.editor.commands.setTextSelection({ from: 0, to: 13 })
        assert.deepEqual(headings.active_item, headings.children[0]);

        // set color
        widget.editor.chain().focus().setColor(opts.colors[1].color).run();
        widget.editor.commands.setTextSelection(2);
        assert.deepEqual(colors.active_item, colors.children[1]);
    });
});