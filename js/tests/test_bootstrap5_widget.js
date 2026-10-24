import bootstrap from 'bootstrap';
import $ from 'jquery';

function create_elem() {
    const elem = $('<div/>').addClass('tiptap-editor');
    $('<textarea />').val('<p>Hello World!</p>').appendTo(elem);
    return elem;
}

QUnit.module('bootstrap5 TiptapWidget', (hooks) => {
    let elem, widget;
    let TiptapWidget, register_array_subscribers;

    hooks.before(async () => {
        $('body').append('<div id="container" />');

        // dynamic imports
        const tiptap = await import('tiptap');
        window.tiptap = tiptap;

        const modules = await import('../src/bootstrap5/widget.js');
        TiptapWidget = modules.TiptapWidget;
        register_array_subscribers = modules.register_array_subscribers;
    });
    hooks.beforeEach(() => {
        elem = create_elem();
        $('#container').append(elem);
    });
    hooks.afterEach(() => {
        if (widget && !widget.editor.isDestroyed) {
            widget.destroy();
        }
        widget = null;
        $('#container').empty();
    });
    hooks.after(() => {
        $('#container').empty().remove();
    });

    QUnit.test('initialize/construct', (assert) => {
        elem.data('tiptap-actions', ['bold']);

        TiptapWidget.initialize();
        widget = elem.data('yafowil-tiptap');
        assert.deepEqual(widget.elem, elem);
        assert.true(widget.controls.is('div.tiptap-controls.btn-toolbar.mb-2', elem));
        assert.strictEqual(widget.controls.attr('role'), 'toolbar');
        assert.true(widget.textarea.is('textarea.m-0.form-control', elem));
        assert.strictEqual(widget.textarea.val(), widget.editor.getHTML());
        assert.true(widget.editor instanceof tiptap.Editor);
        assert.true(widget.editarea.is('div.ProseMirror.form-control'));
        assert.notOk(widget.helpLink);
        assert.ok(widget.buttons.bold);
    });

    QUnit.test('initialize/construct no textarea', (assert) => {
        elem.data('tiptap-actions', ['bold']);

        elem.empty();
        TiptapWidget.initialize();
        widget = elem.data('yafowil-tiptap');
        assert.deepEqual(widget.elem, elem);
        assert.true(widget.textarea.is('textarea.tiptap-editor.m-0.form-control', elem));
    });

    QUnit.test('register_array_subscribers', (assert) => {
        const array_subscribers = {};

        // window.yafowil_array is undefined - return
        register_array_subscribers();
        assert.deepEqual(array_subscribers, {});

        // patch yafowil_array
        window.yafowil_array = {
            on_array_event: (evt_name, evt_function) => {
                array_subscribers[evt_name] = evt_function;
            },
            inside_template(elem) {
                return elem.parents('.arraytemplate').length > 0;
            },
        };
        register_array_subscribers();

        const table = $('<table />').append($('<tr />')).append($('<td />')).appendTo('body');
        const array_elem = create_elem();
        $('td', table).addClass('arraytemplate');
        array_elem.appendTo($('td', table));
        array_elem.data('tiptap-actions', ['bold']);

        // invoke array on_add - returns
        array_subscribers.on_add({}, table);
        assert.notOk(array_elem.data('yafowil-tiptap'));
        $('td', table).removeClass('arraytemplate');

        // invoke array on_add
        array_subscribers.on_add({}, table);
        const array_widget = array_elem.data('yafowil-tiptap');
        assert.true(array_widget instanceof TiptapWidget);

        array_widget.destroy();
        table.remove();
        window.yafowil_array = undefined;
    });

    QUnit.test('treibstoff integration', (assert) => {
        const attached = [];
        window.ts = {
            ajax: {
                attach: (inst, elem) => {
                    attached.push([inst, elem]);
                },
            },
        };
        try {
            widget = new TiptapWidget(elem, { actions: ['bold'] });
        } finally {
            delete window.ts;
        }
        assert.strictEqual(attached.length, 1);
        assert.strictEqual(attached[0][0], widget);
        assert.strictEqual(attached[0][1], elem);
    });

    QUnit.test('destroy', (assert) => {
        elem.data('tiptap-actions', ['bold', 'heading']);
        TiptapWidget.initialize();
        widget = elem.data('yafowil-tiptap');

        const bold = widget.buttons.bold;
        const heading = widget.buttons.heading;
        const noop = () => {};
        for (const el of [widget.editarea, widget.controls, widget.textarea, widget.elem]) {
            el.on('custom', noop);
        }

        widget.destroy();
        assert.true(widget.editor.isDestroyed);
        assert.strictEqual(elem.data('yafowil-tiptap'), undefined);
        assert.strictEqual(bootstrap.Tooltip.getInstance(bold.container[0]), null);
        assert.strictEqual($._data(bold.elem[0], 'events'), undefined);
        assert.strictEqual($._data(heading.elem[0], 'events'), undefined);
        for (const el of [widget.editarea, widget.controls, widget.textarea, widget.elem]) {
            assert.strictEqual($._data(el[0], 'events'), undefined);
        }
    });

    QUnit.test('unload_all', (assert) => {
        widget = new TiptapWidget(elem, { actions: ['bold', 'heading'] });
        const bold = widget.buttons.bold;
        const heading = widget.buttons.heading;
        assert.ok($._data(bold.elem[0], 'events'));
        assert.ok($._data(heading.elem[0], 'events'));

        widget.unload_all();
        assert.strictEqual($._data(bold.elem[0], 'events'), undefined);
        assert.strictEqual($._data(heading.elem[0], 'events'), undefined);
        for (const child of heading.children) {
            assert.strictEqual($._data(child.elem[0], 'events'), undefined);
        }
    });

    QUnit.test('filter_actions', (assert) => {
        widget = new TiptapWidget(elem, {
            actions: ['undefinedAction', 'bold', ['underline', 'italic', 'anotherUndefinedAction']],
        });

        assert.notOk(widget.buttons.undefinedAction);
        assert.ok(widget.buttons.bold);
        assert.ok(widget.buttons.underline);
        assert.ok(widget.buttons.italic);
        assert.notOk(widget.buttons.anotherUndefinedAction);
    });

    QUnit.test('on_update', (assert) => {
        widget = new TiptapWidget(elem, {
            actions: ['bulletList', 'orderedList', 'heading'],
        });

        const bl_button = widget.buttons.bulletList;
        const ol_button = widget.buttons.orderedList;

        // trigger click on bl
        bl_button.elem.trigger('click');
        assert.true(bl_button.active);
        assert.strictEqual(widget.textarea.val(), widget.editor.getHTML());
        assert.true(widget.textarea.val().startsWith('<ul>'));

        // trigger click on ol
        ol_button.elem.trigger('click');
        assert.true(ol_button.active);
        assert.false(bl_button.active);

        // trigger click on bl
        bl_button.elem.trigger('click');
        assert.true(bl_button.active);
        assert.false(ol_button.active);
    });

    QUnit.test('on_selection_update', (assert) => {
        const opts = {
            actions: [
                'heading',
                'bold',
                'italic',
                'underline',
                'bulletList',
                'orderedList',
                'color',
            ],
            colors: [
                { name: 'Default', color: 'rgb(51, 51, 51)' },
                { name: 'Blue', color: 'rgb(53 39 245)' },
            ],
        };
        widget = new TiptapWidget(elem, opts);

        const headings = widget.buttons.heading;
        const colors = widget.buttons.color;

        // set to Heading (h1)
        widget.editor.chain().focus().toggleHeading({ level: 1 }).run();
        widget.editor.commands.setTextSelection(2);
        assert.deepEqual(headings.active_item, headings.children[1]);

        // set to Paragraph and select range
        widget.editor.commands.setParagraph();
        widget.editor.commands.setTextSelection({ from: 0, to: 13 });
        assert.deepEqual(headings.active_item, headings.children[0]);

        // set color
        widget.editor.chain().focus().setColor(`${opts.colors[1].color}`).run();
        widget.editor.commands.setTextSelection(2);
        // we have a "none" option added too, so active item is item #3
        assert.deepEqual(colors.active_item, colors.children[2]);

        // unset color
        widget.editor.commands.setTextSelection({ from: 0, to: 13 });
        widget.editor.chain().focus().unsetColor().run();
        widget.editor.commands.setTextSelection(2);
        assert.deepEqual(colors.active_item, colors.children[0]);
    });

    QUnit.test('action groups', (assert) => {
        widget = new TiptapWidget(elem, {
            actions: [['bold', 'italic'], ['underline', 'link'], 'code'],
        });

        const groups = $('> div.btn-group.me-2', widget.controls);
        assert.strictEqual(groups.length, 2);
        assert.strictEqual($('> div.action', groups[0]).length, 2);
        assert.strictEqual($('> div.action', groups[1]).length, 2);
        assert.true(widget.buttons.code.container.parent().is(widget.controls));
    });
});
