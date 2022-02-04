(function (exports, $, tiptap) {
    'use strict';

    class Tooltip {
        constructor(name, elem) {
            this.elem = $('<div />')
                .text(name)
                .addClass('tiptap-tooltip')
                .appendTo('body');
            let timeout;
            elem.on('mouseover', (e) => {
                let left = `${elem.offset().left + 20}px`;
                let top = `${elem.offset().top + elem.outerHeight()}px`;
                timeout = setTimeout(() => {
                    this.elem.css({left: left, top: top});
                    this.elem.fadeIn();
                }, 500);
            });
            elem.on('mouseout', (e) => {
                clearTimeout(timeout);
                this.elem.fadeOut();
            });
        }
    }
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
                .addClass('tiptap-dropdown')
                .appendTo('body');
            this.children = [];
            this.title = null;
            this.hide_dropdown = this.hide_dropdown.bind(this);
            $(document).on('click', this.hide_dropdown);
        }
        get active_item() {
            return this._active_item;
        }
        set active_item(item) {
            let clone = item.elem.children().clone();
            this.elem.empty().append(clone);
            if (this.title) {
                this.elem.prepend(this.title);
            }
            this.dd_elem.hide();
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
            this.elem
                .data('tiptap-bullet-list', this)
                .append($('<i />').addClass('glyphicon glyphicon-list'));
            this.tooltip = new Tooltip('Bullet List', this.elem);
        }
        on_click(e) {
            e.preventDefault();
            let ordered_list = $('.active', this.elem.parent()).data('tiptap-ordered-list');
            if (ordered_list) {
                ordered_list.active = false;
                ordered_list.elem.removeClass('active');
            }
            this.toggle();
            this.editor.chain().focus().toggleBulletList().run();
        }
    }
    class OrderedListAction extends Button {
        constructor(editor, action_opts, container_elem) {
            super(editor, action_opts, container_elem);
            this.elem
                .data('tiptap-ordered-list', this)
                .append($('<i />').addClass('glyphicon glyphicon-th-list'));
            this.tooltip = new Tooltip('Ordered List', this.elem);
        }
        on_click(e) {
            e.preventDefault();
            let bullet_list = $('.active', this.elem.parent()).data('tiptap-bullet-list');
            if (bullet_list) {
                bullet_list.active = false;
                bullet_list.elem.removeClass('active');
            }
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
            this.elem
                .append($('<i />').addClass('glyphicon glyphicon-pencil'))
                .css('order', '5');
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
            $('<span />')
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
            $('<span />')
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
            this.editor.chain().focus().setColor(this.color).run();
        }
    }
    class HeadingsAction extends DropdownButton {
        constructor(editor, action_opts, container_elem) {
            super(editor, action_opts, container_elem);
            this.title = $('<i />').addClass('glyphicon glyphicon-font');
            this.elem.css('order', "1");
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
            this.elem.css('order', "2");
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
            this.tooltip = new Tooltip('Add image', this.elem);
            this.elem
                .append($('<i />').addClass('glyphicon glyphicon-picture'))
                .css('order', '7');
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
            this.elem
                .append($('<i />').addClass('glyphicon glyphicon-link'))
                .css('order', '6');
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
    };
    class TiptapWidget {
        static initialize(context) {
            $('div.tiptap-editor', context).each(function() {
                let options = {
                    bold: true,
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
            this.controls = $('<div />')
                .addClass('tiptap-controls')
                .prependTo(this.elem);
            this.text_controls = $('<div />')
                .addClass('btn-group')
                .css('order', "3")
                .appendTo(this.controls)
                .hide();
            this.format_controls = $('<div />')
                .addClass('btn-group')
                .css('order', "4")
                .appendTo(this.controls)
                .hide();
            for (let option_name in opts) {
                let action_options = opts[option_name];
                let factory = action_factories[option_name];
                let target = this.controls;
                switch(option_name) {
                    case "bold":
                    case "italic":
                    case "underline":
                        target = this.text_controls;
                        target.show();
                        break;
                    case "bullet_list":
                    case "ordered_list":
                    case "indent":
                    case "outdent":
                        target = this.format_controls;
                        target.show();
                }
                new factory(this.editor, action_options, target);
            }
            this.hide_all = this.hide_all.bind(this);
            this.editor.on('update', this.hide_all);
        }
        unload_all() {
        }
        hide_all() {
            $('div.tiptap-dropdown', this.elem).hide();
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
