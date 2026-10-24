import $ from 'jquery';

QUnit.module('bundle', (hooks) => {
    const ready_callbacks = [];
    let tiptap_dist, default_bundle, bs5_bundle;

    hooks.before(async () => {
        tiptap_dist = await import('tiptap');
        window.tiptap = tiptap_dist;

        // capture DOM ready callbacks registered by the bundles
        const orig_ready = $.fn.ready;
        $.fn.ready = function (fn) {
            ready_callbacks.push(fn);
            return this;
        };
        try {
            default_bundle = await import('../src/default/bundle.js');
            bs5_bundle = await import('../src/bootstrap5/bundle.js');
        } finally {
            $.fn.ready = orig_ready;
        }
    });

    hooks.afterEach(() => {
        delete window.ts;
        delete window.bdajax;
        window.yafowil_array = undefined;
    });

    function assert_dom_ready_registration(assert, ready_callback, widget_class) {
        let registered = [];
        const register = (callback, instant) => {
            registered.push([callback, instant]);
        };

        window.ts = { ajax: { register } };
        ready_callback();
        assert.deepEqual(registered, [[widget_class.initialize, true]]);
        delete window.ts;

        registered = [];
        window.bdajax = { register };
        ready_callback();
        assert.deepEqual(registered, [[widget_class.initialize, true]]);
        delete window.bdajax;

        const orig_initialize = widget_class.initialize;
        const initialized = [];
        widget_class.initialize = (...args) => {
            initialized.push(args);
        };
        const subscribers = {};
        window.yafowil_array = {
            on_array_event: (evt_name, evt_function) => {
                subscribers[evt_name] = evt_function;
            },
        };
        try {
            ready_callback();
        } finally {
            widget_class.initialize = orig_initialize;
        }
        assert.deepEqual(initialized, [[]]);
        assert.deepEqual(Object.keys(subscribers), ['on_add']);
    }

    QUnit.test('tiptap bundle exports', async (assert) => {
        const tiptap_bundle = await import('../src/tiptap/bundle.js');
        const names = Object.keys(tiptap_bundle);
        for (const name of ['Editor', 'Bold', 'Link', 'BulletList', 'TextStyle', 'Color']) {
            assert.true(names.includes(name), name);
        }
        assert.deepEqual(names, Object.keys(tiptap_dist));
    });

    QUnit.test('widget bundle exports', (assert) => {
        const expected = ['TiptapWidget', 'register_array_subscribers'];
        assert.deepEqual(Object.keys(default_bundle).sort(), expected);
        assert.deepEqual(Object.keys(bs5_bundle).sort(), expected);
        assert.notStrictEqual(default_bundle.TiptapWidget, bs5_bundle.TiptapWidget);
        assert.strictEqual(ready_callbacks.length, 2);
    });

    QUnit.test('default DOM ready registration', (assert) => {
        assert_dom_ready_registration(assert, ready_callbacks[0], default_bundle.TiptapWidget);
    });

    QUnit.test('bootstrap5 DOM ready registration', (assert) => {
        assert_dom_ready_registration(assert, ready_callbacks[1], bs5_bundle.TiptapWidget);
    });
});
