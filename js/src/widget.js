import $ from 'jquery';
import tiptap from 'tiptap';
import {actions, ActionGroup} from './actions';

export class TiptapWidget {
    static initialize(context) {
        $('div.tiptap-editor', context).each(function() {
            let options = {
                heading: true,
                colors: [
                    { name: 'Default', color: '#333333'},
                    { name: 'Blue', color: '#1a21fb' },
                    { name: 'Lime', color: '#ccff00' },
                    { name: 'Teal', color: '#2acaea' },
                    { name: 'Red', color: '#d0060a' }
                ],
                bold: { target: 'text_controls' },
                italic: { target: 'text_controls' },
                underline: { target: 'text_controls' },
                bullet_list: { target: 'format_controls' },
                ordered_list: { target: 'format_controls' },
                indent: { target: 'format_controls' },
                outdent: { target: 'format_controls' },
                html: true,
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

        this.editor = new tiptap.Editor({
            element: this.elem[0],
            extensions: extensions,
            content: '<p>Hello World!</p>'
        });

        this.buttons = [];
        let button_groups = [];

        for (let option_name in opts) {
            let options = opts[option_name],
                factory = actions[option_name].factory,
                target = options.target,
                container = this.controls;

            if (target) {
                let targ = button_groups.filter(group => {
                    return group.name === target ?? false
                });
                if (targ[0]) {
                    container = targ[0].elem;
                } else {
                    let group = new ActionGroup(target, this.controls);
                    button_groups.push(group);
                    container = group.elem;
                }
            }
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