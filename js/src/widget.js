import $ from 'jquery';
import {actions} from './actions';

export class TiptapWidget {

    static initialize(context) {
        $('div.tiptap-editor', context).each(function() {
            let elem = $(this);
            new TiptapWidget(elem, {
                actions: elem.data('tiptap-actions'),
                colors: elem.data('tiptap-colors'),
                helpLink: elem.data('tiptap-helpLink')
            });
        });
    }

    constructor(elem, opts={}) {
        this.elem = elem;
        elem.data('tiptap-widget', this);

        this.controls = $('<div />')
            .addClass('tiptap-controls')
            .prependTo(elem);

        this.textarea = $('textarea', elem);
        if (!this.textarea.length) {
            this.textarea = $('<textarea />')
                .addClass('tiptap-editor')
                .appendTo(elem);
        }

        opts = this.parse_opts(opts);
        this.buttons = {};
        this.swatches = opts.colors;
        if (opts.helpLink) {
            let factory = actions.helpLink;
            this.helpLink = new factory(this);
        }

        this.editor = new tiptap.Editor({
            element: elem[0],
            extensions: opts.extensions,
            content: this.textarea.text()
        });

        opts.actions.forEach(act => {
            if (Array.isArray(act)) {
                let container = $('<div />')
                    .addClass('btn-group')
                    .appendTo(this.controls);
                    act.forEach(name => this.add_button(name, container));
            } else {
                this.add_button(act, this.controls);
            }
        });

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

    add_button(name, container) {
        let factory = actions[name],
            btn = new factory(this, this.editor, {
                container_elem: container
            });
        this.buttons[name] = btn;
    }

    parse_opts(opts) {
        opts.extensions = new Set([
            tiptap.Document,
            tiptap.Paragraph,
            tiptap.Text,
            tiptap.TextStyle,
            tiptap.Dropcursor
        ]);

        let filter_actions = (name) => {
            if (Array.isArray(name)) {
                return true;
            } else if (actions[name] !== undefined) {
                actions[name].extensions.forEach(ext => opts.extensions.add(ext));
                return true;
            } else {
                console.log(`ERROR: Defined action does not exist at '${name}'`);
                return false;
            }
        }
        opts.actions = opts.actions.filter(filter_actions);
        opts.actions.forEach((ac, i) => {
            if (Array.isArray(ac)) {
                opts.actions[i] = ac.filter(filter_actions);
            }
        });

        return opts;
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