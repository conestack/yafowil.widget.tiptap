import $ from 'jquery';
import bootstrap from 'bootstrap';

export class Action {

    /**
     * @param {Object} editor - The editor instance to which this action belongs.
     * @param {Object} [opts={}] - Options for configuring the action.
     * @param {HTMLElement} opts.container_elem - The container element for the action.
     * @param {string} opts.tooltip - The tooltip text to display on hover.
     * @param {string} opts.icon - The icon class to use (from Bootstrap Icons).
     * @param {string} opts.text - The text label for the action.
     * @param {Object} opts.css - CSS properties to apply to the action.
     * @param {boolean} opts.toggle - If true, the action can be toggled active/inactive.
     */
    constructor(editor, opts = {}) {
        this.editor = editor;
        this.editor_elem = $(editor.options.element);
        this.opts = opts;
        this.compile(opts);
        this.container_elem = opts.container_elem;
        this.on_click = this.on_click.bind(this);
        this.elem.on('click', this.on_click);
    }

    /**
     * Compiles the action's UI elements based on the provided options.
     *
     * @param {Object} opts - The options used to configure the action.
     */
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

    /**
     * Gets the active state of the action.
     *
     * @returns {boolean} True if the action is active, false otherwise.
     */
    get active() {
        return this._active;
    }

    /**
     * Sets the active state of the action.
     *
     * @param {boolean} active - The new active state.
     */
    set active(active) {
        if (this.opts.toggle) {
            active ? this.elem.addClass('active') : this.elem.removeClass('active');
        }
        this._active = active;
    }

    /**
     * Handles click events on the action element.
     *
     * @param {Event} e - The click event.
     */
    on_click(e) {
        e.preventDefault();
    }
}

export class Button extends Action {

    /**
     * Compiles the button's UI elements, adding button-specific classes.
     *
     * @param {Object} opts - The options used to configure the button.
     */
    compile(opts) {
        super.compile(opts);
        this.container.addClass('btn-group');
        this.elem.attr('role', 'button')
            .addClass('btn btn-outline-secondary d-flex align-items-center');
    }
}

export class DropdownButton extends Button {

    /**
     * Creates an instance of the DropdownButton class.
     *
     * @param {Object} editor - The editor instance to which this dropdown button belongs.
     * @param {Object} [opts={}] - Options for configuring the dropdown button.
     * @param {boolean} opts.submit - If true, includes a submit button in the dropdown.
     */
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

    /**
     * Gets the currently active item in the dropdown.
     *
     * @returns {Object} The currently active item.
     */
    get active_item() {
        return this._active_item;
    }

    /**
     * Sets the currently active item in the dropdown.
     *
     * @param {Object} item - The item to set as active.
     */
    set active_item(item) {
        let clone = item.elem.children().clone();
        this.elem.empty().append(clone);
        if (this.content) {
            this.elem.prepend(this.content);
        }
        this._active_item = item;
    }

    /**
     * Cleans up the dropdown button by removing event listeners.
     */
    unload() {
        $(window).off('resize', this.on_resize);
    }

    /**
     * Handles the window resize event, resetting the active state.
     *
     * @param {Event} e - The resize event.
     */
    on_resize(e) {
        this.active = false;
    }

    /**
     * Sets the items in the dropdown menu.
     */
    set_items() {
        for (let child of this.children) {
            child.container.addClass('dropdown-item');
            child.elem.on('click', (e) => {
                this.active_item = child;
            });
        }

        this.active_item = this.children[0];
    }

    /**
     * Updates the dropdown button based on the current state.
     */
    on_update() {
        // ...
    }

    /* istanbul ignore next */
    /**
     * Handles the submit action for the dropdown.
     *
     * @param {Event} e - The submit event.
     */
    submit(e) {
        e.preventDefault();
    }
}
