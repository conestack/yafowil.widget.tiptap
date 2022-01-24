import cleanup from 'rollup-plugin-cleanup';
import typescript from "rollup-plugin-ts";
import {terser} from 'rollup-plugin-terser';

const out_dir = 'src/yafowil/widget/tiptap/resources/tiptap';

export default args => {
    let conf = {
        input: 'js/tiptap-bundle.js',
        plugins: [
            typescript(),
            terser(),
            cleanup()
        ],
        output: [{
            file: `${out_dir}/tiptap.js`,
            format: 'iife',
            interop: 'default',
        }],
        external: [
        ]
    };
    if (args.configDebug !== true) {
        conf.output.push({
            file: `${out_dir}/tiptap.min.js`,
            format: 'iife',
            plugins: [
                typescript(),
                terser(),
                cleanup()
            ],
        });
    }
    return conf;
};
