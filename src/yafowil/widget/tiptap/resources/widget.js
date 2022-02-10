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
        constructor(editor, opts = {}) {
            this.editor = editor;
            this.editor_elem = $$1(editor.options.element);
            this.elem = $$1('<button />')
                .appendTo(opts.container_elem);
            this.opts = opts;
            if (opts.tooltip) { new Tooltip(opts.tooltip, this.elem); }
            if (opts.order) { this.elem.css('order', opts.order); }
            if (opts.icon) {
                this.icon = $$1('<i />')
                    .addClass(`glyphicon glyphicon-${opts.icon}`)
                    .appendTo(this.elem);
            }
            if (opts.text) {
                $$1(`<span />`)
                    .text(opts.text)
                    .appendTo(this.elem);
            }
            if (opts.css) { $$1('> *', this.elem).css(opts.css); }
            this.content = $$1('> *', this.elem);
            this.container_elem = opts.container_elem;
            this.on_click = this.on_click.bind(this);
            this.elem.on('click', this.on_click);
        }
        get active() {
            return this._active;
        }
        set active(active) {
            if (active && this.event) {
                this.editor_elem.trigger(this.event);
            }
            if (this.opts.toggle) {
                active ? this.elem.addClass('active') : this.elem.removeClass('active');
            }
            this._active = active;
        }
        on_click(e) {
            e.preventDefault();
            this.active = !this.active ? true : false;
        }
    }
    class DropdownButton extends Button {
        constructor(editor, opts = {}) {
            super(editor, opts);
            this.elem.addClass('drop_btn');
            this.dd_elem = $$1('<div />')
                .addClass('tiptap-dropdown')
                .appendTo('body');
            this.children = [];
            if (opts.submit) {
                this.dd_elem.addClass('grid');
                this.submit_elem = $$1('<button />')
                    .addClass('submit')
                    .text('submit')
                    .appendTo(this.dd_elem);
                this.submit = this.submit.bind(this);
                this.submit_elem.on('click', this.submit);
            }
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
            if (this.content) {
                this.elem.prepend(this.content);
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
        set_items() {
            for (let child of this.children) {
                child.elem.addClass('dropdown-item');
                child.elem.on('click', (e) => {
                    this.active_item = child;
                });
            }
            this.active_item = this.children[0];
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

    class BoldAction extends Button {
        constructor(editor, opts) {
            super(editor, {
                container_elem: opts.container_elem,
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
        constructor(editor, opts) {
            super(editor, {
                container_elem: opts.container_elem,
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
        constructor(editor, opts) {
            super(editor, {
                container_elem: opts.container_elem,
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
        constructor(editor, opts) {
            super(editor, {
                container_elem: opts.container_elem,
                icon: 'list',
                tooltip: 'Bullet List',
                toggle: true
            });
            this.event = new $.Event(
                'tiptap-bl-action'
            );
            this.editor_elem.on(`
            tiptap-ol-action
            tiptap-paragraph-action
            tiptap-outdent-action`, (e) => {
                this.active = false;
            });
        }
        on_click(e) {
            super.on_click(e);
            this.editor.chain().focus().toggleBulletList().run();
        }
    }
    class OrderedListAction extends Button {
        constructor(editor, opts) {
            super(editor, {
                container_elem: opts.container_elem,
                icon: 'th-list',
                tooltip: 'Ordered List',
                toggle: true
            });
            this.event = new $.Event(
                'tiptap-ol-action'
            );
            this.editor_elem.on(`
            tiptap-bl-action
            tiptap-paragraph-action
            tiptap-outdent-action`, (e) => {
                this.active = false;
            });
        }
        on_click(e) {
            super.on_click(e);
            this.editor.chain().focus().toggleOrderedList().run();
        }
    }
    class IndentAction extends Button {
        constructor(editor, opts) {
            super(editor, {
                container_elem: opts.container_elem,
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
        constructor(editor, opts) {
            super(editor, {
                container_elem: opts.container_elem,
                icon: 'indent-right',
                tooltip: 'Indent'
            });
            this.event = new $.Event(
                'tiptap-outdent-action'
            );
        }
        on_click(e) {
            super.on_click(e);
            this.editor.chain().focus().unsetBlockquote().run();
        }
    }
    class HTMLAction extends Button {
        constructor(editor, opts) {
            super(editor, {
                container_elem: opts.container_elem,
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
        constructor(editor, opts) {
            super(editor, {
                container_elem: opts.container_elem,
                text: `Heading ${opts.level}`
            });
            this.level = opts.level;
        }
        on_click(e) {
            super.on_click(e);
            this.editor.chain().focus().toggleHeading({level: this.level}).run();
        }
    }
    class ParagraphAction extends Button {
        constructor(editor, opts) {
            super(editor, {
                container_elem: opts.container_elem,
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
        constructor(editor, opts) {
            super(editor, {
                container_elem: opts.container_elem,
                text: opts.swatch.name
            });
            this.swatch = opts.swatch;
            $('<div />')
                .addClass('color')
                .css('background-color', this.swatch.color)
                .appendTo(this.elem);
        }
        on_click(e) {
            super.on_click(e);
            this.editor.chain().focus().setColor(this.swatch.color).run();
        }
    }
    class HeadingsAction extends DropdownButton {
        constructor(editor, opts) {
            super(editor, {
                container_elem: opts.container_elem,
                icon: 'font'
            });
            this.children.push(
                new ParagraphAction(editor, {
                    container_elem: this.dd_elem
                })
            );
            for (let i=1; i<=6; i++) {
                this.children.push(
                    new HeadingAction(editor, {
                        container_elem: this.dd_elem,
                        level: i
                    })
                );
            }
            this.set_items();
        }
    }
    class ColorsAction extends DropdownButton {
        constructor(editor, opts) {
            super(editor, {
                container_elem: opts.container_elem
            });
            for (let swatch of opts.action_opts) {
                this.children.push(
                    new ColorAction(editor, {
                        container_elem: this.dd_elem,
                        swatch: swatch
                    })
                );
            }
            this.set_items();
        }
    }
    class ImageAction extends DropdownButton {
        constructor(editor, opts) {
            super(editor, {
                container_elem: opts.container_elem,
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
        constructor(editor, opts) {
            super(editor, {
                container_elem: opts.container_elem,
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
    class ActionGroup {
        constructor(name, target) {
            this.name = name;
            this.elem = $('<div />')
                .addClass(`btn-group ${name}`)
                .appendTo(target);
        }
    }
    let actions = {
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
    };

    class TiptapWidget {
        static initialize(context) {
            $$1('div.tiptap-editor', context).each(function() {
                let options = {
                    heading: true,
                    colors: [
                        { name: 'Default', color: '#333333'},
                        { name: 'Blue', color: '#1a21fb' },
                        { name: 'Lime', color: '#ccff00' },
                        { name: 'Teal', color: '#2acaea' },
                        { name: 'Red', color: '#d0060a' }
                    ],
                    bold: { target: 'text_controls' },
                    italic: { target: 'text_controls' },
                    underline: { target: 'text_controls' },
                    bullet_list: { target: 'format_controls' },
                    ordered_list: { target: 'format_controls' },
                    indent: { target: 'format_controls' },
                    outdent: { target: 'format_controls' },
                    html: true,
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
            this.editor = new tiptap.Editor({
                element: this.elem[0],
                extensions: extensions,
                content: '<p>Hello World!</p>'
            });
            this.buttons = [];
            let button_groups = [];
            for (let option_name in opts) {
                let options = opts[option_name],
                    factory = actions[option_name].factory,
                    target = options.target,
                    container = this.controls;
                if (target) {
                    let targ = button_groups.filter(group => {
                        return group.name === target ?? false
                    });
                    if (targ[0]) {
                        container = targ[0].elem;
                    } else {
                        let group = new ActionGroup(target, this.controls);
                        button_groups.push(group);
                        container = group.elem;
                    }
                }
                this.buttons.push(new factory(this.editor, {
                    action_opts: options,
                    container_elem: container
                }));
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
