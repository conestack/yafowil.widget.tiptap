import $ from 'jquery';
import { register_array_subscribers, TiptapWidget } from './widget.js';

export * from './widget.js';

$(() => {
    if (window.ts !== undefined) {
        ts.ajax.register(TiptapWidget.initialize, true);
    } else if (window.bdajax !== undefined) {
        bdajax.register(TiptapWidget.initialize, true);
    } else {
        TiptapWidget.initialize();
    }
    register_array_subscribers();
});
