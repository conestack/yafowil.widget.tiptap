import $ from 'jquery';
import {actions, ActionGroup} from './actions';

export class TiptapWidget {

    static initialize(context) {
        $('div.tiptap-editor', context).each(function() {
            let opts = {};

            ['heading', 'colors', 'bold', 'italic', 'underline', 'bullet_list',
             'ordered_list', 'indent', 'outdent', 'html', 'image', 'link',
             'code', 'code_block', 'help_link'].forEach(name => {
                let data = $(this).data(`tiptap-${name}`);
                if (data) { opts[name] = data; }
            });

            new TiptapWidget($(this), opts);
        });
    }

    constructor(elem, opts = {}) {
        this.elem = elem;

        this.elem.data('tiptap-widget', this);

        let extensions = new Set([
            tiptap.Document,
            tiptap.Paragraph,
            tiptap.Text,
            tiptap.TextStyle,
            tiptap.Dropcursor
        ]);
        for (let option_name in opts) {
            let exts = actions[option_name].extensions;
            exts.forEach(ext => extensions.add(ext));
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
                factory = actions[option_name],
                target = options.target,
                container = this.controls;

            if (target) {
                let targ = button_groups.filter(group => {
                    return group.name === target ? target : false
                });
                if (targ[0]) {
                    container = targ[0].elem;
                } else {
                    let group = new ActionGroup(target, this.controls);
                    button_groups.push(group);
                    container = group.elem;
                }
            }
            this.buttons.push(new factory(this, this.editor, {
                action_opts: options,
                container_elem: container
            }));
        }
        this.swatches = opts.colors ? opts.colors : [];
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
        this.buttons.forEach(btn => {
            if (btn.unload) {
                btn.unload();
            }
        });
    }

    on_update() {
        this.buttons.forEach(btn => { if(btn.dd_elem) btn.dd_elem.hide() });

        let ul = this.buttons.find(x => x.id === 'bulletList');
        let ol = this.buttons.find(x => x.id === 'orderedList');

        if (this.editor.isActive('bulletList') && ol) {
            ol.active = false;
        }
        if (this.editor.isActive('orderedList') && ul) {
            ul.active = false;
        }
    }

    on_selection_update() {
        let ids = [
            'bold',
            'italic',
            'underline',
            'bulletList',
            'orderedList',
            'code',
            'codeBlock'
        ];
        for (let id of ids) {
            let btn = this.buttons.find(x => x.id === id);
            if (btn) {
                if (this.editor.isActive(id)) {
                    btn.active = true;
                } else {
                    btn.active = false;
                }
            }
        }
        if (this.editor.isActive('paragraph')) {
            let headings = this.buttons.find(x => x.id === 'headings');
            if (headings) headings.active_item = headings.children[0];
        }
        for (let i = 1; i <=6; i++) {
            if (this.editor.isActive('heading', {level: i})) {
                let headings = this.buttons.find(x => x.id === 'headings');
                if (headings) headings.active_item = headings.children[i];
            }
        }
        for (let swatch of this.swatches) {
            let index = this.swatches.indexOf(swatch);
            let colors = this.buttons.find(x => x.id === 'colors');
            if (this.editor.isActive('textStyle', {color: swatch.color})) {
                colors.active_item = colors.children[index];
            }
        }
        if (!this.editor.isActive('textStyle', { color: /.*/ })) {
            let colors = this.buttons.find(x => x.id === 'colors');
            if (colors) {
                colors.active_item = colors.children[0];
            }
        }
    }
}