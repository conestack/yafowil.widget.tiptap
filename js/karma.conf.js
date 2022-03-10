// chromium binary
process.env.CHROME_BIN = '/usr/bin/chromium';

// karma config
module.exports = function(config) {
    config.set({
        basePath: 'karma',
        frameworks: [
            'qunit',
            'viewport'
        ],
        files: [{
            pattern: '../../node_modules/jquery/src/**/*.js',
            type: 'module',
            included: false
        }, {
            pattern: '../../src/yafowil/widget/tiptap/resources/tiptap.js',
            included: true
        }, {
            pattern: '../src/*.js',
            type: 'module',
            included: false
        }, {
            pattern: '../tests/test_*.js',
            type: 'module'
        }, {
            pattern: '../../src/yafowil/widget/tiptap/resources/widget.css',
            included: true
        }],
        browsers: [
            'ChromeHeadless'
        ],
        singlerun: true,
        reporters: [
            'progress',
            'coverage'
        ],
        preprocessors: {
            '../src/*.js': [
                'coverage',
                'module-resolver'
            ],
            '../tests/*.js': [
                'coverage',
                'module-resolver'
            ]
        },
        moduleResolverPreprocessor: {
            addExtension: 'js',
            customResolver: null,
            ecmaVersion: 6,
            aliases: {
                jquery: '../../node_modules/jquery/src/jquery.js',
                tiptap: '../../src/yafowil/widget/tiptap/resources/tiptap.js'
            }
        }
    });
};
