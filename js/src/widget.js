import $ from 'jquery';
import {actions} from './actions';

export class TiptapWidget {

    static initialize(context) {
        $('div.tiptap-editor', context).each(function() {
            let elem = $(this),
                opts = {
                    actions: elem.data('tiptap-actions'),
                    colors: elem.data('tiptap-colors'),
                    help_link: elem.data('tiptap-help_link')
                };
            new TiptapWidget($(this), opts);
        });
    }

    constructor(elem, opts={}) {
        this.elem = elem;

        elem.data('tiptap-widget', this);

        let extensions = new Set([
            tiptap.Document,
            tiptap.Paragraph,
            tiptap.Text,
            tiptap.TextStyle,
            tiptap.Dropcursor
        ]);

        opts.actions = opts.actions.filter(this.filter_actions);
        for (let action of opts.actions) {
            if (Array.isArray(action)) {
                let index = opts.actions.indexOf(action);
                opts.actions[index] = action.filter(this.filter_actions);
                opts.actions[index].forEach(name => {
                    let exts = actions[name].extensions;
                    exts.forEach(ext => extensions.add(ext));
                });
            } else {
                let exts = actions[action].extensions;
                exts.forEach(ext => extensions.add(ext));
            }
        }

        this.controls = $('<div />')
            .addClass('tiptap-controls')
            .prependTo(elem);

        this.textarea = $('textarea', elem);
        if (!this.textarea.length) {
            this.textarea = $('<textarea />')
                .addClass('tiptap-editor')
                .appendTo(elem);
        }

        this.editor = new tiptap.Editor({
            element: elem[0],
            extensions: extensions,
            content: this.textarea.text()
        });

        this.buttons = {};

        for (let action_name of opts.actions) {
            let add_button = (name, container) => {
                let factory = actions[name],
                    btn = new factory(this, this.editor, {
                        container_elem: container
                    });
                this.buttons[name] = btn;
            }

            if (Array.isArray(action_name)) {
                let container = $('<div />')
                    .addClass('btn-group')
                    .appendTo(this.controls);
                action_name.forEach(name => add_button(name, container));
            } else {
                add_button(action_name, this.controls);
            }
        }

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

    filter_actions(name) {
        if (actions[name] == undefined && !Array.isArray(name)) {
            console.log(`ERROR: Defined action does not exist at '${name}'`);
            return false;
        } else {
            return true;
        }
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