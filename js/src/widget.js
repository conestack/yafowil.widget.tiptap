import $ from 'jquery';
import tiptap from 'tiptap';
import {Button, DropButton} from './buttons.js';

class TiptapButton extends Button {
    static create(editor, content) {
        let elem = $('<button />');
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
                }
            }
            if (args.includes('italic')) {
                this.elem.css('font-style', 'italic');
                this.ops.italicToggle = {
                    execute: () => { this.editor.commands.toggleItalic(); }
                }
            }
            if (args.includes('underline')) {
                this.elem.css('text-decoration', 'underline');
                this.ops.underlineToggle = {
                    execute: () => { this.editor.commands.toggleUnderline(); }
                }
            }
            if (args.includes('paragraph')) {
                this.ops.pToggle = {
                    execute: () => { this.editor.commands.setParagraph(); }
                }
            }
            if (args.includes('bulletList')) {
                this.ops.toggleBulletList = {
                    execute: () => { this.editor.commands.toggleBulletList(); }
                }
            }
            if (args.includes('orderedList')) {
                this.ops.toggleOrderedList = {
                    execute: () => { this.editor.commands.toggleOrderedList(); }
                }
            }
            if (args.includes('indent')) {
                this.ops.addBQ = {
                    execute: () => { this.editor.commands.setBlockquote(); }
                }
            }
            if (args.includes('outdent')) {
                this.ops.rmBQ = {
                    execute: () => { this.editor.commands.unsetBlockquote(); }
                }
            }
        } else {
            super.set(str);
        }

        return this;
    }

    setHeading(level) {
        this.ops.headingToggle = {
            execute: () => {this.editor.commands.toggleHeading({level: level});}
        }
        return this;
    }

    setColor(color) {
        this.ops.colorSet = {
            execute: () => { this.editor.commands.setColor(color); }
        }
        return this;
    }
}

class TiptapDropButton extends DropButton {

    static create(content) {
        console.log(content)
        let elem = $('<button />').addClass('drop_btn');
        if (content) {
            elem.append(content);
        }
        return new TiptapDropButton(elem);
    }

    constructor(elem) {
        super(elem);
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
            this.bold_btn = TiptapButton
                .create(this.editor, $('<span />').text('B'))
                .insert(this.buttons_textstyles)
                .set('bold');
        }
        if (ops.italic) {
            this.italic_btn = TiptapButton
                .create(this.editor, $('<span />').text('i'))
                .insert(this.buttons_textstyles)
                .set('italic');
        }
        if (ops.underline) {
            this.underline_btn = TiptapButton
                .create(this.editor, $('<span />').text('U'))
                .insert(this.buttons_textstyles)
                .set('underline');
        }

        this.new_html_btn = TiptapButton
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

        if (ops.bulletList) {
            this.ul_btn = TiptapButton
                .create(this.editor, $('<i />').addClass('glyphicon glyphicon-list'))
                .insert(this.buttons_textstyles)
                .set('bulletList');
        }

        if (ops.orderedList) {
            this.ul_btn = TiptapButton
                .create(this.editor, $('<i />').addClass('glyphicon glyphicon-th-list'))
                .insert(this.buttons_textstyles)
                .set('orderedList');
        }

        this.indent_btn = TiptapButton
            .create(this.editor, $('<i />').addClass('glyphicon glyphicon-indent-left'))
            .insert(this.buttons_textstyles)
            .set('indent');

        this.indent_btn = TiptapButton
            .create(this.editor, $('<i />').addClass('glyphicon glyphicon-indent-right'))
            .insert(this.buttons_textstyles)
            .set('outdent');

        // drop btns
        if (ops.heading) {
            this.heading_btn = TiptapDropButton
                .create()
                .insert(this.buttons_textstyles);

            TiptapButton.create(this.editor, $('<span />', $('body')).text('Text'))
                .addTo(this.heading_btn, true)
                .set('paragraph');

            for (let i=1; i<=6; i++) {
                TiptapButton.create(this.editor, $('<span />').text(`Heading ${i}`))
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
                let color_elem = $('<div />')
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
            .create($('<i />').addClass('glyphicon glyphicon-picture'))
            .addInput(['source', 'title', 'alt'])
            .insert(this.buttons_textstyles);

        this.sub_img_btn = TiptapButton
            .create(this.editor, $('<span />').text(`submit`))
            .addTo(this.img_btn)
            .set(
                () => {
                    let src = $('input.img-source', this.dd_elem).val();
                    let alt = $('input.img-alt', this.dd_elem).val();
                    let title = $('input.img-title', this.dd_elem).val();

                    this.editor.commands.setImage({
                        src: src,
                        alt: alt,
                        title: title
                    });
                }
            );

        this.hide_all = this.hide_all.bind(this);
        this.editor.on('update', this.hide_all);
    }

    unload_all() {

    }

    hide_all() {
        $('div.btn-dropdown', this.elem).hide();
    }
}