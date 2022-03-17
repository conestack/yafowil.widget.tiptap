# -*- coding: utf-8 -*-
from yafowil.base import factory
from yafowil.base import fetch_value
from yafowil.common import generic_extractor
from yafowil.common import generic_required_extractor
from yafowil.tsf import TSF
from yafowil.utils import attr_value
from yafowil.utils import as_data_attrs
from yafowil.utils import cssclasses
from yafowil.utils import cssid
from yafowil.utils import data_attrs_helper
from yafowil.utils import managedprops


# _ = TSF('yafowil.widget.tiptap')

tiptap_options = [
    'heading',
    'colors',
    'bold',
    'italic',
    'underline',
    'bullet_list',
    'ordered_list',
    'indent',
    'outdent',
    'html',
    'image',
    'link',
    'code',
    'code_block',
    'help_link'
]

@managedprops(*tiptap_options)
def tiptap_extractor(widget, data):
    pass


def tiptap_edit_renderer(widget, data):
    attrs = dict(
        id=cssid(widget, 'input'),
        class_=cssclasses(widget, data)
    )

    custom_attrs = data_attrs_helper(widget, data, tiptap_options)

    for key in custom_attrs:
        name = key[:5] + 'tiptap-' + key[5:]
        attrs[name] = custom_attrs[key]

    attrs.update(as_data_attrs({}))

    return data.tag('div', **attrs)


def tiptap_display_renderer(widget, data):
    value = fetch_value(widget, data)
    if not value:
        value = ''
    return data.tag('div', value, **{'class': 'display-tiptap'})


factory.register(
    'tiptap',
    extractors=[
        generic_extractor,
        generic_required_extractor
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

# Additional Options

factory.defaults['tiptap.heading'] = None
factory.doc['props']['tiptap.heading'] = """\
Show heading button and enable heading actions.
Values: [True|{target:''}|None].
"""

factory.defaults['tiptap.colors'] = None
factory.doc['props']['tiptap.colors'] = """\
Show text color button and enable color change.
Values: [array|None].
Supply an array of color objects with the following format:
{'name': 'Red', 'color': 'rgb(208, 6, 10)'}
"""

factory.defaults['tiptap.bold'] = None
factory.doc['props']['tiptap.bold'] = """\
Show bold button and enable bold actions.
Values: [True|{target:''}|None].
"""

factory.defaults['tiptap.italic'] = None
factory.doc['props']['tiptap.italic'] = """\
Show italic button and enable italic actions.
Values: [True|{target:''}|None].
"""

factory.defaults['tiptap.underline'] = None
factory.doc['props']['tiptap.underline'] = """\
Show underline button and enable underline actions.
Values: [True|{target:''}|None].
"""

factory.defaults['tiptap.bullet_list'] = None
factory.doc['props']['tiptap.bullet_list'] = """\
Show bullet list button and enable bullet list actions.
Values: [True|{target:''}|None].
"""

factory.defaults['tiptap.ordered_list'] = None
factory.doc['props']['tiptap.ordered_list'] = """\
Show ordered list button and enable ordered list actions.
Values: [True|{target:''}|None].
"""

factory.defaults['tiptap.indent'] = None
factory.doc['props']['tiptap.indent'] = """\
Show indent button and enable indent actions.
Values: [True|{target:''}|None].
"""

factory.defaults['tiptap.outdent'] = None
factory.doc['props']['tiptap.outdent'] = """\
Show outdent button and enable outdent actions.
Values: [True|{target:''}|None].
"""

factory.defaults['tiptap.html'] = None
factory.doc['props']['tiptap.html'] = """\
Show html edit button and enable html edit actions.
Values: [True|{target:''}|None].
"""

factory.defaults['tiptap.image'] = None
factory.doc['props']['tiptap.image'] = """\
Show image button and enable image actions.
Values: [True|{target:''}|None].
"""

factory.defaults['tiptap.link'] = None
factory.doc['props']['tiptap.link'] = """\
Show link button and enable link actions.
Values: [True|{target:''}|None].
"""

factory.defaults['tiptap.code'] = None
factory.doc['props']['tiptap.code'] = """\
Show code button and enable code actions.
Values: [True|{target:''}|None].
"""

factory.defaults['tiptap.code_block'] = None
factory.doc['props']['tiptap.code_block'] = """\
Show code_block button and enable code_block actions.
Values: [True|{target:''}|None].
"""

factory.defaults['tiptap.help_link'] = None
factory.doc['props']['tiptap.help_link'] = """\
Show help button.
Values: [True|{target:''}|None].
"""
