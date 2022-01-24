import $ from 'jquery';
import {Editor} from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

export class TiptapWidget {
    static initialize(context) {

    }

    constructor(elem) {
        this.elem = elem;

        // this.editor = new Editor({
        //     element: elem[0],
        //     extensions: [
        //         StarterKit,
        //     ],
        //     content: '<p>Hello World!</p>',
        // })
    }
}