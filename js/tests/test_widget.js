import $ from 'jquery';


function create_elem() {
    let elem = $('<div/>').addClass('tiptap-editor');
    let textarea = $('<textarea />')
        .val('<p>Hello World!</p>')
        .appendTo(elem);

    return elem;
}
let widget;

QUnit.module('TiptapWidget', hooks => {
    let elem;
    let TiptapWidget, register_array_subscribers;

    hooks.before(async () => {
        $('body').append('<div id="container" />');

        // dynamic imports
        const tiptap = await import('tiptap');
        window.tiptap = tiptap;

        const modules = await import('../src/default/widget.js');
        TiptapWidget = modules.TiptapWidget;
        register_array_subscribers = modules.register_array_subscribers;
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
        widget = elem.data('yafowil-tiptap');
        assert.deepEqual(widget.elem, elem);
        assert.true(widget.textarea.is('textarea', elem));
        assert.strictEqual(widget.textarea.val(), widget.editor.getHTML());
        assert.true(widget.controls.is('div.tiptap-controls', elem));
        assert.true(widget.editor instanceof tiptap.Editor);

        assert.ok(widget.buttons.bold);
    });

    QUnit.test('initialize/construct no textarea', assert => {
        // set data attr
        elem.data('tiptap-actions', ['bold']);

        elem.empty();
        TiptapWidget.initialize();
        widget = elem.data('yafowil-tiptap');
        assert.deepEqual(widget.elem, elem);
        assert.true(widget.textarea.is('textarea', elem));
    });

    QUnit.test('register_array_subscribers', assert => {
        $('#container').empty();

        let _array_subscribers = {
            on_add: []
        };
    
        // window.yafowil_array is undefined - return
        register_array_subscribers();
        assert.deepEqual(_array_subscribers['on_add'], []);
    
        // patch yafowil_array
        window.yafowil_array = {
            on_array_event: function(evt_name, evt_function) {
                _array_subscribers[evt_name] = evt_function;
            },
            inside_template(elem) {
                return elem.parents('.arraytemplate').length > 0;
            }
        };
        register_array_subscribers();
    
        // create table DOM
        let table = $('<table />')
            .append($('<tr />'))
            .append($('<td />'))
            .appendTo('body');
    
        elem = create_elem();
        $('td', table).addClass('arraytemplate');
        elem.appendTo($('td', table));
        // set data attr
        elem.data('tiptap-actions', ['bold']);

        // invoke array on_add - returns
        _array_subscribers['on_add'].apply(null, $('tr', table));
        let widget = elem.data('yafowil-tiptap');
        assert.notOk(widget);
        $('td', table).removeClass('arraytemplate');
    
        // invoke array on_add
        elem.attr('id', '');
        _array_subscribers['on_add'].apply(null, $('tr', table));
        widget = elem.data('yafowil-tiptap');
        assert.ok(widget);
        table.remove();
        window.yafowil_array = undefined;
        _array_subscribers = undefined;
    });

    QUnit.test('destroy', assert => {
        // set data attr
        elem.data('tiptap-actions', ['bold']);

        TiptapWidget.initialize();
        widget = elem.data('yafowil-tiptap');

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
        widget = elem.data('yafowil-tiptap');

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