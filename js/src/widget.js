import $ from 'jquery';
import {Editor} from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'

export class TiptapWidget {
    static initialize(context) {
        $('div.tiptap-editor', context).each(function() {
            let options = {};
            new TiptapWidget($(this), options);
        });
    }

    constructor(elem) {
        this.elem = elem;
        this.buttons_elem = $('<div />')
            .addClass('btn-group')
            .prependTo(this.elem);

        this.bold_button = $('<button />')
            .text('B')
            .css('font-weight', 'bold')
            .appendTo(this.buttons_elem);

        this.italic_button = $('<button />')
            .text('I')
            .css('font-style', 'italic')
            .appendTo(this.buttons_elem);

        this.underline_button = $('<button />')
            .text('U')
            .css('text-decoration', 'underline')
            .appendTo(this.buttons_elem);

        this.editor = new Editor({
            element: this.elem[0],
            extensions: [
                StarterKit,
            ],
            content: '<p>Hello World!</p>',
        })
        this.bold_button.on('click', e => {
            e.preventDefault();
            this.editor
                .chain()
                .focus()
                .toggleBold()
                .run()
        })
        this.italic_button.on('click', e => {
            e.preventDefault();
            this.editor
                .chain()
                .focus()
                .toggleItalic()
                .run()
        })
        this.underline_button.on('click', e => {
            e.preventDefault();
            this.editor
                .chain()
                .focus()
                .toggleUnderline()
                .run()
        })
    }
}