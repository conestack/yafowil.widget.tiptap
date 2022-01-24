(function () {
  'use strict';

  (function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('prosemirror-state'), require('prosemirror-transform'), require('prosemirror-commands'), require('prosemirror-model'), require('prosemirror-schema-list'), require('prosemirror-view'), require('prosemirror-keymap')) :
    typeof define === 'function' && define.amd ? define(['exports', 'prosemirror-state', 'prosemirror-transform', 'prosemirror-commands', 'prosemirror-model', 'prosemirror-schema-list', 'prosemirror-view', 'prosemirror-keymap'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global["@tiptap/core"] = {}, global.prosemirrorState, global.prosemirrorTransform, global.prosemirrorCommands, global.prosemirrorModel, global.prosemirrorSchemaList, global.prosemirrorView, global.prosemirrorKeymap));
  })(undefined, (function (exports, prosemirrorState, prosemirrorTransform, prosemirrorCommands, prosemirrorModel, prosemirrorSchemaList, prosemirrorView, prosemirrorKeymap) {  function getType(value) {
        return Object.prototype.toString.call(value).slice(8, -1);
    }
    function isPlainObject(value) {
        if (getType(value) !== 'Object') {
            return false;
        }
        return value.constructor === Object && Object.getPrototypeOf(value) === Object.prototype;
    }
    function mergeDeep(target, source) {
        const output = { ...target };
        if (isPlainObject(target) && isPlainObject(source)) {
            Object.keys(source).forEach(key => {
                if (isPlainObject(source[key])) {
                    if (!(key in target)) {
                        Object.assign(output, { [key]: source[key] });
                    }
                    else {
                        output[key] = mergeDeep(target[key], source[key]);
                    }
                }
                else {
                    Object.assign(output, { [key]: source[key] });
                }
            });
        }
        return output;
    }
    function isFunction(value) {
        return typeof value === 'function';
    }
    function callOrReturn(value, context = undefined, ...props) {
        if (isFunction(value)) {
            if (context) {
                return value.bind(context)(...props);
            }
            return value(...props);
        }
        return value;
    }
    function getExtensionField(extension, field, context) {
        if (extension.config[field] === undefined && extension.parent) {
            return getExtensionField(extension.parent, field, context);
        }
        if (typeof extension.config[field] === 'function') {
            const value = extension.config[field].bind({
                ...context,
                parent: extension.parent
                    ? getExtensionField(extension.parent, field, context)
                    : null,
            });
            return value;
        }
        return extension.config[field];
    }
    class Extension {
        constructor(config = {}) {
            this.type = 'extension';
            this.name = 'extension';
            this.parent = null;
            this.child = null;
            this.config = {
                name: this.name,
                defaultOptions: {},
            };
            this.config = {
                ...this.config,
                ...config,
            };
            this.name = this.config.name;
            if (config.defaultOptions) {
                console.warn(`[tiptap warn]: BREAKING CHANGE: "defaultOptions" is deprecated. Please use "addOptions" instead. Found in extension: "${this.name}".`);
            }
            this.options = this.config.defaultOptions;
            if (this.config.addOptions) {
                this.options = callOrReturn(getExtensionField(this, 'addOptions', {
                    name: this.name,
                }));
            }
            this.storage = callOrReturn(getExtensionField(this, 'addStorage', {
                name: this.name,
                options: this.options,
            })) || {};
        }
        static create(config = {}) {
            return new Extension(config);
        }
        configure(options = {}) {
            const extension = this.extend();
            extension.options = mergeDeep(this.options, options);
            extension.storage = callOrReturn(getExtensionField(extension, 'addStorage', {
                name: extension.name,
                options: extension.options,
            }));
            return extension;
        }
        extend(extendedConfig = {}) {
            const extension = new Extension(extendedConfig);
            extension.parent = this;
            this.child = extension;
            extension.name = extendedConfig.name
                ? extendedConfig.name
                : extension.parent.name;
            if (extendedConfig.defaultOptions) {
                console.warn(`[tiptap warn]: BREAKING CHANGE: "defaultOptions" is deprecated. Please use "addOptions" instead. Found in extension: "${extension.name}".`);
            }
            extension.options = callOrReturn(getExtensionField(extension, 'addOptions', {
                name: extension.name,
            }));
            extension.storage = callOrReturn(getExtensionField(extension, 'addStorage', {
                name: extension.name,
                options: extension.options,
            }));
            return extension;
        }
    }
    function getTextBetween(startNode, range, options) {
        const { from, to } = range;
        const { blockSeparator = '\n\n', textSerializers = {}, } = options || {};
        let text = '';
        let separated = true;
        startNode.nodesBetween(from, to, (node, pos, parent, index) => {
            var _a;
            const textSerializer = textSerializers === null || textSerializers === void 0 ? void 0 : textSerializers[node.type.name];
            if (textSerializer) {
                if (node.isBlock && !separated) {
                    text += blockSeparator;
                    separated = true;
                }
                text += textSerializer({
                    node,
                    pos,
                    parent,
                    index,
                });
            }
            else if (node.isText) {
                text += (_a = node === null || node === void 0 ? void 0 : node.text) === null || _a === void 0 ? void 0 : _a.slice(Math.max(from, pos) - pos, to - pos);
                separated = false;
            }
            else if (node.isBlock && !separated) {
                text += blockSeparator;
                separated = true;
            }
        });
        return text;
    }
    function getTextSeralizersFromSchema(schema) {
        return Object.fromEntries(Object
            .entries(schema.nodes)
            .filter(([, node]) => node.spec.toText)
            .map(([name, node]) => [name, node.spec.toText]));
    }
    const ClipboardTextSerializer = Extension.create({
        name: 'clipboardTextSerializer',
        addProseMirrorPlugins() {
            return [
                new prosemirrorState.Plugin({
                    key: new prosemirrorState.PluginKey('clipboardTextSerializer'),
                    props: {
                        clipboardTextSerializer: () => {
                            const { editor } = this;
                            const { state, schema } = editor;
                            const { doc, selection } = state;
                            const { ranges } = selection;
                            const from = Math.min(...ranges.map(range => range.$from.pos));
                            const to = Math.max(...ranges.map(range => range.$to.pos));
                            const textSerializers = getTextSeralizersFromSchema(schema);
                            const range = { from, to };
                            return getTextBetween(doc, range, {
                                textSerializers,
                            });
                        },
                    },
                }),
            ];
        },
    });
    const blur = () => ({ editor, view }) => {
        requestAnimationFrame(() => {
            var _a;
            if (!editor.isDestroyed) {
                view.dom.blur();
                (_a = window === null || window === void 0 ? void 0 : window.getSelection()) === null || _a === void 0 ? void 0 : _a.removeAllRanges();
            }
        });
        return true;
    };
    var blur$1 = Object.freeze({
      __proto__: null,
      blur: blur
    });
    const clearContent = (emitUpdate = false) => ({ commands }) => {
        return commands.setContent('', emitUpdate);
    };
    var clearContent$1 = Object.freeze({
      __proto__: null,
      clearContent: clearContent
    });
    const clearNodes = () => ({ state, tr, dispatch }) => {
        const { selection } = tr;
        const { ranges } = selection;
        if (!dispatch) {
            return true;
        }
        ranges.forEach(({ $from, $to }) => {
            state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
                if (node.type.isText) {
                    return;
                }
                const { doc, mapping } = tr;
                const $mappedFrom = doc.resolve(mapping.map(pos));
                const $mappedTo = doc.resolve(mapping.map(pos + node.nodeSize));
                const nodeRange = $mappedFrom.blockRange($mappedTo);
                if (!nodeRange) {
                    return;
                }
                const targetLiftDepth = prosemirrorTransform.liftTarget(nodeRange);
                if (node.type.isTextblock) {
                    const { defaultType } = $mappedFrom.parent.contentMatchAt($mappedFrom.index());
                    tr.setNodeMarkup(nodeRange.start, defaultType);
                }
                if (targetLiftDepth || targetLiftDepth === 0) {
                    tr.lift(nodeRange, targetLiftDepth);
                }
            });
        });
        return true;
    };
    var clearNodes$1 = Object.freeze({
      __proto__: null,
      clearNodes: clearNodes
    });
    const command = fn => props => {
        return fn(props);
    };
    var command$1 = Object.freeze({
      __proto__: null,
      command: command
    });
    const createParagraphNear = () => ({ state, dispatch }) => {
        return prosemirrorCommands.createParagraphNear(state, dispatch);
    };
    var createParagraphNear$1 = Object.freeze({
      __proto__: null,
      createParagraphNear: createParagraphNear
    });
    function getNodeType(nameOrType, schema) {
        if (typeof nameOrType === 'string') {
            if (!schema.nodes[nameOrType]) {
                throw Error(`There is no node type named '${nameOrType}'. Maybe you forgot to add the extension?`);
            }
            return schema.nodes[nameOrType];
        }
        return nameOrType;
    }
    const deleteNode = typeOrName => ({ tr, state, dispatch }) => {
        const type = getNodeType(typeOrName, state.schema);
        const $pos = tr.selection.$anchor;
        for (let depth = $pos.depth; depth > 0; depth -= 1) {
            const node = $pos.node(depth);
            if (node.type === type) {
                if (dispatch) {
                    const from = $pos.before(depth);
                    const to = $pos.after(depth);
                    tr.delete(from, to).scrollIntoView();
                }
                return true;
            }
        }
        return false;
    };
    var deleteNode$1 = Object.freeze({
      __proto__: null,
      deleteNode: deleteNode
    });
    const deleteRange = range => ({ tr, dispatch }) => {
        const { from, to } = range;
        if (dispatch) {
            tr.delete(from, to);
        }
        return true;
    };
    var deleteRange$1 = Object.freeze({
      __proto__: null,
      deleteRange: deleteRange
    });
    const deleteSelection = () => ({ state, dispatch }) => {
        return prosemirrorCommands.deleteSelection(state, dispatch);
    };
    var deleteSelection$1 = Object.freeze({
      __proto__: null,
      deleteSelection: deleteSelection
    });
    const enter = () => ({ commands }) => {
        return commands.keyboardShortcut('Enter');
    };
    var enter$1 = Object.freeze({
      __proto__: null,
      enter: enter
    });
    const exitCode = () => ({ state, dispatch }) => {
        return prosemirrorCommands.exitCode(state, dispatch);
    };
    var exitCode$1 = Object.freeze({
      __proto__: null,
      exitCode: exitCode
    });
    function getMarkType(nameOrType, schema) {
        if (typeof nameOrType === 'string') {
            if (!schema.marks[nameOrType]) {
                throw Error(`There is no mark type named '${nameOrType}'. Maybe you forgot to add the extension?`);
            }
            return schema.marks[nameOrType];
        }
        return nameOrType;
    }
    function isRegExp(value) {
        return Object.prototype.toString.call(value) === '[object RegExp]';
    }
    function objectIncludes(object1, object2, options = { strict: true }) {
        const keys = Object.keys(object2);
        if (!keys.length) {
            return true;
        }
        return keys.every(key => {
            if (options.strict) {
                return object2[key] === object1[key];
            }
            if (isRegExp(object2[key])) {
                return object2[key].test(object1[key]);
            }
            return object2[key] === object1[key];
        });
    }
    function findMarkInSet(marks, type, attributes = {}) {
        return marks.find(item => {
            return item.type === type && objectIncludes(item.attrs, attributes);
        });
    }
    function isMarkInSet(marks, type, attributes = {}) {
        return !!findMarkInSet(marks, type, attributes);
    }
    function getMarkRange($pos, type, attributes = {}) {
        if (!$pos || !type) {
            return;
        }
        const start = $pos.parent.childAfter($pos.parentOffset);
        if (!start.node) {
            return;
        }
        const mark = findMarkInSet(start.node.marks, type, attributes);
        if (!mark) {
            return;
        }
        let startIndex = $pos.index();
        let startPos = $pos.start() + start.offset;
        let endIndex = startIndex + 1;
        let endPos = startPos + start.node.nodeSize;
        findMarkInSet(start.node.marks, type, attributes);
        while (startIndex > 0 && mark.isInSet($pos.parent.child(startIndex - 1).marks)) {
            startIndex -= 1;
            startPos -= $pos.parent.child(startIndex).nodeSize;
        }
        while (endIndex < $pos.parent.childCount
            && isMarkInSet($pos.parent.child(endIndex).marks, type, attributes)) {
            endPos += $pos.parent.child(endIndex).nodeSize;
            endIndex += 1;
        }
        return {
            from: startPos,
            to: endPos,
        };
    }
    const extendMarkRange = (typeOrName, attributes = {}) => ({ tr, state, dispatch }) => {
        const type = getMarkType(typeOrName, state.schema);
        const { doc, selection } = tr;
        const { $from, from, to } = selection;
        if (dispatch) {
            const range = getMarkRange($from, type, attributes);
            if (range && range.from <= from && range.to >= to) {
                const newSelection = prosemirrorState.TextSelection.create(doc, range.from, range.to);
                tr.setSelection(newSelection);
            }
        }
        return true;
    };
    var extendMarkRange$1 = Object.freeze({
      __proto__: null,
      extendMarkRange: extendMarkRange
    });
    const first = commands => props => {
        const items = typeof commands === 'function'
            ? commands(props)
            : commands;
        for (let i = 0; i < items.length; i += 1) {
            if (items[i](props)) {
                return true;
            }
        }
        return false;
    };
    var first$1 = Object.freeze({
      __proto__: null,
      first: first
    });
    function isClass(value) {
        var _a;
        if (((_a = value.constructor) === null || _a === void 0 ? void 0 : _a.toString().substring(0, 5)) !== 'class') {
            return false;
        }
        return true;
    }
    function isObject(value) {
        return (value
            && typeof value === 'object'
            && !Array.isArray(value)
            && !isClass(value));
    }
    function isTextSelection(value) {
        return isObject(value) && value instanceof prosemirrorState.TextSelection;
    }
    function isiOS() {
        return [
            'iPad Simulator',
            'iPhone Simulator',
            'iPod Simulator',
            'iPad',
            'iPhone',
            'iPod',
        ].includes(navigator.platform)
            || (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
    }
    function minMax(value = 0, min = 0, max = 0) {
        return Math.min(Math.max(value, min), max);
    }
    function resolveFocusPosition(doc, position = null) {
        if (!position) {
            return null;
        }
        if (position === 'start' || position === true) {
            return prosemirrorState.Selection.atStart(doc);
        }
        if (position === 'end') {
            return prosemirrorState.Selection.atEnd(doc);
        }
        if (position === 'all') {
            return prosemirrorState.TextSelection.create(doc, 0, doc.content.size);
        }
        const minPos = prosemirrorState.Selection.atStart(doc).from;
        const maxPos = prosemirrorState.Selection.atEnd(doc).to;
        const resolvedFrom = minMax(position, minPos, maxPos);
        const resolvedEnd = minMax(position, minPos, maxPos);
        return prosemirrorState.TextSelection.create(doc, resolvedFrom, resolvedEnd);
    }
    const focus = (position = null, options) => ({ editor, view, tr, dispatch, }) => {
        options = {
            scrollIntoView: true,
            ...options,
        };
        const delayedFocus = () => {
            if (isiOS()) {
                view.dom.focus();
            }
            requestAnimationFrame(() => {
                if (!editor.isDestroyed) {
                    view.focus();
                    if (options === null || options === void 0 ? void 0 : options.scrollIntoView) {
                        editor.commands.scrollIntoView();
                    }
                }
            });
        };
        if ((view.hasFocus() && position === null) || position === false) {
            return true;
        }
        if (dispatch && position === null && !isTextSelection(editor.state.selection)) {
            delayedFocus();
            return true;
        }
        const selection = resolveFocusPosition(editor.state.doc, position) || editor.state.selection;
        const isSameSelection = editor.state.selection.eq(selection);
        if (dispatch) {
            if (!isSameSelection) {
                tr.setSelection(selection);
            }
            if (isSameSelection && tr.storedMarks) {
                tr.setStoredMarks(tr.storedMarks);
            }
            delayedFocus();
        }
        return true;
    };
    var focus$1 = Object.freeze({
      __proto__: null,
      focus: focus
    });
    const forEach = (items, fn) => props => {
        return items.every((item, index) => fn(item, { ...props, index }));
    };
    var forEach$1 = Object.freeze({
      __proto__: null,
      forEach: forEach
    });
    const insertContent = (value, options) => ({ tr, commands }) => {
        return commands.insertContentAt({ from: tr.selection.from, to: tr.selection.to }, value, options);
    };
    var insertContent$1 = Object.freeze({
      __proto__: null,
      insertContent: insertContent
    });
    function elementFromString(value) {
        const wrappedValue = `<body>${value}</body>`;
        return new window.DOMParser().parseFromString(wrappedValue, 'text/html').body;
    }
    function createNodeFromContent(content, schema, options) {
        options = {
            slice: true,
            parseOptions: {},
            ...options,
        };
        if (typeof content === 'object' && content !== null) {
            try {
                if (Array.isArray(content)) {
                    return prosemirrorModel.Fragment.fromArray(content.map(item => schema.nodeFromJSON(item)));
                }
                return schema.nodeFromJSON(content);
            }
            catch (error) {
                console.warn('[tiptap warn]: Invalid content.', 'Passed value:', content, 'Error:', error);
                return createNodeFromContent('', schema, options);
            }
        }
        if (typeof content === 'string') {
            const parser = prosemirrorModel.DOMParser.fromSchema(schema);
            return options.slice
                ? parser.parseSlice(elementFromString(content), options.parseOptions).content
                : parser.parse(elementFromString(content), options.parseOptions);
        }
        return createNodeFromContent('', schema, options);
    }
    function selectionToInsertionEnd(tr, startLen, bias) {
        const last = tr.steps.length - 1;
        if (last < startLen) {
            return;
        }
        const step = tr.steps[last];
        if (!(step instanceof prosemirrorTransform.ReplaceStep || step instanceof prosemirrorTransform.ReplaceAroundStep)) {
            return;
        }
        const map = tr.mapping.maps[last];
        let end = 0;
        map.forEach((_from, _to, _newFrom, newTo) => {
            if (end === 0) {
                end = newTo;
            }
        });
        tr.setSelection(prosemirrorState.Selection.near(tr.doc.resolve(end), bias));
    }
    const isFragment = (nodeOrFragment) => {
        return nodeOrFragment.toString().startsWith('<');
    };
    const insertContentAt = (position, value, options) => ({ tr, dispatch, editor }) => {
        if (dispatch) {
            options = {
                parseOptions: {},
                updateSelection: true,
                ...options,
            };
            const content = createNodeFromContent(value, editor.schema, {
                parseOptions: {
                    preserveWhitespace: 'full',
                    ...options.parseOptions,
                },
            });
            if (content.toString() === '<>') {
                return true;
            }
            let { from, to } = typeof position === 'number'
                ? { from: position, to: position }
                : position;
            let isOnlyTextContent = true;
            let isOnlyBlockContent = true;
            const nodes = isFragment(content)
                ? content
                : [content];
            nodes.forEach(node => {
                node.check();
                isOnlyTextContent = isOnlyTextContent
                    ? node.isText && node.marks.length === 0
                    : false;
                isOnlyBlockContent = isOnlyBlockContent
                    ? node.isBlock
                    : false;
            });
            if (from === to && isOnlyBlockContent) {
                const { parent } = tr.doc.resolve(from);
                const isEmptyTextBlock = parent.isTextblock
                    && !parent.type.spec.code
                    && !parent.childCount;
                if (isEmptyTextBlock) {
                    from -= 1;
                    to += 1;
                }
            }
            if (isOnlyTextContent) {
                tr.insertText(value, from, to);
            }
            else {
                tr.replaceWith(from, to, content);
            }
            if (options.updateSelection) {
                selectionToInsertionEnd(tr, tr.steps.length - 1, -1);
            }
        }
        return true;
    };
    var insertContentAt$1 = Object.freeze({
      __proto__: null,
      insertContentAt: insertContentAt
    });
    const joinBackward = () => ({ state, dispatch }) => {
        return prosemirrorCommands.joinBackward(state, dispatch);
    };
    var joinBackward$1 = Object.freeze({
      __proto__: null,
      joinBackward: joinBackward
    });
    const joinForward = () => ({ state, dispatch }) => {
        return prosemirrorCommands.joinForward(state, dispatch);
    };
    var joinForward$1 = Object.freeze({
      __proto__: null,
      joinForward: joinForward
    });
    const mac = typeof navigator !== 'undefined' ? /Mac/.test(navigator.platform) : false;
    function normalizeKeyName(name) {
        const parts = name.split(/-(?!$)/);
        let result = parts[parts.length - 1];
        if (result === 'Space') {
            result = ' ';
        }
        let alt;
        let ctrl;
        let shift;
        let meta;
        for (let i = 0; i < parts.length - 1; i += 1) {
            const mod = parts[i];
            if (/^(cmd|meta|m)$/i.test(mod)) {
                meta = true;
            }
            else if (/^a(lt)?$/i.test(mod)) {
                alt = true;
            }
            else if (/^(c|ctrl|control)$/i.test(mod)) {
                ctrl = true;
            }
            else if (/^s(hift)?$/i.test(mod)) {
                shift = true;
            }
            else if (/^mod$/i.test(mod)) {
                if (mac) {
                    meta = true;
                }
                else {
                    ctrl = true;
                }
            }
            else {
                throw new Error(`Unrecognized modifier name: ${mod}`);
            }
        }
        if (alt) {
            result = `Alt-${result}`;
        }
        if (ctrl) {
            result = `Ctrl-${result}`;
        }
        if (meta) {
            result = `Meta-${result}`;
        }
        if (shift) {
            result = `Shift-${result}`;
        }
        return result;
    }
    const keyboardShortcut = name => ({ editor, view, tr, dispatch, }) => {
        const keys = normalizeKeyName(name).split(/-(?!$)/);
        const key = keys.find(item => !['Alt', 'Ctrl', 'Meta', 'Shift'].includes(item));
        const event = new KeyboardEvent('keydown', {
            key: key === 'Space'
                ? ' '
                : key,
            altKey: keys.includes('Alt'),
            ctrlKey: keys.includes('Ctrl'),
            metaKey: keys.includes('Meta'),
            shiftKey: keys.includes('Shift'),
            bubbles: true,
            cancelable: true,
        });
        const capturedTransaction = editor.captureTransaction(() => {
            view.someProp('handleKeyDown', f => f(view, event));
        });
        capturedTransaction === null || capturedTransaction === void 0 ? void 0 : capturedTransaction.steps.forEach(step => {
            const newStep = step.map(tr.mapping);
            if (newStep && dispatch) {
                tr.maybeStep(newStep);
            }
        });
        return true;
    };
    var keyboardShortcut$1 = Object.freeze({
      __proto__: null,
      keyboardShortcut: keyboardShortcut
    });
    function isNodeActive(state, typeOrName, attributes = {}) {
        const { from, to, empty } = state.selection;
        const type = typeOrName
            ? getNodeType(typeOrName, state.schema)
            : null;
        const nodeRanges = [];
        state.doc.nodesBetween(from, to, (node, pos) => {
            if (node.isText) {
                return;
            }
            const relativeFrom = Math.max(from, pos);
            const relativeTo = Math.min(to, pos + node.nodeSize);
            nodeRanges.push({
                node,
                from: relativeFrom,
                to: relativeTo,
            });
        });
        const selectionRange = to - from;
        const matchedNodeRanges = nodeRanges
            .filter(nodeRange => {
            if (!type) {
                return true;
            }
            return type.name === nodeRange.node.type.name;
        })
            .filter(nodeRange => objectIncludes(nodeRange.node.attrs, attributes, { strict: false }));
        if (empty) {
            return !!matchedNodeRanges.length;
        }
        const range = matchedNodeRanges
            .reduce((sum, nodeRange) => sum + nodeRange.to - nodeRange.from, 0);
        return range >= selectionRange;
    }
    const lift = (typeOrName, attributes = {}) => ({ state, dispatch }) => {
        const type = getNodeType(typeOrName, state.schema);
        const isActive = isNodeActive(state, type, attributes);
        if (!isActive) {
            return false;
        }
        return prosemirrorCommands.lift(state, dispatch);
    };
    var lift$1 = Object.freeze({
      __proto__: null,
      lift: lift
    });
    const liftEmptyBlock = () => ({ state, dispatch }) => {
        return prosemirrorCommands.liftEmptyBlock(state, dispatch);
    };
    var liftEmptyBlock$1 = Object.freeze({
      __proto__: null,
      liftEmptyBlock: liftEmptyBlock
    });
    const liftListItem = typeOrName => ({ state, dispatch }) => {
        const type = getNodeType(typeOrName, state.schema);
        return prosemirrorSchemaList.liftListItem(type)(state, dispatch);
    };
    var liftListItem$1 = Object.freeze({
      __proto__: null,
      liftListItem: liftListItem
    });
    const newlineInCode = () => ({ state, dispatch }) => {
        return prosemirrorCommands.newlineInCode(state, dispatch);
    };
    var newlineInCode$1 = Object.freeze({
      __proto__: null,
      newlineInCode: newlineInCode
    });
    function getSchemaTypeNameByName(name, schema) {
        if (schema.nodes[name]) {
            return 'node';
        }
        if (schema.marks[name]) {
            return 'mark';
        }
        return null;
    }
    function deleteProps(obj, propOrProps) {
        const props = typeof propOrProps === 'string'
            ? [propOrProps]
            : propOrProps;
        return Object
            .keys(obj)
            .reduce((newObj, prop) => {
            if (!props.includes(prop)) {
                newObj[prop] = obj[prop];
            }
            return newObj;
        }, {});
    }
    const resetAttributes = (typeOrName, attributes) => ({ tr, state, dispatch }) => {
        let nodeType = null;
        let markType = null;
        const schemaType = getSchemaTypeNameByName(typeof typeOrName === 'string'
            ? typeOrName
            : typeOrName.name, state.schema);
        if (!schemaType) {
            return false;
        }
        if (schemaType === 'node') {
            nodeType = getNodeType(typeOrName, state.schema);
        }
        if (schemaType === 'mark') {
            markType = getMarkType(typeOrName, state.schema);
        }
        if (dispatch) {
            tr.selection.ranges.forEach(range => {
                state.doc.nodesBetween(range.$from.pos, range.$to.pos, (node, pos) => {
                    if (nodeType && nodeType === node.type) {
                        tr.setNodeMarkup(pos, undefined, deleteProps(node.attrs, attributes));
                    }
                    if (markType && node.marks.length) {
                        node.marks.forEach(mark => {
                            if (markType === mark.type) {
                                tr.addMark(pos, pos + node.nodeSize, markType.create(deleteProps(mark.attrs, attributes)));
                            }
                        });
                    }
                });
            });
        }
        return true;
    };
    var resetAttributes$1 = Object.freeze({
      __proto__: null,
      resetAttributes: resetAttributes
    });
    const scrollIntoView = () => ({ tr, dispatch }) => {
        if (dispatch) {
            tr.scrollIntoView();
        }
        return true;
    };
    var scrollIntoView$1 = Object.freeze({
      __proto__: null,
      scrollIntoView: scrollIntoView
    });
    const selectAll = () => ({ tr, commands }) => {
        return commands.setTextSelection({
            from: 0,
            to: tr.doc.content.size,
        });
    };
    var selectAll$1 = Object.freeze({
      __proto__: null,
      selectAll: selectAll
    });
    const selectNodeBackward = () => ({ state, dispatch }) => {
        return prosemirrorCommands.selectNodeBackward(state, dispatch);
    };
    var selectNodeBackward$1 = Object.freeze({
      __proto__: null,
      selectNodeBackward: selectNodeBackward
    });
    const selectNodeForward = () => ({ state, dispatch }) => {
        return prosemirrorCommands.selectNodeForward(state, dispatch);
    };
    var selectNodeForward$1 = Object.freeze({
      __proto__: null,
      selectNodeForward: selectNodeForward
    });
    const selectParentNode = () => ({ state, dispatch }) => {
        return prosemirrorCommands.selectParentNode(state, dispatch);
    };
    var selectParentNode$1 = Object.freeze({
      __proto__: null,
      selectParentNode: selectParentNode
    });
    function createDocument(content, schema, parseOptions = {}) {
        return createNodeFromContent(content, schema, { slice: false, parseOptions });
    }
    const setContent = (content, emitUpdate = false, parseOptions = {}) => ({ tr, editor, dispatch }) => {
        const { doc } = tr;
        const document = createDocument(content, editor.schema, parseOptions);
        const selection = prosemirrorState.TextSelection.create(doc, 0, doc.content.size);
        if (dispatch) {
            tr.setSelection(selection)
                .replaceSelectionWith(document, false)
                .setMeta('preventUpdate', !emitUpdate);
        }
        return true;
    };
    var setContent$1 = Object.freeze({
      __proto__: null,
      setContent: setContent
    });
    function getMarkAttributes(state, typeOrName) {
        const type = getMarkType(typeOrName, state.schema);
        const { from, to, empty } = state.selection;
        const marks = [];
        if (empty) {
            if (state.storedMarks) {
                marks.push(...state.storedMarks);
            }
            marks.push(...state.selection.$head.marks());
        }
        else {
            state.doc.nodesBetween(from, to, node => {
                marks.push(...node.marks);
            });
        }
        const mark = marks.find(markItem => markItem.type.name === type.name);
        if (!mark) {
            return {};
        }
        return { ...mark.attrs };
    }
    const setMark = (typeOrName, attributes = {}) => ({ tr, state, dispatch }) => {
        const { selection } = tr;
        const { empty, ranges } = selection;
        const type = getMarkType(typeOrName, state.schema);
        if (dispatch) {
            if (empty) {
                const oldAttributes = getMarkAttributes(state, type);
                tr.addStoredMark(type.create({
                    ...oldAttributes,
                    ...attributes,
                }));
            }
            else {
                ranges.forEach(range => {
                    const from = range.$from.pos;
                    const to = range.$to.pos;
                    state.doc.nodesBetween(from, to, (node, pos) => {
                        const trimmedFrom = Math.max(pos, from);
                        const trimmedTo = Math.min(pos + node.nodeSize, to);
                        const someHasMark = node.marks.find(mark => mark.type === type);
                        if (someHasMark) {
                            node.marks.forEach(mark => {
                                if (type === mark.type) {
                                    tr.addMark(trimmedFrom, trimmedTo, type.create({
                                        ...mark.attrs,
                                        ...attributes,
                                    }));
                                }
                            });
                        }
                        else {
                            tr.addMark(trimmedFrom, trimmedTo, type.create(attributes));
                        }
                    });
                });
            }
        }
        return true;
    };
    var setMark$1 = Object.freeze({
      __proto__: null,
      setMark: setMark
    });
    const setMeta = (key, value) => ({ tr }) => {
        tr.setMeta(key, value);
        return true;
    };
    var setMeta$1 = Object.freeze({
      __proto__: null,
      setMeta: setMeta
    });
    const setNode = (typeOrName, attributes = {}) => ({ state, dispatch, chain }) => {
        const type = getNodeType(typeOrName, state.schema);
        if (!type.isTextblock) {
            console.warn('[tiptap warn]: Currently "setNode()" only supports text block nodes.');
            return false;
        }
        return chain()
            .command(({ commands }) => {
            const canSetBlock = prosemirrorCommands.setBlockType(type, attributes)(state);
            if (canSetBlock) {
                return true;
            }
            return commands.clearNodes();
        })
            .command(({ state: updatedState }) => {
            return prosemirrorCommands.setBlockType(type, attributes)(updatedState, dispatch);
        })
            .run();
    };
    var setNode$1 = Object.freeze({
      __proto__: null,
      setNode: setNode
    });
    const setNodeSelection = position => ({ tr, dispatch }) => {
        if (dispatch) {
            const { doc } = tr;
            const minPos = prosemirrorState.Selection.atStart(doc).from;
            const maxPos = prosemirrorState.Selection.atEnd(doc).to;
            const resolvedPos = minMax(position, minPos, maxPos);
            const selection = prosemirrorState.NodeSelection.create(doc, resolvedPos);
            tr.setSelection(selection);
        }
        return true;
    };
    var setNodeSelection$1 = Object.freeze({
      __proto__: null,
      setNodeSelection: setNodeSelection
    });
    const setTextSelection = position => ({ tr, dispatch }) => {
        if (dispatch) {
            const { doc } = tr;
            const { from, to } = typeof position === 'number'
                ? { from: position, to: position }
                : position;
            const minPos = prosemirrorState.Selection.atStart(doc).from;
            const maxPos = prosemirrorState.Selection.atEnd(doc).to;
            const resolvedFrom = minMax(from, minPos, maxPos);
            const resolvedEnd = minMax(to, minPos, maxPos);
            const selection = prosemirrorState.TextSelection.create(doc, resolvedFrom, resolvedEnd);
            tr.setSelection(selection);
        }
        return true;
    };
    var setTextSelection$1 = Object.freeze({
      __proto__: null,
      setTextSelection: setTextSelection
    });
    const sinkListItem = typeOrName => ({ state, dispatch }) => {
        const type = getNodeType(typeOrName, state.schema);
        return prosemirrorSchemaList.sinkListItem(type)(state, dispatch);
    };
    var sinkListItem$1 = Object.freeze({
      __proto__: null,
      sinkListItem: sinkListItem
    });
    function getSplittedAttributes(extensionAttributes, typeName, attributes) {
        return Object.fromEntries(Object
            .entries(attributes)
            .filter(([name]) => {
            const extensionAttribute = extensionAttributes.find(item => {
                return item.type === typeName && item.name === name;
            });
            if (!extensionAttribute) {
                return false;
            }
            return extensionAttribute.attribute.keepOnSplit;
        }));
    }
    function defaultBlockAt$1(match) {
        for (let i = 0; i < match.edgeCount; i += 1) {
            const { type } = match.edge(i);
            if (type.isTextblock && !type.hasRequiredAttrs()) {
                return type;
            }
        }
        return null;
    }
    function ensureMarks(state, splittableMarks) {
        const marks = state.storedMarks
            || (state.selection.$to.parentOffset && state.selection.$from.marks());
        if (marks) {
            const filteredMarks = marks.filter(mark => splittableMarks === null || splittableMarks === void 0 ? void 0 : splittableMarks.includes(mark.type.name));
            state.tr.ensureMarks(filteredMarks);
        }
    }
    const splitBlock = ({ keepMarks = true } = {}) => ({ tr, state, dispatch, editor, }) => {
        const { selection, doc } = tr;
        const { $from, $to } = selection;
        const extensionAttributes = editor.extensionManager.attributes;
        const newAttributes = getSplittedAttributes(extensionAttributes, $from.node().type.name, $from.node().attrs);
        if (selection instanceof prosemirrorState.NodeSelection && selection.node.isBlock) {
            if (!$from.parentOffset || !prosemirrorTransform.canSplit(doc, $from.pos)) {
                return false;
            }
            if (dispatch) {
                if (keepMarks) {
                    ensureMarks(state, editor.extensionManager.splittableMarks);
                }
                tr.split($from.pos).scrollIntoView();
            }
            return true;
        }
        if (!$from.parent.isBlock) {
            return false;
        }
        if (dispatch) {
            const atEnd = $to.parentOffset === $to.parent.content.size;
            if (selection instanceof prosemirrorState.TextSelection) {
                tr.deleteSelection();
            }
            const deflt = $from.depth === 0
                ? undefined
                : defaultBlockAt$1($from.node(-1).contentMatchAt($from.indexAfter(-1)));
            let types = atEnd && deflt
                ? [{
                        type: deflt,
                        attrs: newAttributes,
                    }]
                : undefined;
            let can = prosemirrorTransform.canSplit(tr.doc, tr.mapping.map($from.pos), 1, types);
            if (!types
                && !can
                && prosemirrorTransform.canSplit(tr.doc, tr.mapping.map($from.pos), 1, deflt ? [{ type: deflt }] : undefined)) {
                can = true;
                types = deflt
                    ? [{
                            type: deflt,
                            attrs: newAttributes,
                        }]
                    : undefined;
            }
            if (can) {
                tr.split(tr.mapping.map($from.pos), 1, types);
                if (deflt
                    && !atEnd
                    && !$from.parentOffset
                    && $from.parent.type !== deflt) {
                    const first = tr.mapping.map($from.before());
                    const $first = tr.doc.resolve(first);
                    if ($from.node(-1).canReplaceWith($first.index(), $first.index() + 1, deflt)) {
                        tr.setNodeMarkup(tr.mapping.map($from.before()), deflt);
                    }
                }
            }
            if (keepMarks) {
                ensureMarks(state, editor.extensionManager.splittableMarks);
            }
            tr.scrollIntoView();
        }
        return true;
    };
    var splitBlock$1 = Object.freeze({
      __proto__: null,
      splitBlock: splitBlock
    });
    const splitListItem = typeOrName => ({ tr, state, dispatch, editor, }) => {
        var _a;
        const type = getNodeType(typeOrName, state.schema);
        const { $from, $to } = state.selection;
        const node = state.selection.node;
        if ((node && node.isBlock) || $from.depth < 2 || !$from.sameParent($to)) {
            return false;
        }
        const grandParent = $from.node(-1);
        if (grandParent.type !== type) {
            return false;
        }
        const extensionAttributes = editor.extensionManager.attributes;
        if ($from.parent.content.size === 0 && $from.node(-1).childCount === $from.indexAfter(-1)) {
            if ($from.depth === 2
                || $from.node(-3).type !== type
                || $from.index(-2) !== $from.node(-2).childCount - 1) {
                return false;
            }
            if (dispatch) {
                let wrap = prosemirrorModel.Fragment.empty;
                const depthBefore = $from.index(-1)
                    ? 1
                    : $from.index(-2)
                        ? 2
                        : 3;
                for (let d = $from.depth - depthBefore; d >= $from.depth - 3; d -= 1) {
                    wrap = prosemirrorModel.Fragment.from($from.node(d).copy(wrap));
                }
                const depthAfter = $from.indexAfter(-1) < $from.node(-2).childCount
                    ? 1
                    : $from.indexAfter(-2) < $from.node(-3).childCount
                        ? 2
                        : 3;
                const newNextTypeAttributes = getSplittedAttributes(extensionAttributes, $from.node().type.name, $from.node().attrs);
                const nextType = ((_a = type.contentMatch.defaultType) === null || _a === void 0 ? void 0 : _a.createAndFill(newNextTypeAttributes)) || undefined;
                wrap = wrap.append(prosemirrorModel.Fragment.from(type.createAndFill(null, nextType) || undefined));
                const start = $from.before($from.depth - (depthBefore - 1));
                tr.replace(start, $from.after(-depthAfter), new prosemirrorModel.Slice(wrap, 4 - depthBefore, 0));
                let sel = -1;
                tr.doc.nodesBetween(start, tr.doc.content.size, (n, pos) => {
                    if (sel > -1) {
                        return false;
                    }
                    if (n.isTextblock && n.content.size === 0) {
                        sel = pos + 1;
                    }
                });
                if (sel > -1) {
                    tr.setSelection(prosemirrorState.TextSelection.near(tr.doc.resolve(sel)));
                }
                tr.scrollIntoView();
            }
            return true;
        }
        const nextType = $to.pos === $from.end()
            ? grandParent.contentMatchAt(0).defaultType
            : null;
        const newTypeAttributes = getSplittedAttributes(extensionAttributes, grandParent.type.name, grandParent.attrs);
        const newNextTypeAttributes = getSplittedAttributes(extensionAttributes, $from.node().type.name, $from.node().attrs);
        tr.delete($from.pos, $to.pos);
        const types = nextType
            ? [{ type, attrs: newTypeAttributes }, { type: nextType, attrs: newNextTypeAttributes }]
            : [{ type, attrs: newTypeAttributes }];
        if (!prosemirrorTransform.canSplit(tr.doc, $from.pos, 2)) {
            return false;
        }
        if (dispatch) {
            tr.split($from.pos, 2, types).scrollIntoView();
        }
        return true;
    };
    var splitListItem$1 = Object.freeze({
      __proto__: null,
      splitListItem: splitListItem
    });
    function findParentNodeClosestToPos($pos, predicate) {
        for (let i = $pos.depth; i > 0; i -= 1) {
            const node = $pos.node(i);
            if (predicate(node)) {
                return {
                    pos: i > 0 ? $pos.before(i) : 0,
                    start: $pos.start(i),
                    depth: i,
                    node,
                };
            }
        }
    }
    function findParentNode(predicate) {
        return (selection) => findParentNodeClosestToPos(selection.$from, predicate);
    }
    function splitExtensions(extensions) {
        const baseExtensions = extensions.filter(extension => extension.type === 'extension');
        const nodeExtensions = extensions.filter(extension => extension.type === 'node');
        const markExtensions = extensions.filter(extension => extension.type === 'mark');
        return {
            baseExtensions,
            nodeExtensions,
            markExtensions,
        };
    }
    function isList(name, extensions) {
        const { nodeExtensions } = splitExtensions(extensions);
        const extension = nodeExtensions.find(item => item.name === name);
        if (!extension) {
            return false;
        }
        const context = {
            name: extension.name,
            options: extension.options,
            storage: extension.storage,
        };
        const group = callOrReturn(getExtensionField(extension, 'group', context));
        if (typeof group !== 'string') {
            return false;
        }
        return group.split(' ').includes('list');
    }
    const joinListBackwards = (tr, listType) => {
        const list = findParentNode(node => node.type === listType)(tr.selection);
        if (!list) {
            return true;
        }
        const before = tr.doc.resolve(Math.max(0, list.pos - 1)).before(list.depth);
        if (before === undefined) {
            return true;
        }
        const nodeBefore = tr.doc.nodeAt(before);
        const canJoinBackwards = list.node.type === (nodeBefore === null || nodeBefore === void 0 ? void 0 : nodeBefore.type)
            && prosemirrorTransform.canJoin(tr.doc, list.pos);
        if (!canJoinBackwards) {
            return true;
        }
        tr.join(list.pos);
        return true;
    };
    const joinListForwards = (tr, listType) => {
        const list = findParentNode(node => node.type === listType)(tr.selection);
        if (!list) {
            return true;
        }
        const after = tr.doc.resolve(list.start).after(list.depth);
        if (after === undefined) {
            return true;
        }
        const nodeAfter = tr.doc.nodeAt(after);
        const canJoinForwards = list.node.type === (nodeAfter === null || nodeAfter === void 0 ? void 0 : nodeAfter.type)
            && prosemirrorTransform.canJoin(tr.doc, after);
        if (!canJoinForwards) {
            return true;
        }
        tr.join(after);
        return true;
    };
    const toggleList = (listTypeOrName, itemTypeOrName) => ({ editor, tr, state, dispatch, chain, commands, can, }) => {
        const { extensions } = editor.extensionManager;
        const listType = getNodeType(listTypeOrName, state.schema);
        const itemType = getNodeType(itemTypeOrName, state.schema);
        const { selection } = state;
        const { $from, $to } = selection;
        const range = $from.blockRange($to);
        if (!range) {
            return false;
        }
        const parentList = findParentNode(node => isList(node.type.name, extensions))(selection);
        if (range.depth >= 1 && parentList && range.depth - parentList.depth <= 1) {
            if (parentList.node.type === listType) {
                return commands.liftListItem(itemType);
            }
            if (isList(parentList.node.type.name, extensions)
                && listType.validContent(parentList.node.content)
                && dispatch) {
                return chain()
                    .command(() => {
                    tr.setNodeMarkup(parentList.pos, listType);
                    return true;
                })
                    .command(() => joinListBackwards(tr, listType))
                    .command(() => joinListForwards(tr, listType))
                    .run();
            }
        }
        return chain()
            .command(() => {
            const canWrapInList = can().wrapInList(listType);
            if (canWrapInList) {
                return true;
            }
            return commands.clearNodes();
        })
            .wrapInList(listType)
            .command(() => joinListBackwards(tr, listType))
            .command(() => joinListForwards(tr, listType))
            .run();
    };
    var toggleList$1 = Object.freeze({
      __proto__: null,
      toggleList: toggleList
    });
    function isMarkActive(state, typeOrName, attributes = {}) {
        const { empty, ranges } = state.selection;
        const type = typeOrName
            ? getMarkType(typeOrName, state.schema)
            : null;
        if (empty) {
            return !!(state.storedMarks || state.selection.$from.marks())
                .filter(mark => {
                if (!type) {
                    return true;
                }
                return type.name === mark.type.name;
            })
                .find(mark => objectIncludes(mark.attrs, attributes, { strict: false }));
        }
        let selectionRange = 0;
        const markRanges = [];
        ranges.forEach(({ $from, $to }) => {
            const from = $from.pos;
            const to = $to.pos;
            state.doc.nodesBetween(from, to, (node, pos) => {
                if (!node.isText && !node.marks.length) {
                    return;
                }
                const relativeFrom = Math.max(from, pos);
                const relativeTo = Math.min(to, pos + node.nodeSize);
                const range = relativeTo - relativeFrom;
                selectionRange += range;
                markRanges.push(...node.marks.map(mark => ({
                    mark,
                    from: relativeFrom,
                    to: relativeTo,
                })));
            });
        });
        if (selectionRange === 0) {
            return false;
        }
        const matchedRange = markRanges
            .filter(markRange => {
            if (!type) {
                return true;
            }
            return type.name === markRange.mark.type.name;
        })
            .filter(markRange => objectIncludes(markRange.mark.attrs, attributes, { strict: false }))
            .reduce((sum, markRange) => sum + markRange.to - markRange.from, 0);
        const excludedRange = markRanges
            .filter(markRange => {
            if (!type) {
                return true;
            }
            return markRange.mark.type !== type
                && markRange.mark.type.excludes(type);
        })
            .reduce((sum, markRange) => sum + markRange.to - markRange.from, 0);
        const range = matchedRange > 0
            ? matchedRange + excludedRange
            : matchedRange;
        return range >= selectionRange;
    }
    const toggleMark = (typeOrName, attributes = {}, options = {}) => ({ state, commands }) => {
        const { extendEmptyMarkRange = false } = options;
        const type = getMarkType(typeOrName, state.schema);
        const isActive = isMarkActive(state, type, attributes);
        if (isActive) {
            return commands.unsetMark(type, { extendEmptyMarkRange });
        }
        return commands.setMark(type, attributes);
    };
    var toggleMark$1 = Object.freeze({
      __proto__: null,
      toggleMark: toggleMark
    });
    const toggleNode = (typeOrName, toggleTypeOrName, attributes = {}) => ({ state, commands }) => {
        const type = getNodeType(typeOrName, state.schema);
        const toggleType = getNodeType(toggleTypeOrName, state.schema);
        const isActive = isNodeActive(state, type, attributes);
        if (isActive) {
            return commands.setNode(toggleType);
        }
        return commands.setNode(type, attributes);
    };
    var toggleNode$1 = Object.freeze({
      __proto__: null,
      toggleNode: toggleNode
    });
    const toggleWrap = (typeOrName, attributes = {}) => ({ state, commands }) => {
        const type = getNodeType(typeOrName, state.schema);
        const isActive = isNodeActive(state, type, attributes);
        if (isActive) {
            return commands.lift(type);
        }
        return commands.wrapIn(type, attributes);
    };
    var toggleWrap$1 = Object.freeze({
      __proto__: null,
      toggleWrap: toggleWrap
    });
    const undoInputRule = () => ({ state, dispatch }) => {
        const plugins = state.plugins;
        for (let i = 0; i < plugins.length; i += 1) {
            const plugin = plugins[i];
            let undoable;
            if (plugin.spec.isInputRules && (undoable = plugin.getState(state))) {
                if (dispatch) {
                    const tr = state.tr;
                    const toUndo = undoable.transform;
                    for (let j = toUndo.steps.length - 1; j >= 0; j -= 1) {
                        tr.step(toUndo.steps[j].invert(toUndo.docs[j]));
                    }
                    if (undoable.text) {
                        const marks = tr.doc.resolve(undoable.from).marks();
                        tr.replaceWith(undoable.from, undoable.to, state.schema.text(undoable.text, marks));
                    }
                    else {
                        tr.delete(undoable.from, undoable.to);
                    }
                }
                return true;
            }
        }
        return false;
    };
    var undoInputRule$1 = Object.freeze({
      __proto__: null,
      undoInputRule: undoInputRule
    });
    const unsetAllMarks = () => ({ tr, dispatch }) => {
        const { selection } = tr;
        const { empty, ranges } = selection;
        if (empty) {
            return true;
        }
        if (dispatch) {
            ranges.forEach(range => {
                tr.removeMark(range.$from.pos, range.$to.pos);
            });
        }
        return true;
    };
    var unsetAllMarks$1 = Object.freeze({
      __proto__: null,
      unsetAllMarks: unsetAllMarks
    });
    const unsetMark = (typeOrName, options = {}) => ({ tr, state, dispatch }) => {
        var _a;
        const { extendEmptyMarkRange = false } = options;
        const { selection } = tr;
        const type = getMarkType(typeOrName, state.schema);
        const { $from, empty, ranges } = selection;
        if (!dispatch) {
            return true;
        }
        if (empty && extendEmptyMarkRange) {
            let { from, to } = selection;
            const attrs = (_a = $from.marks().find(mark => mark.type === type)) === null || _a === void 0 ? void 0 : _a.attrs;
            const range = getMarkRange($from, type, attrs);
            if (range) {
                from = range.from;
                to = range.to;
            }
            tr.removeMark(from, to, type);
        }
        else {
            ranges.forEach(range => {
                tr.removeMark(range.$from.pos, range.$to.pos, type);
            });
        }
        tr.removeStoredMark(type);
        return true;
    };
    var unsetMark$1 = Object.freeze({
      __proto__: null,
      unsetMark: unsetMark
    });
    const updateAttributes = (typeOrName, attributes = {}) => ({ tr, state, dispatch }) => {
        let nodeType = null;
        let markType = null;
        const schemaType = getSchemaTypeNameByName(typeof typeOrName === 'string'
            ? typeOrName
            : typeOrName.name, state.schema);
        if (!schemaType) {
            return false;
        }
        if (schemaType === 'node') {
            nodeType = getNodeType(typeOrName, state.schema);
        }
        if (schemaType === 'mark') {
            markType = getMarkType(typeOrName, state.schema);
        }
        if (dispatch) {
            tr.selection.ranges.forEach(range => {
                const from = range.$from.pos;
                const to = range.$to.pos;
                state.doc.nodesBetween(from, to, (node, pos) => {
                    if (nodeType && nodeType === node.type) {
                        tr.setNodeMarkup(pos, undefined, {
                            ...node.attrs,
                            ...attributes,
                        });
                    }
                    if (markType && node.marks.length) {
                        node.marks.forEach(mark => {
                            if (markType === mark.type) {
                                const trimmedFrom = Math.max(pos, from);
                                const trimmedTo = Math.min(pos + node.nodeSize, to);
                                tr.addMark(trimmedFrom, trimmedTo, markType.create({
                                    ...mark.attrs,
                                    ...attributes,
                                }));
                            }
                        });
                    }
                });
            });
        }
        return true;
    };
    var updateAttributes$1 = Object.freeze({
      __proto__: null,
      updateAttributes: updateAttributes
    });
    const wrapIn = (typeOrName, attributes = {}) => ({ state, dispatch }) => {
        const type = getNodeType(typeOrName, state.schema);
        return prosemirrorCommands.wrapIn(type, attributes)(state, dispatch);
    };
    var wrapIn$1 = Object.freeze({
      __proto__: null,
      wrapIn: wrapIn
    });
    const wrapInList = (typeOrName, attributes = {}) => ({ state, dispatch }) => {
        const type = getNodeType(typeOrName, state.schema);
        return prosemirrorSchemaList.wrapInList(type, attributes)(state, dispatch);
    };
    var wrapInList$1 = Object.freeze({
      __proto__: null,
      wrapInList: wrapInList
    });
    const Commands = Extension.create({
        name: 'commands',
        addCommands() {
            return {
                ...blur$1,
                ...clearContent$1,
                ...clearNodes$1,
                ...command$1,
                ...createParagraphNear$1,
                ...deleteNode$1,
                ...deleteRange$1,
                ...deleteSelection$1,
                ...enter$1,
                ...exitCode$1,
                ...extendMarkRange$1,
                ...first$1,
                ...focus$1,
                ...forEach$1,
                ...insertContent$1,
                ...insertContentAt$1,
                ...joinBackward$1,
                ...joinForward$1,
                ...keyboardShortcut$1,
                ...lift$1,
                ...liftEmptyBlock$1,
                ...liftListItem$1,
                ...newlineInCode$1,
                ...resetAttributes$1,
                ...scrollIntoView$1,
                ...selectAll$1,
                ...selectNodeBackward$1,
                ...selectNodeForward$1,
                ...selectParentNode$1,
                ...setContent$1,
                ...setMark$1,
                ...setMeta$1,
                ...setNode$1,
                ...setNodeSelection$1,
                ...setTextSelection$1,
                ...sinkListItem$1,
                ...splitBlock$1,
                ...splitListItem$1,
                ...toggleList$1,
                ...toggleMark$1,
                ...toggleNode$1,
                ...toggleWrap$1,
                ...undoInputRule$1,
                ...unsetAllMarks$1,
                ...unsetMark$1,
                ...updateAttributes$1,
                ...wrapIn$1,
                ...wrapInList$1,
            };
        },
    });
    const Editable = Extension.create({
        name: 'editable',
        addProseMirrorPlugins() {
            return [
                new prosemirrorState.Plugin({
                    key: new prosemirrorState.PluginKey('editable'),
                    props: {
                        editable: () => this.editor.options.editable,
                    },
                }),
            ];
        },
    });
    const FocusEvents = Extension.create({
        name: 'focusEvents',
        addProseMirrorPlugins() {
            const { editor } = this;
            return [
                new prosemirrorState.Plugin({
                    key: new prosemirrorState.PluginKey('focusEvents'),
                    props: {
                        handleDOMEvents: {
                            focus: (view, event) => {
                                editor.isFocused = true;
                                const transaction = editor.state.tr
                                    .setMeta('focus', { event })
                                    .setMeta('addToHistory', false);
                                view.dispatch(transaction);
                                return false;
                            },
                            blur: (view, event) => {
                                editor.isFocused = false;
                                const transaction = editor.state.tr
                                    .setMeta('blur', { event })
                                    .setMeta('addToHistory', false);
                                view.dispatch(transaction);
                                return false;
                            },
                        },
                    },
                }),
            ];
        },
    });
    function createChainableState(config) {
        const { state, transaction } = config;
        let { selection } = transaction;
        let { doc } = transaction;
        let { storedMarks } = transaction;
        return {
            ...state,
            schema: state.schema,
            plugins: state.plugins,
            apply: state.apply.bind(state),
            applyTransaction: state.applyTransaction.bind(state),
            reconfigure: state.reconfigure.bind(state),
            toJSON: state.toJSON.bind(state),
            get storedMarks() {
                return storedMarks;
            },
            get selection() {
                return selection;
            },
            get doc() {
                return doc;
            },
            get tr() {
                selection = transaction.selection;
                doc = transaction.doc;
                storedMarks = transaction.storedMarks;
                return transaction;
            },
        };
    }
    class CommandManager {
        constructor(props) {
            this.editor = props.editor;
            this.rawCommands = this.editor.extensionManager.commands;
            this.customState = props.state;
        }
        get hasCustomState() {
            return !!this.customState;
        }
        get state() {
            return this.customState || this.editor.state;
        }
        get commands() {
            const { rawCommands, editor, state } = this;
            const { view } = editor;
            const { tr } = state;
            const props = this.buildProps(tr);
            return Object.fromEntries(Object
                .entries(rawCommands)
                .map(([name, command]) => {
                const method = (...args) => {
                    const callback = command(...args)(props);
                    if (!tr.getMeta('preventDispatch') && !this.hasCustomState) {
                        view.dispatch(tr);
                    }
                    return callback;
                };
                return [name, method];
            }));
        }
        get chain() {
            return () => this.createChain();
        }
        get can() {
            return () => this.createCan();
        }
        createChain(startTr, shouldDispatch = true) {
            const { rawCommands, editor, state } = this;
            const { view } = editor;
            const callbacks = [];
            const hasStartTransaction = !!startTr;
            const tr = startTr || state.tr;
            const run = () => {
                if (!hasStartTransaction
                    && shouldDispatch
                    && !tr.getMeta('preventDispatch')
                    && !this.hasCustomState) {
                    view.dispatch(tr);
                }
                return callbacks.every(callback => callback === true);
            };
            const chain = {
                ...Object.fromEntries(Object.entries(rawCommands).map(([name, command]) => {
                    const chainedCommand = (...args) => {
                        const props = this.buildProps(tr, shouldDispatch);
                        const callback = command(...args)(props);
                        callbacks.push(callback);
                        return chain;
                    };
                    return [name, chainedCommand];
                })),
                run,
            };
            return chain;
        }
        createCan(startTr) {
            const { rawCommands, state } = this;
            const dispatch = undefined;
            const tr = startTr || state.tr;
            const props = this.buildProps(tr, dispatch);
            const formattedCommands = Object.fromEntries(Object
                .entries(rawCommands)
                .map(([name, command]) => {
                return [name, (...args) => command(...args)({ ...props, dispatch })];
            }));
            return {
                ...formattedCommands,
                chain: () => this.createChain(tr, dispatch),
            };
        }
        buildProps(tr, shouldDispatch = true) {
            const { rawCommands, editor, state } = this;
            const { view } = editor;
            if (state.storedMarks) {
                tr.setStoredMarks(state.storedMarks);
            }
            const props = {
                tr,
                editor,
                view,
                state: createChainableState({
                    state,
                    transaction: tr,
                }),
                dispatch: shouldDispatch
                    ? () => undefined
                    : undefined,
                chain: () => this.createChain(tr),
                can: () => this.createCan(tr),
                get commands() {
                    return Object.fromEntries(Object
                        .entries(rawCommands)
                        .map(([name, command]) => {
                        return [name, (...args) => command(...args)(props)];
                    }));
                },
            };
            return props;
        }
    }
    const Keymap = Extension.create({
        name: 'keymap',
        addKeyboardShortcuts() {
            const handleBackspace = () => this.editor.commands.first(({ commands }) => [
                () => commands.undoInputRule(),
                () => commands.command(({ tr }) => {
                    const { selection, doc } = tr;
                    const { empty, $anchor } = selection;
                    const { pos, parent } = $anchor;
                    const isAtStart = prosemirrorState.Selection.atStart(doc).from === pos;
                    if (!empty
                        || !isAtStart
                        || !parent.type.isTextblock
                        || parent.textContent.length) {
                        return false;
                    }
                    return commands.clearNodes();
                }),
                () => commands.deleteSelection(),
                () => commands.joinBackward(),
                () => commands.selectNodeBackward(),
            ]);
            const handleDelete = () => this.editor.commands.first(({ commands }) => [
                () => commands.deleteSelection(),
                () => commands.joinForward(),
                () => commands.selectNodeForward(),
            ]);
            return {
                Enter: () => this.editor.commands.first(({ commands }) => [
                    () => commands.newlineInCode(),
                    () => commands.createParagraphNear(),
                    () => commands.liftEmptyBlock(),
                    () => commands.splitBlock(),
                ]),
                'Mod-Enter': () => this.editor.commands.exitCode(),
                Backspace: handleBackspace,
                'Mod-Backspace': handleBackspace,
                'Shift-Backspace': handleBackspace,
                Delete: handleDelete,
                'Mod-Delete': handleDelete,
                'Mod-a': () => this.editor.commands.selectAll(),
            };
        },
        addProseMirrorPlugins() {
            return [
                new prosemirrorState.Plugin({
                    key: new prosemirrorState.PluginKey('clearDocument'),
                    appendTransaction: (transactions, oldState, newState) => {
                        const docChanges = transactions.some(transaction => transaction.docChanged)
                            && !oldState.doc.eq(newState.doc);
                        if (!docChanges) {
                            return;
                        }
                        const { empty, from, to } = oldState.selection;
                        const allFrom = prosemirrorState.Selection.atStart(oldState.doc).from;
                        const allEnd = prosemirrorState.Selection.atEnd(oldState.doc).to;
                        const allWasSelected = from === allFrom && to === allEnd;
                        const isEmpty = newState.doc.textBetween(0, newState.doc.content.size, ' ', ' ').length === 0;
                        if (empty || !allWasSelected || !isEmpty) {
                            return;
                        }
                        const tr = newState.tr;
                        const state = createChainableState({
                            state: newState,
                            transaction: tr,
                        });
                        const { commands } = new CommandManager({
                            editor: this.editor,
                            state,
                        });
                        commands.clearNodes();
                        if (!tr.steps.length) {
                            return;
                        }
                        return tr;
                    },
                }),
            ];
        },
    });
    const Tabindex = Extension.create({
        name: 'tabindex',
        addProseMirrorPlugins() {
            return [
                new prosemirrorState.Plugin({
                    key: new prosemirrorState.PluginKey('tabindex'),
                    props: {
                        attributes: {
                            tabindex: '0',
                        },
                    },
                }),
            ];
        },
    });
    var extensions = Object.freeze({
      __proto__: null,
      ClipboardTextSerializer: ClipboardTextSerializer,
      Commands: Commands,
      Editable: Editable,
      FocusEvents: FocusEvents,
      Keymap: Keymap,
      Tabindex: Tabindex
    });
    function getNodeAttributes(state, typeOrName) {
        const type = getNodeType(typeOrName, state.schema);
        const { from, to } = state.selection;
        const nodes = [];
        state.doc.nodesBetween(from, to, node => {
            nodes.push(node);
        });
        const node = nodes
            .reverse()
            .find(nodeItem => nodeItem.type.name === type.name);
        if (!node) {
            return {};
        }
        return { ...node.attrs };
    }
    function getAttributes(state, typeOrName) {
        const schemaType = getSchemaTypeNameByName(typeof typeOrName === 'string'
            ? typeOrName
            : typeOrName.name, state.schema);
        if (schemaType === 'node') {
            return getNodeAttributes(state, typeOrName);
        }
        if (schemaType === 'mark') {
            return getMarkAttributes(state, typeOrName);
        }
        return {};
    }
    function isActive(state, name, attributes = {}) {
        if (!name) {
            return isNodeActive(state, null, attributes) || isMarkActive(state, null, attributes);
        }
        const schemaType = getSchemaTypeNameByName(name, state.schema);
        if (schemaType === 'node') {
            return isNodeActive(state, name, attributes);
        }
        if (schemaType === 'mark') {
            return isMarkActive(state, name, attributes);
        }
        return false;
    }
    function getHTMLFromFragment(fragment, schema) {
        const documentFragment = prosemirrorModel.DOMSerializer
            .fromSchema(schema)
            .serializeFragment(fragment);
        const temporaryDocument = document.implementation.createHTMLDocument();
        const container = temporaryDocument.createElement('div');
        container.appendChild(documentFragment);
        return container.innerHTML;
    }
    function getText(node, options) {
        const range = {
            from: 0,
            to: node.content.size,
        };
        return getTextBetween(node, range, options);
    }
    function isNodeEmpty(node) {
        var _a;
        const defaultContent = (_a = node.type.createAndFill()) === null || _a === void 0 ? void 0 : _a.toJSON();
        const content = node.toJSON();
        return JSON.stringify(defaultContent) === JSON.stringify(content);
    }
    function createStyleTag(style) {
        const tipTapStyleTag = document.querySelector('style[data-tiptap-style]');
        if (tipTapStyleTag !== null) {
            return tipTapStyleTag;
        }
        const styleNode = document.createElement('style');
        styleNode.setAttribute('data-tiptap-style', '');
        styleNode.innerHTML = style;
        document.getElementsByTagName('head')[0].appendChild(styleNode);
        return styleNode;
    }
    class InputRule {
        constructor(config) {
            this.find = config.find;
            this.handler = config.handler;
        }
    }
    const inputRuleMatcherHandler = (text, find) => {
        if (isRegExp(find)) {
            return find.exec(text);
        }
        const inputRuleMatch = find(text);
        if (!inputRuleMatch) {
            return null;
        }
        const result = [];
        result.push(inputRuleMatch.text);
        result.index = inputRuleMatch.index;
        result.input = text;
        result.data = inputRuleMatch.data;
        if (inputRuleMatch.replaceWith) {
            if (!inputRuleMatch.text.includes(inputRuleMatch.replaceWith)) {
                console.warn('[tiptap warn]: "inputRuleMatch.replaceWith" must be part of "inputRuleMatch.text".');
            }
            result.push(inputRuleMatch.replaceWith);
        }
        return result;
    };
    function run$1(config) {
        var _a;
        const { editor, from, to, text, rules, plugin, } = config;
        const { view } = editor;
        if (view.composing) {
            return false;
        }
        const $from = view.state.doc.resolve(from);
        if (
        $from.parent.type.spec.code
            || !!((_a = ($from.nodeBefore || $from.nodeAfter)) === null || _a === void 0 ? void 0 : _a.marks.find(mark => mark.type.spec.code))) {
            return false;
        }
        let matched = false;
        const maxMatch = 500;
        const textBefore = $from.parent.textBetween(Math.max(0, $from.parentOffset - maxMatch), $from.parentOffset, undefined, ' ') + text;
        rules.forEach(rule => {
            if (matched) {
                return;
            }
            const match = inputRuleMatcherHandler(textBefore, rule.find);
            if (!match) {
                return;
            }
            const tr = view.state.tr;
            const state = createChainableState({
                state: view.state,
                transaction: tr,
            });
            const range = {
                from: from - (match[0].length - text.length),
                to,
            };
            const { commands, chain, can } = new CommandManager({
                editor,
                state,
            });
            const handler = rule.handler({
                state,
                range,
                match,
                commands,
                chain,
                can,
            });
            if (handler === null || !tr.steps.length) {
                return;
            }
            tr.setMeta(plugin, {
                transform: tr,
                from,
                to,
                text,
            });
            view.dispatch(tr);
            matched = true;
        });
        return matched;
    }
    function inputRulesPlugin(props) {
        const { editor, rules } = props;
        const plugin = new prosemirrorState.Plugin({
            state: {
                init() {
                    return null;
                },
                apply(tr, prev) {
                    const stored = tr.getMeta(this);
                    if (stored) {
                        return stored;
                    }
                    return tr.selectionSet || tr.docChanged
                        ? null
                        : prev;
                },
            },
            props: {
                handleTextInput(view, from, to, text) {
                    return run$1({
                        editor,
                        from,
                        to,
                        text,
                        rules,
                        plugin,
                    });
                },
                handleDOMEvents: {
                    compositionend: view => {
                        setTimeout(() => {
                            const { $cursor } = view.state.selection;
                            if ($cursor) {
                                run$1({
                                    editor,
                                    from: $cursor.pos,
                                    to: $cursor.pos,
                                    text: '',
                                    rules,
                                    plugin,
                                });
                            }
                        });
                        return false;
                    },
                },
                handleKeyDown(view, event) {
                    if (event.key !== 'Enter') {
                        return false;
                    }
                    const { $cursor } = view.state.selection;
                    if ($cursor) {
                        return run$1({
                            editor,
                            from: $cursor.pos,
                            to: $cursor.pos,
                            text: '\n',
                            rules,
                            plugin,
                        });
                    }
                    return false;
                },
            },
            isInputRules: true,
        });
        return plugin;
    }
    function isNumber(value) {
        return typeof value === 'number';
    }
    class PasteRule {
        constructor(config) {
            this.find = config.find;
            this.handler = config.handler;
        }
    }
    const pasteRuleMatcherHandler = (text, find) => {
        if (isRegExp(find)) {
            return [...text.matchAll(find)];
        }
        const matches = find(text);
        if (!matches) {
            return [];
        }
        return matches.map(pasteRuleMatch => {
            const result = [];
            result.push(pasteRuleMatch.text);
            result.index = pasteRuleMatch.index;
            result.input = text;
            result.data = pasteRuleMatch.data;
            if (pasteRuleMatch.replaceWith) {
                if (!pasteRuleMatch.text.includes(pasteRuleMatch.replaceWith)) {
                    console.warn('[tiptap warn]: "pasteRuleMatch.replaceWith" must be part of "pasteRuleMatch.text".');
                }
                result.push(pasteRuleMatch.replaceWith);
            }
            return result;
        });
    };
    function run(config) {
        const { editor, state, from, to, rule, } = config;
        const { commands, chain, can } = new CommandManager({
            editor,
            state,
        });
        const handlers = [];
        state.doc.nodesBetween(from, to, (node, pos) => {
            if (!node.isTextblock || node.type.spec.code) {
                return;
            }
            const resolvedFrom = Math.max(from, pos);
            const resolvedTo = Math.min(to, pos + node.content.size);
            const textToMatch = node.textBetween(resolvedFrom - pos, resolvedTo - pos, undefined, '\ufffc');
            const matches = pasteRuleMatcherHandler(textToMatch, rule.find);
            matches.forEach(match => {
                if (match.index === undefined) {
                    return;
                }
                const start = resolvedFrom + match.index + 1;
                const end = start + match[0].length;
                const range = {
                    from: state.tr.mapping.map(start),
                    to: state.tr.mapping.map(end),
                };
                const handler = rule.handler({
                    state,
                    range,
                    match,
                    commands,
                    chain,
                    can,
                });
                handlers.push(handler);
            });
        });
        const success = handlers.every(handler => handler !== null);
        return success;
    }
    function pasteRulesPlugin(props) {
        const { editor, rules } = props;
        let dragSourceElement = null;
        let isPastedFromProseMirror = false;
        let isDroppedFromProseMirror = false;
        const plugins = rules.map(rule => {
            return new prosemirrorState.Plugin({
                view(view) {
                    const handleDragstart = (event) => {
                        var _a;
                        dragSourceElement = ((_a = view.dom.parentElement) === null || _a === void 0 ? void 0 : _a.contains(event.target))
                            ? view.dom.parentElement
                            : null;
                    };
                    window.addEventListener('dragstart', handleDragstart);
                    return {
                        destroy() {
                            window.removeEventListener('dragstart', handleDragstart);
                        },
                    };
                },
                props: {
                    handleDOMEvents: {
                        drop: view => {
                            isDroppedFromProseMirror = dragSourceElement === view.dom.parentElement;
                            return false;
                        },
                        paste: (view, event) => {
                            var _a;
                            const html = (_a = event.clipboardData) === null || _a === void 0 ? void 0 : _a.getData('text/html');
                            isPastedFromProseMirror = !!(html === null || html === void 0 ? void 0 : html.includes('data-pm-slice'));
                            return false;
                        },
                    },
                },
                appendTransaction: (transactions, oldState, state) => {
                    const transaction = transactions[0];
                    const isPaste = transaction.getMeta('uiEvent') === 'paste' && !isPastedFromProseMirror;
                    const isDrop = transaction.getMeta('uiEvent') === 'drop' && !isDroppedFromProseMirror;
                    if (!isPaste && !isDrop) {
                        return;
                    }
                    const from = oldState.doc.content.findDiffStart(state.doc.content);
                    const to = oldState.doc.content.findDiffEnd(state.doc.content);
                    if (!isNumber(from) || !to || from === to.b) {
                        return;
                    }
                    const tr = state.tr;
                    const chainableState = createChainableState({
                        state,
                        transaction: tr,
                    });
                    const handler = run({
                        editor,
                        state: chainableState,
                        from: Math.max(from - 1, 0),
                        to: to.b,
                        rule,
                    });
                    if (!handler || !tr.steps.length) {
                        return;
                    }
                    return tr;
                },
            });
        });
        return plugins;
    }
    function getAttributesFromExtensions(extensions) {
        const extensionAttributes = [];
        const { nodeExtensions, markExtensions } = splitExtensions(extensions);
        const nodeAndMarkExtensions = [...nodeExtensions, ...markExtensions];
        const defaultAttribute = {
            default: null,
            rendered: true,
            renderHTML: null,
            parseHTML: null,
            keepOnSplit: true,
        };
        extensions.forEach(extension => {
            const context = {
                name: extension.name,
                options: extension.options,
                storage: extension.storage,
            };
            const addGlobalAttributes = getExtensionField(extension, 'addGlobalAttributes', context);
            if (!addGlobalAttributes) {
                return;
            }
            const globalAttributes = addGlobalAttributes();
            globalAttributes.forEach(globalAttribute => {
                globalAttribute.types.forEach(type => {
                    Object
                        .entries(globalAttribute.attributes)
                        .forEach(([name, attribute]) => {
                        extensionAttributes.push({
                            type,
                            name,
                            attribute: {
                                ...defaultAttribute,
                                ...attribute,
                            },
                        });
                    });
                });
            });
        });
        nodeAndMarkExtensions.forEach(extension => {
            const context = {
                name: extension.name,
                options: extension.options,
                storage: extension.storage,
            };
            const addAttributes = getExtensionField(extension, 'addAttributes', context);
            if (!addAttributes) {
                return;
            }
            const attributes = addAttributes();
            Object
                .entries(attributes)
                .forEach(([name, attribute]) => {
                extensionAttributes.push({
                    type: extension.name,
                    name,
                    attribute: {
                        ...defaultAttribute,
                        ...attribute,
                    },
                });
            });
        });
        return extensionAttributes;
    }
    function mergeAttributes(...objects) {
        return objects
            .filter(item => !!item)
            .reduce((items, item) => {
            const mergedAttributes = { ...items };
            Object.entries(item).forEach(([key, value]) => {
                const exists = mergedAttributes[key];
                if (!exists) {
                    mergedAttributes[key] = value;
                    return;
                }
                if (key === 'class') {
                    mergedAttributes[key] = [mergedAttributes[key], value].join(' ');
                }
                else if (key === 'style') {
                    mergedAttributes[key] = [mergedAttributes[key], value].join('; ');
                }
                else {
                    mergedAttributes[key] = value;
                }
            });
            return mergedAttributes;
        }, {});
    }
    function getRenderedAttributes(nodeOrMark, extensionAttributes) {
        return extensionAttributes
            .filter(item => item.attribute.rendered)
            .map(item => {
            if (!item.attribute.renderHTML) {
                return {
                    [item.name]: nodeOrMark.attrs[item.name],
                };
            }
            return item.attribute.renderHTML(nodeOrMark.attrs) || {};
        })
            .reduce((attributes, attribute) => mergeAttributes(attributes, attribute), {});
    }
    function isEmptyObject(value = {}) {
        return Object.keys(value).length === 0 && value.constructor === Object;
    }
    function fromString(value) {
        if (typeof value !== 'string') {
            return value;
        }
        if (value.match(/^[+-]?(?:\d*\.)?\d+$/)) {
            return Number(value);
        }
        if (value === 'true') {
            return true;
        }
        if (value === 'false') {
            return false;
        }
        return value;
    }
    function injectExtensionAttributesToParseRule(parseRule, extensionAttributes) {
        if (parseRule.style) {
            return parseRule;
        }
        return {
            ...parseRule,
            getAttrs: node => {
                const oldAttributes = parseRule.getAttrs
                    ? parseRule.getAttrs(node)
                    : parseRule.attrs;
                if (oldAttributes === false) {
                    return false;
                }
                const newAttributes = extensionAttributes
                    .filter(item => item.attribute.rendered)
                    .reduce((items, item) => {
                    const value = item.attribute.parseHTML
                        ? item.attribute.parseHTML(node)
                        : fromString(node.getAttribute(item.name));
                    if (isObject(value)) {
                        console.warn(`[tiptap warn]: BREAKING CHANGE: "parseHTML" for your attribute "${item.name}" returns an object but should return the value itself. If this is expected you can ignore this message. This warning will be removed in one of the next releases. Further information: https://github.com/ueberdosis/tiptap/issues/1863`);
                    }
                    if (value === null || value === undefined) {
                        return items;
                    }
                    return {
                        ...items,
                        [item.name]: value,
                    };
                }, {});
                return { ...oldAttributes, ...newAttributes };
            },
        };
    }
    function cleanUpSchemaItem(data) {
        return Object.fromEntries(Object.entries(data).filter(([key, value]) => {
            if (key === 'attrs' && isEmptyObject(value)) {
                return false;
            }
            return value !== null && value !== undefined;
        }));
    }
    function getSchemaByResolvedExtensions(extensions) {
        var _a;
        const allAttributes = getAttributesFromExtensions(extensions);
        const { nodeExtensions, markExtensions } = splitExtensions(extensions);
        const topNode = (_a = nodeExtensions.find(extension => getExtensionField(extension, 'topNode'))) === null || _a === void 0 ? void 0 : _a.name;
        const nodes = Object.fromEntries(nodeExtensions.map(extension => {
            const extensionAttributes = allAttributes.filter(attribute => attribute.type === extension.name);
            const context = {
                name: extension.name,
                options: extension.options,
                storage: extension.storage,
            };
            const extraNodeFields = extensions.reduce((fields, e) => {
                const extendNodeSchema = getExtensionField(e, 'extendNodeSchema', context);
                return {
                    ...fields,
                    ...(extendNodeSchema ? extendNodeSchema(extension) : {}),
                };
            }, {});
            const schema = cleanUpSchemaItem({
                ...extraNodeFields,
                content: callOrReturn(getExtensionField(extension, 'content', context)),
                marks: callOrReturn(getExtensionField(extension, 'marks', context)),
                group: callOrReturn(getExtensionField(extension, 'group', context)),
                inline: callOrReturn(getExtensionField(extension, 'inline', context)),
                atom: callOrReturn(getExtensionField(extension, 'atom', context)),
                selectable: callOrReturn(getExtensionField(extension, 'selectable', context)),
                draggable: callOrReturn(getExtensionField(extension, 'draggable', context)),
                code: callOrReturn(getExtensionField(extension, 'code', context)),
                defining: callOrReturn(getExtensionField(extension, 'defining', context)),
                isolating: callOrReturn(getExtensionField(extension, 'isolating', context)),
                attrs: Object.fromEntries(extensionAttributes.map(extensionAttribute => {
                    var _a;
                    return [extensionAttribute.name, { default: (_a = extensionAttribute === null || extensionAttribute === void 0 ? void 0 : extensionAttribute.attribute) === null || _a === void 0 ? void 0 : _a.default }];
                })),
            });
            const parseHTML = callOrReturn(getExtensionField(extension, 'parseHTML', context));
            if (parseHTML) {
                schema.parseDOM = parseHTML
                    .map(parseRule => injectExtensionAttributesToParseRule(parseRule, extensionAttributes));
            }
            const renderHTML = getExtensionField(extension, 'renderHTML', context);
            if (renderHTML) {
                schema.toDOM = node => renderHTML({
                    node,
                    HTMLAttributes: getRenderedAttributes(node, extensionAttributes),
                });
            }
            const renderText = getExtensionField(extension, 'renderText', context);
            if (renderText) {
                schema.toText = renderText;
            }
            return [extension.name, schema];
        }));
        const marks = Object.fromEntries(markExtensions.map(extension => {
            const extensionAttributes = allAttributes.filter(attribute => attribute.type === extension.name);
            const context = {
                name: extension.name,
                options: extension.options,
                storage: extension.storage,
            };
            const extraMarkFields = extensions.reduce((fields, e) => {
                const extendMarkSchema = getExtensionField(e, 'extendMarkSchema', context);
                return {
                    ...fields,
                    ...(extendMarkSchema ? extendMarkSchema(extension) : {}),
                };
            }, {});
            const schema = cleanUpSchemaItem({
                ...extraMarkFields,
                inclusive: callOrReturn(getExtensionField(extension, 'inclusive', context)),
                excludes: callOrReturn(getExtensionField(extension, 'excludes', context)),
                group: callOrReturn(getExtensionField(extension, 'group', context)),
                spanning: callOrReturn(getExtensionField(extension, 'spanning', context)),
                code: callOrReturn(getExtensionField(extension, 'code', context)),
                attrs: Object.fromEntries(extensionAttributes.map(extensionAttribute => {
                    var _a;
                    return [extensionAttribute.name, { default: (_a = extensionAttribute === null || extensionAttribute === void 0 ? void 0 : extensionAttribute.attribute) === null || _a === void 0 ? void 0 : _a.default }];
                })),
            });
            const parseHTML = callOrReturn(getExtensionField(extension, 'parseHTML', context));
            if (parseHTML) {
                schema.parseDOM = parseHTML
                    .map(parseRule => injectExtensionAttributesToParseRule(parseRule, extensionAttributes));
            }
            const renderHTML = getExtensionField(extension, 'renderHTML', context);
            if (renderHTML) {
                schema.toDOM = mark => renderHTML({
                    mark,
                    HTMLAttributes: getRenderedAttributes(mark, extensionAttributes),
                });
            }
            return [extension.name, schema];
        }));
        return new prosemirrorModel.Schema({
            topNode,
            nodes,
            marks,
        });
    }
    function getSchemaTypeByName(name, schema) {
        return schema.nodes[name] || schema.marks[name] || null;
    }
    function isExtensionRulesEnabled(extension, enabled) {
        if (Array.isArray(enabled)) {
            return enabled.some(enabledExtension => {
                const name = typeof enabledExtension === 'string'
                    ? enabledExtension
                    : enabledExtension.name;
                return name === extension.name;
            });
        }
        return enabled;
    }
    function findDuplicates(items) {
        const filtered = items.filter((el, index) => items.indexOf(el) !== index);
        return [...new Set(filtered)];
    }
    class ExtensionManager {
        constructor(extensions, editor) {
            this.splittableMarks = [];
            this.editor = editor;
            this.extensions = ExtensionManager.resolve(extensions);
            this.schema = getSchemaByResolvedExtensions(this.extensions);
            this.extensions.forEach(extension => {
                var _a;
                this.editor.extensionStorage[extension.name] = extension.storage;
                const context = {
                    name: extension.name,
                    options: extension.options,
                    storage: extension.storage,
                    editor: this.editor,
                    type: getSchemaTypeByName(extension.name, this.schema),
                };
                if (extension.type === 'mark') {
                    const keepOnSplit = (_a = callOrReturn(getExtensionField(extension, 'keepOnSplit', context))) !== null && _a !== void 0 ? _a : true;
                    if (keepOnSplit) {
                        this.splittableMarks.push(extension.name);
                    }
                }
                const onBeforeCreate = getExtensionField(extension, 'onBeforeCreate', context);
                if (onBeforeCreate) {
                    this.editor.on('beforeCreate', onBeforeCreate);
                }
                const onCreate = getExtensionField(extension, 'onCreate', context);
                if (onCreate) {
                    this.editor.on('create', onCreate);
                }
                const onUpdate = getExtensionField(extension, 'onUpdate', context);
                if (onUpdate) {
                    this.editor.on('update', onUpdate);
                }
                const onSelectionUpdate = getExtensionField(extension, 'onSelectionUpdate', context);
                if (onSelectionUpdate) {
                    this.editor.on('selectionUpdate', onSelectionUpdate);
                }
                const onTransaction = getExtensionField(extension, 'onTransaction', context);
                if (onTransaction) {
                    this.editor.on('transaction', onTransaction);
                }
                const onFocus = getExtensionField(extension, 'onFocus', context);
                if (onFocus) {
                    this.editor.on('focus', onFocus);
                }
                const onBlur = getExtensionField(extension, 'onBlur', context);
                if (onBlur) {
                    this.editor.on('blur', onBlur);
                }
                const onDestroy = getExtensionField(extension, 'onDestroy', context);
                if (onDestroy) {
                    this.editor.on('destroy', onDestroy);
                }
            });
        }
        static resolve(extensions) {
            const resolvedExtensions = ExtensionManager.sort(ExtensionManager.flatten(extensions));
            const duplicatedNames = findDuplicates(resolvedExtensions.map(extension => extension.name));
            if (duplicatedNames.length) {
                console.warn(`[tiptap warn]: Duplicate extension names found: [${duplicatedNames.map(item => `'${item}'`).join(', ')}]. This can lead to issues.`);
            }
            return resolvedExtensions;
        }
        static flatten(extensions) {
            return extensions
                .map(extension => {
                const context = {
                    name: extension.name,
                    options: extension.options,
                    storage: extension.storage,
                };
                const addExtensions = getExtensionField(extension, 'addExtensions', context);
                if (addExtensions) {
                    return [
                        extension,
                        ...this.flatten(addExtensions()),
                    ];
                }
                return extension;
            })
                .flat(10);
        }
        static sort(extensions) {
            const defaultPriority = 100;
            return extensions.sort((a, b) => {
                const priorityA = getExtensionField(a, 'priority') || defaultPriority;
                const priorityB = getExtensionField(b, 'priority') || defaultPriority;
                if (priorityA > priorityB) {
                    return -1;
                }
                if (priorityA < priorityB) {
                    return 1;
                }
                return 0;
            });
        }
        get commands() {
            return this.extensions.reduce((commands, extension) => {
                const context = {
                    name: extension.name,
                    options: extension.options,
                    storage: extension.storage,
                    editor: this.editor,
                    type: getSchemaTypeByName(extension.name, this.schema),
                };
                const addCommands = getExtensionField(extension, 'addCommands', context);
                if (!addCommands) {
                    return commands;
                }
                return {
                    ...commands,
                    ...addCommands(),
                };
            }, {});
        }
        get plugins() {
            const { editor } = this;
            const extensions = ExtensionManager.sort([...this.extensions].reverse());
            const inputRules = [];
            const pasteRules = [];
            const allPlugins = extensions
                .map(extension => {
                const context = {
                    name: extension.name,
                    options: extension.options,
                    storage: extension.storage,
                    editor,
                    type: getSchemaTypeByName(extension.name, this.schema),
                };
                const plugins = [];
                const addKeyboardShortcuts = getExtensionField(extension, 'addKeyboardShortcuts', context);
                if (addKeyboardShortcuts) {
                    const bindings = Object.fromEntries(Object
                        .entries(addKeyboardShortcuts())
                        .map(([shortcut, method]) => {
                        return [shortcut, () => method({ editor })];
                    }));
                    const keyMapPlugin = prosemirrorKeymap.keymap(bindings);
                    plugins.push(keyMapPlugin);
                }
                const addInputRules = getExtensionField(extension, 'addInputRules', context);
                if (isExtensionRulesEnabled(extension, editor.options.enableInputRules) && addInputRules) {
                    inputRules.push(...addInputRules());
                }
                const addPasteRules = getExtensionField(extension, 'addPasteRules', context);
                if (isExtensionRulesEnabled(extension, editor.options.enablePasteRules) && addPasteRules) {
                    pasteRules.push(...addPasteRules());
                }
                const addProseMirrorPlugins = getExtensionField(extension, 'addProseMirrorPlugins', context);
                if (addProseMirrorPlugins) {
                    const proseMirrorPlugins = addProseMirrorPlugins();
                    plugins.push(...proseMirrorPlugins);
                }
                return plugins;
            })
                .flat();
            return [
                inputRulesPlugin({
                    editor,
                    rules: inputRules,
                }),
                ...pasteRulesPlugin({
                    editor,
                    rules: pasteRules,
                }),
                ...allPlugins,
            ];
        }
        get attributes() {
            return getAttributesFromExtensions(this.extensions);
        }
        get nodeViews() {
            const { editor } = this;
            const { nodeExtensions } = splitExtensions(this.extensions);
            return Object.fromEntries(nodeExtensions
                .filter(extension => !!getExtensionField(extension, 'addNodeView'))
                .map(extension => {
                const extensionAttributes = this.attributes.filter(attribute => attribute.type === extension.name);
                const context = {
                    name: extension.name,
                    options: extension.options,
                    storage: extension.storage,
                    editor,
                    type: getNodeType(extension.name, this.schema),
                };
                const addNodeView = getExtensionField(extension, 'addNodeView', context);
                if (!addNodeView) {
                    return [];
                }
                const nodeview = (node, view, getPos, decorations) => {
                    const HTMLAttributes = getRenderedAttributes(node, extensionAttributes);
                    return addNodeView()({
                        editor,
                        node,
                        getPos,
                        decorations,
                        HTMLAttributes,
                        extension,
                    });
                };
                return [extension.name, nodeview];
            }));
        }
    }
    class EventEmitter {
        constructor() {
            this.callbacks = {};
        }
        on(event, fn) {
            if (!this.callbacks[event]) {
                this.callbacks[event] = [];
            }
            this.callbacks[event].push(fn);
            return this;
        }
        emit(event, ...args) {
            const callbacks = this.callbacks[event];
            if (callbacks) {
                callbacks.forEach(callback => callback.apply(this, args));
            }
            return this;
        }
        off(event, fn) {
            const callbacks = this.callbacks[event];
            if (callbacks) {
                if (fn) {
                    this.callbacks[event] = callbacks.filter(callback => callback !== fn);
                }
                else {
                    delete this.callbacks[event];
                }
            }
            return this;
        }
        removeAllListeners() {
            this.callbacks = {};
        }
    }
    const style = `.ProseMirror {
  position: relative;
}

.ProseMirror {
  word-wrap: break-word;
  white-space: pre-wrap;
  white-space: break-spaces;
  -webkit-font-variant-ligatures: none;
  font-variant-ligatures: none;
  font-feature-settings: "liga" 0; /* the above doesn't seem to work in Edge */
}

.ProseMirror [contenteditable="false"] {
  white-space: normal;
}

.ProseMirror [contenteditable="false"] [contenteditable="true"] {
  white-space: pre-wrap;
}

.ProseMirror pre {
  white-space: pre-wrap;
}

img.ProseMirror-separator {
  display: inline !important;
  border: none !important;
  margin: 0 !important;
  width: 1px !important;
  height: 1px !important;
}

.ProseMirror-gapcursor {
  display: none;
  pointer-events: none;
  position: absolute;
  margin: 0;
}

.ProseMirror-gapcursor:after {
  content: "";
  display: block;
  position: absolute;
  top: -2px;
  width: 20px;
  border-top: 1px solid black;
  animation: ProseMirror-cursor-blink 1.1s steps(2, start) infinite;
}

@keyframes ProseMirror-cursor-blink {
  to {
    visibility: hidden;
  }
}

.ProseMirror-hideselection *::selection {
  background: transparent;
}

.ProseMirror-hideselection *::-moz-selection {
  background: transparent;
}

.ProseMirror-hideselection * {
  caret-color: transparent;
}

.ProseMirror-focused .ProseMirror-gapcursor {
  display: block;
}

.tippy-box[data-animation=fade][data-state=hidden] {
  opacity: 0
}`;
    class Editor extends EventEmitter {
        constructor(options = {}) {
            super();
            this.isFocused = false;
            this.extensionStorage = {};
            this.options = {
                element: document.createElement('div'),
                content: '',
                injectCSS: true,
                extensions: [],
                autofocus: false,
                editable: true,
                editorProps: {},
                parseOptions: {},
                enableInputRules: true,
                enablePasteRules: true,
                enableCoreExtensions: true,
                onBeforeCreate: () => null,
                onCreate: () => null,
                onUpdate: () => null,
                onSelectionUpdate: () => null,
                onTransaction: () => null,
                onFocus: () => null,
                onBlur: () => null,
                onDestroy: () => null,
            };
            this.isCapturingTransaction = false;
            this.capturedTransaction = null;
            this.setOptions(options);
            this.createExtensionManager();
            this.createCommandManager();
            this.createSchema();
            this.on('beforeCreate', this.options.onBeforeCreate);
            this.emit('beforeCreate', { editor: this });
            this.createView();
            this.injectCSS();
            this.on('create', this.options.onCreate);
            this.on('update', this.options.onUpdate);
            this.on('selectionUpdate', this.options.onSelectionUpdate);
            this.on('transaction', this.options.onTransaction);
            this.on('focus', this.options.onFocus);
            this.on('blur', this.options.onBlur);
            this.on('destroy', this.options.onDestroy);
            window.setTimeout(() => {
                if (this.isDestroyed) {
                    return;
                }
                this.commands.focus(this.options.autofocus);
                this.emit('create', { editor: this });
            }, 0);
        }
        get storage() {
            return this.extensionStorage;
        }
        get commands() {
            return this.commandManager.commands;
        }
        chain() {
            return this.commandManager.chain();
        }
        can() {
            return this.commandManager.can();
        }
        injectCSS() {
            if (this.options.injectCSS && document) {
                this.css = createStyleTag(style);
            }
        }
        setOptions(options = {}) {
            this.options = {
                ...this.options,
                ...options,
            };
            if (!this.view || !this.state || this.isDestroyed) {
                return;
            }
            if (this.options.editorProps) {
                this.view.setProps(this.options.editorProps);
            }
            this.view.updateState(this.state);
        }
        setEditable(editable) {
            this.setOptions({ editable });
        }
        get isEditable() {
            return this.options.editable
                && this.view
                && this.view.editable;
        }
        get state() {
            return this.view.state;
        }
        registerPlugin(plugin, handlePlugins) {
            const plugins = isFunction(handlePlugins)
                ? handlePlugins(plugin, this.state.plugins)
                : [...this.state.plugins, plugin];
            const state = this.state.reconfigure({ plugins });
            this.view.updateState(state);
        }
        unregisterPlugin(nameOrPluginKey) {
            if (this.isDestroyed) {
                return;
            }
            const name = typeof nameOrPluginKey === 'string'
                ? `${nameOrPluginKey}$`
                : nameOrPluginKey.key;
            const state = this.state.reconfigure({
                plugins: this.state.plugins.filter(plugin => !plugin.key.startsWith(name)),
            });
            this.view.updateState(state);
        }
        createExtensionManager() {
            const coreExtensions = this.options.enableCoreExtensions
                ? Object.values(extensions)
                : [];
            const allExtensions = [...coreExtensions, ...this.options.extensions].filter(extension => {
                return ['extension', 'node', 'mark'].includes(extension === null || extension === void 0 ? void 0 : extension.type);
            });
            this.extensionManager = new ExtensionManager(allExtensions, this);
        }
        createCommandManager() {
            this.commandManager = new CommandManager({
                editor: this,
            });
        }
        createSchema() {
            this.schema = this.extensionManager.schema;
        }
        createView() {
            const doc = createDocument(this.options.content, this.schema, this.options.parseOptions);
            const selection = resolveFocusPosition(doc, this.options.autofocus);
            this.view = new prosemirrorView.EditorView(this.options.element, {
                ...this.options.editorProps,
                dispatchTransaction: this.dispatchTransaction.bind(this),
                state: prosemirrorState.EditorState.create({
                    doc,
                    selection,
                }),
            });
            const newState = this.state.reconfigure({
                plugins: this.extensionManager.plugins,
            });
            this.view.updateState(newState);
            this.createNodeViews();
            const dom = this.view.dom;
            dom.editor = this;
        }
        createNodeViews() {
            this.view.setProps({
                nodeViews: this.extensionManager.nodeViews,
            });
        }
        captureTransaction(fn) {
            this.isCapturingTransaction = true;
            fn();
            this.isCapturingTransaction = false;
            const tr = this.capturedTransaction;
            this.capturedTransaction = null;
            return tr;
        }
        dispatchTransaction(transaction) {
            if (this.isCapturingTransaction) {
                if (!this.capturedTransaction) {
                    this.capturedTransaction = transaction;
                    return;
                }
                transaction.steps.forEach(step => { var _a; return (_a = this.capturedTransaction) === null || _a === void 0 ? void 0 : _a.step(step); });
                return;
            }
            const state = this.state.apply(transaction);
            const selectionHasChanged = !this.state.selection.eq(state.selection);
            this.view.updateState(state);
            this.emit('transaction', {
                editor: this,
                transaction,
            });
            if (selectionHasChanged) {
                this.emit('selectionUpdate', {
                    editor: this,
                    transaction,
                });
            }
            const focus = transaction.getMeta('focus');
            const blur = transaction.getMeta('blur');
            if (focus) {
                this.emit('focus', {
                    editor: this,
                    event: focus.event,
                    transaction,
                });
            }
            if (blur) {
                this.emit('blur', {
                    editor: this,
                    event: blur.event,
                    transaction,
                });
            }
            if (!transaction.docChanged || transaction.getMeta('preventUpdate')) {
                return;
            }
            this.emit('update', {
                editor: this,
                transaction,
            });
        }
        getAttributes(nameOrType) {
            return getAttributes(this.state, nameOrType);
        }
        isActive(nameOrAttributes, attributesOrUndefined) {
            const name = typeof nameOrAttributes === 'string'
                ? nameOrAttributes
                : null;
            const attributes = typeof nameOrAttributes === 'string'
                ? attributesOrUndefined
                : nameOrAttributes;
            return isActive(this.state, name, attributes);
        }
        getJSON() {
            return this.state.doc.toJSON();
        }
        getHTML() {
            return getHTMLFromFragment(this.state.doc.content, this.schema);
        }
        getText(options) {
            const { blockSeparator = '\n\n', textSerializers = {}, } = options || {};
            return getText(this.state.doc, {
                blockSeparator,
                textSerializers: {
                    ...textSerializers,
                    ...getTextSeralizersFromSchema(this.schema),
                },
            });
        }
        get isEmpty() {
            return isNodeEmpty(this.state.doc);
        }
        getCharacterCount() {
            console.warn('[tiptap warn]: "editor.getCharacterCount()" is deprecated. Please use "editor.storage.characterCount.characters()" instead.');
            return this.state.doc.content.size - 2;
        }
        destroy() {
            this.emit('destroy');
            if (this.view) {
                this.view.destroy();
            }
            this.removeAllListeners();
        }
        get isDestroyed() {
            var _a;
            return !((_a = this.view) === null || _a === void 0 ? void 0 : _a.docView);
        }
    }
    class Node {
        constructor(config = {}) {
            this.type = 'node';
            this.name = 'node';
            this.parent = null;
            this.child = null;
            this.config = {
                name: this.name,
                defaultOptions: {},
            };
            this.config = {
                ...this.config,
                ...config,
            };
            this.name = this.config.name;
            if (config.defaultOptions) {
                console.warn(`[tiptap warn]: BREAKING CHANGE: "defaultOptions" is deprecated. Please use "addOptions" instead. Found in extension: "${this.name}".`);
            }
            this.options = this.config.defaultOptions;
            if (this.config.addOptions) {
                this.options = callOrReturn(getExtensionField(this, 'addOptions', {
                    name: this.name,
                }));
            }
            this.storage = callOrReturn(getExtensionField(this, 'addStorage', {
                name: this.name,
                options: this.options,
            })) || {};
        }
        static create(config = {}) {
            return new Node(config);
        }
        configure(options = {}) {
            const extension = this.extend();
            extension.options = mergeDeep(this.options, options);
            extension.storage = callOrReturn(getExtensionField(extension, 'addStorage', {
                name: extension.name,
                options: extension.options,
            }));
            return extension;
        }
        extend(extendedConfig = {}) {
            const extension = new Node(extendedConfig);
            extension.parent = this;
            this.child = extension;
            extension.name = extendedConfig.name
                ? extendedConfig.name
                : extension.parent.name;
            if (extendedConfig.defaultOptions) {
                console.warn(`[tiptap warn]: BREAKING CHANGE: "defaultOptions" is deprecated. Please use "addOptions" instead. Found in extension: "${extension.name}".`);
            }
            extension.options = callOrReturn(getExtensionField(extension, 'addOptions', {
                name: extension.name,
            }));
            extension.storage = callOrReturn(getExtensionField(extension, 'addStorage', {
                name: extension.name,
                options: extension.options,
            }));
            return extension;
        }
    }
    class Mark {
        constructor(config = {}) {
            this.type = 'mark';
            this.name = 'mark';
            this.parent = null;
            this.child = null;
            this.config = {
                name: this.name,
                defaultOptions: {},
            };
            this.config = {
                ...this.config,
                ...config,
            };
            this.name = this.config.name;
            if (config.defaultOptions) {
                console.warn(`[tiptap warn]: BREAKING CHANGE: "defaultOptions" is deprecated. Please use "addOptions" instead. Found in extension: "${this.name}".`);
            }
            this.options = this.config.defaultOptions;
            if (this.config.addOptions) {
                this.options = callOrReturn(getExtensionField(this, 'addOptions', {
                    name: this.name,
                }));
            }
            this.storage = callOrReturn(getExtensionField(this, 'addStorage', {
                name: this.name,
                options: this.options,
            })) || {};
        }
        static create(config = {}) {
            return new Mark(config);
        }
        configure(options = {}) {
            const extension = this.extend();
            extension.options = mergeDeep(this.options, options);
            extension.storage = callOrReturn(getExtensionField(extension, 'addStorage', {
                name: extension.name,
                options: extension.options,
            }));
            return extension;
        }
        extend(extendedConfig = {}) {
            const extension = new Mark(extendedConfig);
            extension.parent = this;
            this.child = extension;
            extension.name = extendedConfig.name
                ? extendedConfig.name
                : extension.parent.name;
            if (extendedConfig.defaultOptions) {
                console.warn(`[tiptap warn]: BREAKING CHANGE: "defaultOptions" is deprecated. Please use "addOptions" instead. Found in extension: "${extension.name}".`);
            }
            extension.options = callOrReturn(getExtensionField(extension, 'addOptions', {
                name: extension.name,
            }));
            extension.storage = callOrReturn(getExtensionField(extension, 'addStorage', {
                name: extension.name,
                options: extension.options,
            }));
            return extension;
        }
    }
    class NodeView {
        constructor(component, props, options) {
            this.isDragging = false;
            this.component = component;
            this.editor = props.editor;
            this.options = {
                stopEvent: null,
                ignoreMutation: null,
                ...options,
            };
            this.extension = props.extension;
            this.node = props.node;
            this.decorations = props.decorations;
            this.getPos = props.getPos;
            this.mount();
        }
        mount() {
            return;
        }
        get dom() {
            return null;
        }
        get contentDOM() {
            return null;
        }
        onDragStart(event) {
            var _a, _b, _c;
            const { view } = this.editor;
            const target = event.target;
            const dragHandle = target.nodeType === 3
                ? (_a = target.parentElement) === null || _a === void 0 ? void 0 : _a.closest('[data-drag-handle]')
                : target.closest('[data-drag-handle]');
            if (!this.dom
                || ((_b = this.contentDOM) === null || _b === void 0 ? void 0 : _b.contains(target))
                || !dragHandle) {
                return;
            }
            let x = 0;
            let y = 0;
            if (this.dom !== dragHandle) {
                const domBox = this.dom.getBoundingClientRect();
                const handleBox = dragHandle.getBoundingClientRect();
                x = handleBox.x - domBox.x + event.offsetX;
                y = handleBox.y - domBox.y + event.offsetY;
            }
            (_c = event.dataTransfer) === null || _c === void 0 ? void 0 : _c.setDragImage(this.dom, x, y);
            const selection = prosemirrorState.NodeSelection.create(view.state.doc, this.getPos());
            const transaction = view.state.tr.setSelection(selection);
            view.dispatch(transaction);
        }
        stopEvent(event) {
            var _a;
            if (!this.dom) {
                return false;
            }
            if (typeof this.options.stopEvent === 'function') {
                return this.options.stopEvent({ event });
            }
            const target = event.target;
            const isInElement = this.dom.contains(target) && !((_a = this.contentDOM) === null || _a === void 0 ? void 0 : _a.contains(target));
            if (!isInElement) {
                return false;
            }
            const isDropEvent = event.type === 'drop';
            const isInput = ['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA'].includes(target.tagName)
                || target.isContentEditable;
            if (isInput && !isDropEvent) {
                return true;
            }
            const { isEditable } = this.editor;
            const { isDragging } = this;
            const isDraggable = !!this.node.type.spec.draggable;
            const isSelectable = prosemirrorState.NodeSelection.isSelectable(this.node);
            const isCopyEvent = event.type === 'copy';
            const isPasteEvent = event.type === 'paste';
            const isCutEvent = event.type === 'cut';
            const isClickEvent = event.type === 'mousedown';
            const isDragEvent = event.type.startsWith('drag');
            if (!isDraggable && isSelectable && isDragEvent) {
                event.preventDefault();
            }
            if (isDraggable && isDragEvent && !isDragging) {
                event.preventDefault();
                return false;
            }
            if (isDraggable && isEditable && !isDragging && isClickEvent) {
                const dragHandle = target.closest('[data-drag-handle]');
                const isValidDragHandle = dragHandle
                    && (this.dom === dragHandle || (this.dom.contains(dragHandle)));
                if (isValidDragHandle) {
                    this.isDragging = true;
                    document.addEventListener('dragend', () => {
                        this.isDragging = false;
                    }, { once: true });
                    document.addEventListener('mouseup', () => {
                        this.isDragging = false;
                    }, { once: true });
                }
            }
            if (isDragging
                || isDropEvent
                || isCopyEvent
                || isPasteEvent
                || isCutEvent
                || (isClickEvent && isSelectable)) {
                return false;
            }
            return true;
        }
        ignoreMutation(mutation) {
            if (!this.dom || !this.contentDOM) {
                return true;
            }
            if (typeof this.options.ignoreMutation === 'function') {
                return this.options.ignoreMutation({ mutation });
            }
            if (this.node.isLeaf || this.node.isAtom) {
                return true;
            }
            if (mutation.type === 'selection') {
                return false;
            }
            if (this.dom.contains(mutation.target)
                && mutation.type === 'childList'
                && isiOS()
                && this.editor.isFocused) {
                const changedNodes = [
                    ...Array.from(mutation.addedNodes),
                    ...Array.from(mutation.removedNodes),
                ];
                if (changedNodes.every(node => node.isContentEditable)) {
                    return false;
                }
            }
            if (this.contentDOM === mutation.target && mutation.type === 'attributes') {
                return true;
            }
            if (this.contentDOM.contains(mutation.target)) {
                return false;
            }
            return true;
        }
        updateAttributes(attributes) {
            this.editor.commands.command(({ tr }) => {
                const pos = this.getPos();
                tr.setNodeMarkup(pos, undefined, {
                    ...this.node.attrs,
                    ...attributes,
                });
                return true;
            });
        }
        deleteNode() {
            const from = this.getPos();
            const to = from + this.node.nodeSize;
            this.editor.commands.deleteRange({ from, to });
        }
    }
    class Tracker {
        constructor(transaction) {
            this.transaction = transaction;
            this.currentStep = this.transaction.steps.length;
        }
        map(position) {
            let deleted = false;
            const mappedPosition = this.transaction.steps
                .slice(this.currentStep)
                .reduce((newPosition, step) => {
                const mapResult = step
                    .getMap()
                    .mapResult(newPosition);
                if (mapResult.deleted) {
                    deleted = true;
                }
                return mapResult.pos;
            }, position);
            return {
                position: mappedPosition,
                deleted,
            };
        }
    }
    function nodeInputRule(config) {
        return new InputRule({
            find: config.find,
            handler: ({ state, range, match }) => {
                const attributes = callOrReturn(config.getAttributes, undefined, match) || {};
                const { tr } = state;
                const start = range.from;
                let end = range.to;
                if (match[1]) {
                    const offset = match[0].lastIndexOf(match[1]);
                    let matchStart = start + offset;
                    if (matchStart > end) {
                        matchStart = end;
                    }
                    else {
                        end = matchStart + match[1].length;
                    }
                    const lastChar = match[0][match[0].length - 1];
                    tr.insertText(lastChar, start + match[0].length - 1);
                    tr.replaceWith(matchStart, end, config.type.create(attributes));
                }
                else if (match[0]) {
                    tr.replaceWith(start, end, config.type.create(attributes));
                }
            },
        });
    }
    function getMarksBetween(from, to, doc) {
        const marks = [];
        if (from === to) {
            doc
                .resolve(from)
                .marks()
                .forEach(mark => {
                const $pos = doc.resolve(from - 1);
                const range = getMarkRange($pos, mark.type);
                if (!range) {
                    return;
                }
                marks.push({
                    mark,
                    ...range,
                });
            });
        }
        else {
            doc.nodesBetween(from, to, (node, pos) => {
                marks.push(...node.marks.map(mark => ({
                    from: pos,
                    to: pos + node.nodeSize,
                    mark,
                })));
            });
        }
        return marks;
    }
    function markInputRule(config) {
        return new InputRule({
            find: config.find,
            handler: ({ state, range, match }) => {
                const attributes = callOrReturn(config.getAttributes, undefined, match);
                if (attributes === false || attributes === null) {
                    return null;
                }
                const { tr } = state;
                const captureGroup = match[match.length - 1];
                const fullMatch = match[0];
                let markEnd = range.to;
                if (captureGroup) {
                    const startSpaces = fullMatch.search(/\S/);
                    const textStart = range.from + fullMatch.indexOf(captureGroup);
                    const textEnd = textStart + captureGroup.length;
                    const excludedMarks = getMarksBetween(range.from, range.to, state.doc)
                        .filter(item => {
                        const excluded = item.mark.type.excluded;
                        return excluded.find(type => type === config.type && type !== item.mark.type);
                    })
                        .filter(item => item.to > textStart);
                    if (excludedMarks.length) {
                        return null;
                    }
                    if (textEnd < range.to) {
                        tr.delete(textEnd, range.to);
                    }
                    if (textStart > range.from) {
                        tr.delete(range.from + startSpaces, textStart);
                    }
                    markEnd = range.from + startSpaces + captureGroup.length;
                    tr.addMark(range.from + startSpaces, markEnd, config.type.create(attributes || {}));
                    tr.removeStoredMark(config.type);
                }
            },
        });
    }
    function textblockTypeInputRule(config) {
        return new InputRule({
            find: config.find,
            handler: ({ state, range, match }) => {
                const $start = state.doc.resolve(range.from);
                const attributes = callOrReturn(config.getAttributes, undefined, match) || {};
                if (!$start.node(-1).canReplaceWith($start.index(-1), $start.indexAfter(-1), config.type)) {
                    return null;
                }
                state.tr
                    .delete(range.from, range.to)
                    .setBlockType(range.from, range.from, config.type, attributes);
            },
        });
    }
    function textInputRule(config) {
        return new InputRule({
            find: config.find,
            handler: ({ state, range, match }) => {
                let insert = config.replace;
                let start = range.from;
                const end = range.to;
                if (match[1]) {
                    const offset = match[0].lastIndexOf(match[1]);
                    insert += match[0].slice(offset + match[1].length);
                    start += offset;
                    const cutOff = start - end;
                    if (cutOff > 0) {
                        insert = match[0].slice(offset - cutOff, offset) + insert;
                        start = end;
                    }
                }
                state.tr.insertText(insert, start, end);
            },
        });
    }
    function wrappingInputRule(config) {
        return new InputRule({
            find: config.find,
            handler: ({ state, range, match }) => {
                const attributes = callOrReturn(config.getAttributes, undefined, match) || {};
                const tr = state.tr.delete(range.from, range.to);
                const $start = tr.doc.resolve(range.from);
                const blockRange = $start.blockRange();
                const wrapping = blockRange && prosemirrorTransform.findWrapping(blockRange, config.type, attributes);
                if (!wrapping) {
                    return null;
                }
                tr.wrap(blockRange, wrapping);
                const before = tr.doc.resolve(range.from - 1).nodeBefore;
                if (before
                    && before.type === config.type
                    && prosemirrorTransform.canJoin(tr.doc, range.from - 1)
                    && (!config.joinPredicate || config.joinPredicate(match, before))) {
                    tr.join(range.from - 1);
                }
            },
        });
    }
    function markPasteRule(config) {
        return new PasteRule({
            find: config.find,
            handler: ({ state, range, match }) => {
                const attributes = callOrReturn(config.getAttributes, undefined, match);
                if (attributes === false || attributes === null) {
                    return null;
                }
                const { tr } = state;
                const captureGroup = match[match.length - 1];
                const fullMatch = match[0];
                let markEnd = range.to;
                if (captureGroup) {
                    const startSpaces = fullMatch.search(/\S/);
                    const textStart = range.from + fullMatch.indexOf(captureGroup);
                    const textEnd = textStart + captureGroup.length;
                    const excludedMarks = getMarksBetween(range.from, range.to, state.doc)
                        .filter(item => {
                        const excluded = item.mark.type.excluded;
                        return excluded.find(type => type === config.type && type !== item.mark.type);
                    })
                        .filter(item => item.to > textStart);
                    if (excludedMarks.length) {
                        return null;
                    }
                    if (textEnd < range.to) {
                        tr.delete(textEnd, range.to);
                    }
                    if (textStart > range.from) {
                        tr.delete(range.from + startSpaces, textStart);
                    }
                    markEnd = range.from + startSpaces + captureGroup.length;
                    tr.addMark(range.from + startSpaces, markEnd, config.type.create(attributes || {}));
                    tr.removeStoredMark(config.type);
                }
            },
        });
    }
    function textPasteRule(config) {
        return new PasteRule({
            find: config.find,
            handler: ({ state, range, match }) => {
                let insert = config.replace;
                let start = range.from;
                const end = range.to;
                if (match[1]) {
                    const offset = match[0].lastIndexOf(match[1]);
                    insert += match[0].slice(offset + match[1].length);
                    start += offset;
                    const cutOff = start - end;
                    if (cutOff > 0) {
                        insert = match[0].slice(offset - cutOff, offset) + insert;
                        start = end;
                    }
                }
                state.tr.insertText(insert, start, end);
            },
        });
    }
    function escapeForRegEx(string) {
        return string.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    }
    function combineTransactionSteps(oldDoc, transactions) {
        const transform = new prosemirrorTransform.Transform(oldDoc);
        transactions.forEach(transaction => {
            transaction.steps.forEach(step => {
                transform.step(step);
            });
        });
        return transform;
    }
    function defaultBlockAt(match) {
        for (let i = 0; i < match.edgeCount; i += 1) {
            const { type } = match.edge(i);
            if (type.isTextblock && !type.hasRequiredAttrs()) {
                return type;
            }
        }
        return null;
    }
    function findChildren(node, predicate) {
        const nodesWithPos = [];
        node.descendants((child, pos) => {
            if (predicate(child)) {
                nodesWithPos.push({
                    node: child,
                    pos,
                });
            }
        });
        return nodesWithPos;
    }
    function findChildrenInRange(node, range, predicate) {
        const nodesWithPos = [];
        node.nodesBetween(range.from, range.to, (child, pos) => {
            if (predicate(child)) {
                nodesWithPos.push({
                    node: child,
                    pos,
                });
            }
        });
        return nodesWithPos;
    }
    function getSchema(extensions) {
        const resolvedExtensions = ExtensionManager.resolve(extensions);
        return getSchemaByResolvedExtensions(resolvedExtensions);
    }
    function generateHTML(doc, extensions) {
        const schema = getSchema(extensions);
        const contentNode = prosemirrorModel.Node.fromJSON(schema, doc);
        return getHTMLFromFragment(contentNode.content, schema);
    }
    function generateJSON(html, extensions) {
        const schema = getSchema(extensions);
        const dom = elementFromString(html);
        return prosemirrorModel.DOMParser.fromSchema(schema)
            .parse(dom)
            .toJSON();
    }
    function generateText(doc, extensions, options) {
        const { blockSeparator = '\n\n', textSerializers = {}, } = options || {};
        const schema = getSchema(extensions);
        const contentNode = prosemirrorModel.Node.fromJSON(schema, doc);
        return getText(contentNode, {
            blockSeparator,
            textSerializers: {
                ...textSerializers,
                ...getTextSeralizersFromSchema(schema),
            },
        });
    }
    function removeDuplicates(array, by = JSON.stringify) {
        const seen = {};
        return array.filter(item => {
            const key = by(item);
            return Object.prototype.hasOwnProperty.call(seen, key)
                ? false
                : (seen[key] = true);
        });
    }
    function simplifyChangedRanges(changes) {
        const uniqueChanges = removeDuplicates(changes);
        return uniqueChanges.length === 1
            ? uniqueChanges
            : uniqueChanges.filter((change, index) => {
                const rest = uniqueChanges.filter((_, i) => i !== index);
                return !rest.some(otherChange => {
                    return change.oldRange.from >= otherChange.oldRange.from
                        && change.oldRange.to <= otherChange.oldRange.to
                        && change.newRange.from >= otherChange.newRange.from
                        && change.newRange.to <= otherChange.newRange.to;
                });
            });
    }
    function getChangedRanges(transform) {
        const { mapping, steps } = transform;
        const changes = [];
        mapping.maps.forEach((stepMap, index) => {
            const ranges = [];
            if (!stepMap.ranges.length) {
                const { from, to } = steps[index];
                if (from === undefined || to === undefined) {
                    return;
                }
                ranges.push({ from, to });
            }
            else {
                stepMap.forEach((from, to) => {
                    ranges.push({ from, to });
                });
            }
            ranges.forEach(({ from, to }) => {
                const newStart = mapping.slice(index).map(from, -1);
                const newEnd = mapping.slice(index).map(to);
                const oldStart = mapping.invert().map(newStart, -1);
                const oldEnd = mapping.invert().map(newEnd);
                changes.push({
                    oldRange: {
                        from: oldStart,
                        to: oldEnd,
                    },
                    newRange: {
                        from: newStart,
                        to: newEnd,
                    },
                });
            });
        });
        return simplifyChangedRanges(changes);
    }
    function getDebugJSON(node, startOffset = 0) {
        const isTopNode = node.type === node.type.schema.topNodeType;
        const increment = isTopNode ? 0 : 1;
        const from = startOffset;
        const to = from + node.nodeSize;
        const marks = node.marks.map(mark => {
            const output = {
                type: mark.type.name,
            };
            if (Object.keys(mark.attrs).length) {
                output.attrs = { ...mark.attrs };
            }
            return output;
        });
        const attrs = { ...node.attrs };
        const output = {
            type: node.type.name,
            from,
            to,
        };
        if (Object.keys(attrs).length) {
            output.attrs = attrs;
        }
        if (marks.length) {
            output.marks = marks;
        }
        if (node.content.childCount) {
            output.content = [];
            node.forEach((child, offset) => {
                var _a;
                (_a = output.content) === null || _a === void 0 ? void 0 : _a.push(getDebugJSON(child, startOffset + offset + increment));
            });
        }
        if (node.text) {
            output.text = node.text;
        }
        return output;
    }
    function isNodeSelection(value) {
        return isObject(value) && value instanceof prosemirrorState.NodeSelection;
    }
    function posToDOMRect(view, from, to) {
        const minPos = 0;
        const maxPos = view.state.doc.content.size;
        const resolvedFrom = minMax(from, minPos, maxPos);
        const resolvedEnd = minMax(to, minPos, maxPos);
        const start = view.coordsAtPos(resolvedFrom);
        const end = view.coordsAtPos(resolvedEnd, -1);
        const top = Math.min(start.top, end.top);
        const bottom = Math.max(start.bottom, end.bottom);
        const left = Math.min(start.left, end.left);
        const right = Math.max(start.right, end.right);
        const width = right - left;
        const height = bottom - top;
        const x = left;
        const y = top;
        const data = {
            top,
            bottom,
            left,
            right,
            width,
            height,
            x,
            y,
        };
        return {
            ...data,
            toJSON: () => data,
        };
    }
    exports.CommandManager = CommandManager;
    exports.Editor = Editor;
    exports.Extension = Extension;
    exports.InputRule = InputRule;
    exports.Mark = Mark;
    exports.Node = Node;
    exports.NodeView = NodeView;
    exports.PasteRule = PasteRule;
    exports.Tracker = Tracker;
    exports.callOrReturn = callOrReturn;
    exports.combineTransactionSteps = combineTransactionSteps;
    exports.defaultBlockAt = defaultBlockAt;
    exports.escapeForRegEx = escapeForRegEx;
    exports.extensions = extensions;
    exports.findChildren = findChildren;
    exports.findChildrenInRange = findChildrenInRange;
    exports.findParentNode = findParentNode;
    exports.findParentNodeClosestToPos = findParentNodeClosestToPos;
    exports.generateHTML = generateHTML;
    exports.generateJSON = generateJSON;
    exports.generateText = generateText;
    exports.getAttributes = getAttributes;
    exports.getChangedRanges = getChangedRanges;
    exports.getDebugJSON = getDebugJSON;
    exports.getExtensionField = getExtensionField;
    exports.getHTMLFromFragment = getHTMLFromFragment;
    exports.getMarkAttributes = getMarkAttributes;
    exports.getMarkRange = getMarkRange;
    exports.getMarkType = getMarkType;
    exports.getMarksBetween = getMarksBetween;
    exports.getNodeAttributes = getNodeAttributes;
    exports.getNodeType = getNodeType;
    exports.getSchema = getSchema;
    exports.getText = getText;
    exports.getTextBetween = getTextBetween;
    exports.inputRulesPlugin = inputRulesPlugin;
    exports.isActive = isActive;
    exports.isList = isList;
    exports.isMarkActive = isMarkActive;
    exports.isNodeActive = isNodeActive;
    exports.isNodeEmpty = isNodeEmpty;
    exports.isNodeSelection = isNodeSelection;
    exports.isTextSelection = isTextSelection;
    exports.markInputRule = markInputRule;
    exports.markPasteRule = markPasteRule;
    exports.mergeAttributes = mergeAttributes;
    exports.nodeInputRule = nodeInputRule;
    exports.pasteRulesPlugin = pasteRulesPlugin;
    exports.posToDOMRect = posToDOMRect;
    exports.textInputRule = textInputRule;
    exports.textPasteRule = textPasteRule;
    exports.textblockTypeInputRule = textblockTypeInputRule;
    exports.wrappingInputRule = wrappingInputRule;
    Object.defineProperty(exports, '__esModule', { value: true });
  }));

  $(function() {
      console.log('foobar');
  });


      window.tiptap = exports;


})();
//# sourceMappingURL=tiptap.js.map
