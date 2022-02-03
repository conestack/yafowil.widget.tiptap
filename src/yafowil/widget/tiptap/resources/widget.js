(function (exports, $$1, tiptap) {
    'use strict';

    class Button {
        static create(content) {
            let elem = $('<button />');
            if (content) {
                elem.append(content);
            }
            return new Button(elem);
        }
        constructor(elem) {
            this.elem = elem;
            this.ops = {};
            this.on_click = this.on_click.bind(this);
            this.elem.on('click', this.on_click);
        }
        on_click(e) {
            e.preventDefault();
            for (let op in this.ops) {
                if (op) { this.ops[op].execute(); }
            }
        }
        insert(target) {
            this.elem.appendTo(target);
            return this;
        }
        addTo(target, selectable) {
            target.add(this, selectable);
            return this;
        }
        setName(str) {
            this.elem.prepend($('<span />').addClass('name').text(str));
            return this;
        }
        set(arg) {
            if (arg && typeof arg === 'function') {
                this.ops.customFunction = {
                    execute: () => { arg(); }
                };
            }
            return this;
        }
        setToggle(execute, undo) {
            this.ops.toggle = {
                execute: () => {
                    this.active = !this.active ? true : false;
                    if (this.active) {
                        this.elem.addClass('active');
                        execute();
                    } else {
                        this.elem.removeClass('active');
                        undo();
                    }
                }
            };
        }
        setActive() {
            if (!this.parent) {return;}
            this.parent.active_item = this;
        }
    }
    class DropButton extends Button {
        static create(content) {
            let elem = $('<button />').addClass('drop_btn');
            if (content) {
                elem.append(content);
            }
            return new DropButton(elem);
        }
        constructor(elem) {
            super(elem);
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
            super.on_click(e);
            this.dd_elem
                .css('left', `${this.elem.offset().left}px`)
                .css('top', `${this.elem.offset().top + this.elem.outerHeight()}px`)
                .toggle();
        }
        add(item, selectable) {
            item.parent = this;
            item.elem.addClass('dropdown-item');
            if (selectable) {
                item.ops.activate = {
                    execute: () => {this.active_item = item;}
                };
            }
            item.insert(this.dd_elem);
            this.children.push(item);
        }
        addForm(content, custom_function) {
            for (let item of content) {
                $('<span />')
                    .addClass('dropdown-item')
                    .append($('<span />').addClass('name').text(`${item}:`))
                    .append($('<input type="text" />')
                    .addClass(`input-${item}`))
                    .appendTo(this.dd_elem);
            }
            this.submit_btn = Button
                .create($('<span />').text('Submit'))
                .insert(this.dd_elem)
                .set(custom_function);
            this.submit_btn.elem.addClass('submit');
            return this;
        }
    }

    class TiptapButton extends Button {
        static create(editor, content) {
            let elem = $$1('<button />');
            if (content) {
                elem.append(content);
            }
            return new TiptapButton(editor, elem);
        }
        constructor(editor, elem) {
            super(elem);
            this.editor = editor;
        }
        set(str) {
            if (!str) {return;}
            super.set(str);
            if (typeof str === 'string') {
                let args = str.split(', ');
                if (args.includes('bold')) {
                    this.elem.css('font-weight', 'bold');
                    this.ops.boldToggle = {
                        execute: () => { this.editor.commands.toggleBold(); }
                    };
                }
                if (args.includes('italic')) {
                    this.elem.css('font-style', 'italic');
                    this.ops.italicToggle = {
                        execute: () => { this.editor.commands.toggleItalic(); }
                    };
                }
                if (args.includes('underline')) {
                    this.elem.css('text-decoration', 'underline');
                    this.ops.underlineToggle = {
                        execute: () => { this.editor.commands.toggleUnderline(); }
                    };
                }
                if (args.includes('paragraph')) {
                    this.ops.pToggle = {
                        execute: () => { this.editor.commands.setParagraph(); }
                    };
                }
                if (args.includes('bulletList')) {
                    this.ops.toggleBulletList = {
                        execute: () => { this.editor.commands.toggleBulletList(); }
                    };
                }
                if (args.includes('orderedList')) {
                    this.ops.toggleOrderedList = {
                        execute: () => { this.editor.commands.toggleOrderedList(); }
                    };
                }
                if (args.includes('indent')) {
                    this.ops.addBQ = {
                        execute: () => { this.editor.commands.setBlockquote(); }
                    };
                }
                if (args.includes('outdent')) {
                    this.ops.rmBQ = {
                        execute: () => { this.editor.commands.unsetBlockquote(); }
                    };
                }
            } else {
                super.set(str);
            }
            return this;
        }
        setHeading(level) {
            this.ops.headingToggle = {
                execute: () => {this.editor.commands.toggleHeading({level: level});}
            };
            return this;
        }
        setColor(color) {
            this.ops.colorSet = {
                execute: () => { this.editor.commands.setColor(color); }
            };
            return this;
        }
    }
    class TiptapDropButton extends DropButton {
        static create(content) {
            let elem = $$1('<button />').addClass('drop_btn');
            if (content) {
                elem.append(content);
            }
            return new TiptapDropButton(elem);
        }
        constructor(elem) {
            super(elem);
        }
    }
    class TiptapWidget {
        static initialize(context) {
            $$1('div.tiptap-editor', context).each(function() {
                let options = {
                    bold: true,
                    italic: true,
                    underline: true,
                    heading: true,
                    text_colors: [
                        {name: 'blue', color: '#1a21fb'},
                        {name: 'lime', color:'#ccff00'},
                        {name: 'teal', color: '#2acaea'},
                        {name: 'red', color: '#d0060a'}
                    ],
                    bulletList : true,
                    orderedList: true
                };
                new TiptapWidget($$1(this), options);
            });
        }
        constructor(elem, ops) {
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
            this.editarea = $$1('div.ProseMirror', this.elem);
            this.textarea = $$1('<textarea />')
                .addClass('ProseMirror')
                .appendTo(this.elem);
            this.buttons_textstyles = $$1('<div />')
                .addClass('btn-group')
                .prependTo(this.elem);
            if (ops.bold) {
                this.bold_btn = TiptapButton
                    .create(this.editor, $$1('<span />').text('B'))
                    .insert(this.buttons_textstyles)
                    .set('bold');
            }
            if (ops.italic) {
                this.italic_btn = TiptapButton
                    .create(this.editor, $$1('<span />').text('i'))
                    .insert(this.buttons_textstyles)
                    .set('italic');
            }
            if (ops.underline) {
                this.underline_btn = TiptapButton
                    .create(this.editor, $$1('<span />').text('U'))
                    .insert(this.buttons_textstyles)
                    .set('underline');
            }
            this.new_html_btn = TiptapButton
                .create(this.editor, $$1('<i class="glyphicon glyphicon-pencil">'))
                .insert(this.buttons_textstyles)
                .setToggle(() => {
                    let html = this.editor.getHTML();
                    this.editarea.hide();
                    this.textarea.show().text(html);},
                    () => {
                        let html = this.textarea.val();
                        this.textarea.hide();
                        this.editarea.show();
                        this.editor.commands.setContent(html);
                    }
                );
            if (ops.bulletList) {
                this.ul_btn = TiptapButton
                    .create(this.editor, $$1('<i />').addClass('glyphicon glyphicon-list'))
                    .insert(this.buttons_textstyles)
                    .set('bulletList');
            }
            if (ops.orderedList) {
                this.ul_btn = TiptapButton
                    .create(this.editor, $$1('<i />').addClass('glyphicon glyphicon-th-list'))
                    .insert(this.buttons_textstyles)
                    .set('orderedList');
            }
            this.indent_btn = TiptapButton
                .create(this.editor, $$1('<i />').addClass('glyphicon glyphicon-indent-left'))
                .insert(this.buttons_textstyles)
                .set('indent');
            this.indent_btn = TiptapButton
                .create(this.editor, $$1('<i />').addClass('glyphicon glyphicon-indent-right'))
                .insert(this.buttons_textstyles)
                .set('outdent');
            if (ops.heading) {
                this.heading_btn = TiptapDropButton
                    .create()
                    .insert(this.buttons_textstyles);
                TiptapButton.create(this.editor, $$1('<span />', $$1('body')).text('Text'))
                    .addTo(this.heading_btn, true)
                    .set('paragraph');
                for (let i=1; i<=6; i++) {
                    TiptapButton.create(this.editor, $$1('<span />').text(`Heading ${i}`))
                        .setHeading(i)
                        .addTo(this.heading_btn, true);
                }
                this.heading_btn.active_item = this.heading_btn.children[0];
            }
            if (ops.text_colors) {
                this.colors_btn = TiptapDropButton
                    .create()
                    .insert(this.buttons_textstyles);
                for (let item of ops.text_colors) {
                    let color_elem = $$1('<div />')
                        .addClass('color')
                        .css('background-color', item.color);
                    TiptapButton.create(this.editor, color_elem)
                        .setName(item.name)
                        .setColor(item.color)
                        .addTo(this.colors_btn, true);
                }
                this.colors_btn.active_item = this.colors_btn.children[0];
            }
            this.img_btn = TiptapDropButton
                .create($$1('<i />').addClass('glyphicon glyphicon-picture'))
                .addForm(
                    ['source', 'title', 'alt'],
                    () => {
                        let src = $$1('input.input-source', this.dd_elem).val();
                        let alt = $$1('input.input-alt', this.dd_elem).val();
                        let title = $$1('input.input-title', this.dd_elem).val();
                        this.editor.commands.setImage({
                            src: src,
                            alt: alt,
                            title: title
                        });
                    })
                .insert(this.buttons_textstyles);
            this.link_btn = TiptapDropButton
                .create($$1('<span />').text('A'))
                .insert(this.buttons_textstyles)
                .addForm(['href'], () => {
                    let href = $$1('input.input-href', this.dd_elem).val();
                    this.editor.commands.setLink({href: href});
                });
            this.hide_all = this.hide_all.bind(this);
            this.editor.on('update', this.hide_all);
        }
        unload_all() {
        }
        hide_all() {
            $$1('div.btn-dropdown', this.elem).hide();
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
