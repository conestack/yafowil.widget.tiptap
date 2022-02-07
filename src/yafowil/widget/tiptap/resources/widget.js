(function (exports, $$1, tiptap) {
    'use strict';

    class Tooltip {
        constructor(name, elem) {
            this.elem = $$1('<div />')
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
        constructor(editor, action_opts, container_elem, opts) {
            this.editor = editor;
            this.elem = $$1('<button />')
                .appendTo(container_elem);
            if (opts && opts.tooltip) {
                new Tooltip(opts.tooltip, this.elem);
            }
            if (opts && opts.order) {
                this.elem.css('order', opts.order);
            }
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
    class TextButton extends Button {
        constructor(editor, action_opts, container_elem, opts) {
            super(editor, action_opts, container_elem, opts);
            this.elem
                .text(opts.text)
                .css(opts.css);
        }
    }
    class IconButton extends Button {
        constructor(editor, action_opts, container_elem, opts) {
            super(editor, action_opts, container_elem, opts);
            $$1('<i />')
                .addClass(`glyphicon glyphicon-${opts.btn_class}`)
                .appendTo(this.elem);
        }
    }
    class DropdownButton extends Button {
        constructor(editor, action_opts, container_elem) {
            super(editor, action_opts, container_elem);
            this.elem.addClass('drop_btn');
            this.dd_elem = $$1('<div />')
                .addClass('tiptap-dropdown')
                .appendTo('body');
            this.children = [];
            this.title = null;
            this.hide_dropdown = this.hide_dropdown.bind(this);
            $$1(document).on('click', this.hide_dropdown);
            this.on_resize = this.on_resize.bind(this);
            $$1(window).on('resize', this.on_resize);
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
            $$1(document).off('click', this.hide_dropdown);
            $$1(window).off('resize', this.on_resize);
        }
        on_resize(e) {
            this.dd_elem.hide();
        }
        hide_dropdown(e) {
            if (!this.dd_elem.is(':visible')) { return; }
            if (e.target !== this.dd_elem[0] &&
                e.target !== this.elem[0] &&
                $$1(e.target).closest(this.dd_elem).length === 0 &&
                $$1(e.target).closest(this.elem).length === 0)
            {
                this.dd_elem.hide();
            }
        }
        on_click(e) {
            e.preventDefault();
            let offset_left = this.elem.offset().left,
                elem_width = this.elem.outerWidth(),
                dd_width = this.dd_elem.outerWidth(),
                space_right = $$1(window).width() - offset_left - elem_width;
            let left = (space_right < dd_width) ?
                offset_left - dd_width + elem_width : offset_left;
            this.dd_elem
                .css('left', `${left}px`)
                .css('top', `${this.elem.offset().top + this.elem.outerHeight()}px`)
                .toggle();
        }
    }

    class BoldAction extends TextButton {
        constructor(editor, action_opts, container_elem) {
            super(editor, action_opts, container_elem, {
                text: 'B',
                css: {'font-weight': 'bold'},
                tooltip: 'Toggle Bold'
            });
        }
        on_click(e) {
            e.preventDefault();
            this.toggle();
            this.editor.chain().focus().toggleBold().run();
        }
    }
    class ItalicAction extends TextButton {
        constructor(editor, action_opts, container_elem) {
            super(editor, action_opts, container_elem, {
                text: 'i',
                css: {'font-style': 'italic'},
                tooltip: 'Toggle Italic'
            });
        }
        on_click(e) {
            e.preventDefault();
            this.toggle();
            this.editor.chain().focus().toggleItalic().run();
        }
    }
    class UnderlineAction extends TextButton {
        constructor(editor, action_opts, container_elem) {
            super(editor, action_opts, container_elem, {
                text: 'U',
                css: {'text-decoration': 'underline'},
                tooltip: 'Toggle Underline'
            });
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
    class IndentAction extends IconButton {
        constructor(editor, action_opts, container_elem) {
            super(editor, action_opts, container_elem, {
                btn_class: 'indent-left',
                tooltip: 'Indent'
            });
        }
        on_click(e) {
            e.preventDefault();
            this.editor.chain().focus().setBlockquote().run();
        }
    }
    class OutdentAction extends IconButton {
        constructor(editor, action_opts, container_elem) {
            super(editor, action_opts, container_elem, {
                btn_class: 'indent-right',
                tooltip: 'Indent'
            });
        }
        on_click(e) {
            e.preventDefault();
            this.editor.chain().focus().unsetBlockquote().run();
        }
    }
    class HTMLAction extends IconButton {
        constructor(editor, action_opts, container_elem) {
            super(editor, action_opts, container_elem, {
                btn_class: 'pencil',
                tooltip: 'Edit HTML',
                order: "5"
            });
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
            this.dd_elem.hide();
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
            this.dd_elem.hide();
        }
    }
    let actions = {
        bold: {
            factory: BoldAction,
            extensions: [tiptap.Bold],
            target: '.text_controls'
        },
        italic: {
            factory: ItalicAction,
            extensions: [tiptap.Italic],
            target: '.text_controls'
        },
        underline: {
            factory: UnderlineAction,
            extensions: [tiptap.Underline],
            target: '.text_controls'
        },
        bullet_list: {
            factory: BulletListAction,
            extensions: [tiptap.BulletList, tiptap.ListItem],
            target: '.format_controls'
        },
        ordered_list: {
            factory: OrderedListAction,
            extensions: [tiptap.OrderedList, tiptap.ListIte],
            target: '.format_controls'
        },
        indent: {
            factory: IndentAction,
            extensions: [tiptap.Blockquote],
            target: '.format_controls'
        },
        outdent: {
            factory: OutdentAction,
            extensions: [tiptap.Blockquote],
            target: '.format_controls'
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
    };

    class TiptapWidget {
        static initialize(context) {
            $$1('div.tiptap-editor', context).each(function() {
                let options = {
                    bold: true,
                    italic: true,
                    underline: true,
                    bullet_list: true,
                    ordered_list: true,
                    indent: true,
                    outdent: true,
                    html: true,
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
                new TiptapWidget($$1(this), options);
            });
        }
        constructor(elem, opts = {}) {
            this.elem = elem;
            this.elem.data('tiptap-widget', this);
            let extensions = new Set([
                tiptap.Document,
                tiptap.Paragraph,
                tiptap.Text,
                tiptap.TextStyle
            ]);
            for (let option_name in opts) {
                actions[option_name].extensions.forEach(ext => extensions.add(ext));
            }
            this.editarea = $$1('div.ProseMirror', this.elem);
            this.textarea = $$1('<textarea />')
                .addClass('ProseMirror')
                .appendTo(this.elem);
            this.controls = $$1('<div />')
                .addClass('tiptap-controls')
                .prependTo(this.elem);
            if (opts.bold | opts.italic | opts.underline) {
                this.text_controls = $$1('<div />')
                    .addClass('btn-group text_controls')
                    .css('order', "3")
                    .appendTo(this.controls);
            }
            if (opts.bullet_list | opts.ordered_list | opts.indent | opts.outdent) {
                this.format_controls = $$1('<div />')
                    .addClass('btn-group format_controls')
                    .css('order', "4")
                    .appendTo(this.controls);
            }
            this.editor = new tiptap.Editor({
                element: this.elem[0],
                extensions: extensions,
                content: '<p>Hello World!</p>'
            });
            this.buttons = [];
            for (let option_name in opts) {
                let options = opts[option_name],
                    factory = actions[option_name].factory,
                    target = actions[option_name].target;
                let container = target ? $$1(target, this.controls) : this.controls;
                this.buttons.push(new factory(this.editor, options, container));
            }
            this.hide_all = this.hide_all.bind(this);
            this.editor.on('update', this.hide_all);
        }
        destroy() {
            this.unload_all();
            this.editor.destroy();
            this.elem.empty();
            this.buttons = null;
        }
        unload_all() {
            this.buttons.forEach(btn => {
                if (btn.unload) {
                    btn.unload();
                }
            });
        }
        hide_all() {
            $$1('div.tiptap-dropdown', this.elem).hide();
        }
    }

    $$1(function() {
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
