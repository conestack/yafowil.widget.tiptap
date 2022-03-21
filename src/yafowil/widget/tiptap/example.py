# -*- coding: utf-8 -*-
from yafowil.base import factory


DOC_DEFAULT_TIPTAP = """
Default Tiptap widget
---------------------

.. code-block:: python

    tiptap = factory('tiptap', value="<p>Hello World!</p>", props={
        'label': 'Tiptap Widget'
    })
"""


def default_example():
    part = factory(u'fieldset', name='yafowil.widget.tiptap')
    part['tiptap'] = factory(
        '#field:tiptap',
        value="<p>Hello World!</p>",
        props={
            'label': 'Default Widget'
        })
    return {
        'widget': part,
        'doc': DOC_DEFAULT_TIPTAP,
        'title': 'Tiptap',
    }


DOC_GROUPS_TIPTAP = """
Tiptap Widget with custom groups
--------------------------------

Grouped buttons lead to a more connected feel.
Group buttons by assigning {'target': 'your_name'} to the corresponding buttons.
Button groups receive their name as a css class.

.. code-block:: python

    tiptap = factory(
        'tiptap',
        value="<p>This widget has multiple button groups.</p>",
        props={
        'label': 'Tiptap Widget with custom groups',
        'heading': {'target': 'font_group'},
        'bold': {'target': 'font_group'},
        'italic': {'target': 'font_group'},
        'underline': {'target': 'font_group'},
        'bullet_list': {'target': 'formatting'},
        'ordered_list': {'target': 'formatting'},
        'indent': {'target': 'formatting'},
        'outdent': {'target': 'formatting'},
        'html': True,
        'image': {'target': 'add_content'},
        'link': {'target': 'add_content'},
        'code': {'target': 'code'},
        'code_block': {'target': 'code'},
        'help_link': True
    })
"""


def groups_example():
    part = factory(u'fieldset', name='yafowil.widget.tiptap')
    part['tiptap'] = factory(
        '#field:tiptap',
        value="<p>This widget has multiple button groups.</p>",
        props={
            'label': 'Tiptap Widget with custom groups',
            'heading': {'target': 'font_group'},
            'bold': {'target': 'font_group'},
            'italic': {'target': 'font_group'},
            'underline': {'target': 'font_group'},
            'bullet_list': {'target': 'formatting'},
            'ordered_list': {'target': 'formatting'},
            'indent': {'target': 'formatting'},
            'outdent': {'target': 'formatting'},
            'html': True,
            'image': {'target': 'add_content'},
            'link': {'target': 'add_content'},
            'code': {'target': 'code'},
            'code_block': {'target': 'code'},
            'help_link': True
        })
    return {
        'widget': part,
        'doc': DOC_GROUPS_TIPTAP,
        'title': 'Tiptap Widget with custom groups',
    }



DOC_COLORS_TIPTAP = """
Tiptap Widget with custom colors
--------------------------------

You can add your own text colors to the widget by adding a list of dict like 
items to the 'colors' option.

Color items may only be supplied as rgb() values.

.. code-block:: python

    tiptap = factory(
        'tiptap',
        value='<p><span style="color: rgb(66, 209, 245)">This widget</span> has <span style="color: rgb(161, 66, 245)">custom colors</span>.</p>',
        props={
        'label': 'Tiptap Widget with custom colors',
        'colors': [
            {'name': 'Purple', 'color': 'rgb(161, 66, 245)'},
            {'name': 'Blue', 'color': 'rgb(66, 111, 245)'},
            {'name': 'Turqoise', 'color': 'rgb(66, 209, 245)'},
            {'name': 'Green', 'color': 'rgb(105, 245, 66)'},
            {'name': 'Yellow', 'color': 'rgb(245, 236, 66)'},
            {'name': 'Orange', 'color': 'rgb(245, 167, 66'},
            {'name': 'Red', 'color': 'rgb(245, 66, 66)'}
        ],
        'bullet_list': False,
        'ordered_list': False,
        'indent': False,
        'outdent': False,
        'image': False,
        'link': False,
        'code': False,
        'code_block': False
    })
"""


def colors_example():
    part = factory(u'fieldset', name='yafowil.widget.tiptap')
    part['tiptap'] = factory(
        '#field:tiptap',
        value='<p><span style="color: rgb(66, 209, 245)">This widget</span> has <span style="color: rgb(161, 66, 245)">custom colors</span>.</p>',
        props={
            'label': 'Tiptap Widget with custom colors',
            'colors': [
                {'name': 'Purple', 'color': 'rgb(161, 66, 245)'},
                {'name': 'Blue', 'color': 'rgb(66, 111, 245)'},
                {'name': 'Turqoise', 'color': 'rgb(66, 209, 245)'},
                {'name': 'Green', 'color': 'rgb(105, 245, 66)'},
                {'name': 'Yellow', 'color': 'rgb(245, 236, 66)'},
                {'name': 'Orange', 'color': 'rgb(245, 167, 66'},
                {'name': 'Red', 'color': 'rgb(245, 66, 66)'}
            ],
            'bullet_list': False,
            'ordered_list': False,
            'indent': False,
            'outdent': False,
            'image': False,
            'link': False,
            'code': False,
            'code_block': False
        })
    return {
        'widget': part,
        'doc': DOC_COLORS_TIPTAP,
        'title': 'Tiptap Widget with custom colors',
    }



DOC_ORDER_TIPTAP = """
Tiptap Widget with custom groups
--------------------------------

Grouped buttons lead to a more connected feel.
Group buttons by assigning {'target': 'your_name'} to the corresponding buttons.
Button groups receive their name as a css class.

.. code-block:: python

    tiptap = factory(
        'tiptap',
        value="<p>This widget has multiple button groups.</p>",
        props={
        'label': 'Tiptap Widget with custom groups',
        'heading': {'target': 'font_group'},
        'bold': {'target': 'font_group'},
        'italic': {'target': 'font_group'},
        'underline': {'target': 'font_group'},
        'bullet_list': {'target': 'formatting'},
        'ordered_list': {'target': 'formatting'},
        'indent': {'target': 'formatting'},
        'outdent': {'target': 'formatting'},
        'html': True,
        'image': {'target': 'add_content'},
        'link': {'target': 'add_content'},
        'code': {'target': 'code'},
        'code_block': {'target': 'code'},
        'help_link': True
    })
"""


def order_example():
    part = factory(u'fieldset', name='yafowil.widget.tiptap')
    part['tiptap'] = factory(
        '#field:tiptap',
        value="<p>This widget has multiple button groups.</p>",
        props={
            'label': 'Tiptap Widget with custom groups',
            'heading': {'order': 2},
            'bold': {'order': 1},
            'italic': False,
            'underline': False,
            'bullet_list': False,
            'ordered_list': False,
            'indent': False,
            'outdent': False,
            'html': False,
            'image': False,
            'link': False,
            'code': False,
            'code_block': False,
            'help_link': False
        })
    return {
        'widget': part,
        'doc': DOC_GROUPS_TIPTAP,
        'title': 'Tiptap Widget with custom groups',
    }




def get_example():
    return [
        default_example(),
        groups_example(),
        colors_example(),
        order_example()
    ]
