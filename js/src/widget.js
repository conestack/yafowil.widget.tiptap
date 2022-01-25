import $ from 'jquery';
import {Editor} from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'

class Button {

    static create(content) {
        let elem = $('<button />');
        if (typeof content === 'string') {
            elem.text(content);
        } else {
            elem.append(content);
        }
        return elem;
    }

    constructor(editor, elem) {
        this.elem = elem;
        this.editor = editor;

        this.on_click = this.on_click.bind(this);
        this.elem.on('click', this.on_click);
    }

    on_click() {
        e.preventDefault();
    }
}

class BoldButton extends Button {

    static create(editor, content) {
        let elem = super.create(content);
        return new BoldButton(editor, elem);
    }

    constructor(editor, elem) {
        super(editor, elem);
    }

    on_click(e) {
        super.on_click(e);
        this.editor.chain().focus().toggleBold().run();
    }
}

class DropButton extends Button {
    constructor(content, css) {
        super(content, css);
        this.elem.addClass('drop_btn');

        this.dd_elem = $('<div />')
            .addClass('btn-dropdown');

        this.on_click = this.on_click.bind(this);
        this.elem.on('click', this.on_click);
    }

    on_click(e) {
        this.dd_elem.toggle();
    }
}

export class TiptapWidget {
    static initialize(context) {
        $('div.tiptap-editor', context).each(function() {
            let options = {};
            new TiptapWidget($(this), options);
        });
    }

    constructor(elem) {
        this.elem = elem;
        this.elem.data('tiptap-widget', this);

        this.editor = new Editor({
            element: this.elem[0],
            extensions: [
                StarterKit,
                Underline,
                TextStyle,
                Color
            ],
            content: '<p>Hello World!</p>',
        });

        this.buttons_textstyles = $('<div />')
            .addClass('btn-group')
            .prependTo(this.elem);

        let bold_button_elem = Button.create('B', {'font-weight': 'bold'});
        // this.italic_button = Button.create(this, 'i', {'font-style': 'italic'});
        // this.underline_button = Button.create(this, 'U', {'text-decoration': 'underline'});

        this.buttons_textstyles
            .append(bold_button_elem)
            // .append(italic_button_elem)
            // .append(underline_button_elem);

        this.bold_button = new BoldButton(this, bold_button_elem);
        // this.color_button = new DropButton($('<div class="color" />'));
        // this.color_button.elem.insertAfter(this.buttons_textstyles);
        // this.color_button.dd_elem
        //     .insertAfter(this.color_button.elem)
        //     .css('transform', `translate(${this.color_button.elem.offset().left}, 0)`);

        // this.bold_button.on_click = function(e) {
        //     this.editor.chain().focus().toggleBold().run()
        // }
        // this.italic_button.on_click = function(e) {
        //     this.editor.chain().focus().toggleItalic().run()
        // }
        // this.underline_button.on_click = function(e) {
        //     this.editor.chain().focus().toggleUnderline().run()
        // }
    }
}