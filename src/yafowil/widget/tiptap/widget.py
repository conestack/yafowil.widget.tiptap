# -*- coding: utf-8 -*-
from yafowil.base import factory
from yafowil.common import generic_required_extractor
from yafowil.tsf import TSF
from yafowil.utils import as_data_attrs
from yafowil.utils import cssclasses
from yafowil.utils import cssid
from yafowil.utils import managedprops


_ = TSF('yafowil.widget.tiptap')


@managedprops('emptyvalue')
def tiptap_extractor(widget, data):
    pass


def tiptap_edit_renderer(widget, data):
    attrs = dict(
        id=cssid(widget, 'input'),
        class_=cssclasses(widget, data)
    )
    attrs.update(as_data_attrs({}))
    return data.tag('div', **attrs)


def tiptap_display_renderer(widget, data):
    pass


factory.register(
    'tiptap',
    extractors=[
        tiptap_extractor,
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
