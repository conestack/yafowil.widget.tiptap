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

        this.buttons = {};
        this.colors = opts.colors;
        if (opts.helpLink) {
            let factory = actions.helpLink;
            this.helpLink = new factory(this);
        }

        let tiptap_actions = this.parse_actions(opts.actions);
        let tiptap_extensions = this.parse_extensions(tiptap_actions);

        this.editor = new tiptap.Editor({
            element: elem[0],
            extensions: tiptap_extensions,
            content: this.textarea.text()
        });

        tiptap_actions.forEach(act => {
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

    parse_actions(acs) {
        function parse(acts) {
            acts.forEach((action, i) => {
                if (Array.isArray(action)) {
                    parse(action);
                } else if (actions[action] == undefined) {
                    console.log(`ERROR: Defined action does not exist at '${action}'`);
                    acts.splice(i, 1);
                }
            })
        }
        parse(acs);
        return acs;
    }

    parse_extensions(acs) {
        let extensions = new Set([
            tiptap.Document,
            tiptap.Paragraph,
            tiptap.Text,
            tiptap.TextStyle,
            tiptap.Dropcursor
        ]);

        let flattened = acs.flat(2);
        flattened.forEach(ac => {
            actions[ac].extensions.forEach(ext => extensions.add(ext));
        });
        return extensions;
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