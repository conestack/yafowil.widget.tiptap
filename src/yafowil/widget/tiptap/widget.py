# -*- coding: utf-8 -*-
from yafowil.base import factory
from yafowil.base import fetch_value
from yafowil.common import generic_extractor
from yafowil.common import generic_required_extractor
from yafowil.datatypes import generic_emptyvalue_extractor
from yafowil.textarea import textarea_renderer
from yafowil.utils import cssclasses
from yafowil.utils import data_attrs_helper
from yafowil.utils import managedprops


tiptap_options = [
    'actions',
    'colors',
    'helpLink'
]


@managedprops(*tiptap_options)
def tiptap_edit_renderer(widget, data):
    attrs = dict(
        class_=cssclasses(widget, data)
    )
    # XXX: extend data_attrs_helper to accept optional prefix
    custom_attrs = data_attrs_helper(widget, data, tiptap_options)
    for key in custom_attrs:
        name = key[:5] + 'tiptap-' + key[5:]
        attrs[name] = custom_attrs[key]
    return data.tag('div', textarea_renderer(widget, data), **attrs)


def tiptap_display_renderer(widget, data):
    value = fetch_value(widget, data)
    if not value:
        value = ''
    return data.tag('div', value, **{'class': 'display-tiptap'})


factory.register(
    'tiptap',
    extractors=[
        generic_extractor,
        generic_required_extractor,
        generic_emptyvalue_extractor
    ],
    edit_renderers=[
        tiptap_edit_renderer
    ],
    display_renderers=[
        tiptap_display_renderer
    ]
)

factory.doc['blueprint']['tiptap'] = """\
Add-on blueprint
`yafowil.widget.tiptap <http://github.com/conestack/yafowil.widget.tiptap/>`_ .
"""

factory.defaults['tiptap.class'] = 'tiptap-editor'
factory.doc['props']['tiptap.class'] = """\
CSS classes for tiptap widget wrapper DOM element.
"""

factory.defaults['tiptap.actions'] = [
    ['heading'],
    ['bold', 'italic', 'underline'],
    ['color'],
    ['bulletList', 'orderedList', 'indent', 'outdent'],
    ['html'],
    ['image'],
    ['link'],
    ['code'],
    ['codeBlock']
]
factory.doc['props']['tiptap.actions'] = """\
Specifies the order of elements and button groups.
Elements will be displayed in list order.
Group buttons together by putting them in a list.

Available actions:

- bold
- italic
- underline
- indent
- outdent
- bulletList
- orderedList
- code
- codeBlock
- heading
- color
- html
- image
- link
"""

factory.defaults['tiptap.colors'] = [
    {'name': 'Blue', 'color': 'rgb(53,39,245)'},
    {'name': 'Lime', 'color': 'rgb(204,255,0)'},
    {'name': 'Teal', 'color': 'rgb(42,202,234)'},
    {'name': 'Red', 'color': 'rgb(208,6,10)'}
]
factory.doc['props']['tiptap.colors'] = """\
Specify custom font colors for ``color`` action.

Colors are defined as list of dict in the following form::

    [{
        'name': 'Red',
        'color': 'rgb(208,6,10)'
    }]
"""

factory.defaults['tiptap.helpLink'] = None
factory.doc['props']['tiptap.helpLink'] = """\
Add a ``help`` button linked to tiptap shortcuts.

Values: [True|False|None].
"""
