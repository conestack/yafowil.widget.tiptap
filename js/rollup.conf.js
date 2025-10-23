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

    ////////////////////////////////////////////////////////////////////////////
    // TIPTAP
    ////////////////////////////////////////////////////////////////////////////

    let bundle_tiptap = {
        input: 'js/src/tiptap/bundle.js',
        plugins: [
            nodeResolve(),
            cleanup()
        ],
        output: [{
            file: `${out_dir}/tiptap/tiptap.js`,
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
        bundle_tiptap.output.push({
            file: `${out_dir}/tiptap/tiptap.min.js`,
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
    let tiptap_dist = {
        input: 'js/src/tiptap/bundle.js',
        plugins: [
            nodeResolve(),
            commonjs()
        ],
        output: [{
            file: `${out_dir}/tiptap/tiptap.dist.bundle.js`,
            name: 'tiptap',
            format: 'es',
            interop: 'default',
            sourcemap: false
        }]
    };
    conf.push(bundle_tiptap, tiptap_dist);

    ////////////////////////////////////////////////////////////////////////////
    // DEFAULT
    ////////////////////////////////////////////////////////////////////////////

    let bundle_default = {
        input: 'js/src/default/bundle.js',
        plugins: [
            nodeResolve(),
            cleanup()
        ],
        output: [{
            name: 'yafowil_tiptap',
            file: `${out_dir}/default/widget.js`,
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
        bundle_default.output.push({
            name: 'yafowil_tiptap',
            file: `${out_dir}/default/widget.min.js`,
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
    let scss_default = {
        input: ['scss/default/widget.scss'],
        output: [{
            file: `${out_dir}/default/widget.min.css`,
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
    conf.push(bundle_default, scss_default);

    ////////////////////////////////////////////////////////////////////////////
    // BOOTSTRAP5
    ////////////////////////////////////////////////////////////////////////////

    let bundle_bs5 = {
        input: 'js/src/bootstrap5/bundle.js',
        plugins: [
            cleanup()
        ],
        output: [{
            name: 'yafowil_tiptap',
            file: `${out_dir}/bootstrap5/widget.js`,
            format: 'iife',
            outro: outro,
            globals: {
                jquery: 'jQuery',
                bootstrap: 'bootstrap'
            },
            interop: 'default'
        }],
        external: [
            'jquery',
            'bootstrap'
        ]
    };
    if (args.configDebug !== true) {
        bundle_bs5.output.push({
            name: 'yafowil_tiptap',
            file: `${out_dir}/bootstrap5/widget.min.js`,
            format: 'iife',
            plugins: [
                terser()
            ],
            outro: outro,
            globals: {
                jquery: 'jQuery',
                bootstrap: 'bootstrap'
            },
            interop: 'default'
        });
    }
    let scss_bs5 = {
        input: ['scss/bootstrap5/widget.scss'],
        output: [{
            file: `${out_dir}/bootstrap5/widget.min.css`,
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
    conf.push(bundle_bs5, scss_bs5);

    return conf;
};
