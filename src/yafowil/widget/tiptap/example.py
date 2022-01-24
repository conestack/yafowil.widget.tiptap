# -*- coding: utf-8 -*-
from yafowil.base import factory


DOC_TIPTAP = """
Tiptap widget
-------------

.. code-block:: python

    tiptap = factory('tiptap', name='tiptapwidget')
"""


def tiptap_example():
    part = factory(u'fieldset', name='yafowil.widget.tiptap')
    part['tiptap'] = factory(
        '#field:tiptap',
        props={
            'label': 'tiptap Widget'
        })
    return {
        'widget': part,
        'doc': DOC_TIPTAP,
        'title': 'Tiptap',
    }


def get_example():
    return [
        tiptap_example(),
    ]
