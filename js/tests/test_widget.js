import {TiptapWidget} from '../src/widget.js';
import $ from 'jquery';

function create_elem() {
    let elem = $('<div/>').addClass('tiptap-editor');
    let textarea = $('<textarea />')
        .text('<p>Hello World!</p>')
        .appendTo(elem);

    return elem;
}
let widget;

QUnit.module('TiptapWidget', hooks => {
    let elem;

    hooks.before(() => {
        $('body').append('<div id="container" />');
    });
    hooks.beforeEach(() => {
        elem = create_elem();
        $('#container').append(elem);
    });
    hooks.afterEach(() => {
        elem.removeAttr('tiptap-actions');
        $('#container').empty();
        widget = null;
    });
    hooks.after(() => {
        $('#container').empty().remove();
    });

    QUnit.test('initialize/construct', assert => {
        // set data attr
        elem.data('tiptap-actions', ['bold']);

        TiptapWidget.initialize();
        widget = elem.data('tiptap-widget');
        assert.deepEqual(widget.elem, elem);
        assert.true(widget.textarea.is('textarea', elem));
        assert.strictEqual(widget.textarea.text(), widget.editor.getHTML());
        assert.true(widget.controls.is('div.tiptap-controls', elem));
        assert.true(widget.editor instanceof tiptap.Editor);

        assert.ok(widget.buttons.bold);
    });

    QUnit.test('initialize/construct no textarea', assert => {
        // set data attr
        elem.data('tiptap-actions', ['bold']);

        elem.empty();
        TiptapWidget.initialize();
        widget = elem.data('tiptap-widget');
        assert.deepEqual(widget.elem, elem);
        assert.true(widget.textarea.is('textarea', elem));
    });

    QUnit.test('destroy', assert => {
        // set data attr
        elem.data('tiptap-actions', ['bold']);

        TiptapWidget.initialize();
        widget = elem.data('tiptap-widget');

        widget.destroy();
        assert.strictEqual($('> *', widget.elem).length, 0);
        assert.notOk(widget.buttons);
    });

    QUnit.test('unload_all', assert => {
        // set data attr
        elem.data('tiptap-actions', [
            'heading'
        ]);
        TiptapWidget.initialize();
        widget = elem.data('tiptap-widget');

        widget.buttons.heading.dd_elem.show();
        $('body').trigger('click');
        assert.strictEqual(widget.buttons.heading.dd_elem.css('display'), 'none');

        // unload all buttons
        widget.unload_all();
        widget.buttons.heading.dd_elem.show();
        $('body').trigger('click');
        assert.strictEqual(widget.buttons.heading.dd_elem.css('display'), 'block');
    });

    QUnit.test('filter_actions', assert => {
        widget = new TiptapWidget(elem, {
            actions: [
                'undefinedAction',
                'bold',
                ['underline', 'italic', 'anotherUndefinedAction']
            ]
        });

        assert.notOk(widget.buttons.undefinedAction);
        assert.ok(widget.buttons.bold);
        assert.ok(widget.buttons.italic);
        assert.notOk(widget.buttons.anotherUndefinedAction);
    });

    QUnit.test('on_update', assert => {
        widget = new TiptapWidget(elem, {
            actions: [
                'bulletList',
                'orderedList',
                'heading'
            ]
        });

        let heading_button = widget.buttons.heading;
        let bl_button = widget.buttons.bulletList;
        let ol_button = widget.buttons.orderedList;

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

    QUnit.test('on_selection_update', assert => {
        let opts = {
            actions: [
                'heading',
                'bold',
                'italic',
                'underline',
                'bulletList',
                'orderedList',
                'color'
            ],
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

        let headings = widget.buttons.heading;
        let colors = widget.buttons.color;

        // set to Heading (h1)
        widget.editor.chain().focus().toggleHeading({level: 1}).run();
        widget.editor.commands.setTextSelection(2);
        assert.deepEqual(headings.active_item, headings.children[1]);

        // set to Paragraph and select range
        widget.editor.commands.setParagraph();
        widget.editor.commands.setTextSelection({ from: 0, to: 13 })
        assert.deepEqual(headings.active_item, headings.children[0]);

        // set color
        widget.editor.chain().focus().setColor(`${opts.colors[1].color}`).run();
        widget.editor.commands.setTextSelection(2);
        // we have a "none" option added too, so active item is item #3
        assert.deepEqual(colors.active_item, colors.children[2]);
    });
});