import $ from 'jquery';

let element = $('<div />')
    .attr('id', 'test_element')
    .css({
        'width': '100px',
        'height': '50px',
        'border': '1px solid red'
    });
    let css_link;

QUnit.module('buttons.js', hooks => {
    let Tooltip, Button, DropdownButton;
    let editor = {
        options: {
            element: $('<div id="foo" />')
        }
    };

    hooks.before(async () => {
        $('body').append('<div id="container" />');

        // dynamic imports
        const tiptap = await import('tiptap');
        window.tiptap = tiptap;

        const modules = await import('../src/default/buttons.js');
        Tooltip = modules.Tooltip;
        Button = modules.Button;
        DropdownButton = modules.DropdownButton;

        // css
        css_link = document.createElement('link');
        css_link.rel = 'stylesheet';
        css_link.href = '../../src/yafowil/widget/tiptap/resources/default/widget.min.css';
        document.head.appendChild(css_link);
    });
    hooks.beforeEach(() => {
        element.appendTo('#container');
    });
    hooks.afterEach(() => {
        $('#container').empty();
        $('div.tiptap-tooltip').remove();
    });
    hooks.after(() => {
        $('#container').empty().remove();

        // remove required css styles after test run has finished
        if (css_link) {
            document.head.removeChild(css_link);
        }
    });

    QUnit.test('Tooltip', assert => {
        let tt = new Tooltip('test', element);

        assert.strictEqual(tt.elem.text(), 'test');
        assert.true(tt.elem.hasClass('tiptap-tooltip'));

        let parent_left = element.offset().left;
        let parent_top = element.offset().top + element.outerHeight();

        element.trigger('mouseover');
        let done = assert.async();
        setTimeout(()=> {
            assert.strictEqual(tt.elem.offset().left, parent_left + 20);
            assert.strictEqual(tt.elem.offset().top, parent_top);
            assert.strictEqual(tt.elem.css('display'), 'block');
            element.trigger('mouseout');
            done();
        }, 500);

        let done2 = assert.async();
        setTimeout(()=> {
            assert.strictEqual(tt.elem.css('display'), 'none');
            done2();
        }, 1500);
    });

    QUnit.test('Button constructor / no options', assert => {
        let btn = new Button(editor);
        assert.deepEqual(btn.editor, editor);
        assert.deepEqual(btn.editor_elem, editor.options.element);
        assert.deepEqual(btn.opts, {});
        assert.strictEqual(btn.content.length, 0);
        assert.notOk(btn.container_elem);
    });

    QUnit.test('Button w/ options', assert => {
        let opts = {
            container_elem: $('#container'),
            tooltip: 'test_tt',
            icon: 'font',
            text: 'baz',
            css: {'color': 'red'},
            toggle: true
        }
        let btn = new Button(editor, opts);
        assert.deepEqual(btn.opts, opts);
        assert.strictEqual(btn.content.length, 2);
        assert.deepEqual(btn.container_elem, $('#container'));
        assert.true(btn.icon.is('i.glyphicon.glyphicon-font'));
        assert.strictEqual($('span', btn.elem).text(), 'baz');
        assert.strictEqual($('> *', btn.elem).css('color'), 'rgb(255, 0, 0)');

        // getter / setter
        assert.notOk(btn.active); // undefined
        btn.active = true;
        assert.true(btn.active);
        assert.true(btn.elem.hasClass('active'));
        btn.active = false;
        assert.false(btn.active);
        assert.false(btn.elem.hasClass('active'));

        btn.elem.trigger('click');
    });

    QUnit.test('DropdownButton constructor w/o submit', assert => {
        let opts = {
            container_elem: $('#container')
        }
        let btn = new DropdownButton(editor, opts);
        assert.deepEqual(btn.opts, opts);
        assert.deepEqual(btn.container_elem, $('#container'));
        assert.true(btn.elem.hasClass('drop_btn'));
        assert.true(btn.dd_elem.is('div.tiptap-dropdown'));
        assert.deepEqual(btn.children, []);
        assert.false(btn.dd_elem.hasClass('grid'));
        assert.notOk(btn.submit_elem);
    });

    QUnit.test('DropdownButton constructor w/ submit', assert => {
        let opts = {
            container_elem: $('#container'),
            submit: true
        }
        let btn = new DropdownButton(editor, opts);
        assert.deepEqual(btn.opts, opts);
        assert.true(btn.dd_elem.hasClass('grid'));
        assert.true(btn.submit_elem.is('button.submit'));
    });

    // XXX: SKIP until viewport plugin
    // QUnit.test('DropdownButton on_resize', assert => {
    //     let opts = {
    //         container_elem: $('#container')
    //     }
    //     let btn = new DropdownButton(editor, opts);
    //     let original_width = $(window).width();

    //     btn.dd_elem.show();
    //     viewport.set(300);
    //     $(window).trigger('resize');
    //     assert.strictEqual(btn.dd_elem.css('display'), 'none');
    //     assert.false(btn.active);
    //     viewport.set(original_width);
    // });

    QUnit.test('DropdownButton with children', assert => {
        let opts = {
            container_elem: $('#container')
        }
        let btn = new DropdownButton(editor, opts);

        let child1 = new Button(editor, {
            container_elem: $('#container'),
            text: 'child 1'
        });
        let child2 = new Button(editor, {
            container_elem: $('#container'),
            text: 'child 2'
        });
        btn.children.push(child1, child2);
        assert.strictEqual(btn.children.length, 2);

        // set_items
        btn.set_items();
        assert.true(child1.elem.hasClass('dropdown-item'));
        assert.true(child2.elem.hasClass('dropdown-item'));
        assert.deepEqual(btn.active_item, child1);

        // trigger click on child 2
        btn.dd_elem.show();
        child2.elem.trigger('click');
        assert.deepEqual(btn.active_item, child2);

        // test the setter
        assert.strictEqual($('span', btn.elem).text(), 'child 2');
        assert.strictEqual(btn.dd_elem.css('display'), 'none');
    });

    QUnit.test('DropdownButton on_click', assert => {
        let opts = {container_elem: $('#container')};
        let btn = new DropdownButton(editor, opts);

        // dropdown within margins
        btn.elem.trigger('click');
        assert.strictEqual(btn.dd_elem.css('display'), 'block');
        assert.strictEqual(btn.dd_elem.offset().left, btn.elem.offset().left);
        assert.strictEqual(
            btn.dd_elem.offset().top,
            btn.elem.offset().top + btn.elem.outerHeight()
        );
        btn.dd_elem.hide();

        // dropdown would overflow on right side
        $('#container').css({
            'position': 'absolute',
            'left': 'calc(100vw - 110px)'
        });
        btn.elem.trigger('click');
        assert.strictEqual(btn.dd_elem.offset().right, btn.elem.offset().right);

        // close on btn click
        btn.elem.trigger('click');
        assert.strictEqual(btn.dd_elem.css('display'), 'none');

        // reset container
        $('#container').css({
            'position': 'static',
            'left': '0'
        });
    });

    QUnit.test('DropdownButton hide_dropdown', assert => {
        let opts = {container_elem: $('#container')};
        let btn = new DropdownButton(editor, opts);

        // return if not visible - for coverage
        btn.hide_dropdown();

        btn.dd_elem.show();
        // trigger click outside
        let evt = new $.Event('click', {pageY: 10, pageX: 500});
        $(document).trigger(evt);
        assert.strictEqual(btn.dd_elem.css('display'), 'none');
    });

    QUnit.test('submit', assert => {
        let opts = {container_elem: $('#container'), submit: true};
        class TestDropdownButton extends DropdownButton {
            constructor(editor, opts) {
                super(editor, opts);
            }
            submit(e) {
                e.preventDefault();
                assert.step('submit');
            }
        }
        let btn = new TestDropdownButton(editor, opts);

        btn.submit_elem.trigger('click');
        assert.verifySteps(['submit']);
    })
});