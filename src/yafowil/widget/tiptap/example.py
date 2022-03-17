# -*- coding: utf-8 -*-
from yafowil.base import factory


DOC_TIPTAP = """
Tiptap widget
-------------

.. code-block:: python

    tiptap = factory('tiptap', props={
        'label': 'Tiptap Widget',
        'heading': True,
        'colors': [
            {'name': 'Default', 'color': 'rgb(51, 51, 51)'},
            {'name': 'Blue', 'color': 'rgb(53 39 245)'},
            {'name': 'Lime', 'color': 'rgb(204, 255, 0)'},
            {'name': 'Teal', 'color': 'rgb(42, 202, 234)'},
            {'name': 'Red', 'color': 'rgb(208, 6, 10)'}
        ],
        'bold': { 'target': 'text_controls' },
        'italic': { 'target': 'text_controls' },
        'underline': { 'target': 'text_controls' },
        'bullet_list': { 'target': 'format_controls' },
        'ordered_list': { 'target': 'format_controls' },
        'indent': { 'target': 'format_controls' },
        'outdent': { 'target': 'format_controls' },
        'html':  True,
        'image': True,
        'link': True,
        'code': True,
        'code_block': True,
        'help_link': True
    })
"""


def tiptap_example():
    part = factory(u'fieldset', name='yafowil.widget.tiptap')
    part['tiptap'] = factory(
        '#field:tiptap',
        props={
            'label': 'Tiptap Widget',
            'heading': True,
            'colors': [
                {'name': 'Default', 'color': 'rgb(51, 51, 51)'},
                {'name': 'Blue', 'color': 'rgb(53 39 245)'},
                {'name': 'Lime', 'color': 'rgb(204, 255, 0)'},
                {'name': 'Teal', 'color': 'rgb(42, 202, 234)'},
                {'name': 'Red', 'color': 'rgb(208, 6, 10)'}
            ],
            'bold': { 'target': 'text_controls' },
            'italic': { 'target': 'text_controls' },
            'underline': { 'target': 'text_controls' },
            'bullet_list': { 'target': 'format_controls' },
            'ordered_list': { 'target': 'format_controls' },
            'indent': { 'target': 'format_controls' },
            'outdent': { 'target': 'format_controls' },
            'html':  True,
            'image': True,
            'link': True,
            'code': True,
            'code_block': True,
            'help_link': True
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
