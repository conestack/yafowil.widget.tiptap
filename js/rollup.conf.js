import cleanup from 'rollup-plugin-cleanup';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import {terser} from 'rollup-plugin-terser';

const out_dir = 'src/yafowil/widget/tiptap/resources';

const outro = `
if (window.yafowil === undefined) {
    window.yafowil = {};
}
window.yafowil.tiptap = exports;
`;

export default args => {
    let conf = {
        input: 'js/src/bundles/yafowil.bundle.js',
        plugins: [
            nodeResolve(),
            cleanup()
        ],
        output: [{
            file: `${out_dir}/widget.js`,
            format: 'iife',
            outro: outro,
            globals: {
                jquery: 'jQuery',
                tiptap: 'tiptap'
            },
            interop: 'default',
            sourcemap: true,
            sourcemapExcludeSources: true
        }],
        external: [
            'jquery',
            'tiptap'
        ]
    };
    if (args.configDebug !== true) {
        conf.output.push({
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
            interop: 'default',
            sourcemap: true,
            sourcemapExcludeSources: true
        });
    }
    return conf;
};
