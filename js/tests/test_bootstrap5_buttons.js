import bootstrap from 'bootstrap';
import $ from 'jquery';

QUnit.module('bootstrap5 buttons.js', (hooks) => {
    let Action, Button, DropdownButton;
    const editor = {
        options: {
            element: $('<div id="foo" />'),
        },
    };

    hooks.before(async () => {
        $('body').append('<div id="container" />');

        const modules = await import('../src/bootstrap5/buttons.js');
        Action = modules.Action;
        Button = modules.Button;
        DropdownButton = modules.DropdownButton;
    });
    hooks.afterEach(() => {
        $('#container').empty();
    });
    hooks.after(() => {
        $('#container').empty().remove();
    });

    QUnit.test('Action constructor / no options', (assert) => {
        const action = new Action(editor);
        assert.deepEqual(action.editor, editor);
        assert.deepEqual(action.editor_elem, editor.options.element);
        assert.deepEqual(action.opts, {});
        assert.strictEqual(action.content.length, 0);
        assert.notOk(action.tooltip);
        assert.notOk(action.icon);
        assert.notOk(action.container_elem);
    });

    QUnit.test('Action w/ options', (assert) => {
        const opts = {
            container_elem: $('#container'),
            tooltip: 'test_tt',
            icon: 'fonts',
            text: 'baz',
            css: { color: 'red' },
            toggle: true,
        };
        const action = new Action(editor, opts);
        assert.deepEqual(action.opts, opts);
        assert.deepEqual(action.container_elem, $('#container'));
        assert.true(action.container.is('div.action'));
        assert.true(action.container.parent().is('#container'));
        assert.true(action.elem.parent().is(action.container));
        assert.false(action.elem.hasClass('btn'));
        assert.strictEqual(action.container.attr('data-bs-toggle'), 'tooltip');
        assert.strictEqual(action.container.attr('data-bs-title'), 'test_tt');
        assert.true(action.tooltip instanceof bootstrap.Tooltip);
        assert.strictEqual(bootstrap.Tooltip.getInstance(action.container[0]), action.tooltip);
        assert.true(action.icon.is('i.bi-fonts'));
        assert.strictEqual($('span', action.elem).text(), 'baz');
        assert.strictEqual($('> *', action.elem).css('color'), 'rgb(255, 0, 0)');
        assert.strictEqual(action.content.length, 2);

        // getter / setter
        assert.notOk(action.active); // undefined
        action.active = true;
        assert.true(action.active);
        assert.true(action.elem.hasClass('active'));
        action.active = false;
        assert.false(action.active);
        assert.false(action.elem.hasClass('active'));

        // on click
        const evt = new $.Event('click');
        action.elem.trigger(evt);
        assert.true(evt.isDefaultPrevented());
    });

    QUnit.test('Action active w/o toggle', (assert) => {
        const action = new Action(editor, { container_elem: $('#container') });
        action.active = true;
        assert.true(action.active);
        assert.false(action.elem.hasClass('active'));
    });

    QUnit.test('Action unload', (assert) => {
        const action = new Action(editor, {
            container_elem: $('#container'),
            tooltip: 'test_tt',
        });
        assert.ok($._data(action.elem[0], 'events'));

        action.unload();
        assert.strictEqual(bootstrap.Tooltip.getInstance(action.container[0]), null);
        assert.strictEqual($._data(action.elem[0], 'events'), undefined);

        // disposed tooltip is not disposed twice
        action.unload();
        assert.strictEqual(bootstrap.Tooltip.getInstance(action.container[0]), null);

        // without tooltip
        const no_tt_action = new Action(editor, { container_elem: $('#container') });
        no_tt_action.unload();
        assert.strictEqual($._data(no_tt_action.elem[0], 'events'), undefined);
    });

    QUnit.test('Button', (assert) => {
        const btn = new Button(editor, {
            container_elem: $('#container'),
            text: 'baz',
        });
        assert.true(btn instanceof Action);
        assert.true(btn.container.is('div.action.btn-group'));
        assert.strictEqual(btn.elem.attr('role'), 'button');
        assert.true(btn.elem.is('.btn.btn-outline-secondary.d-flex.align-items-center'));
        assert.strictEqual($('span', btn.elem).text(), 'baz');
    });

    QUnit.test('DropdownButton constructor w/o submit', (assert) => {
        const opts = {
            container_elem: $('#container'),
        };
        const btn = new DropdownButton(editor, opts);
        assert.deepEqual(btn.opts, opts);
        assert.deepEqual(btn.container_elem, $('#container'));
        assert.true(btn.elem.is('.drop_btn.dropdown-toggle'));
        assert.strictEqual(btn.elem.attr('data-bs-toggle'), 'dropdown');
        assert.true(btn.dd_elem.is('ul.dropdown-menu.tiptap-dropdown'));
        assert.true(btn.dd_elem.parent().is(btn.container));
        assert.deepEqual(btn.children, []);
        assert.false(btn.dd_elem.hasClass('p-3'));
        assert.notOk(btn.submit_elem);
    });

    QUnit.test('DropdownButton constructor w/ submit', (assert) => {
        const opts = {
            container_elem: $('#container'),
            submit: true,
        };
        const btn = new DropdownButton(editor, opts);
        assert.deepEqual(btn.opts, opts);
        assert.true(btn.dd_elem.hasClass('p-3'));
        assert.true(btn.submit_elem.is('button.btn.btn-secondary.submit'));
        assert.strictEqual(btn.submit_elem.text(), 'submit');
        assert.true(btn.submit_elem.parent().is(btn.dd_elem));
    });

    QUnit.test('DropdownButton on_resize', (assert) => {
        const btn = new DropdownButton(editor, {
            container_elem: $('#container'),
            toggle: true,
        });
        btn.active = true;

        $(window).trigger('resize');
        assert.false(btn.active);

        // no longer reacts on window resize after unload
        btn.unload();
        btn.active = true;
        $(window).trigger('resize');
        assert.true(btn.active);
    });

    QUnit.test('DropdownButton with children', (assert) => {
        const btn = new DropdownButton(editor, {
            container_elem: $('#container'),
            icon: 'fonts',
        });

        const child1 = new Action(editor, {
            container_elem: btn.dd_elem,
            text: 'child 1',
        });
        const child2 = new Action(editor, {
            container_elem: btn.dd_elem,
            text: 'child 2',
        });
        btn.children.push(child1, child2);
        assert.strictEqual(btn.children.length, 2);

        // set_items
        btn.set_items();
        assert.true(child1.container.hasClass('dropdown-item'));
        assert.true(child2.container.hasClass('dropdown-item'));
        assert.deepEqual(btn.active_item, child1);
        assert.strictEqual($('span', btn.elem).text(), 'child 1');

        // trigger click on child 2
        child2.elem.trigger('click');
        assert.deepEqual(btn.active_item, child2);

        // the setter shows active item and keeps button content
        assert.strictEqual($('span', btn.elem).text(), 'child 2');
        assert.strictEqual($('i.bi-fonts', btn.elem).length, 1);

        // on_update does nothing
        btn.on_update();
        assert.deepEqual(btn.active_item, child2);
    });

    QUnit.test('DropdownButton unload', (assert) => {
        const btn = new DropdownButton(editor, {
            container_elem: $('#container'),
            tooltip: 'test_tt',
            submit: true,
        });
        const child = new Action(editor, {
            container_elem: btn.dd_elem,
            text: 'child',
        });
        btn.children.push(child);
        btn.set_items();

        btn.unload();
        assert.strictEqual($._data(btn.submit_elem[0], 'events'), undefined);
        assert.strictEqual($._data(child.elem[0], 'events'), undefined);
        assert.strictEqual($._data(btn.elem[0], 'events'), undefined);
        assert.strictEqual(bootstrap.Tooltip.getInstance(btn.container[0]), null);

        // without submit element
        const no_submit_btn = new DropdownButton(editor, {
            container_elem: $('#container'),
        });
        no_submit_btn.unload();
        assert.strictEqual($._data(no_submit_btn.elem[0], 'events'), undefined);
    });

    QUnit.test('DropdownButton submit', (assert) => {
        const opts = { container_elem: $('#container'), submit: true };
        class TestDropdownButton extends DropdownButton {
            submit(e) {
                e.preventDefault();
                assert.step('submit');
            }
        }
        const btn = new TestDropdownButton(editor, opts);
        btn.submit_elem.trigger('click');
        assert.verifySteps(['submit']);
    });

    QUnit.test('DropdownButton default submit', (assert) => {
        const opts = { container_elem: $('#container'), submit: true };
        const btn = new DropdownButton(editor, opts);

        const evt = new $.Event('click');
        btn.submit_elem.trigger(evt);
        assert.true(evt.isDefaultPrevented());
    });
});
