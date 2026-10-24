import bootstrap from 'bootstrap';
import $ from 'jquery';

function create_elem() {
    const elem = $('<div/>').addClass('tiptap-editor');
    $('<textarea />').text('<p>Hello World!</p>').appendTo(elem);
    return elem;
}

QUnit.module('bootstrap5 Actions', (hooks) => {
    let elem, widget;
    let TiptapWidget, actions;

    hooks.before(async () => {
        $('body').append('<div id="container" />');

        // dynamic imports
        const tiptap = await import('tiptap');
        window.tiptap = tiptap;

        const widget_modules = await import('../src/bootstrap5/widget.js');
        TiptapWidget = widget_modules.TiptapWidget;
        const actions_modules = await import('../src/bootstrap5/actions.js');
        actions = actions_modules.actions;
    });
    hooks.beforeEach(() => {
        elem = create_elem();
        $('#container').append(elem);
    });
    hooks.afterEach(() => {
        if (widget) {
            widget.destroy();
            widget = null;
        }
        $('#container').empty();
    });
    hooks.after(() => {
        $('#container').empty().remove();
    });

    function assert_button(assert, btn, opts) {
        assert.true(btn instanceof actions[opts.name]);
        assert.strictEqual(btn.id, opts.id);
        assert.true($('i', btn.elem).hasClass(`bi-${opts.icon}`));
        assert.strictEqual(Boolean(btn.opts.toggle), opts.toggle);
        assert.strictEqual(btn.container.attr('data-bs-title'), opts.tooltip);
        assert.strictEqual(Boolean(btn.tooltip), opts.tooltip !== undefined);
        if (btn.tooltip) {
            assert.true(btn.tooltip instanceof bootstrap.Tooltip);
        }
    }

    function assert_toggle_mark(assert, btn, mark) {
        assert.notOk(btn.active); // undefined on init
        assert.false(widget.editor.isActive(mark));
        btn.elem.trigger('click');
        assert.true(btn.active);
        assert.true(widget.editor.isActive(mark));
    }

    QUnit.test('Bold', (assert) => {
        widget = new TiptapWidget(elem, { actions: ['bold'] });
        const btn = widget.buttons.bold;
        assert_button(assert, btn, {
            name: 'bold',
            id: 'bold',
            icon: 'type-bold',
            toggle: true,
            tooltip: 'Toggle Bold',
        });
        assert_toggle_mark(assert, btn, 'bold');
    });

    QUnit.test('Italic', (assert) => {
        widget = new TiptapWidget(elem, { actions: ['italic'] });
        const btn = widget.buttons.italic;
        assert_button(assert, btn, {
            name: 'italic',
            id: 'italic',
            icon: 'type-italic',
            toggle: true,
            tooltip: 'Toggle Italic',
        });
        assert_toggle_mark(assert, btn, 'italic');
    });

    QUnit.test('Underline', (assert) => {
        widget = new TiptapWidget(elem, { actions: ['underline'] });
        const btn = widget.buttons.underline;
        assert_button(assert, btn, {
            name: 'underline',
            id: 'underline',
            icon: 'type-underline',
            toggle: true,
            tooltip: 'Toggle Underline',
        });
        assert_toggle_mark(assert, btn, 'underline');
    });

    QUnit.test('BulletList', (assert) => {
        widget = new TiptapWidget(elem, { actions: ['bulletList'] });
        const btn = widget.buttons.bulletList;
        assert_button(assert, btn, {
            name: 'bulletList',
            id: 'bulletList',
            icon: 'list-ul',
            toggle: true,
            tooltip: 'Bullet List',
        });
        assert.strictEqual(btn.widget, widget);
        assert_toggle_mark(assert, btn, 'bulletList');
    });

    QUnit.test('OrderedList', (assert) => {
        widget = new TiptapWidget(elem, { actions: ['orderedList'] });
        const btn = widget.buttons.orderedList;
        assert_button(assert, btn, {
            name: 'orderedList',
            id: 'orderedList',
            icon: 'list-ol',
            toggle: true,
            tooltip: 'Ordered List',
        });
        assert_toggle_mark(assert, btn, 'orderedList');
    });

    QUnit.test('Indent', (assert) => {
        widget = new TiptapWidget(elem, { actions: ['indent'] });
        const btn = widget.buttons.indent;
        assert_button(assert, btn, {
            name: 'indent',
            id: 'indent',
            icon: 'text-indent-left',
            toggle: false,
            tooltip: 'Indent',
        });

        // on click
        assert.false(widget.editor.isActive('blockquote'));
        btn.elem.trigger('click');
        assert.true(widget.editor.isActive('blockquote'));
    });

    QUnit.test('Outdent', (assert) => {
        widget = new TiptapWidget(elem, { actions: ['outdent'] });
        const btn = widget.buttons.outdent;
        assert_button(assert, btn, {
            name: 'outdent',
            id: 'outdent',
            icon: 'text-indent-right',
            toggle: false,
            tooltip: 'Outdent',
        });

        // on click
        widget.editor.commands.setBlockquote();
        assert.true(widget.editor.isActive('blockquote'));
        btn.elem.trigger('click');
        assert.false(widget.editor.isActive('blockquote'));
        assert.true(widget.editor.isActive('paragraph'));
    });

    QUnit.test('HTML', (assert) => {
        widget = new TiptapWidget(elem, { actions: ['html', 'bold'] });
        const btn = widget.buttons.html;
        assert_button(assert, btn, {
            name: 'html',
            id: 'html',
            icon: 'pencil',
            toggle: true,
            tooltip: 'Edit HTML',
        });
        assert.strictEqual(btn.widget, widget);
        assert.deepEqual(btn.textarea, widget.textarea);

        // on click
        assert.notOk(btn.active);
        btn.elem.trigger('click');
        assert.true(btn.active);
        assert.false(btn.elem.hasClass('disabled'));
        assert.true(widget.buttons.bold.elem.hasClass('disabled'));
        assert.strictEqual(widget.editarea.css('display'), 'none');
        assert.notStrictEqual(widget.textarea.css('display'), 'none');
        assert.strictEqual(widget.textarea.val(), widget.editor.getHTML());

        // edit HTML and switch back to editor
        widget.textarea.val('<p>Changed</p>');
        btn.elem.trigger('click');
        assert.false(btn.active);
        assert.false(widget.buttons.bold.elem.hasClass('disabled'));
        assert.strictEqual(widget.editarea.css('display'), 'block');
        assert.strictEqual(widget.textarea.css('display'), 'none');
        assert.strictEqual(widget.editor.getHTML(), '<p>Changed</p>');
    });

    QUnit.test('Headings / Heading', (assert) => {
        widget = new TiptapWidget(elem, { actions: ['heading'] });
        const headings_button = widget.buttons.heading;
        assert_button(assert, headings_button, {
            name: 'heading',
            id: 'headings',
            icon: 'fonts',
            toggle: false,
            tooltip: undefined,
        });
        assert.strictEqual(headings_button.children.length, 7);

        // set to h1
        const h_button = headings_button.children[1];
        h_button.elem.trigger('click');
        assert.true(widget.editor.isActive('heading', { level: 1 }));
        assert.deepEqual(headings_button.active_item, h_button);

        // set to paragraph
        const p_button = headings_button.children[0];
        assert.strictEqual(p_button.id, 'paragraph');
        assert.true(p_button.container.hasClass('dropdown-item'));
        assert.strictEqual($('span', p_button.elem).text(), 'Text');
        p_button.elem.trigger('click');
        assert.true(widget.editor.isActive('paragraph'));
        assert.deepEqual(headings_button.active_item, p_button);

        for (let i = 1; i < headings_button.children.length; i++) {
            const button = headings_button.children[i];
            assert.true(button.container.parent().is(headings_button.dd_elem));
            assert.strictEqual($('span', button.elem).text(), `Heading ${i}`);
            assert.strictEqual(button.id, 'heading');
            assert.strictEqual(button.level, i);

            button.elem.trigger('click');
            assert.true(widget.editor.isActive('heading', { level: i }));
            assert.deepEqual(headings_button.active_item, button);
            assert.strictEqual($('span', headings_button.elem).text(), `Heading ${i}`);
        }

        headings_button.reset();
        assert.deepEqual(headings_button.active_item, headings_button.children[0]);
    });

    QUnit.test('Colors / Color', (assert) => {
        widget = new TiptapWidget(elem, {
            actions: ['color'],
            colors: [
                { name: 'Default', color: 'rgb(51, 51, 51)' },
                { name: 'Blue', color: 'rgb(53 39 245)' },
                { name: 'Lime', color: 'rgb(204, 255, 0)' },
            ],
        });
        const colors_button = widget.buttons.color;
        assert.true(colors_button instanceof actions.color);
        assert.notOk(colors_button.opts.toggle);
        assert.strictEqual(colors_button.id, 'colors');
        assert.strictEqual(colors_button.children.length, 4);

        const unset_button = colors_button.children[0];
        assert.strictEqual(unset_button.id, 'unsetColor');
        assert.strictEqual($('span', unset_button.elem).text(), 'None');
        assert.strictEqual(
            $('> div.color.border', unset_button.elem).css('background-color'),
            'rgb(51, 51, 51)',
        );

        widget.editor.commands.setTextSelection({ from: 0, to: 13 });
        for (const button of colors_button.children.slice(1)) {
            assert.strictEqual(button.id, 'color');
            assert.strictEqual($('span', button.elem).text(), button.swatch.name);
            assert.strictEqual($('> div.color.border', button.elem).length, 1);

            button.elem.trigger('click');
            assert.true(widget.editor.isActive('textStyle', { color: button.swatch.color }));
            assert.deepEqual(colors_button.active_item, button);
        }

        unset_button.elem.trigger('click');
        assert.false(widget.editor.isActive('textStyle', { color: /.*/ }));
        assert.deepEqual(colors_button.active_item, unset_button);
    });

    QUnit.test('Image', (assert) => {
        widget = new TiptapWidget(elem, { actions: ['image'] });
        const btn = widget.buttons.image;
        assert_button(assert, btn, {
            name: 'image',
            id: 'image',
            icon: 'image',
            toggle: false,
            tooltip: 'Add Image',
        });
        assert.true(btn.dd_elem.hasClass('p-3'));
        assert.ok(btn.submit_elem);
        for (const [input_elem, name] of [
            [btn.src_elem, 'src:'],
            [btn.alt_elem, 'alt:'],
            [btn.title_elem, 'title:'],
        ]) {
            assert.true(input_elem.is('div.input-group.input-group-sm.mb-2'));
            assert.strictEqual($('span.input-group-text.name', input_elem).text(), name);
            assert.strictEqual($('input.form-control', input_elem).length, 1);
        }

        // submit
        $('input', btn.src_elem).val('https://example.com/parrot.jpg');
        $('input', btn.alt_elem).val('photo of a parrot');
        $('input', btn.title_elem).val('Parrot');
        btn.submit_elem.trigger('click');

        const img = $('img', $('<div />').html(widget.editor.getHTML()));
        assert.strictEqual(img.attr('src'), 'https://example.com/parrot.jpg');
        assert.strictEqual(img.attr('alt'), 'photo of a parrot');
        assert.strictEqual(img.attr('title'), 'Parrot');
        assert.strictEqual(btn.dd_elem.css('display'), 'none');
    });

    QUnit.test('Link', (assert) => {
        widget = new TiptapWidget(elem, { actions: ['link'] });
        const btn = widget.buttons.link;
        assert_button(assert, btn, {
            name: 'link',
            id: 'link',
            icon: 'link-45deg',
            toggle: false,
            tooltip: 'Add Link',
        });
        assert.true(btn.dd_elem.hasClass('p-3'));
        assert.true(btn.href_elem.is('div.input-group.input-group-sm.mb-2'));
        assert.strictEqual($('span.input-group-text.name', btn.href_elem).text(), 'href:');

        // submit
        widget.editor.commands.setTextSelection({ from: 0, to: 13 });
        $('input', btn.href_elem).val('https://tiptap.dev/');
        btn.submit_elem.trigger('click');

        const link = $('a', $('<div />').html(widget.editor.getHTML()));
        assert.strictEqual(link.attr('href'), 'https://tiptap.dev/');
        assert.strictEqual(btn.dd_elem.css('display'), 'none');
    });

    QUnit.test('Code', (assert) => {
        widget = new TiptapWidget(elem, { actions: ['code'] });
        const btn = widget.buttons.code;
        assert_button(assert, btn, {
            name: 'code',
            id: 'code',
            icon: 'code-slash',
            toggle: true,
            tooltip: 'Toggle Code',
        });
        assert.strictEqual(btn.widget, widget);

        // on click
        assert_toggle_mark(assert, btn, 'code');
        btn.elem.trigger('click');
        assert.false(btn.active);

        // on_selection_update
        widget.editor.commands.setTextSelection({ from: 0, to: 5 });
        widget.editor.chain().focus().toggleCode().run();
        widget.editor.commands.setTextSelection(3);
        assert.true(btn.active);
    });

    QUnit.test('CodeBlock', (assert) => {
        widget = new TiptapWidget(elem, { actions: ['codeBlock'] });
        const btn = widget.buttons.codeBlock;
        assert_button(assert, btn, {
            name: 'codeBlock',
            id: 'codeBlock',
            icon: 'braces',
            toggle: true,
            tooltip: 'Toggle Code Block',
        });

        // on click
        assert_toggle_mark(assert, btn, 'codeBlock');
        btn.elem.trigger('click');
        assert.false(btn.active);

        // on_selection_update
        widget.editor.chain().focus().toggleCodeBlock().run();
        widget.editor.commands.setTextSelection(2);
        assert.true(btn.active);
    });

    QUnit.test('mark buttons on_selection_update', (assert) => {
        widget = new TiptapWidget(elem, {
            actions: ['bold', 'italic', 'underline', 'bulletList', 'orderedList'],
        });
        const buttons = widget.buttons;

        widget.editor.commands.setTextSelection({ from: 0, to: 13 });
        widget.editor.chain().focus().toggleBold().toggleItalic().toggleUnderline().run();
        widget.editor.commands.setTextSelection(3);
        assert.true(buttons.bold.active);
        assert.true(buttons.italic.active);
        assert.true(buttons.underline.active);
        assert.false(buttons.bulletList.active);
        assert.false(buttons.orderedList.active);

        widget.editor.chain().focus().toggleOrderedList().run();
        widget.editor.commands.setTextSelection(4);
        assert.true(buttons.orderedList.active);
        assert.false(buttons.bulletList.active);
    });
});
