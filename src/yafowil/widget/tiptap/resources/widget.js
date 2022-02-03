(function (exports, $, tiptap) {
    'use strict';

    class Button {
        constructor(editor, action_opts, container_elem) {
            this.editor = editor;
            this.elem = $('<button />')
                .appendTo(container_elem);
            this.container_elem = container_elem;
            this.opts = action_opts;
            this.on_click = this.on_click.bind(this);
            this.elem.on('click', this.on_click);
        }
        toggle() {
            this.active = !this.active ? true : false;
            this.active ? this.elem.addClass('active') : this.elem.removeClass('active');
        }
    }
    class DropdownButton extends Button {
        constructor(editor, action_opts, container_elem) {
            super(editor, action_opts, container_elem);
            this.elem.addClass('drop_btn');
            this.dd_elem = $('<div />')
                .addClass('btn-dropdown')
                .appendTo('body');
            this.children = [];
            this.hide_dropdown = this.hide_dropdown.bind(this);
            $(document).on('click', this.hide_dropdown);
        }
        get active_item() {
            return this._active_item;
        }
        set active_item(item) {
            let clone = item.elem.children().clone();
            this.elem.empty().append(clone);
            this._active_item = item;
        }
        unload() {
            $(document).off('click', this.hide_dropdown);
        }
        hide_dropdown(e) {
            if (!this.dd_elem.is(':visible')) { return; }
            if (e.target !== this.dd_elem[0] &&
                e.target !== this.elem[0] &&
                $(e.target).closest(this.dd_elem).length === 0 &&
                $(e.target).closest(this.elem).length === 0)
            {
                this.dd_elem.hide();
            }
        }
        on_click(e) {
            e.preventDefault();
            this.dd_elem
                .css('left', `${this.elem.offset().left}px`)
                .css('top', `${this.elem.offset().top + this.elem.outerHeight()}px`)
                .toggle();
        }
    }

    class BoldAction extends Button {
        constructor(editor, action_opts, container_elem) {
            super(editor, action_opts, container_elem);
            this.elem
                .text('B')
                .css('font-weight', 'bold');
        }
        on_click(e) {
            e.preventDefault();
            this.editor.commands.toggleBold();
        }
    }
    class ItalicAction extends Button {
        constructor(editor, action_opts, container_elem) {
            super(editor, action_opts, container_elem);
            this.elem
                .text('i')
                .css('font-style', 'italic');
        }
        on_click(e) {
            e.preventDefault();
            this.editor.commands.toggleItalic();
        }
    }
    class UnderlineAction extends Button {
        constructor(editor, action_opts, container_elem) {
            super(editor, action_opts, container_elem);
            this.elem
                .text('U')
                .css('text-decoration', 'underline');
        }
        on_click(e) {
            e.preventDefault();
            this.editor.commands.toggleUnderline();
        }
    }
    class BulletListAction extends Button {
        constructor(editor, action_opts, container_elem) {
            super(editor, action_opts, container_elem);
            this.elem.append($('<i />').addClass('glyphicon glyphicon-list'));
        }
        on_click(e) {
            e.preventDefault();
            this.editor.commands.toggleBulletList();
        }
    }
    class OrderedListAction extends Button {
        constructor(editor, action_opts, container_elem) {
            super(editor, action_opts, container_elem);
            this.elem.append($('<i />').addClass('glyphicon glyphicon-th-list'));
        }
        on_click(e) {
            e.preventDefault();
            this.editor.commands.toggleOrderedList();
        }
    }
    class IndentAction extends Button {
        constructor(editor, action_opts, container_elem) {
            super(editor, action_opts, container_elem);
            this.elem.append($('<i />').addClass('glyphicon glyphicon-indent-left'));
        }
        on_click(e) {
            e.preventDefault();
            this.editor.commands.setBlockquote();
        }
    }
    class OutdentAction extends Button {
        constructor(editor, action_opts, container_elem) {
            super(editor, action_opts, container_elem);
            this.elem.append($('<i />').addClass('glyphicon glyphicon-indent-right'));
        }
        on_click(e) {
            e.preventDefault();
            this.editor.commands.unsetBlockquote();
        }
    }
    class HTMLAction extends Button {
        constructor(editor, action_opts, container_elem) {
            super(editor, action_opts, container_elem);
            this.elem.append($('<i />').addClass('glyphicon glyphicon-pencil'));
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
                this.editor.commands.setContent(this.textarea.val());
            }
        }
    }
    class HeadingAction extends Button {
        constructor(editor, action_opts, container_elem, level) {
            super(editor, action_opts, container_elem, level);
            this.level = level;
            $('<span />')
                .text(`Heading ${this.level}`)
                .appendTo(this.elem);
        }
        on_click(e) {
            e.preventDefault();
            this.editor.commands.toggleHeading({level: this.level});
        }
    }
    class ParagraphAction extends Button {
        constructor(editor, action_opts, container_elem) {
            super(editor, action_opts, container_elem);
            $('<span />')
                .text('Text')
                .appendTo(this.elem);
        }
        on_click(e) {
            e.preventDefault();
            this.editor.commands.setParagraph();
        }
    }
    class ColorAction extends Button {
        constructor(editor, action_opts, container_elem, color) {
            super(editor, action_opts, container_elem, color);
            this.name = color.name;
            this.color = color.color;
            $('<span />')
                .text(this.name)
                .appendTo(this.elem);
            $('<div />')
                .addClass('color')
                .css('background-color', this.color)
                .appendTo(this.elem);
        }
        on_click(e) {
            e.preventDefault();
            this.editor.commands.setColor(this.color);
        }
    }
    class HeadingsAction extends DropdownButton {
        constructor(editor, action_opts, container_elem) {
            super(editor, action_opts, container_elem);
            this.children.push(
                new ParagraphAction(editor, action_opts, this.dd_elem)
            );
            for (let i=1; i<=6; i++) {
                this.children.push(
                    new HeadingAction(editor, action_opts, this.dd_elem, i)
                );
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
                );
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
            this.elem.append($('<i />').addClass('glyphicon glyphicon-picture'));
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
            this.editor.commands.setImage({
                src: $('input', this.src_elem).val(),
                alt: $('input', this.alt_elem).val(),
                title: $('input', this.title_elem).val()
            });
        }
    }
    class LinkAction extends DropdownButton {
        constructor(editor, action_opts, container_elem) {
            super(editor, action_opts, container_elem);
            this.elem.text('A');
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
            this.editor.commands.setLink({href: href});
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
    };
    class TiptapWidget {
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
                        { name: 'default', color: '#333333'},
                        { name: 'blue', color: '#1a21fb' },
                        { name: 'lime', color: '#ccff00' },
                        { name: 'teal', color: '#2acaea' },
                        { name: 'red', color: '#d0060a' }
                    ],
                    image: true,
                    link: true
                };
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

    $(function() {
        if (window.ts !== undefined) {
            ts.ajax.register(TiptapWidget.initialize, true);
        } else {
            TiptapWidget.initialize();
        }
    });

    exports.TiptapWidget = TiptapWidget;

    Object.defineProperty(exports, '__esModule', { value: true });


    if (window.yafowil === undefined) {
        window.yafowil = {};
    }
    window.yafowil.tiptap = exports;


    return exports;

})({}, jQuery, tiptap);
//# sourceMappingURL=widget.js.map
