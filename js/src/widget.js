import $ from 'jquery';
import tiptap from 'tiptap';

class Button {

    static create(widget, ops) {
        let elem = $('<button />');
        return new Button(widget, elem, ops);
    }

    constructor(widget, elem, ops) {
        this.elem = elem;
        this.widget = widget;
        this.ops = ops;

        this.on_click = this.on_click.bind(this);
        this.elem.on('click', this.on_click);
    }

    on_click(e) {
        e.preventDefault();
        if (this.ops && this.ops.click) {
            this.ops.click();
        }
    }
}

class ToggleButton extends Button {
    constructor(widget, elem, ops) {
        super(widget, elem, ops);

        this.do = this.ops.toggle[0].bind(this.widget);
        this.undo = this.ops.toggle[1].bind(this.widget);
    }

    on_click(e) {
        super.on_click(e);
        this.active = !this.active ? true : false;

        if (this.active) {
            this.elem.addClass('active');
            this.do();
        } else {
            this.elem.removeClass('active');
            this.undo();
        }
    }
}

class DropButton extends Button {

    static create(widget) {
        let elem = $('<button />').addClass('drop_btn');
        return new DropButton(widget, elem);
    }

    constructor(widget, elem) {
        super(widget, elem);
        this.dd_elem = $('<div />')
            .addClass('btn-dropdown')
            .appendTo(widget.elem);

        this.hide_dropdown = this.hide_dropdown.bind(this);
        $(document).on('click', this.hide_dropdown);
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
        this.dd_elem.css('transform', `translate(${this.elem.position().left}px, ${this.elem.outerHeight()}px)`);
        this.dd_elem.toggle();
    }
}

class ImageButton extends DropButton {
    static create(widget) {
        let elem = $('<button />').addClass('drop_btn');
        return new ImageButton(widget, elem);
    }

    constructor(widget, elem) {
        super(widget, elem);

        this.src_input = $('<span />')
            .addClass('dropdown-item')
            .text('source:')
            .append($('<input type="text" />')
            .addClass('img-source'))
            .appendTo(this.dd_elem);

        this.title_input = $('<span />')
            .addClass('dropdown-item')
            .text('title:')
            .append($('<input type="text" />')
            .addClass('img-title'))
            .appendTo(this.dd_elem);

        this.alt_input = $('<span />')
            .addClass('dropdown-item')
            .text('alt:')
            .append($('<input type="text" />')
            .addClass('img-alt'))
            .appendTo(this.dd_elem);

        let submit_btn_elem = this.submit_btn_elem = $('<button />')
            .text('submit')
            .appendTo(this.dd_elem);

        this.submit_btn = new Button(widget, submit_btn_elem);
        this.submit_btn.elem.on('click', (e) => {
            let src = $('input.img-source', this.dd_elem).val();
            let alt = $('input.img-alt', this.dd_elem).val();
            let title = $('input.img-title', this.dd_elem).val();
            this.widget.editor.commands.setImage({
                src: src,
                alt: alt,
                title: title
            })
        });
    }
}

class DropListButton extends DropButton {

    static create(widget, children) {
        let elem = $('<button />').addClass('drop_btn');
        return new DropListButton(widget, elem, children);
    }

    constructor(widget, elem, children) {
        super(widget, elem);
        this.children = [];
        if (children) {
            for (let child of children) {
                this.add(child);
            }
            this.active_item = this.children[0];
        }
    }

    get active_item() {
        return this._active_item;
    }

    set active_item(item) {
        let clone = item.elem.children().clone();
        this.elem.empty().append(clone);
        this._active_item = item;
    }

    add(item) {
        item.elem.addClass('dropdown-item');
        item.elem.on('click', () => {
            this.active_item = item;
        });
        this.dd_elem.append(item.elem);
        this.children.push(item);
    }
}

export class TiptapWidget {
    static initialize(context) {
        $('div.tiptap-editor', context).each(function() {
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
            new TiptapWidget($(this), options);
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
                tiptap.Image
            ],
            content: '<p>Hello World!</p>',
        });

        this.editarea = $('div.ProseMirror', this.elem);
        let textarea = this.textarea = $('<textarea />')
            .addClass('ProseMirror')
            .appendTo(this.elem);

        this.buttons_textstyles = $('<div />')
            .addClass('btn-group')
            .prependTo(this.elem);

        if (ops.bold) {
            let bold_elem = $('<button />')
                .text('B')
                .css('font-weight', 'bold')
                .appendTo(this.buttons_textstyles);
            this.bold_btn = new Button(this, bold_elem, {
                click: () => {this.editor.commands.toggleBold();}
            });
        }

        if (ops.italic) {
            let italic_elem = $('<button />')
                .text('i')
                .css('font-style', 'italic')
                .appendTo(this.buttons_textstyles);
            this.italic_btn = new Button(this, italic_elem, {
                click: () => {this.editor.commands.toggleItalic();}
            });
        }

        if (ops.underline) {
            let underline_elem = $('<button />')
                .text('U')
                .css('text-decoration', 'underline')
                .appendTo(this.buttons_textstyles);
            this.underline_btn = Button.create(this, underline_elem, {
                click: () => {this.editor.commands.toggleUnderline();}
            });
        }

        if (ops.heading) {
            let heading_elem = $('<button />')
                .addClass('drop_btn')
                .insertAfter(this.buttons_textstyles);
            let items = [];

            const text_elem = $('<button />')
                .append($('<span />').text('Text'));


            items.push(new Button(
                this,
                text_elem, {
                    click: () => {this.editor.commands.setParagraph();}
                }
            ));
            for (let i=1; i<=6; i++) {
                let heading_btn = $('<button />')
                    .append($('<span />').text(`Heading ${i}`));

                items.push(new Button(
                    this,
                    heading_btn, {
                        click: () => {this.editor.commands.toggleHeading({level: i})}
                    }
                ));
            }
            this.heading_btn = new DropListButton(this, heading_elem, items);
        }

        if (ops.text_colors) {
            let colors_btn = $('<button />')
                .addClass('drop_btn')
                .insertAfter(this.heading_btn.elem);

            let items = [];
            for (let item of ops.text_colors) {
                let name_elem = $('<span />').text(item.name);
                let color_elem = $('<div />')
                    .addClass('color')
                    .css('background-color', item.color);

                let btn = $('<button />')
                    .append(color_elem)
                    .append(name_elem)
                    .insertAfter(this.buttons_textstyles);

                items.push(new Button(this, btn, {
                    click: () => {this.editor.commands.setColor(item.color);}
                }));
            }
            this.color_btn = new DropListButton(this, colors_btn, items);
        }

        if (ops.bulletList) {
            let bullet_elem = $('<button />')
                .append($('<i />').addClass('glyphicon glyphicon-list'))
                .insertAfter(this.color_btn.elem);
            this.ul_btn = new Button(
                this,
                bullet_elem, {
                    click: () => {this.editor.commands.toggleBulletList();}
                }
            );
        }

        if (ops.orderedList) {
            let ol_elem = $('<button />')
                .append($('<i />').addClass('glyphicon glyphicon-th-list'))
                .insertAfter(this.ul_btn.elem);
            this.ol_btn = new Button(
                this,
                ol_elem, {
                    click: () => {this.editor.commands.toggleOrderedList();}
                }
            );
        }

        let indent_elem = $('<button />')
                .append($('<i />').addClass('glyphicon glyphicon-indent-left'))
                .insertAfter(this.ol_btn.elem);
        this.indent_btn = new Button(this, indent_elem, {
                click: () => {this.editor.commands.setBlockquote();}
        });

        let outdent_elem = $('<button />')
            .append($('<i />').addClass('glyphicon glyphicon-indent-right'))
            .insertAfter(this.indent_btn.elem);
        this.outdent_btn = new Button(this, outdent_elem, {
            click: ()=> {this.editor.commands.unsetBlockquote();}
        });

        let html_btn_elem = $('<button />')
            .append($('<i class="glyphicon glyphicon-pencil">'))
            .insertAfter(this.buttons_textstyles);

        this.html_btn = new ToggleButton(this, html_btn_elem, {
            toggle: [function() {
                    let html = this.editor.getHTML();
                    this.editarea.hide();
                    this.textarea.show().text(html);
                }, function() {
                    let html = this.textarea.val();
                    this.textarea.hide();
                    this.editarea.show();
                    this.editor.commands.setContent(html);
            }]
        });

        let img_btn_elem = $('<button />')
            .append($('<i class="glyphicon glyphicon-picture">'))
            .insertAfter(this.buttons_textstyles);
        this.image_btn = new ImageButton(this, img_btn_elem);

        this.hide_all = this.hide_all.bind(this);
        this.editor.on('update', this.hide_all);
    }

    unload_all() {

    }

    hide_all() {
        $('div.btn-dropdown', this.elem).hide();
    }
}