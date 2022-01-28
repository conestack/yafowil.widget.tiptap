import $ from 'jquery';
import {Editor, getText} from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Heading from '@tiptap/extension-heading';
import ListItem from '@tiptap/extension-list-item';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import Blockquote from '@tiptap/extension-blockquote';
import Code from '@tiptap/extension-code';
import CodeBlock from '@tiptap/extension-code-block';

class Button {

    static create(widget, content, func) {
        let elem = $('<button />');
        if (content instanceof Array) {
            for (let item of content) {
                elem.append(item);
            }
        } else {
            elem.append(content);
        }
        return new Button(widget, elem, func);
    }

    constructor(widget, elem, func) {
        this.elem = elem;
        this.widget = widget;
        if (func) {
            this.func = func;
            this.func = this.func.bind(this);
        }
        this.on_click = this.on_click.bind(this);
        this.elem.on('click', this.on_click);
    }

    on_click(e) {
        e.preventDefault();
        if (this.func) {
            this.func();
        }
    }
}

class DropButton extends Button {

    static create(widget, children) {
        let elem = $('<button />').addClass('drop_btn');
        return new DropButton(widget, elem, children);
    }

    constructor(widget, elem, children) {
        super(widget, elem);
        this.dd_elem = $('<div />')
            .addClass('btn-dropdown')
            .appendTo(widget.elem);

        this.children = [];
        if (children) {
            for (let child of children) {
                this.add(child);
            }
            this.active_item = this.children[0];
        }

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

    add(item) {
        item.elem.addClass('dropdown-item');
        item.elem.on('click', () => {
            this.active_item = item;
        });
        this.dd_elem.append(item.elem);
        this.children.push(item);
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

        this.editor = new Editor({
            element: this.elem[0],
            extensions: [
                StarterKit,
                Underline,
                TextStyle,
                Color,
                ListItem,
                BulletList,
                OrderedList,
                Blockquote,
                Code,
                CodeBlock
            ],
            content: '<p>Hello World!</p>',
        });

        this.buttons_textstyles = $('<div />')
            .addClass('btn-group')
            .prependTo(this.elem);

        if (ops.bold) {
            this.bold_btn = Button.create(this, 'B', function() {
                this.widget.editor.chain().focus().toggleBold().run();
            });
            this.bold_btn.elem.css('font-weight', 'bold');
        }

        if (ops.italic) {
            this.italic_btn = Button.create(this, 'i', function() {
                this.widget.editor.chain().focus().toggleItalic().run();
            });
            this.italic_btn.elem.css('font-style', 'italic');
        }

        if (ops.underline) {
            this.underline_btn = Button.create(this, 'U', function() {
                this.widget.editor.chain().focus().toggleUnderline().run();
            });
            this.underline_btn.elem.css('text-decoration', 'underline');
        }

        if (ops.heading) {
            let items = [];
            items.push(Button.create(
                this,
                $('<span />').text('Text'),
                function() {this.widget.editor.commands.setParagraph()}
            ));
            for (let i=1; i<=6; i++) {
                items.push(Button.create(
                    this,
                    $('<span />').text(`Heading ${i}`),
                    function() {this.widget.editor.commands.toggleHeading({level: i})}
                ));
            }
            this.heading_btn = DropButton.create(this, items);
        }

        if (ops.text_colors) {
            let items = [];
            for (let item of ops.text_colors) {
                let name_elem = $('<span />').text(item.name),
                    color_elem = $('<div />')
                    .addClass('color')
                    .css('background-color', item.color);
                items.push(Button.create(
                    this,
                    [color_elem, name_elem],
                    function() {
                        this.widget.editor.commands.setColor(item.color);
                    }
                ));
            }
            this.color_btn = DropButton.create(this, items);
        }

        if (ops.bulletList) {
            this.ul_btn = Button.create(this, 'Bullet List', function() {
                this.widget.editor.commands.toggleBulletList();
            });
        }

        if (ops.orderedList) {
            this.ol_btn = Button.create(this, 'Ordered List', function() {
                this.widget.editor.commands.toggleOrderedList();
            });
        }

        this.indent_btn = Button.create(this, 'Indent', function() {
            this.widget.editor.commands.setBlockquote();
        });

        this.outdent_btn = Button.create(this, 'Outdent', function() {
            this.widget.editor.commands.unsetBlockquote();
        });

        this.html_btn = Button.create(this, 'Edit HTML', function() {
            this.html_edit = !this.html_edit ? true : false;
            console.log(this.html_edit)

            if (this.html_edit) {
                console.log('is not editable')
                let html = this.widget.editor.getHTML();
                let cont = this.widget.parse_from_html(html);
                this.widget.editor.commands.setContent(`<p>${cont}</p>`);
            } else {
                console.log('is editable');
                let html = this.widget.editor.getHTML();
                let cont = this.widget.parse_to_html(html);
                this.widget.editor.commands.setContent(`${cont}`);
            }

        });
        // let html = this.editor.getHTML();
        // let new_html = this.parse_from_html(html);
        // this.editor.commands.setContent(`<p>${new_html}</p>`);


        this.buttons_textstyles
            .append(this.bold_btn.elem)
            .append(this.italic_btn.elem)
            .append(this.underline_btn.elem)
            .after(this.color_btn.elem)
            .after(this.heading_btn.elem)
            .after(this.ul_btn.elem)
            .after(this.ol_btn.elem)
            .after(this.indent_btn.elem)
            .after(this.outdent_btn.elem)
            .after(this.html_btn.elem);

        this.hide_all = this.hide_all.bind(this);
        this.editor.on('update', this.hide_all);
    }

    unload_all() {

    }

    parse_from_html(html) {
        let arr_html = html.split('');
        for (let i = 0; i < arr_html.length; i++) {
            if (html.charAt(i).toLowerCase() === '<') {
                arr_html[i] = '&lt;';
            } else if (html.charAt(i).toLowerCase() === '>') {
                arr_html[i] = '&gt;';
            }
        }
        return arr_html.join('');
    }

    parse_to_html(html) {
        // some escape regex
    }

    hide_all() {
        $('div.btn-dropdown', this.elem).hide();
    }
}