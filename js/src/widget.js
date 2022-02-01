import $ from 'jquery';
import tiptap from 'tiptap';

class NewBtn {
    static create(editor, content) {
        let elem = $('<button />');
        if (content) {
            elem.append(content);
        }
        return new NewBtn(editor, elem);
    }

    constructor(editor, elem) {
        this.editor = editor;
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

    setName(str) {
        this.elem.prepend($('<span />').text(str));
        return this;
    }

    setBold() {
        this.elem.css('font-weight', 'bold');
        this.ops.boldToggle = {
            execute: () => {this.editor.commands.toggleBold();}
        }
        return this;
    }

    setItalic() {
        this.elem.css('font-style', 'italic');
        this.ops.italicToggle = {
            execute: () => {this.editor.commands.toggleItalic();}
        }
        return this;
    }

    setUnderline() {
        this.elem.css('text-decoration', 'underline');
        this.ops.underlineToggle = {
            execute: () => {this.editor.commands.toggleUnderline();}
        }
        return this;
    }

    setColor(color) {
        this.elem.css('text-decoration', 'underline');
        this.ops.colorSet = {
            execute: () => {this.editor.commands.setColor(color);}
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
        }
    }

    setParagraph()  {
        this.ops.pToggle = {
            execute: () => {this.editor.commands.setParagraph();}
        }
        return this;
    }

    setHeading(level) {
        this.ops.headingToggle = {
            execute: () => {this.editor.commands.toggleHeading({level: level});}
        }
        return this;
    }

    setBulletList() {
        this.ops.toggleBulletList = {
            execute: () => {this.editor.commands.toggleBulletList();}
        }
        return this;
    }

    setOrderedList() {
        this.ops.toggleOrderedList = {
            execute: () => {this.editor.commands.toggleOrderedList();}
        }
        return this;
    }

    setIndent() {
        this.ops.addBQ = {
            execute: () => {this.editor.commands.setBlockquote();}
        }
        return this;
    }

    setOutdent() {
        this.ops.rmBQ = {
            execute: () => {this.editor.commands.unsetBlockquote();}
        }
        return this;
    }
}

class NewDropBtn extends NewBtn {

    static create(editor, content) {
        let elem = $('<button />').addClass('drop_btn');
        if (content) {
            elem.append(content);
        }
        return new NewDropBtn(editor, elem);
    }

    constructor(editor, elem) {
        super(editor, elem);
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

    add(item) {
        item.elem.addClass('dropdown-item');
        item.elem.on('click', () => {
            this.active_item = item;
        });
        this.dd_elem.append(item.elem);
        this.children.push(item);
    }
}

// class ImageButton extends DropButton {
//     static create(widget) {
//         let elem = $('<button />').addClass('drop_btn');
//         return new ImageButton(widget, elem);
//     }

//     constructor(widget, elem) {
//         super(widget, elem);

//         this.src_input = $('<span />')
//             .addClass('dropdown-item')
//             .text('source:')
//             .append($('<input type="text" />')
//             .addClass('img-source'))
//             .appendTo(this.dd_elem);

//         this.title_input = $('<span />')
//             .addClass('dropdown-item')
//             .text('title:')
//             .append($('<input type="text" />')
//             .addClass('img-title'))
//             .appendTo(this.dd_elem);

//         this.alt_input = $('<span />')
//             .addClass('dropdown-item')
//             .text('alt:')
//             .append($('<input type="text" />')
//             .addClass('img-alt'))
//             .appendTo(this.dd_elem);

//         let submit_btn_elem = this.submit_btn_elem = $('<button />')
//             .text('submit')
//             .appendTo(this.dd_elem);

//         this.submit_btn = new Button(widget, submit_btn_elem);
//         this.submit_btn.elem.on('click', (e) => {
//             let src = $('input.img-source', this.dd_elem).val();
//             let alt = $('input.img-alt', this.dd_elem).val();
//             let title = $('input.img-title', this.dd_elem).val();
//             this.widget.editor.commands.setImage({
//                 src: src,
//                 alt: alt,
//                 title: title
//             })
//         });
//     }
// }

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
            this.bold_btn = NewBtn
                .create(this.editor, $('<span />').text('B'))
                .insert(this.buttons_textstyles)
                .setBold();
        }
        if (ops.italic) {
            this.italic_btn = NewBtn
                .create(this.editor, $('<span />').text('i'))
                .insert(this.buttons_textstyles)
                .setItalic();
        }
        if (ops.underline) {
            this.underline_btn = NewBtn
                .create(this.editor, $('<span />').text('U'))
                .insert(this.buttons_textstyles)
                .setUnderline();
        }

        if (ops.heading) {
            this.heading_btn = NewDropBtn
            .create(this.editor)
            .insert(this.buttons_textstyles);

            let p_btn = NewBtn
                .create(this.editor, $('<span />').text(`Text`))
                .setParagraph();

            this.heading_btn.add(p_btn)
            for (let i=1; i<=6; i++) {
                let btn = NewBtn
                .create(this.editor, $('<span />').text(`Heading ${i}`))
                .setHeading(i);
                this.heading_btn.add(btn);
            }
            this.heading_btn.active_item = p_btn;
        }

        this.new_html_btn = NewBtn
            .create(this.editor, $('<i class="glyphicon glyphicon-pencil">'))
            .insert(this.buttons_textstyles)
            .setToggle(() => {
                let html = this.editor.getHTML();
                this.editarea.hide();
                this.textarea.show().text(html)},
                () => {
                    let html = this.textarea.val();
                    this.textarea.hide();
                    this.editarea.show();
                    this.editor.commands.setContent(html);
                }
            );

        if (ops.text_colors) {
            this.colors_btn = NewDropBtn
                .create(this.editor)
                .insert(this.buttons_textstyles);

            for (let item of ops.text_colors) {
                let color_elem = $('<div />')
                    .addClass('color')
                    .css('background-color', item.color);

                let btn = NewBtn
                    .create(this.editor, color_elem)
                    .setName(item.name)
                    .setColor(item.color);
                this.colors_btn.add(btn);

                this.colors_btn.active_item = btn;
            }
        }

        if (ops.bulletList) {
            this.ul_btn = NewBtn
                .create(this.editor, $('<i />').addClass('glyphicon glyphicon-list'))
                .insert(this.buttons_textstyles)
                .setBulletList();
        }

        if (ops.orderedList) {
            this.ul_btn = NewBtn
                .create(this.editor, $('<i />').addClass('glyphicon glyphicon-th-list'))
                .insert(this.buttons_textstyles)
                .setOrderedList();
        }

        this.indent_btn = NewBtn
            .create(this.editor, $('<i />').addClass('glyphicon glyphicon-indent-left'))
            .insert(this.buttons_textstyles)
            .setIndent();

        this.indent_btn = NewBtn
            .create(this.editor, $('<i />').addClass('glyphicon glyphicon-indent-right'))
            .insert(this.buttons_textstyles)
            .setOutdent();

        this.img_btn = NewDropBtn
            .create(this.editor, $('<i class="glyphicon glyphicon-picture">'))
            .insert(this.buttons_textstyles);

        this.sub_img_btn = NewBtn
            .create(this.editor, $('<span />').text(`submit`));
        this.img_btn.add(this.sub_img_btn);

        this.hide_all = this.hide_all.bind(this);
        this.editor.on('update', this.hide_all);
    }

    unload_all() {

    }

    hide_all() {
        $('div.btn-dropdown', this.elem).hide();
    }
}