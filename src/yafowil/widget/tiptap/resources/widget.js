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
            if (this.opts.toggle) {
                active ? this.elem.addClass('active') : this.elem.removeClass('active');
            }
            this._active = active;
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
            this.active = false;
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
                this.active = false;
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
            this.widget_elem = widget.elem;
        }
        on_click(e) {
            e.preventDefault();
            this.active = !this.active;
            this.editor.chain().focus().toggleBold().run();
            this.widget_elem.trigger(new $.Event('tiptap-action', {
                action: this
            }));
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
            this.widget_elem = widget.elem;
        }
        on_click(e) {
            e.preventDefault();
            this.active = !this.active;
            this.editor.chain().focus().toggleItalic().run();
            this.widget_elem.trigger(new $.Event('tiptap-action', {
                action: this
            }));
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
            this.widget_elem = widget.elem;
        }
        on_click(e) {
            e.preventDefault();
            this.active = !this.active;
            this.editor.chain().focus().toggleUnderline().run();
            this.widget_elem.trigger(new $.Event('tiptap-action', {
                action: this
            }));
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
            this.id = 'bullet_list';
            this.widget_elem = widget.elem;
        }
        on_click(e) {
            e.preventDefault();
            this.active = !this.active;
            this.editor.chain().focus().toggleBulletList().run();
            this.widget_elem.trigger(new $.Event('tiptap-action', {
                action: this
            }));
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
            this.id = 'ordered_list';
            this.widget_elem = widget.elem;
        }
        on_click(e) {
            e.preventDefault();
            this.active = !this.active;
            this.editor.chain().focus().toggleOrderedList().run();
            this.widget_elem.trigger(new $.Event('tiptap-action', {
                action: this
            }));
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
            this.widget_elem = widget.elem;
        }
        on_click(e) {
            e.preventDefault();
            if (this.editor.can().setBlockquote()) {
                this.editor.chain().focus().setBlockquote().run();
            }
            this.widget_elem.trigger(new $.Event('tiptap-action', {
                action: this
            }));
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
            this.widget_elem = widget.elem;
        }
        on_click(e) {
            e.preventDefault();
            if (this.editor.can().unsetBlockquote()) {
                this.editor.chain().focus().unsetBlockquote().run();
                this.widget_elem.trigger(new $.Event('tiptap-action', {
                    action: this
                }));
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
            this.widget_elem = widget.elem;
            this.parent = this.elem.closest('div.tiptap-editor');
            this.editarea = $('div.ProseMirror', this.parent);
            this.textarea = $('textarea.ProseMirror', this.parent);
        }
        on_click(e) {
            e.preventDefault();
            this.active = !this.active;
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
            this.widget_elem.trigger(new $.Event('tiptap-action', {
                action: this
            }));
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
            this.widget_elem = widget.elem;
        }
        on_click(e) {
            e.preventDefault();
            this.editor.chain().focus().toggleHeading({level: this.level}).run();
            this.widget_elem.trigger(new $.Event('tiptap-action', {
                action: this
            }));
        }
    }
    class ParagraphAction extends Button {
        constructor(widget, editor, opts) {
            super(editor, {
                container_elem: opts.container_elem,
                text: 'Text'
            });
            this.id = 'paragraph';
            this.widget_elem = widget.elem;
        }
        on_click(e) {
            e.preventDefault();
            this.editor.chain().focus().setParagraph().run();
            this.widget_elem.trigger(new $.Event('tiptap-action', {
                action: this
            }));
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
            this.widget_elem = widget.elem;
            $('<div />')
                .addClass('color')
                .css('background-color', this.swatch.color)
                .appendTo(this.elem);
        }
        on_click(e) {
            e.preventDefault();
            this.editor.chain().focus().setColor(this.swatch.color).run();
            this.widget_elem.trigger(new $.Event('tiptap-action', {
                action: this
            }));
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
                );
            }
            this.set_items();
        }
        reset() {
            this.active_item = this.children[0];
        }
    }
    class ColorsAction extends DropdownButton {
        static extensions = [tiptap.Color];
        constructor(widget, editor, opts) {
            super(editor, {
                container_elem: opts.container_elem
            });
            this.id = 'colors';
            for (let swatch of opts.action_opts) {
                this.children.push(
                    new ColorAction(widget, editor, {
                        container_elem: this.dd_elem,
                        swatch: swatch
                    })
                );
            }
            this.set_items();
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
            this.widget_elem = widget.elem;
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
            this.widget_elem.trigger(new $.Event('tiptap-action', {
                action: this
            }));
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
            this.widget_elem = widget.elem;
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
            this.widget_elem.trigger(new $.Event('tiptap-action', {
                action: this
            }));
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
            factory: BoldAction
        },
        italic: {
            factory: ItalicAction
        },
        underline: {
            factory: UnderlineAction
        },
        bullet_list: {
            factory: BulletListAction
        },
        ordered_list: {
            factory: OrderedListAction
        },
        indent: {
            factory: IndentAction
        },
        outdent: {
            factory: OutdentAction
        },
        html: {
            factory: HTMLAction
        },
        heading: {
            factory: HeadingsAction
        },
        colors: {
            factory: ColorsAction
        },
        image: {
            factory: ImageAction
        },
        link: {
            factory: LinkAction
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
                tiptap.TextStyle,
                tiptap.Dropcursor
            ]);
            for (let option_name in opts) {
                actions[option_name].factory.extensions.forEach(
                    ext => extensions.add(ext)
                );
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
                this.buttons.push(new factory(this, this.editor, {
                    action_opts: options,
                    container_elem: container
                }));
            }
            this.hide_all = this.hide_all.bind(this);
            this.editor.on('update', this.hide_all);
            this.editor.on('selectionUpdate', () => {
            });
            this.on_event = this.on_event.bind(this);
            this.elem.on('tiptap-action', this.on_event);
            $$1(document).on('keyup', (e) => {
                let ul = this.buttons.find(x => x.id === 'bullet_list');
                let ol = this.buttons.find(x => x.id === 'ordered_list');
                if (!ol && !ul) return;
                let bold = this.buttons.find(x => x.id === 'bold');
                let italic = this.buttons.find(x => x.id === 'italic');
                let underline = this.buttons.find(x => x.id === 'underline');
                if (e.key === 'Enter') {
                    if (ul && ul.active || ol && ol.active) {
                        if (bold && bold.active) {
                            this.editor.commands.setBold();
                        }
                        if (italic && italic.active) {
                            this.editor.commands.setItalic();
                        }
                        if (underline && underline.active) {
                            this.editor.commands.setUnderline();
                        }
                    }
                }
            });
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
            console.log('update');
            $$1('div.tiptap-dropdown', this.elem).hide();
        }
        on_event(e) {
            let find = (id) => {
                return this.buttons.find(x => x.id === id);
            };
            let deactivate = (id) => {
                let btn = this.buttons.find(x => x.id === id);
                if (btn) btn.active = false;
            };
            switch(e.action.id) {
                case 'bullet_list':
                    deactivate('ordered_list');
                    find('headings').reset();
                    break;
                case 'ordered_list':
                    deactivate('bullet_list');
                    find('headings').reset();
                    break;
                case 'paragraph':
                case 'outdent':
                    deactivate('ordered_list');
                    deactivate('bullet_list');
                    break;
                case 'heading':
                    deactivate('ordered_list');
                    deactivate('bullet_list');
                    let bold = find('bold');
                    let italic = find('italic');
                    let underline = find('underline');
                    if (bold && bold.active) {
                        this.editor.commands.setBold();
                    }
                    if (italic && italic.active) {
                        this.editor.commands.setItalic();
                    }
                    if (underline && underline.active) {
                        this.editor.commands.setUnderline();
                    }
                    break;
            }
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
