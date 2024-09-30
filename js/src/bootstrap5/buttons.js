import $ from 'jquery';
import bootstrap from 'bootstrap';

export class Action {

    constructor(editor, opts = {}) {
        this.editor = editor;
        this.editor_elem = $(editor.options.element);
        this.opts = opts;
        this.compile(opts);
        this.container_elem = opts.container_elem;
        this.on_click = this.on_click.bind(this);
        this.elem.on('click', this.on_click);
    }

    compile(opts) {
        this.container = $('<div />')
            .addClass('action')
            .appendTo(opts.container_elem);
        this.elem = $('<div />')
            .appendTo(this.container);

        if (opts.tooltip) {
            this.container.attr('data-bs-toggle', 'tooltip')
                .attr('data-bs-title', opts.tooltip);
            new bootstrap.Tooltip(this.container);
        }

        if (opts.icon) {
            this.icon = $('<i />')
                .addClass(`bi-${opts.icon}`)
                .appendTo(this.elem);
        }
        if (opts.text) {
            $(`<span />`)
                .text(opts.text)
                .appendTo(this.elem);
        }
        if (opts.css) { $('> *', this.elem).css(opts.css); }

        this.content = $('> *', this.elem);
    }

    get active() {
        return this._active;
    }
    set active(active) {
        if (this.opts.toggle) {
            active ? this.elem.addClass('active') : this.elem.removeClass('active');
        }
        this._active = active;
    }
    on_click(e) {
        e.preventDefault();
    }
}

export class Button extends Action {

    compile(opts) {
        super.compile(opts);
        this.container.addClass('btn-group');
        this.elem.attr('role', 'button')
            .addClass('btn btn-outline-secondary d-flex align-items-center');
    }
}

export class DropdownButton extends Button {

    constructor(editor, opts = {}) {
        super(editor, opts);
        this.elem.addClass('drop_btn dropdown-toggle')
            .attr('data-bs-toggle', 'dropdown');
        this.dd_elem = $('<ul />')
            .addClass('dropdown-menu tiptap-dropdown')
            .appendTo(this.container);
        this.children = [];

        if (opts.submit) {
            this.dd_elem.addClass('p-3');
            this.submit_elem = $('<button />')
                .addClass('btn btn-secondary submit')
                .text('submit')
                .appendTo(this.dd_elem);

            this.submit = this.submit.bind(this);
            this.submit_elem.on('click', this.submit);
        }
        this.on_resize = this.on_resize.bind(this);
        $(window).on('resize', this.on_resize);
    }

    get active_item() {
        return this._active_item;
    }

    set active_item(item) {
        let clone = item.elem.children().clone();
        this.elem.empty().append(clone);
        if (this.content) {
            this.elem.prepend(this.content);
        }
        this._active_item = item;
    }

    unload() {
        $(window).off('resize', this.on_resize);
    }

    on_resize(e) {
        this.active = false;
    }

    set_items() {
        for (let child of this.children) {
            child.container.addClass('dropdown-item');
            child.elem.on('click', (e) => {
                this.active_item = child;
            });
        }

        this.active_item = this.children[0];
    }

    on_update() {
        // ...
    }

    /* istanbul ignore next */
    submit(e) {
        e.preventDefault();
    }
}
