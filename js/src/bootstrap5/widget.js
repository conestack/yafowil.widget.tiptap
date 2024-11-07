import $ from 'jquery';
import {actions} from './actions';

export class TiptapWidget {

    /**
     * Initializes each widget in the given DOM context.
     * 
     * @param {HTMLElement} context - DOM context for initialization.
     */
    static initialize(context) {
        $('div.tiptap-editor', context).each(function() {
            let elem = $(this);
            if (window.yafowil_array !== undefined &&
                window.yafowil_array.inside_template(elem)) {
                return;
            }
            new TiptapWidget(elem, {
                actions: elem.data('tiptap-actions'),
                colors: elem.data('tiptap-colors'),
                helpLink: elem.data('tiptap-helpLink')
            });
        });
    }

    /**
     * @param {jQuery} elem - The jQuery element representing the Tiptap widget.
     * @param {Object} [opts={}] - Configuration options for the Tiptap widget.
     * @param {Array} opts.actions - An array of actions to be used in the editor.
     * @param {Array} opts.colors - An array of font colors to be used in the editor.
     * @param {string} opts.helpLink - A link to help resources related to the editor.
     */
    constructor(elem, opts={}) {
        elem.data('yafowil-tiptap', this);
        elem.attr('spellcheck', false);
        this.elem = elem;

        this.controls = $('<div />')
            .addClass('tiptap-controls btn-toolbar mb-2')
            .attr('role', 'toolbar')
            .prependTo(elem);

        this.textarea = $('textarea', elem);
        if (!this.textarea.length) {
            this.textarea = $('<textarea />')
                .addClass('tiptap-editor')
                .appendTo(elem);
        }
        this.textarea.addClass('m-0 form-control');

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
            content: this.textarea.val()
        });

        this.editarea = $('div.ProseMirror', this.elem)
            .addClass('form-control');

        tiptap_actions.forEach(act => {
            if (Array.isArray(act)) {
                let container = $('<div />')
                    .addClass('btn-group me-2')
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

    /**
     * Cleans up the widget and removes event listeners.
     */
    destroy() {
        this.unload_all();
        this.editor.destroy();
        this.elem.empty();
        this.buttons = null;
    }

    /**
     * Unloads all action buttons in the widget.
     */
    unload_all() {
        for (let btn in this.buttons) {
            if (this.buttons[btn].unload) {
                this.buttons[btn].unload();
            }
        }
    }

    /**
     * Adds a button to the control panel.
     *
     * @param {string} name - The name of the action to create a button for.
     * @param {jQuery} container - The jQuery container to append the button to.
     */
    add_button(name, container) {
        let factory = actions[name];
        let btn = new factory(this, this.editor, {
            container_elem: container
        });
        this.buttons[name] = btn;
    }

    /**
     * Parses the provided actions and returns a structured array.
     *
     * @param {Array} acs - An array of action names.
     * @returns {Array} A structured array of parsed actions.
     */
    parse_actions(acs) {
        let ret = [];
        function parse(ret_arr, acts) {
            acts.forEach((action, i) => {
                if (Array.isArray(action)) {
                    ret.push([]);
                    parse(ret[ret.length - 1], action);
                } else if (actions[action] == undefined) {
                    console.log(`ERROR: Defined action does not exist at '${action}'`);
                } else {
                    ret_arr.push(action);
                }
            });
        }
        parse(ret, acs);
        return ret;
    }

    /**
     * Parses the provided actions and returns a set of corresponding extensions.
     *
     * @param {Array} acs - An array of action names.
     * @returns {Set} A set of extensions associated with the actions.
     */
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

    /**
     * Updates the state of all buttons and the textarea value.
     */
    on_update() {
        for (let btn in this.buttons) {
            if (this.buttons[btn].on_update) {
                this.buttons[btn].on_update();
            }
        }
        this.textarea.val(this.editor.getHTML());
    }

    /**
     * Updates the state of all buttons based on the current selection.
     */
    on_selection_update() {
        for (let btn in this.buttons) {
            if (this.buttons[btn].on_selection_update) {
                this.buttons[btn].on_selection_update();
            }
        }
    }
}

//////////////////////////////////////////////////////////////////////////////
// yafowil.widget.array integration
//////////////////////////////////////////////////////////////////////////////

/**
 * Re-initializes widget on array add event.
 */
function tiptap_on_array_add(inst, context) {
    TiptapWidget.initialize(context);
}

/**
 * Registers subscribers to yafowil array events.
 */
export function register_array_subscribers() {
    if (window.yafowil_array === undefined) {
        return;
    }
    window.yafowil_array.on_array_event('on_add', tiptap_on_array_add);
}
