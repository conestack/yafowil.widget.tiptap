import $ from 'jquery';
import tiptap from 'tiptap';
import {Button, DropdownButton, Tooltip} from './buttons.js';

class BoldAction extends Button {
    constructor(editor, action_opts, container_elem) {
        super(editor, action_opts, container_elem);
        this.elem
            .text('B')
            .css('font-weight', 'bold');

        this.tooltip = new Tooltip('Toggle bold', this.elem);
    }

    on_click(e) {
        e.preventDefault();
        this.toggle();
        this.editor.chain().focus().toggleBold().run();
    }
}

class ItalicAction extends Button {
    constructor(editor, action_opts, container_elem) {
        super(editor, action_opts, container_elem);
        this.elem
            .text('i')
            .css('font-style', 'italic');

        this.tooltip = new Tooltip('Toggle italic', this.elem);
    }

    on_click(e) {
        e.preventDefault();
        this.toggle();
        this.editor.chain().focus().toggleItalic().run();
    }
}

class UnderlineAction extends Button {
    constructor(editor, action_opts, container_elem) {
        super(editor, action_opts, container_elem);
        this.elem
            .text('U')
            .css('text-decoration', 'underline');

        this.tooltip = new Tooltip('Toggle underline', this.elem);
    }

    on_click(e) {
        e.preventDefault();
        this.toggle();
        this.editor.chain().focus().toggleUnderline().run();
    }
}

class BulletListAction extends Button {
    constructor(editor, action_opts, container_elem) {
        super(editor, action_opts, container_elem);
        this.elem.append($('<i />').addClass('glyphicon glyphicon-list'));

        this.tooltip = new Tooltip('Bullet List', this.elem);
    }

    on_click(e) {
        e.preventDefault();
        this.toggle();
        this.editor.chain().focus().toggleBulletList().run();
    }
}

class OrderedListAction extends Button {
    constructor(editor, action_opts, container_elem) {
        super(editor, action_opts, container_elem);
        this.elem.append($('<i />').addClass('glyphicon glyphicon-th-list'));

        this.tooltip = new Tooltip('Ordered List', this.elem);
    }

    on_click(e) {
        e.preventDefault();
        this.toggle();
        this.editor.chain().focus().toggleOrderedList().run();
    }
}

class IndentAction extends Button {
    constructor(editor, action_opts, container_elem) {
        super(editor, action_opts, container_elem);
        this.elem.append($('<i />').addClass('glyphicon glyphicon-indent-left'));

        this.tooltip = new Tooltip('Indent', this.elem);
    }

    on_click(e) {
        e.preventDefault();
        this.editor.chain().focus().setBlockquote().run();
    }
}

class OutdentAction extends Button {
    constructor(editor, action_opts, container_elem) {
        super(editor, action_opts, container_elem);
        this.elem.append($('<i />').addClass('glyphicon glyphicon-indent-right'));

        this.tooltip = new Tooltip('Outdent', this.elem);
    }

    on_click(e) {
        e.preventDefault();
        this.editor.chain().focus().unsetBlockquote().run();
    }
}

class HTMLAction extends Button {
    constructor(editor, action_opts, container_elem) {
        super(editor, action_opts, container_elem);
        this.elem.append($('<i />').addClass('glyphicon glyphicon-pencil'));
        this.tooltip = new Tooltip('Edit HTML', this.elem);

        this.parent = this.elem.closest('div.tiptap-editor');
        this.editarea = $('div.ProseMirror', this.parent);
        this.textarea = $('textarea.ProseMirror', this.parent);
    }

    on_click(e) {
        e.preventDefault();
        this.toggle();

        if (this.active) {
            $('button', this.parent).not(this.elem).prop('disabled', true);
            this.editarea.hide();
            this.textarea.show().text(this.editor.getHTML());
        } else {
            $('button', this.parent).prop('disabled', false);
            this.textarea.hide();
            this.editarea.show();
            this.editor.chain().focus().setContent(this.textarea.val()).run();
        }
    }
}

class HeadingAction extends Button {
    constructor(editor, action_opts, container_elem, level) {
        super(editor, action_opts, container_elem, level);
        this.level = level;

        let content = $('<span />')
            .text(`Heading ${this.level}`)
            .appendTo(this.elem);
    }

    on_click(e) {
        e.preventDefault();
        this.editor.chain().focus().toggleHeading({level: this.level}).run();
    }
}

class ParagraphAction extends Button {
    constructor(editor, action_opts, container_elem) {
        super(editor, action_opts, container_elem);

        let content = $('<span />')
            .text('Text')
            .appendTo(this.elem);
    }

    on_click(e) {
        e.preventDefault();
        this.editor.chain().focus().setParagraph().run();
    }
}

class ColorAction extends Button {
    constructor(editor, action_opts, container_elem, color) {
        super(editor, action_opts, container_elem, color);

        this.name = color.name;
        this.color = color.color;

        let content = $('<span />')
            .text(this.name)
            .appendTo(this.elem);

        let swatch = $('<div />')
            .addClass('color')
            .css('background-color', this.color)
            .appendTo(this.elem);
    }

    on_click(e) {
        e.preventDefault();
        this.editor.chain().focus().setColor(this.color).run();
    }
}

class HeadingsAction extends DropdownButton {
    constructor(editor, action_opts, container_elem) {
        super(editor, action_opts, container_elem);
        this.title = $('<i />').addClass('glyphicon glyphicon-font');

        this.children.push(
            new ParagraphAction(editor, action_opts, this.dd_elem)
        );
        for (let i=1; i<=6; i++) {
            this.children.push(
                new HeadingAction(editor, action_opts, this.dd_elem, i)
            )
        }

        for (let child of this.children) {
            child.elem.addClass('dropdown-item');
            child.elem.on('click', (e) => {
                this.active_item = child;
            });
        }

        this.active_item = this.children[0];
    }
}

class ColorsAction extends DropdownButton {
    constructor(editor, action_opts, container_elem) {
        super(editor, action_opts, container_elem);

        for (let color of action_opts) {
            this.children.push(
                new ColorAction(editor, action_opts, this.dd_elem, color)
            )
        }

        for (let child of this.children) {
            child.elem.addClass('dropdown-item');
            child.elem.on('click', (e) => {
                this.active_item = child;
            });
        }

        this.active_item = this.children[0];
    }
}

class ImageAction extends DropdownButton {
    constructor(editor, action_opts, container_elem) {
        super(editor, action_opts, container_elem);

        this.tooltip = new Tooltip('Add image', this.elem);

        this.elem.append($('<i />').addClass('glyphicon glyphicon-picture'));
        this.dd_elem.addClass('grid');
        this.src_elem = $('<span />')
            .addClass('dropdown-item')
            .append($('<span />').addClass('name').text(`src:`))
            .append($('<input type="text" />'))
            .appendTo(this.dd_elem);
        this.alt_elem = $('<span />')
            .addClass('dropdown-item')
            .append($('<span />').addClass('name').text(`alt:`))
            .append($('<input type="text" />'))
            .appendTo(this.dd_elem);
        this.title_elem = $('<span />')
            .addClass('dropdown-item')
            .append($('<span />').addClass('name').text(`title:`))
            .append($('<input type="text" />'))
            .appendTo(this.dd_elem);

        this.submit_elem = $('<button />')
            .addClass('submit')
            .text('submit')
            .appendTo(this.dd_elem);

        this.submit = this.submit.bind(this);
        this.submit_elem.on('click', this.submit);
    }

    submit(e) {
        e.preventDefault();
        this.editor.chain().focus().setImage({
            src: $('input', this.src_elem).val(),
            alt: $('input', this.alt_elem).val(),
            title: $('input', this.title_elem).val()
        }).run();
    }
}

class LinkAction extends DropdownButton {
    constructor(editor, action_opts, container_elem) {
        super(editor, action_opts, container_elem);

        this.tooltip = new Tooltip('Add link', this.elem);

        this.elem.append($('<i />').addClass('glyphicon glyphicon-link'));
        this.dd_elem.addClass('grid');
        this.href_elem = $('<span />')
            .addClass('dropdown-item')
            .append($('<span />').addClass('name').text(`href:`))
            .append($('<input type="text" />'))
            .appendTo(this.dd_elem);

        this.submit_elem = $('<button />')
            .addClass('submit')
            .text('submit')
            .appendTo(this.dd_elem);

        this.submit = this.submit.bind(this);
        this.submit_elem.on('click', this.submit);
    }

    submit(e) {
        e.preventDefault();
        let href = $('input', this.href_elem).val();
        this.editor.chain().focus().setLink({href: href}).run();
    }
}

let action_factories = {
    bold: BoldAction,
    italic: ItalicAction,
    underline: UnderlineAction,
    bullet_list: BulletListAction,
    ordered_list: OrderedListAction,
    indent: IndentAction,
    outdent: OutdentAction,
    html_edit: HTMLAction,
    heading: HeadingsAction,
    colors: ColorsAction,
    image: ImageAction,
    link: LinkAction
}

export class TiptapWidget {
    static initialize(context) {
        $('div.tiptap-editor', context).each(function() {
            let options = {
                bold: {},
                italic: true,
                underline: true,
                bullet_list: true,
                ordered_list: true,
                indent: true,
                outdent: true,
                html_edit: true,
                heading: true,
                colors: [
                    { name: 'Default', color: '#333333'},
                    { name: 'Blue', color: '#1a21fb' },
                    { name: 'Lime', color: '#ccff00' },
                    { name: 'Teal', color: '#2acaea' },
                    { name: 'Red', color: '#d0060a' }
                ],
                image: true,
                link: true
            }
            new TiptapWidget($(this), options);
        });
    }

    constructor(elem, opts) {
        this.elem = elem;
        this.elem.data('tiptap-widget', this);

        this.editor = new tiptap.Editor({
            element: this.elem[0],
            extensions: [
                tiptap.Document,
                tiptap.Paragraph,
                tiptap.Text,
                tiptap.Underline,
                tiptap.TextStyle,
                tiptap.Color,
                tiptap.Heading,
                tiptap.BulletList,
                tiptap.OrderedList,
                tiptap.ListItem,
                tiptap.Blockquote,
                tiptap.Bold,
                tiptap.Italic,
                tiptap.Code,
                tiptap.CodeBlock,
                tiptap.Image,
                tiptap.Link
            ],
            content: '<p>Hello World!</p>',
        });

        this.editarea = $('div.ProseMirror', this.elem);
        this.textarea = $('<textarea />')
            .addClass('ProseMirror')
            .appendTo(this.elem);

        if (!opts) {
            opts = {};
        }

        this.buttons_textstyles = $('<div />')
            .addClass('btn-group')
            .prependTo(this.elem);

        for (let option_name in opts) {
            let action_options = opts[option_name];
            let factory = action_factories[option_name];
            new factory(this.editor, action_options, this.buttons_textstyles);
        }

        this.hide_all = this.hide_all.bind(this);
        this.editor.on('update', this.hide_all);
    }

    unload_all() {

    }

    hide_all() {
        $('div.btn-dropdown', this.elem).hide();
    }
}