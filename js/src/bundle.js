import $ from 'jquery';

import {TiptapWidget} from './widget.js';

export * from './widget.js';

$(function() {
    if (window.ts !== undefined) {
        ts.ajax.register(TiptapWidget.initialize, true);
    } else {
        TiptapWidget.initialize();
    }
});
