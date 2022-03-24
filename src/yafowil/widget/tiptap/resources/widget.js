var yafowil_tiptap = (function (exports, $) {
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
        constructor(editor, opts = {}) {
            this.editor = editor;
            this.editor_elem = $(editor.options.element);
            this.elem = $('<button />')
                .appendTo(opts.container_elem);
            this.opts = opts;
            if (opts.tooltip) { new Tooltip(opts.tooltip, this.elem); }
            if (opts.icon) {
                this.icon = $('<i />')
                    .addClass(`glyphicon glyphicon-${opts.icon}`)
                    .appendTo(this.elem);
            }
            if (opts.text) {
                $(`<span />`)
                    .text(opts.text)
                    .appendTo(this.elem);
            }
            if (opts.css) { $('> *', this.elem).css(opts.css); }
            this.content = $('> *', this.elem);
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
        on_click(e) {
            e.preventDefault();
        }
    }
    class DropdownButton extends Button {
        constructor(editor, opts = {}) {
            super(editor, opts);
            this.elem.addClass('drop_btn');
            this.dd_elem = $('<div />')
                .addClass('tiptap-dropdown')
                .appendTo('body');
            this.children = [];
            if (opts.submit) {
                this.dd_elem.addClass('grid');
                this.submit_elem = $('<button />')
                    .addClass('submit')
                    .text('submit')
                    .appendTo(this.dd_elem);
                this.submit = this.submit.bind(this);
                this.submit_elem.on('click', this.submit);
            }
            this.hide_dropdown = this.hide_dropdown.bind(this);
            $(document).on('click', this.hide_dropdown);
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
            this.dd_elem.hide();
            this._active_item = item;
        }
        unload() {
            $(document).off('click', this.hide_dropdown);
            $(window).off('resize', this.on_resize);
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
        on_click(e) {
            e.preventDefault();
            let offset_left = this.elem.offset().left,
                elem_width = this.elem.outerWidth(),
                dd_width = this.dd_elem.outerWidth(),
                space_right = $(window).width() - offset_left - elem_width;
            let left = (space_right < dd_width) ?
                offset_left - dd_width + elem_width : offset_left;
            this.dd_elem
                .css('left', `${left}px`)
                .css('top', `${this.elem.offset().top + this.elem.outerHeight()}px`)
                .toggle();
        }
        hide_dropdown(e) {
            if (!this.dd_elem.is(':visible')) { return; }
            if (e.target !== this.dd_elem[0] &&
                e.target !== this.elem[0] &&
                $(e.target).closest(this.dd_elem).length === 0 &&
                $(e.target).closest(this.elem).length === 0)
            {
                this.dd_elem.hide();
                this.active = false;
            }
        }
        on_update() {
            this.dd_elem.hide();
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
            this.swatches = widget.swatches;
            for (let swatch of this.swatches) {
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
            for (let swatch of this.swatches) {
                let index = this.swatches.indexOf(swatch);
                if (this.editor.isActive('textStyle', {color: swatch.color})) {
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
                new TiptapWidget(elem, {
                    actions: elem.data('tiptap-actions'),
                    colors: elem.data('tiptap-colors'),
                    helpLink: elem.data('tiptap-helpLink')
                });
            });
        }
        constructor(elem, opts={}) {
            this.elem = elem;
            elem.data('tiptap-widget', this);
            this.controls = $('<div />')
                .addClass('tiptap-controls')
                .prependTo(elem);
            this.textarea = $('textarea', elem);
            if (!this.textarea.length) {
                this.textarea = $('<textarea />')
                    .addClass('tiptap-editor')
                    .appendTo(elem);
            }
            opts = this.parse_opts(opts);
            this.buttons = {};
            this.swatches = opts.colors;
            if (opts.helpLink) {
                let factory = actions.helpLink;
                this.helpLink = new factory(this);
            }
            this.editor = new tiptap.Editor({
                element: elem[0],
                extensions: opts.extensions,
                content: this.textarea.text()
            });
            opts.actions.forEach(act => {
                if (Array.isArray(act)) {
                    let container = $('<div />')
                        .addClass('btn-group')
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
        parse_opts(opts) {
            opts.extensions = new Set([
                tiptap.Document,
                tiptap.Paragraph,
                tiptap.Text,
                tiptap.TextStyle,
                tiptap.Dropcursor
            ]);
            let filter_actions = (name) => {
                if (Array.isArray(name)) {
                    return true;
                } else if (actions[name] !== undefined) {
                    actions[name].extensions.forEach(ext => opts.extensions.add(ext));
                    return true;
                } else {
                    console.log(`ERROR: Defined action does not exist at '${name}'`);
                    return false;
                }
            };
            opts.actions = opts.actions.filter(filter_actions);
            opts.actions.forEach((ac, i) => {
                if (Array.isArray(ac)) {
                    opts.actions[i] = ac.filter(filter_actions);
                }
            });
            return opts;
        }
        on_update() {
            for (let btn in this.buttons) {
                if (this.buttons[btn].on_update) {
                    this.buttons[btn].on_update();
                }
            }
            this.textarea.text(this.editor.getHTML());
        }
        on_selection_update() {
            for (let btn in this.buttons) {
                if (this.buttons[btn].on_selection_update) {
                    this.buttons[btn].on_selection_update();
                }
            }
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

})({}, jQuery);
