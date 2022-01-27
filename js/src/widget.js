import $ from 'jquery';
import {Editor} from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Heading from '@tiptap/extension-heading';

class Button {

    static create(content) {
        let elem = $('<button />');
        if (typeof content === 'string') {
            elem.text(content);
        } else {
            elem.append(content);
        }
        return elem;
    }

    constructor(widget, elem) {
        this.elem = elem;
        this.widget = widget;

        this.on_click = this.on_click.bind(this);
        this.elem.on('click', this.on_click);
    }

    on_click(e) {
        e.preventDefault();
    }
}

class BoldButton extends Button {

    static create(widget, content) {
        let elem = super.create(content);
        elem.css('font-weight', 'bold');
        return new BoldButton(widget, elem);
    }

    constructor(widget, elem) {
        super(widget, elem);
    }

    on_click(e) {
        super.on_click(e);
        this.widget.editor.chain().focus().toggleBold().run();
    }
}

class ItalicButton extends Button {

    static create(widget, content) {
        let elem = super.create(content);
        elem.css('font-style', 'italic');
        return new ItalicButton(widget, elem);
    }

    constructor(widget, elem) {
        super(widget, elem);
    }

    on_click(e) {
        super.on_click(e);
        this.widget.editor.chain().focus().toggleItalic().run();
    }
}

class UnderlineButton extends Button {

    static create(widget, content) {
        let elem = super.create(content);
        elem.css('text-decoration', 'underline');
        return new UnderlineButton(widget, elem);
    }

    constructor(widget, elem) {
        super(widget, elem);
    }

    on_click(e) {
        super.on_click(e);
        this.widget.editor.chain().focus().toggleUnderline().run();
    }
}

class ColorButton extends Button {
    static create(widget, color) {
        let elem = super.create(
            $('<div />')
                .addClass('color')
                .css('background-color', color));
        return new ColorButton(widget, elem, color);
    }

    constructor(widget, elem, color) {
        super(widget, elem);
        this.color = color;
    }

    on_click(e) {
        super.on_click(e);
        this.widget.editor.commands.setColor(this.color);
    }
}

class HeadingButton extends Button {
    static create(widget, level) {
        let elem = super.create(content);
        return new HeadingButton(widget, elem, level);
    }

    constructor(widget, elem, level) {
        super(widget, elem);
        this.level = level;
    }

    on_click(e) {
        super.on_click(e);
        if (!this.level) {
            this.widget.editor.commands.setParagraph();
            return;
        }
        this.widget.editor.commands.toggleHeading({ level: this.level });
    }
}

class DropButton extends Button {

    static create(content) {
        let elem = super.create(content);
        elem.addClass('drop_btn');
        return elem;
    }

    constructor(widget, elem) {
        super(widget, elem);
        this.dd_elem = $('<div />')
            .addClass('btn-dropdown')
            .appendTo(widget.elem);

        this.hide_dropdown = this.hide_dropdown.bind(this);
        $(document).on('click', this.hide_dropdown);
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
        this.dd_elem.css('transform', `translate(${this.elem.position().left}px, ${this.elem.outerHeight()}px)`);
        this.dd_elem.toggle();
    }
}

class ColorDropButton extends DropButton {

    static create(widget, content, colors) {
        let elem = super.create(content);
        return new ColorDropButton(widget, elem, colors);
    }

    constructor(widget, elem, colors) {
        super(widget, elem);

        this.colors = colors ? colors : [];
        this.buttons = [];

        for (let swatch of colors) {
            let color_elem = $('<div />')
                .addClass('color')
                .css('background-color', swatch.color);
            let elem = $('<button />')
                .addClass('dropdown-item')
                .text(swatch.name);

            this.dd_elem.append(elem);
            elem.prepend(color_elem);
            this.buttons.push(new ColorButton(widget, elem, swatch.color));
        }
    }
}

class HeadingDropButton extends DropButton {

    static create(widget, content, styles) {
        let elem = super.create(content);
        return new HeadingDropButton(widget, elem, styles);
    }

    constructor(widget, elem, styles) {
        super(widget, elem);

        this.styles = styles ? styles : [];
        this.buttons = [];

        for (let style of styles) {
            let elem = $('<button />')
                .addClass('dropdown-item')
                .text(style.name);

            this.dd_elem.append(elem);
            this.buttons.push(new HeadingButton(widget, elem, style.level));
        }
    }
}

export class TiptapWidget {
    static initialize(context) {
        $('div.tiptap-editor', context).each(function() {
            let options = {};
            new TiptapWidget($(this), options);
        });
    }

    constructor(elem) {
        this.elem = elem;
        this.elem.data('tiptap-widget', this);

        this.editor = new Editor({
            element: this.elem[0],
            extensions: [
                StarterKit,
                Underline,
                TextStyle,
                Color
            ],
            content: '<p>Hello World!</p>',
        });

        this.buttons_textstyles = $('<div />')
            .addClass('btn-group')
            .prependTo(this.elem);

        this.bold_button = BoldButton.create(this, 'B');
        this.italic_button = ItalicButton.create(this, 'i');
        this.underline_button = UnderlineButton.create(this, 'U');

        let colors = [
            {name: 'blue', color: '#1a21fb'},
            {name: 'lime', color:'#ccff00'},
            {name: 'teal', color: '#2acaea'},
            {name: 'red', color: '#d0060a'}
        ];

        this.colors_button = ColorDropButton.create(
            this,
            $('<div class="color" />'),
            colors);

        let styles = [{name: 'Text', level: null}];
        for (let i=1; i<=6; i++) {
            styles.push({
                name: 'Heading ' + i,
                level: i
            });
        }
        this.styles_button = HeadingDropButton.create(
            this,
            'A',
            styles
        );

        this.buttons_textstyles
            .append(this.bold_button.elem)
            .append(this.italic_button.elem)
            .append(this.underline_button.elem)
            .after(this.colors_button.elem)
            .after(this.styles_button.elem);

        this.hide_all = this.hide_all.bind(this);
        this.editor.on('update', this.hide_all);
    }

    unload_all() {

    }

    hide_all() {
        $('div.btn-dropdown', this.elem).hide();
    }
}