export class Button {

    static create(content) {
        let elem = $('<button />');
        if (content) {
            elem.append(content);
        }
        return new Button(elem);
    }

    constructor(elem) {
        this.elem = elem;
        this.ops = {};

        this.on_click = this.on_click.bind(this);
        this.elem.on('click', this.on_click);
    }

    on_click(e) {
        e.preventDefault();
        for (let op in this.ops) {
            if (op) { this.ops[op].execute(); }
        }
    }

    insert(target) {
        this.elem.appendTo(target);
        return this;
    }

    addTo(target, selectable) {
        target.add(this, selectable);
        return this;
    }

    setName(str) {
        this.elem.prepend($('<span />').addClass('name').text(str));
        return this;
    }

    set(arg) {
        if (arg && typeof arg === 'function') {
            this.ops.customFunction = {
                execute: () => { arg(); }
            }
        }
        return this;
    }

    setToggle(execute, undo) {
        this.ops.toggle = {
            execute: () => {
                this.active = !this.active ? true : false;
                if (this.active) {
                    this.elem.addClass('active');
                    execute();
                } else {
                    this.elem.removeClass('active');
                    undo();
                }
            }
        }
    }

    setActive() {
        if (!this.parent) {return;}
        this.parent.active_item = this;
    }
}

export class DropButton extends Button {

    static create(content) {
        let elem = $('<button />').addClass('drop_btn');
        if (content) {
            elem.append(content);
        }
        return new DropButton(elem);
    }

    constructor(elem) {
        super(elem);
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
        super.on_click(e);
        this.dd_elem
            .css('left', `${this.elem.offset().left}px`)
            .css('top', `${this.elem.offset().top + this.elem.outerHeight()}px`)
            .toggle();
    }

    add(item, selectable) {
        item.parent = this;
        item.elem.addClass('dropdown-item');

        if (selectable) {
            item.ops.activate = {
                execute: () => {this.active_item = item}
            }
        }

        item.insert(this.dd_elem);
        this.children.push(item);
    }

    addForm(content, custom_function) {
        for (let item of content) {
            let input_elem = $('<span />')
                .addClass('dropdown-item')
                .append($('<span />').addClass('name').text(`${item}:`))
                .append($('<input type="text" />')
                .addClass(`input-${item}`))
                .appendTo(this.dd_elem);
        }
        this.submit_btn = Button
            .create($('<span />').text('Submit'))
            .insert(this.dd_elem)
            .set(custom_function);
        this.submit_btn.elem.addClass('submit');
        return this;
    }
}