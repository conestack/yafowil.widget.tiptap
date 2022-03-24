
import $ from 'jquery';
import {Button, DropdownButton, Tooltip} from './buttons.js';

class BoldAction extends Button {
    static extensions = [tiptap.Bold];

    constructor(widget, editor, opts) {
        super(editor, {
            container_elem: opts.container_elem,
            text: 'B',
            css: {'font-weight': 'bold'},
            tooltip: 'Toggle Bold',
            toggle: true
        });
        this.id = 'bold';
    }

    on_click(e) {
        e.preventDefault();
        this.active = !this.active;
        this.editor.chain().focus().toggleBold().run();
    }

    on_selection_update() {
        this.active = this.editor.isActive('bold');
    }
}

class ItalicAction extends Button {
    static extensions = [tiptap.Italic];

    constructor(widget, editor, opts) {
        super(editor, {
            container_elem: opts.container_elem,
            text: 'i',
            css: {'font-style': 'italic'},
            tooltip: 'Toggle Italic',
            toggle: true
        });
        this.id = 'italic';
    }

    on_click(e) {
        e.preventDefault();
        this.active = !this.active;
        this.editor.chain().focus().toggleItalic().run();
    }

    on_selection_update() {
        this.active = this.editor.isActive('italic');
    }
}

class UnderlineAction extends Button {
    static extensions = [tiptap.Underline];

    constructor(widget, editor, opts) {
        super(editor, {
            container_elem: opts.container_elem,
            text: 'U',
            css: {'text-decoration': 'underline'},
            tooltip: 'Toggle Underline',
            toggle: true
        });
        this.id = 'underline';
    }

    on_click(e) {
        e.preventDefault();
        this.active = !this.active;
        this.editor.chain().focus().toggleUnderline().run();
    }

    on_selection_update() {
        this.active = this.editor.isActive('underline');
    }
}

class BulletListAction extends Button {
    static extensions = [tiptap.BulletList, tiptap.ListItem];

    constructor(widget, editor, opts) {
        super(editor, {
            container_elem: opts.container_elem,
            icon: 'list',
            tooltip: 'Bullet List',
            toggle: true
        });

        this.id = 'bulletList';
        this.widget = widget;
    }

    on_click(e) {
        e.preventDefault();
        this.active = !this.active;
        this.editor.chain().focus().toggleBulletList().run();
    }

    on_update() {
        if (this.editor.isActive('orderedList')) {
            this.active = false;
        }
    }

    on_selection_update() {
        this.active = this.editor.isActive('bulletList');
    }
}

class OrderedListAction extends Button {
    static extensions = [tiptap.OrderedList, tiptap.ListItem];

    constructor(widget, editor, opts) {
        super(editor, {
            container_elem: opts.container_elem,
            icon: 'th-list',
            tooltip: 'Ordered List',
            toggle: true
        });

        this.id = 'orderedList';
    }

    on_click(e) {
        e.preventDefault();
        this.active = !this.active;
        this.editor.chain().focus().toggleOrderedList().run();
    }

    on_update() {
        if (this.editor.isActive('bulletList')) {
            this.active = false;
        }
    }

    on_selection_update() {
        this.active = this.editor.isActive('orderedList');
    }
}

class IndentAction extends Button {
    static extensions = [tiptap.Blockquote];

    constructor(widget, editor, opts) {
        super(editor, {
            container_elem: opts.container_elem,
            icon: 'indent-left',
            tooltip: 'Indent'
        });
        this.id = 'indent';
    }

    on_click(e) {
        e.preventDefault();
        if (this.editor.can().setBlockquote()) {
            this.editor.chain().focus().setBlockquote().run();
        }
    }
}

class OutdentAction extends Button {
    static extensions = [tiptap.Blockquote];

    constructor(widget, editor, opts) {
        super(editor, {
            container_elem: opts.container_elem,
            icon: 'indent-right',
            tooltip: 'Outdent'
        });
        this.id = 'outdent';
    }

    on_click(e) {
        e.preventDefault();
        if (this.editor.can().unsetBlockquote()) {
            this.editor.chain().focus().unsetBlockquote().run();
        }
    }
}

class HTMLAction extends Button {
    static extensions = [];

    constructor(widget, editor, opts) {
        super(editor, {
            container_elem: opts.container_elem,
            icon: 'pencil',
            tooltip: 'Edit HTML',
            toggle: true
        });
        this.id = 'html';
        this.widget = widget;
        this.editarea = $('div.ProseMirror', this.widget.elem);
        this.textarea = this.widget.textarea;
    }

    on_click(e) {
        e.preventDefault();
        this.active = !this.active;

        if (this.active) {
            for (let btn in this.widget.buttons) {
                if (this.widget.buttons[btn] !== this) {
                    this.widget.buttons[btn].elem.prop('disabled', true);
                }
            }
            this.editarea.hide();
            this.textarea.show();
        } else {
            for (let btn in this.widget.buttons) {
                if (this.widget.buttons[btn] !== this) {
                    this.widget.buttons[btn].elem.prop('disabled', false);
                }
            }
            this.textarea.hide();
            this.editarea.show();
            this.editor.chain().focus().setContent(this.textarea.val()).run();
        }
    }
}

class HeadingAction extends Button {
    static extensions = [tiptap.Heading];

    constructor(widget, editor, opts) {
        super(editor, {
            container_elem: opts.container_elem,
            text: `Heading ${opts.level}`
        });
        this.id = 'heading';
        this.level = opts.level;
    }

    on_click(e) {
        e.preventDefault();
        this.editor.chain().focus().toggleHeading({level: this.level}).run();
    }
}

class ParagraphAction extends Button {

    constructor(widget, editor, opts) {
        super(editor, {
            container_elem: opts.container_elem,
            text: 'Text'
        });
        this.id = 'paragraph';
    }

    on_click(e) {
        e.preventDefault();
        this.editor.chain().focus().setParagraph().run();
    }
}

class ColorAction extends Button {

    constructor(widget, editor, opts) {
        super(editor, {
            container_elem: opts.container_elem, 
            text: opts.swatch.name
        });
        this.id = 'color';
        this.swatch = opts.swatch;
        $('<div />')
            .addClass('color')
            .css('background-color', this.swatch.color)
            .appendTo(this.elem);
    }

    on_click(e) {
        e.preventDefault();
        this.editor.chain().focus().setColor(this.swatch.color).run();
    }
}

class UnsetColorAction extends Button {

    constructor(widget, editor, opts) {
        super(editor, {
            container_elem: opts.container_elem, 
            text: 'None'
        });
        this.id = 'unsetColor';

        $('<div />')
            .addClass('color')
            .css('background-color', 'rgb(51, 51, 51)')
            .appendTo(this.elem);
    }

    on_click(e) {
        e.preventDefault();
        this.editor.chain().focus().unsetColor().run();
    }
}

class HeadingsAction extends DropdownButton {
    static extensions = [tiptap.Heading];

    constructor(widget, editor, opts) {
        super(editor, {
            container_elem: opts.container_elem,
            icon: 'font'
        });
        this.id = 'headings';

        this.children.push(
            new ParagraphAction(widget, editor, {
                container_elem: this.dd_elem
            })
        );
        for (let i=1; i<=6; i++) {
            this.children.push(
                new HeadingAction(widget, editor, {
                    container_elem: this.dd_elem,
                    level: i
                })
            )
        }
        this.set_items();
    }

    reset() {
        this.active_item = this.children[0];
    }

    on_selection_update() {
        if (this.editor.isActive('paragraph')) {
            this.active_item = this.children[0];
        } else {
            for (let i=1; i<=6; i++) {
                if (this.editor.isActive('heading', {level: i})) {
                    this.active_item = this.children[i];
                }
            }
        }
    }
}

class ColorsAction extends DropdownButton {
    static extensions = [tiptap.Color];

    constructor(widget, editor, opts) {
        super(editor, {
            container_elem: opts.container_elem
        });
        this.id = 'colors';

        this.children.push(
            new UnsetColorAction(widget, editor, {
                container_elem: this.dd_elem
            })
        );

        this.colors = widget.colors;
        for (let swatch of this.colors) {
            this.children.push(
                new ColorAction(widget, editor, {
                    container_elem: this.dd_elem,
                    swatch: swatch
                })
            )
        }
        this.set_items();
    }

    on_selection_update() {
        for (let color of this.colors) {
            let index = this.colors.indexOf(color);
            if (this.editor.isActive('textStyle', {color: color.color})) {
                this.active_item = this.children[index + 1];
                return;
            }
        }
        if (!this.editor.isActive('textStyle', { color: /.*/ })) {
                this.active_item = this.children[0];
        }
    }
}

class ImageAction extends DropdownButton {
    static extensions = [tiptap.Image];

    constructor(widget, editor, opts) {
        super(editor, {
            container_elem: opts.container_elem,
            tooltip: 'Add Image',
            icon: 'picture',
            submit: true
        });
        this.id = 'image';

        this.src_elem = $('<span />')
            .addClass('dropdown-item')
            .append($('<span />').addClass('name').text(`src:`))
            .append($('<input type="text" />'))
            .prependTo(this.dd_elem);
        this.alt_elem = $('<span />')
            .addClass('dropdown-item')
            .append($('<span />').addClass('name').text(`alt:`))
            .append($('<input type="text" />'))
            .prependTo(this.dd_elem);
        this.title_elem = $('<span />')
            .addClass('dropdown-item')
            .append($('<span />').addClass('name').text(`title:`))
            .append($('<input type="text" />'))
            .prependTo(this.dd_elem);
    }

    submit(e) {
        e.preventDefault();
        this.editor.chain().focus().setImage({
            src: $('input', this.src_elem).val(),
            alt: $('input', this.alt_elem).val(),
            title: $('input', this.title_elem).val()
        }).run();
        this.dd_elem.hide();
    }
}

class LinkAction extends DropdownButton {
    static extensions = [tiptap.Link];

    constructor(widget, editor, opts) {
        super(editor, {
            container_elem: opts.container_elem,
            tooltip: 'Add Link',
            icon: 'link',
            submit: true
        });
        this.id = 'link';

        this.href_elem = $('<span />')
            .addClass('dropdown-item')
            .append($('<span />').addClass('name').text(`href:`))
            .append($('<input type="text" />'))
            .prependTo(this.dd_elem);
    }

    submit(e) {
        e.preventDefault();
        let href = $('input', this.href_elem).val();
        this.editor.chain().focus().setLink({href: href}).run();
        this.dd_elem.hide();
    }
}

class CodeAction extends Button {
    static extensions = [tiptap.Code];

    constructor(widget, editor, opts) {
        super(editor, {
            container_elem: opts.container_elem,
            text: '< / >',
            tooltip: 'Toggle Code',
            toggle: true
        });
        this.id = 'code';
    }

    on_click(e) {
        e.preventDefault();
        this.active = !this.active;
        this.editor.chain().focus().toggleCode().run();
    }

    on_selection_update() {
        this.active = this.editor.isActive('code');
    }
}

class CodeBlockAction extends Button {
    static extensions = [tiptap.CodeBlock];

    constructor(widget, editor, opts) {
        super(editor, {
            container_elem: opts.container_elem,
            text: '{ }',
            tooltip: 'Toggle Code Block',
            toggle: true
        });
        this.id = 'codeBlock';
    }

    on_click(e) {
        e.preventDefault();
        this.active = !this.active;
        this.editor.chain().focus().toggleCodeBlock().run();
    }

    on_selection_update() {
        this.active = this.editor.isActive('codeBlock');
    }
}

class HelpAction {
    static extensions = [];

    constructor(widget) {
        this.elem = $('<a />')
            .attr('href', 'https://tiptap.dev/api/keyboard-shortcuts#predefined-keyboard-shortcuts')
            .attr('target', '_blank')
            .addClass('help-btn')
            .append(
                $('<div />')
                .text('?'))
                .insertAfter(widget.elem);
        this.tooltip = new Tooltip('Help', this.elem);
    }
}

export let actions = {
    bold: BoldAction,
    italic: ItalicAction,
    underline: UnderlineAction,
    bulletList: BulletListAction,
    orderedList: OrderedListAction,
    indent: IndentAction,
    outdent: OutdentAction,
    html: HTMLAction,
    heading: HeadingsAction,
    color: ColorsAction,
    image: ImageAction,
    link: LinkAction,
    code: CodeAction,
    codeBlock: CodeBlockAction,
    helpLink: HelpAction
}
