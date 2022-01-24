import $ from 'jquery';

export class TiptapWidget {
    static initialize(context) {
        $('div.tiptap-editor', context).each(function() {
            let options = {};
            new TiptapWidget($(this), options);
        });
    }

    constructor(elem) {
        this.elem = elem;
        this.elem.css('width', '300px').css('height', '200px').css('border', '1px solid red');
        // this.editor = new tiptap.Editor({
        //     element: this.elem[0],
        //     content: '<p>Hello World!</p>',
        // })
        console.log(tiptap)
    }
}