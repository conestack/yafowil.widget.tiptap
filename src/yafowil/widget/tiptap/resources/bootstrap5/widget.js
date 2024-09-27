var yafowil_tiptap = (function (exports, $, bootstrap) {
    'use strict';

    class Action {
        constructor(editor, opts = {}) {
            this.editor = editor;
            this.editor_elem = $(editor.options.element);
            this.opts = opts;
            this.compile(opts);
            this.container_elem = opts.container_elem;
            this.on_click = this.on_click.bind(this);
            this.elem.on('click', this.on_click);
        }
        compile(opts) {
            this.container = $('<div />')
                .addClass('action')
                .appendTo(opts.container_elem);
            this.elem = $('<div />')
                .appendTo(this.container);
            if (opts.tooltip) {
                this.container.attr('data-bs-toggle', 'tooltip')
                    .attr('data-bs-title', opts.tooltip);
                new bootstrap.Tooltip(this.container);
            }
            if (opts.icon) {
                this.icon = $('<i />')
                    .addClass(`bi-${opts.icon}`)
                    .appendTo(this.elem);
            }
            if (opts.text) {
                $(`<span />`)
                    .text(opts.text)
                    .appendTo(this.elem);
            }
            if (opts.css) { $('> *', this.elem).css(opts.css); }
            this.content = $('> *', this.elem);
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
        on_click(e) {
            e.preventDefault();
        }
    }
    class Button extends Action {
        compile(opts) {
            super.compile(opts);
            this.container.addClass('btn-group');
            this.elem.attr('role', 'button')
                .addClass('btn btn-outline-primary');
        }
    }
    class DropdownButton extends Button {
        constructor(editor, opts = {}) {
            super(editor, opts);
            this.elem.addClass('drop_btn dropdown-toggle')
                .attr('data-bs-toggle', 'dropdown');
            this.dd_elem = $('<ul />')
                .addClass('dropdown-menu tiptap-dropdown')
                .appendTo(this.container);
            this.children = [];
            if (opts.submit) {
                this.dd_elem.addClass('px-3');
                this.submit_elem = $('<button />')
                    .addClass('btn btn-primary mt-2 submit')
                    .text('submit')
                    .appendTo(this.dd_elem);
                this.submit = this.submit.bind(this);
                this.submit_elem.on('click', this.submit);
            }
            this.hide_dropdown = this.hide_dropdown.bind(this);
            this.on_resize = this.on_resize.bind(this);
            $(window).on('resize', this.on_resize);
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
            this._active_item = item;
        }
        unload() {
            $(window).off('resize', this.on_resize);
        }
        on_resize(e) {
            this.active = false;
        }
        set_items() {
            for (let child of this.children) {
                child.container.addClass('dropdown-item');
                child.elem.on('click', (e) => {
                    this.active_item = child;
                });
            }
            this.active_item = this.children[0];
        }
        hide_dropdown(e) {
            if (!this.dd_elem.is(':visible')) { return; }
        }
        on_update() {
        }
        submit(e) {
            e.preventDefault();
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
                icon: 'list-ul',
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
                icon: 'list-ol',
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
                icon: 'text-indent-left',
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
                icon: 'text-indent-right',
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
            this.editarea = $('div.ProseMirror', this.widget.elem)
                .addClass('form-control');
            this.textarea = this.widget.textarea;
        }
        on_click(e) {
            e.preventDefault();
            this.active = !this.active;
            for (let id in this.widget.buttons) {
                if (id === this.id) {
                    continue;
                }
                const btn = this.widget.buttons[id];
                if (this.active) {
                    btn.elem.addClass('disabled');
                } else {
                    btn.elem.removeClass('disabled');
                }
            }
            if (this.active) {
                this.editarea.hide();
                this.textarea.show();
            } else {
                this.textarea.hide();
                this.editarea.show();
                this.editor.chain().focus().setContent(this.textarea.val()).run();
            }
        }
    }
    class HeadingAction extends Action {
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
    class ParagraphAction extends Action {
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
    class ColorAction extends Action {
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
    class UnsetColorAction extends Action {
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
                icon: 'fonts'
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
                );
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
                icon: 'image',
                submit: true
            });
            this.id = 'image';
            this.src_elem = $('<div />')
                .addClass('input-group input-group-sm mb-2')
                .append($('<span />').addClass('input-group-text name').text(`src:`))
                .append($('<input type="text" />').addClass('form-control'))
                .prependTo(this.dd_elem);
            this.alt_elem = $('<div />')
                .addClass('input-group input-group-sm mb-2')
                .append($('<span />').addClass('input-group-text name').text(`alt:`))
                .append($('<input type="text" />').addClass('form-control'))
                .prependTo(this.dd_elem);
            this.title_elem = $('<div />')
                .addClass('input-group input-group-sm mb-2')
                .append($('<span />').addClass('input-group-text name').text(`title:`))
                .append($('<input type="text" />').addClass('form-control'))
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
                icon: 'link-45deg',
                submit: true
            });
            this.id = 'link';
            this.href_elem = $('<div />')
                .addClass('input-group input-group-sm')
                .append($('<span />').addClass('input-group-text name').text(`href:`))
                .append($('<input type="text" />').addClass('form-control'))
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
            this.widget = widget;
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
                .attr('data-bs-toggle', 'tooltip')
                .attr('data-bs-title', 'Help')
                .addClass('help-btn')
                .append(
                    $('<div />')
                    .text('?'))
                    .insertAfter(widget.elem);
                new bootstrap.Tooltip(this.container);
        }
    }
    let actions = {
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
    };

    class TiptapWidget {
        static initialize(context) {
            $('div.tiptap-editor', context).each(function() {
                let elem = $(this);
                if (window.yafowil_array !== undefined &&
                    window.yafowil_array.inside_template(elem)) {
                    return;
                }
                new TiptapWidget(elem, {
                    actions: elem.data('tiptap-actions'),
                    colors: elem.data('tiptap-colors'),
                    helpLink: elem.data('tiptap-helpLink')
                });
            });
        }
        constructor(elem, opts={}) {
            elem.data('yafowil-tiptap', this);
            this.elem = elem;
            this.controls = $('<div />')
                .addClass('tiptap-controls btn-toolbar mb-2')
                .attr('role', 'toolbar')
                .prependTo(elem);
            this.textarea = $('textarea', elem);
            if (!this.textarea.length) {
                this.textarea = $('<textarea />')
                    .addClass('tiptap-editor')
                    .appendTo(elem);
            }
            this.buttons = {};
            this.colors = opts.colors;
            if (opts.helpLink) {
                let factory = actions.helpLink;
                this.helpLink = new factory(this);
            }
            let tiptap_actions = this.parse_actions(opts.actions);
            let tiptap_extensions = this.parse_extensions(tiptap_actions);
            this.editor = new tiptap.Editor({
                element: elem[0],
                extensions: tiptap_extensions,
                content: this.textarea.val()
            });
            tiptap_actions.forEach(act => {
                if (Array.isArray(act)) {
                    let container = $('<div />')
                        .addClass('btn-group me-2')
                        .appendTo(this.controls);
                        act.forEach(name => this.add_button(name, container));
                } else {
                    this.add_button(act, this.controls);
                }
            });
            this.on_update = this.on_update.bind(this);
            this.editor.on('update', this.on_update);
            this.on_selection_update = this.on_selection_update.bind(this);
            this.editor.on('selectionUpdate', this.on_selection_update);
        }
        destroy() {
            this.unload_all();
            this.editor.destroy();
            this.elem.empty();
            this.buttons = null;
        }
        unload_all() {
            for (let btn in this.buttons) {
                if (this.buttons[btn].unload) {
                    this.buttons[btn].unload();
                }
            }
        }
        add_button(name, container) {
            let factory = actions[name],
                btn = new factory(this, this.editor, {
                    container_elem: container
                });
            this.buttons[name] = btn;
        }
        parse_actions(acs) {
            let ret = [];
            function parse(ret_arr, acts) {
                acts.forEach((action, i) => {
                    if (Array.isArray(action)) {
                        ret.push([]);
                        parse(ret[ret.length - 1], action);
                    } else if (actions[action] == undefined) {
                        console.log(`ERROR: Defined action does not exist at '${action}'`);
                    } else {
                        ret_arr.push(action);
                    }
                });
            }
            parse(ret, acs);
            return ret;
        }
        parse_extensions(acs) {
            let extensions = new Set([
                tiptap.Document,
                tiptap.Paragraph,
                tiptap.Text,
                tiptap.TextStyle,
                tiptap.Dropcursor
            ]);
            let flattened = acs.flat(2);
            flattened.forEach(ac => {
                actions[ac].extensions.forEach(ext => extensions.add(ext));
            });
            return extensions;
        }
        on_update() {
            for (let btn in this.buttons) {
                if (this.buttons[btn].on_update) {
                    this.buttons[btn].on_update();
                }
            }
            this.textarea.val(this.editor.getHTML());
        }
        on_selection_update() {
            for (let btn in this.buttons) {
                if (this.buttons[btn].on_selection_update) {
                    this.buttons[btn].on_selection_update();
                }
            }
        }
    }
    function tiptap_on_array_add(inst, context) {
        TiptapWidget.initialize(context);
    }
    function register_array_subscribers() {
        if (window.yafowil_array === undefined) {
            return;
        }
        window.yafowil_array.on_array_event('on_add', tiptap_on_array_add);
    }

    $(function() {
        if (window.ts !== undefined) {
            ts.ajax.register(TiptapWidget.initialize, true);
        } else if (window.bdajax !== undefined) {
            bdajax.register(TiptapWidget.initialize, true);
        } else {
            TiptapWidget.initialize();
        }
        register_array_subscribers();
    });

    exports.TiptapWidget = TiptapWidget;
    exports.register_array_subscribers = register_array_subscribers;

    Object.defineProperty(exports, '__esModule', { value: true });


    window.yafowil = window.yafowil || {};
    window.yafowil.tiptap = exports;


    return exports;

})({}, jQuery, bootstrap);
