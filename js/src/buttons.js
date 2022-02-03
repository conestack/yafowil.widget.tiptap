import $ from 'jquery';

export class Button {

    constructor(editor, action_opts, container_elem) {
        this.editor = editor;
        let elem = this.elem = $('<button />')
            .appendTo(container_elem);

        this.container_elem = container_elem;
        this.opts = action_opts;
        this.on_click = this.on_click.bind(this);
        this.elem.on('click', this.on_click);
    }

    toggle() {
        this.active = !this.active ? true : false;
        this.active ? this.elem.addClass('active') : this.elem.removeClass('active');
    }
}

export class DropdownButton extends Button {

    constructor(editor, action_opts, container_elem) {
        super(editor, action_opts, container_elem);
        this.elem.addClass('drop_btn');
        this.dd_elem = $('<div />')
            .addClass('btn-dropdown')
            .appendTo('body');
        this.children = [];

        this.hide_dropdown = this.hide_dropdown.bind(this);
        $(document).on('click', this.hide_dropdown);
    }

    get active_item() {
        return this._active_item;
    }

    set active_item(item) {
        let clone = item.elem.children().clone();
        this.elem.empty().append(clone);
        this._active_item = item;
    }

    unload() {
        $(document).off('click', this.hide_dropdown);
    }

    hide_dropdown(e) {
        if (!this.dd_elem.is(':visible')) { return; }

        if (e.target !== this.dd_elem[0] &&
            e.target !== this.elem[0] &&
            $(e.target).closest(this.dd_elem).length === 0 &&
            $(e.target).closest(this.elem).length === 0)
        {
            this.dd_elem.hide();
        }
    }

    on_click(e) {
        e.preventDefault();
        this.dd_elem
            .css('left', `${this.elem.offset().left}px`)
            .css('top', `${this.elem.offset().top + this.elem.outerHeight()}px`)
            .toggle();
    }
}
