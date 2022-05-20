import cleanup from 'rollup-plugin-cleanup';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import {terser} from 'rollup-plugin-terser';

const out_dir = 'src/yafowil/widget/tiptap/resources';

const outro = `
window.yafowil = window.yafowil || {};
window.yafowil.tiptap = exports;
`;

export default args => {
    let conf = [];

    let conf_tiptap = {
        input: 'js/src/bundles/tiptap.js',
        plugins: [
            nodeResolve(),
            cleanup()
        ],
        output: [{
            file: `${out_dir}/tiptap.js`,
            name: 'tiptap',
            format: 'iife',
            interop: 'default',
            sourcemap: false,
            globals: {
                tiptap: 'tiptap'
            }
        }]
    };
    if (args.configDebug !== true) {
        conf_tiptap.output.push({
            file: `${out_dir}/tiptap.min.js`,
            name: 'tiptap',
            format: 'iife',
            plugins: [
                terser()
            ],
            interop: 'default',
            sourcemap: false,
            globals: {
                tiptap: 'tiptap'
            }
        });
    }
    conf.push(conf_tiptap);

    let conf_widget = {
        input: 'js/src/bundles/widget.js',
        plugins: [
            nodeResolve(),
            cleanup()
        ],
        output: [{
            name: 'yafowil_tiptap',
            file: `${out_dir}/widget.js`,
            format: 'iife',
            outro: outro,
            globals: {
                jquery: 'jQuery',
                tiptap: 'tiptap'
            },
            interop: 'default'
        }],
        external: [
            'jquery',
            'tiptap'
        ]
    };
    if (args.configDebug !== true) {
        conf_widget.output.push({
            name: 'yafowil_tiptap',
            file: `${out_dir}/widget.min.js`,
            format: 'iife',
            plugins: [
                terser()
            ],
            outro: outro,
            globals: {
                jquery: 'jQuery',
                tiptap: 'tiptap'
            },
            interop: 'default'
        });
    }
    conf.push(conf_widget);

    return conf;
};
