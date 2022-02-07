import $ from 'jquery';
import tiptap from 'tiptap';
import {actions} from './actions';

export class TiptapWidget {
    static initialize(context) {
        $('div.tiptap-editor', context).each(function() {
            let options = {
                bold: true,
                italic: true,
                underline: true,
                bullet_list: true,
                ordered_list: true,
                indent: true,
                outdent: true,
                html: true,
                heading: true,
                colors: [
                    { name: 'Default', color: '#333333'},
                    { name: 'Blue', color: '#1a21fb' },
                    { name: 'Lime', color: '#ccff00' },
                    { name: 'Teal', color: '#2acaea' },
                    { name: 'Red', color: '#d0060a' }
                ],
                image: true,
                link: true
            }
            new TiptapWidget($(this), options);
        });
    }

    constructor(elem, opts = {}) {
        this.elem = elem;
        this.elem.data('tiptap-widget', this);

        let extensions = new Set([
            tiptap.Document,
            tiptap.Paragraph,
            tiptap.Text,
            tiptap.TextStyle
        ]);
        for (let option_name in opts) {
            actions[option_name].extensions.forEach(ext => extensions.add(ext));
        }

        this.editarea = $('div.ProseMirror', this.elem);
        this.textarea = $('<textarea />')
            .addClass('ProseMirror')
            .appendTo(this.elem);
        this.controls = $('<div />')
            .addClass('tiptap-controls')
            .prependTo(this.elem);

        if (opts.bold | opts.italic | opts.underline) {
            this.text_controls = $('<div />')
                .addClass('btn-group text_controls')
                .css('order', "3")
                .appendTo(this.controls);
        }
        if (opts.bullet_list | opts.ordered_list | opts.indent | opts.outdent) {
            this.format_controls = $('<div />')
                .addClass('btn-group format_controls')
                .css('order', "4")
                .appendTo(this.controls);
        }

        this.editor = new tiptap.Editor({
            element: this.elem[0],
            extensions: extensions,
            content: '<p>Hello World!</p>'
        });

        this.buttons = [];
        for (let option_name in opts) {
            let options = opts[option_name],
                factory = actions[option_name].factory,
                target = actions[option_name].target;
            let container = target ? $(target, this.controls) : this.controls;
            this.buttons.push(new factory(this.editor, options, container));
        }

        this.hide_all = this.hide_all.bind(this);
        this.editor.on('update', this.hide_all);
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
        $('div.tiptap-dropdown', this.elem).hide();
    }
}