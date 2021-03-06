import $ from 'jquery';

export class Tooltip {

    constructor(name, elem) {
        this.elem = $('<div />')
            .text(name)
            .addClass('tiptap-tooltip')
            .appendTo('body');

        let timeout;
        elem.on('mouseover', (e) => {
            let left = `${elem.offset().left + 20}px`;
            let top = `${elem.offset().top + elem.outerHeight()}px`;

            timeout = setTimeout(() => {
                this.elem.css({left: left, top: top});
                this.elem.fadeIn();
            }, 500);
        });
        elem.on('mouseout', (e) => {
            clearTimeout(timeout);
            this.elem.fadeOut();
        });
    }
}

export class Button {

    constructor(editor, opts = {}) {
        this.editor = editor;
        this.editor_elem = $(editor.options.element);
        this.elem = $('<button />')
            .appendTo(opts.container_elem);

        this.opts = opts;

        if (opts.tooltip) { new Tooltip(opts.tooltip, this.elem); }
        if (opts.icon) {
            this.icon = $('<i />')
                .addClass(`glyphicon glyphicon-${opts.icon}`)
                .appendTo(this.elem);
        }
        if (opts.text) {
            $(`<span />`)
                .text(opts.text)
                .appendTo(this.elem);
        }
        if (opts.css) { $('> *', this.elem).css(opts.css); }

        this.content = $('> *', this.elem);
        this.container_elem = opts.container_elem;
        this.on_click = this.on_click.bind(this);
        this.elem.on('click', this.on_click);
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

export class DropdownButton extends Button {

    constructor(editor, opts = {}) {
        super(editor, opts);
        this.elem.addClass('drop_btn');
        this.dd_elem = $('<div />')
            .addClass('tiptap-dropdown')
            .appendTo('body');
        this.children = [];

        if (opts.submit) {
            this.dd_elem.addClass('grid');
            this.submit_elem = $('<button />')
                .addClass('submit')
                .text('submit')
                .appendTo(this.dd_elem);

            this.submit = this.submit.bind(this);
            this.submit_elem.on('click', this.submit);
        }

        this.hide_dropdown = this.hide_dropdown.bind(this);
        $(document).on('click', this.hide_dropdown);
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
        this.dd_elem.hide();
        this._active_item = item;
    }

    unload() {
        $(document).off('click', this.hide_dropdown);
        $(window).off('resize', this.on_resize);
    }

    on_resize(e) {
        this.dd_elem.hide();
        this.active = false;
    }

    set_items() {
        for (let child of this.children) {
            child.elem.addClass('dropdown-item');
            child.elem.on('click', (e) => {
                this.active_item = child;
            });
        }

        this.active_item = this.children[0];
    }

    on_click(e) {
        e.preventDefault();
        let offset_left = this.elem.offset().left,
            elem_width = this.elem.outerWidth(),
            dd_width = this.dd_elem.outerWidth(),
            space_right = $(window).width() - offset_left - elem_width;

        let left = (space_right < dd_width) ?
            offset_left - dd_width + elem_width : offset_left;

        this.dd_elem
            .css('left', `${left}px`)
            .css('top', `${this.elem.offset().top + this.elem.outerHeight()}px`)
            .toggle();
    }

    hide_dropdown(e) {
        if (!this.dd_elem.is(':visible')) { return; }

        if (e.target !== this.dd_elem[0] &&
            e.target !== this.elem[0] &&
            $(e.target).closest(this.dd_elem).length === 0 &&
            $(e.target).closest(this.elem).length === 0)
        {
            this.dd_elem.hide();
            this.active = false;
        }
    }

    on_update() {
        this.dd_elem.hide();
    }

    /* istanbul ignore next */
    submit(e) {
        e.preventDefault();
    }
}
