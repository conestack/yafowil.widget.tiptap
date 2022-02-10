
import {Button, DropdownButton} from './buttons.js';
import tiptap from 'tiptap';

class BoldAction extends Button {
    constructor(editor, action_opts, container_elem) {
        super(editor, action_opts, {
            container_elem: container_elem,
            text: 'B',
            css: {'font-weight': 'bold'},
            tooltip: 'Toggle Bold',
            toggle: true
        });
    }

    on_click(e) {
        super.on_click(e);
        this.editor.chain().focus().toggleBold().run();
    }
}

class ItalicAction extends Button {
    constructor(editor, action_opts, container_elem) {
        super(editor, action_opts, {
            container_elem: container_elem,
            text: 'i',
            css: {'font-style': 'italic'},
            tooltip: 'Toggle Italic',
            toggle: true
        });
    }

    on_click(e) {
        super.on_click(e);
        this.editor.chain().focus().toggleItalic().run();
    }
}

class UnderlineAction extends Button {
    constructor(editor, action_opts, container_elem) {
        super(editor, action_opts, {
            container_elem: container_elem,
            text: 'U',
            css: {'text-decoration': 'underline'},
            tooltip: 'Toggle Underline',
            toggle: true
        });
    }

    on_click(e) {
        super.on_click(e);
        this.editor.chain().focus().toggleUnderline().run();
    }
}

class BulletListAction extends Button {
    constructor(editor, action_opts, container_elem) {
        super(editor, action_opts, {
            container_elem: container_elem,
            icon: 'list',
            tooltip: 'Bullet List',
            toggle: true
        });
        this.event = new $.Event(
            'tiptap-bl-action'
        );
        this.editor_elem.on('tiptap-ol-action tiptap-paragraph-action', (e) => {
            this.active = false;
        });
    }

    on_click(e) {
        super.on_click(e);
        this.editor.chain().focus().toggleBulletList().run();
    }
}

class OrderedListAction extends Button {
    constructor(editor, action_opts, container_elem) {
        super(editor, action_opts, {
            container_elem: container_elem,
            icon: 'th-list',
            tooltip: 'Ordered List',
            toggle: true
        });
        this.event = new $.Event(
            'tiptap-ol-action'
        );
        this.editor_elem.on('tiptap-bl-action tiptap-paragraph-action', (e) => {
            this.active = false;
        });
    }

    on_click(e) {
        super.on_click(e);
        this.editor.chain().focus().toggleOrderedList().run();
    }
}

class IndentAction extends Button {
    constructor(editor, action_opts, container_elem) {
        super(editor, action_opts, {
            container_elem: container_elem,
            icon: 'indent-left',
            tooltip: 'Indent'
        });
    }

    on_click(e) {
        super.on_click(e);
        this.editor.chain().focus().setBlockquote().run();
    }
}

class OutdentAction extends Button {
    constructor(editor, action_opts, container_elem) {
        super(editor, action_opts, {
            container_elem: container_elem,
            icon: 'indent-right',
            tooltip: 'Indent'
        });
    }

    on_click(e) {
        super.on_click(e);
        this.editor.chain().focus().unsetBlockquote().run();
    }
}

class HTMLAction extends Button {
    constructor(editor, action_opts, container_elem) {
        super(editor, action_opts, {
            container_elem: container_elem,
            icon: 'pencil',
            tooltip: 'Edit HTML',
            toggle: true
        });

        this.parent = this.elem.closest('div.tiptap-editor');
        this.editarea = $('div.ProseMirror', this.parent);
        this.textarea = $('textarea.ProseMirror', this.parent);
    }

    on_click(e) {
        super.on_click(e);

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
        super(editor, action_opts, {
            container_elem: container_elem,
            text: `Heading ${level}`
        });
        this.level = level;
    }

    on_click(e) {
        super.on_click(e);
        this.editor.chain().focus().toggleHeading({level: this.level}).run();
    }
}

class ParagraphAction extends Button {
    constructor(editor, action_opts, container_elem) {
        super(editor, action_opts, {
            container_elem: container_elem,
            text: 'Text'
        });
        this.event = new $.Event(
            'tiptap-paragraph-action'
        );
    }

    on_click(e) {
        super.on_click(e);
        this.editor.chain().focus().setParagraph().run();
    }
}

class ColorAction extends Button {
    constructor(editor, action_opts, container_elem, color) {
        super(editor, action_opts, {
            container_elem: container_elem, 
            text: color.name,
            color: color.color
        });

        this.name = color.name;
        this.color = color.color;
    }

    on_click(e) {
        super.on_click(e);
        this.editor.chain().focus().setColor(this.color).run();
    }
}

class HeadingsAction extends DropdownButton {
    constructor(editor, action_opts, container_elem) {
        super(editor, action_opts, {
            container_elem: container_elem,
            icon: 'font'
        });

        this.children.push(
            new ParagraphAction(editor, action_opts, this.dd_elem)
        );
        for (let i=1; i<=6; i++) {
            this.children.push(
                new HeadingAction(editor, action_opts, this.dd_elem, i)
            )
        }
        this.set_items();
    }
}

class ColorsAction extends DropdownButton {
    constructor(editor, action_opts, container_elem) {
        super(editor, action_opts, {
            container_elem: container_elem
        });

        for (let color of action_opts) {
            this.children.push(
                new ColorAction(editor, action_opts, this.dd_elem, color)
            )
        }

        this.set_items();
    }
}

class ImageAction extends DropdownButton {
    constructor(editor, action_opts, container_elem) {
        super(editor, action_opts, {
            container_elem: container_elem,
            tooltip: 'Add Image',
            icon: 'picture',
            submit: true
        });

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
    constructor(editor, action_opts, container_elem) {
        super(editor, action_opts, {
            container_elem: container_elem,
            tooltip: 'Add Link',
            icon: 'link',
            submit: true
        });

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

export class ActionGroup {
    constructor(name, target) {
        this.name = name;
        this.elem = $('<div />')
            .addClass(`btn-group ${name}`)
            .appendTo(target);
    }
}

export let actions = {
    bold: {
        factory: BoldAction,
        extensions: [tiptap.Bold]
    },
    italic: {
        factory: ItalicAction,
        extensions: [tiptap.Italic]
    },
    underline: {
        factory: UnderlineAction,
        extensions: [tiptap.Underline]
    },
    bullet_list: {
        factory: BulletListAction,
        extensions: [tiptap.BulletList, tiptap.ListItem]
    },
    ordered_list: {
        factory: OrderedListAction,
        extensions: [tiptap.OrderedList, tiptap.ListItem]
    },
    indent: {
        factory: IndentAction,
        extensions: [tiptap.Blockquote]
    },
    outdent: {
        factory: OutdentAction,
        extensions: [tiptap.Blockquote]
    },
    html: {
        factory: HTMLAction,
        extensions: []
    },
    heading: {
        factory: HeadingsAction,
        extensions: [tiptap.Heading]
    },
    colors: {
        factory: ColorsAction,
        extensions: [tiptap.Color]
    },
    image: {
        factory: ImageAction,
        extensions: [tiptap.Image]
    },
    link: {
        factory: LinkAction,
        extensions: [tiptap.Link]
    }
}