(function (exports, $) {
    'use strict';

    class TiptapWidget {
        static initialize(context) {
            $('div.tiptap-editor', context).each(function() {
                let options = {};
                new TiptapWidget($(this), options);
            });
        }
        constructor(elem) {
            this.elem = elem;
            this.elem.css('width', '300px').css('height', '200px').css('border', '1px solid red');
            console.log(tiptap);
        }
    }

    $(function() {
        if (window.ts !== undefined) {
            ts.ajax.register(TiptapWidget.initialize, true);
        } else {
            TiptapWidget.initialize();
        }
    });

    exports.TiptapWidget = TiptapWidget;

    Object.defineProperty(exports, '__esModule', { value: true });


    if (window.yafowil === undefined) {
        window.yafowil = {};
    }
    window.yafowil.tiptap = exports;


    return exports;

})({}, jQuery);
//# sourceMappingURL=widget.js.map
