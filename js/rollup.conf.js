import {nodeResolve} from '@rollup/plugin-node-resolve';
import cleanup from 'rollup-plugin-cleanup';
import postcss from 'rollup-plugin-postcss';
import terser from '@rollup/plugin-terser';
import commonjs from '@rollup/plugin-commonjs';

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

    let conf_tiptap_dist = {
        input: 'js/src/bundles/tiptap.js',
        plugins: [
            nodeResolve(),
            commonjs()
        ],
        output: [{
            file: `${out_dir}/tiptap.dist.bundle.js`,
            name: 'tiptap',
            format: 'es',
            interop: 'default',
            sourcemap: false
        }]
    };
    conf.push(conf_tiptap_dist);

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
    let scss = {
        input: ['scss/widget.scss'],
        output: [{
            file: `${out_dir}/widget.css`,
            format: 'es',
            plugins: [terser()],
        }],
        plugins: [
            postcss({
                extract: true,
                minimize: true,
                use: [
                    ['sass', { outputStyle: 'compressed' }],
                ],
            }),
        ],
    };
    conf.push(scss);

    return conf;
};
