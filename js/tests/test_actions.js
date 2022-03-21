import {actions, ActionGroup} from '../src/actions.js';
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

QUnit.module('Actions', hooks => {
    let elem;

    hooks.before(() => {
        $('body').append('<div id="container" />');
    });
    hooks.beforeEach(() => {
        elem = create_elem();
        $('#container').append(elem);
    });
    hooks.afterEach(() => {
        $('#container').empty();
        widget = null;
    });
    hooks.after(() => {
        $('#container').empty().remove();
    });

    QUnit.test('Bold', assert => {
        widget = new TiptapWidget(elem, {bold: true});

        let bold_btn = widget.buttons[0];
        assert.true(bold_btn instanceof actions.bold);
        assert.strictEqual($('span', bold_btn.elem).text(), 'B');
        assert.strictEqual($('span', bold_btn.elem).css('font-weight'), '700');
        assert.true(bold_btn.opts.toggle);
        assert.strictEqual(bold_btn.id, 'bold');

        // on click
        assert.notOk(bold_btn.active); // undefined on init
        assert.false(widget.editor.isActive('bold'));
        bold_btn.elem.trigger('click');
        assert.true(bold_btn.active);
        assert.true(widget.editor.isActive('bold'));
    });

    QUnit.test('Italic', assert => {
        widget = new TiptapWidget(elem, {italic: true});

        let italic_btn = widget.buttons[0];
        assert.true(italic_btn instanceof actions.italic);
        assert.strictEqual($('span', italic_btn.elem).text(), 'i');
        assert.strictEqual($('span', italic_btn.elem).css('font-style'), 'italic');
        assert.true(italic_btn.opts.toggle);
        assert.strictEqual(italic_btn.id, 'italic');

        // on click
        assert.notOk(italic_btn.active);// undefined on init
        assert.false(widget.editor.isActive('italic'));
        italic_btn.elem.trigger('click');
        assert.true(italic_btn.active);
        assert.true(widget.editor.isActive('italic'));
    });

    QUnit.test('Underline', assert => {
        widget = new TiptapWidget(elem, {underline: true});

        let underline_btn = widget.buttons[0];
        assert.true(underline_btn instanceof actions.underline);
        assert.strictEqual($('span', underline_btn.elem).text(), 'U');
        assert.strictEqual(
            $('span', underline_btn.elem).css('text-decoration'),
            'underline solid rgb(0, 0, 0)'
        );
        assert.true(underline_btn.opts.toggle);
        assert.strictEqual(underline_btn.id, 'underline');

        // on click
        assert.notOk(underline_btn.active); // undefined on init
        assert.false(widget.editor.isActive('underline'));
        underline_btn.elem.trigger('click');
        assert.true(underline_btn.active);
        assert.true(widget.editor.isActive('underline'));
    });

    QUnit.test('BulletList', assert => {
        widget = new TiptapWidget(elem, {bullet_list: true});

        let bullet_btn = widget.buttons[0];
        assert.true(bullet_btn instanceof actions.bullet_list);
        assert.true($('i', bullet_btn.elem).hasClass('glyphicon-list'));
        assert.true(bullet_btn.opts.toggle);
        assert.strictEqual(bullet_btn.id, 'bulletList');

        // on click
        assert.notOk(bullet_btn.active); // undefined on init
        assert.false(widget.editor.isActive('bulletList'));
        bullet_btn.elem.trigger('click');
        assert.true(bullet_btn.active);
        assert.true(widget.editor.isActive('bulletList'));
    });

    QUnit.test('OrderedList', assert => {
        widget = new TiptapWidget(elem, {ordered_list: true});

        let list_btn = widget.buttons[0];
        assert.true(list_btn instanceof actions.ordered_list);
        assert.true($('i', list_btn.elem).hasClass('glyphicon-th-list'));
        assert.true(list_btn.opts.toggle);
        assert.strictEqual(list_btn.id, 'orderedList');

        // on click
        assert.notOk(list_btn.active); // undefined on init
        assert.false(widget.editor.isActive('orderedList'));
        list_btn.elem.trigger('click');
        assert.true(list_btn.active);
        assert.true(widget.editor.isActive('orderedList'));
    });

    QUnit.test('Indent', assert => {
        widget = new TiptapWidget(elem, {indent: true});

        let indent_btn = widget.buttons[0];
        assert.true(indent_btn instanceof actions.indent);
        assert.true($('i', indent_btn.elem).hasClass('glyphicon-indent-left'));
        assert.notOk(indent_btn.opts.toggle);
        assert.strictEqual(indent_btn.id, 'indent');

        // on click
        assert.false(widget.editor.isActive('blockquote'));
        indent_btn.elem.trigger('click');
        assert.true(widget.editor.isActive('blockquote'));
    });

    QUnit.test('Outdent', assert => {
        widget = new TiptapWidget(elem, {outdent: true});

        let outdent_btn = widget.buttons[0];
        assert.true(outdent_btn instanceof actions.outdent);
        assert.true($('i', outdent_btn.elem).hasClass('glyphicon-indent-right'));
        assert.notOk(outdent_btn.opts.toggle);
        assert.strictEqual(outdent_btn.id, 'outdent');

        // on click
        widget.editor.commands.setBlockquote();
        outdent_btn.elem.trigger('click');
        assert.true(widget.editor.isActive('paragraph'));
    });

    QUnit.test('HTML', assert => {
        widget = new TiptapWidget(elem, {html: true, bold: true});

        let html_button = widget.buttons[0];
        assert.true(html_button instanceof actions.html);
        assert.true($('i', html_button.elem).hasClass('glyphicon-pencil'));
        assert.true(html_button.opts.toggle);
        assert.strictEqual(html_button.id, 'html');
        assert.deepEqual(html_button.textarea, widget.textarea);

        // on click
        assert.notOk(html_button.active);
        html_button.elem.trigger('click');
        assert.true(html_button.active);
        assert.true(widget.buttons[1].elem.prop('disabled'));
        assert.strictEqual(html_button.editarea.css('display'), 'none');
        assert.strictEqual(widget.textarea.css('display'), 'inline-block');
        assert.strictEqual(widget.textarea.text(), widget.editor.getHTML());

        // second click
        html_button.elem.trigger('click');
        assert.false(html_button.active);
        assert.false(widget.buttons[1].elem.prop('disabled'));
        assert.strictEqual(html_button.editarea.css('display'), 'block');
        assert.strictEqual(widget.textarea.css('display'), 'none');
    });

    QUnit.test('Headings / Heading', assert => {
        widget = new TiptapWidget(elem, {heading: true});

        let headings_button = widget.buttons[0];
        assert.true(headings_button instanceof actions.heading);
        assert.true($('i', headings_button.elem).hasClass('glyphicon-font'));
        assert.notOk(headings_button.opts.toggle);
        assert.strictEqual(headings_button.id, 'headings');
        assert.strictEqual(headings_button.children.length, 7);

        // set to h1
        headings_button.elem.trigger('click');
        let h_button = headings_button.children[1];
        h_button.elem.trigger('click');
        assert.true(widget.editor.isActive('heading', {level: 1}));

        // set to paragraph
        let p_button = headings_button.children[0];
        assert.strictEqual(p_button.id, 'paragraph');
        assert.strictEqual($('span', p_button.elem).text(), 'Text');
        p_button.elem.trigger('click');
        assert.true(widget.editor.isActive('paragraph'));

        for (let i = 1; i < headings_button.children.length; i++) {
            headings_button.elem.trigger('click');
            assert.strictEqual(headings_button.dd_elem.css('display'), 'block');

            let button = headings_button.children[i];
            assert.strictEqual($('span', button.elem).text(), `Heading ${i}`);
            assert.strictEqual(button.id, 'heading');
            assert.strictEqual(button.level, i);

            headings_button.elem.trigger('click');
            button.elem.trigger('click');
            assert.true(widget.editor.isActive('heading', {level: i}));
            assert.deepEqual(headings_button.active_item, button);
        }

        headings_button.reset();
        assert.deepEqual(
            headings_button.active_item,
            headings_button.children[0]
        );
    });

    QUnit.test('Colors / Color', assert => {
        widget = new TiptapWidget(elem, {
            colors: [
                { name: 'Default', color: 'rgb(51, 51, 51)' },
                { name: 'Blue', color: 'rgb(53 39 245)' },
                { name: 'Lime', color: 'rgb(204, 255, 0)' },
                { name: 'Teal', color: 'rgb(42, 202, 234)' },
                { name: 'Red', color: 'rgb(208, 6, 10)' }
            ]
        });

        let colors_button = widget.buttons[0];
        assert.true(colors_button instanceof actions.colors);
        assert.notOk(colors_button.opts.toggle);
        assert.strictEqual(colors_button.id, 'colors');

        for (let button of colors_button.children) {
            assert.ok($('> div.color', button.elem));
            assert.strictEqual(button.id, 'color');

            colors_button.elem.trigger('click');
            button.elem.trigger('click');
            assert.true(widget.editor.isActive('textStyle', {color: button.swatch.color}));
            assert.deepEqual(colors_button.active_item, button);
        }
    });

    QUnit.test('Image', assert => {
        widget = new TiptapWidget(elem, {image: true});

        let img_btn = widget.buttons[0];
        assert.true(img_btn instanceof actions.image);
        assert.ok($('i', img_btn.elem).hasClass('glyphicon-picture'));
        assert.true(img_btn.dd_elem.hasClass('grid'));
        assert.ok(img_btn.submit_elem);
        assert.notOk(img_btn.opts.toggle);
        assert.strictEqual(img_btn.id, 'image');
        assert.ok(img_btn.src_elem.is('span.dropdown-item'));
        assert.ok(img_btn.alt_elem.is('span.dropdown-item'));
        assert.ok(img_btn.title_elem.is('span.dropdown-item'));

        // on click
        img_btn.elem.trigger('click');
        $('input', img_btn.src_elem).val('https://images.unsplash.com/photo-1430990480609-2bf7c02a6b1a?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Nnx8ZnJlZXxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=500&q=60');
        $('input', img_btn.alt_elem).val('photo of a parrot');
        $('input', img_btn.title_elem).val('Parrot');
        img_btn.submit_elem.trigger('click');

        $('#container').append($('<div id="img-container" />'));
        $('#img-container').append($(widget.editor.getHTML()));
        let img = $('img', '#img-container');
        assert.strictEqual(img.attr('src'), 'https://images.unsplash.com/photo-1430990480609-2bf7c02a6b1a?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Nnx8ZnJlZXxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=500&q=60');
        assert.strictEqual(img.attr('alt'), 'photo of a parrot');
        assert.strictEqual(img.attr('title'), 'Parrot');
    });

    QUnit.test('Link', assert => {
        widget = new TiptapWidget(elem, {link: true});

        let link_btn = widget.buttons[0];
        assert.true(link_btn instanceof actions.link);
        assert.ok($('i', link_btn.elem).hasClass('glyphicon-link'));
        assert.true(link_btn.dd_elem.hasClass('grid'));
        assert.notOk(link_btn.opts.toggle);
        assert.strictEqual(link_btn.id, 'link');
        assert.ok(link_btn.href_elem.is('span.dropdown-item'));

        // on click
        widget.editor.commands.setTextSelection({ from: 0, to: 13 });
        link_btn.elem.trigger('click');
        $('input', link_btn.href_elem).val('https://tiptap.dev/');
        link_btn.submit_elem.trigger('click');

        $('#container').append($('<div id="link-container" />'));
        $('#link-container').append($(widget.editor.getHTML()));
        let link = $('a', '#link-container');
        assert.strictEqual(link.attr('href'), 'https://tiptap.dev/');
    });

    QUnit.test('Code', assert => {
        widget = new TiptapWidget(elem, {code: true});

        let code_button = widget.buttons[0];
        assert.true(code_button instanceof actions.code);
        assert.strictEqual($('span', code_button.elem).text(), '< / >');
        assert.true(code_button.opts.toggle);
        assert.strictEqual(code_button.id, 'code');

        // on click
        assert.notOk(code_button.active);
        assert.false(widget.editor.isActive('code'));
        code_button.elem.trigger('click');
        assert.true(code_button.active);
        assert.true(widget.editor.isActive('code'));
    });

    QUnit.test('CodeBlock', assert => {
        widget = new TiptapWidget(elem, {code_block: true});

        let codeblock_button = widget.buttons[0];
        assert.true(codeblock_button instanceof actions.code_block);
        assert.strictEqual($('span', codeblock_button.elem).text(), '{ }');
        assert.true(codeblock_button.opts.toggle);
        assert.strictEqual(codeblock_button.id, 'codeBlock');

        // on click
        assert.notOk(codeblock_button.active);
        assert.false(widget.editor.isActive('codeBlock'));
        codeblock_button.elem.trigger('click');
        assert.true(codeblock_button.active);
        assert.true(widget.editor.isActive('codeBlock'));
    });

    QUnit.test('Help', assert => {
        widget = new TiptapWidget(elem, {help_link: true});

        let help_button = widget.buttons[0];
        assert.true(help_button instanceof actions.help_link);
        assert.true(help_button.elem.is('a.help-btn'));
    });

    QUnit.test('ActionGroup', assert => {
        widget = new TiptapWidget(elem, {
            bold: {target: 'group'},
            italic: {target: 'group'},
            underline: {target: 'group_2'},
            link: {target: 'group_2'}
        });

        let group = $('div.btn-group.group');
        let group_2 = $('div.btn-group.group_2');
        assert.strictEqual(group.children('button').length, 2);
        assert.strictEqual(group_2.children('button').length, 2);
    });
});