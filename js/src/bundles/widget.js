import $ from 'jquery';

import {TiptapWidget} from '../widget.js';
import {register_array_subscribers} from '../widget.js';
export * from '../widget.js';

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
