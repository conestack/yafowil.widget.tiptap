import $ from 'jquery';

import {TiptapWidget} from '../bootstrap5/widget.js';
import {register_array_subscribers} from '../bootstrap5/widget.js';
export * from '../bootstrap5/widget.js';

$(function() {
    if (window.ts !== undefined) {
        ts.ajax.register(TiptapWidget.initialize, true);
    } else if (window.bdajax !== undefined) {
        bdajax.register(TiptapWidget.initialize, true);
    } else {
        TiptapWidget.initialize();
    }
    register_array_subscribers();
});
