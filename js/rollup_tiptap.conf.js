import cleanup from 'rollup-plugin-cleanup';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import {terser} from 'rollup-plugin-terser';

const out_dir = 'src/yafowil/widget/tiptap/resources';

export default args => {
    let conf = {
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
        conf.output.push({
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
    return conf;
};
