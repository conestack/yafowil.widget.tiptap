# -*- coding: utf-8 -*-
from yafowil.base import factory


DOC_DEFAULT_TIPTAP = """
Default Tiptap widget
---------------------

.. code-block:: python

    tiptap = factory('tiptap', value="<p>Hello World!</p>", props={
        'label': 'Default Widget'
    })
"""


def default_example():
    part = factory(u'fieldset', name='yafowil.widget.tiptap.default')
    part['tiptap'] = factory(
        '#field:tiptap',
        value="<p>Hello World!</p>",
        props={
            'label': 'Default Widget'
        })
    return {
        'widget': part,
        'doc': DOC_DEFAULT_TIPTAP,
        'title': 'Tiptap'
    }


DOC_ORDER_TIPTAP = """
Ordered Tiptap widget
---------------------

Change the order of elements in the 'actions' option to order elements.

.. code-block:: python

    tiptap = factory('tiptap', value="<p>The buttons are ordered differently!</p>", props={
        'label': 'Ordered Tiptap Widget',
        'actions': [
            'color',
            ['bulletList', 'orderedList', 'indent', 'outdent'],
            'html',
            'code',
            'codeBlock',
            'link',
            'image',
            ['bold', 'italic', 'underline']
        ]
    })
"""


def order_example():
    part = factory(u'fieldset', name='yafowil.widget.tiptap.order')
    part['tiptap'] = factory(
        '#field:tiptap',
        value="<p>The buttons are ordered differently!</p>",
        props={
            'label': 'Ordered Tiptap Widget',
            'actions': [
                'color',
                ['bulletList', 'orderedList', 'indent', 'outdent'],
                'html',
                'code',
                'codeBlock',
                'link',
                'image',
                ['bold', 'italic', 'underline']
            ]
        })
    return {
        'widget': part,
        'doc': DOC_ORDER_TIPTAP,
        'title': 'Ordered Tiptap Widget',
    }


DOC_GROUPS_TIPTAP = """
Tiptap Widget with custom groups
--------------------------------

Grouped buttons lead to a more connected feel.
Buttons can be grouped together by putting them in a list.

.. code-block:: python

    tiptap = factory(
        'tiptap',
        value="<p>This widget has multiple button groups.</p>",
        props={
            'label': 'Tiptap Widget with custom groups',
            'actions': [
                ['heading', 'color'],
                ['bold', 'italic', 'underline'],
                ['bulletList', 'orderedList', 'indent', 'outdent'],
                'html',
                ['image', 'link'],
                ['code', 'codeBlock']
            ]
    })
"""


def groups_example():
    part = factory(u'fieldset', name='yafowil.widget.tiptap.groups')
    part['tiptap'] = factory(
        '#field:tiptap',
        value="<p>This widget has multiple button groups.</p>",
        props={
            'label': 'Tiptap Widget with custom groups',
            'actions': [
                ['heading', 'color'],
                ['bold', 'italic', 'underline'],
                ['bulletList', 'orderedList', 'indent', 'outdent'],
                'html',
                ['image', 'link'],
                ['code', 'codeBlock']
            ]
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

To allow font color change and add a button, provide 'color' in your
'actions' option.

Color items may only be supplied as rgb() values.

.. code-block:: python

    tiptap = factory(
        'tiptap',
        value='<p><span style="color: rgb(66, 209, 245)">This widget</span> has <span style="color: rgb(161, 66, 245)">custom colors</span>.</p>',
        props={
        'label': 'Tiptap Widget with custom colors',
        'actions': [
            ['bold', 'italic', 'underline'],
            'color',
            'html'
        ],
        'colors': [
            {'name': 'Purple', 'color': 'rgb(161, 66, 245)'},
            {'name': 'Blue', 'color': 'rgb(66, 111, 245)'},
            {'name': 'Turqoise', 'color': 'rgb(66, 209, 245)'},
            {'name': 'Green', 'color': 'rgb(105, 245, 66)'},
            {'name': 'Yellow', 'color': 'rgb(245, 236, 66)'},
            {'name': 'Orange', 'color': 'rgb(245, 167, 66'},
            {'name': 'Red', 'color': 'rgb(245, 66, 66)'}
        ]
    })
"""


def colors_example():
    part = factory(u'fieldset', name='yafowil.widget.tiptap.colors')
    part['tiptap'] = factory(
        '#field:tiptap',
        value='<p><span style="color: rgb(66, 209, 245)">This widget</span> has <span style="color: rgb(161, 66, 245)">custom colors</span>.</p>',
        props={
            'label': 'Tiptap Widget with custom colors',
            'actions': [
                ['bold', 'italic', 'underline'],
                'color',
                'html'
            ],
            'colors': [
                {'name': 'Purple', 'color': 'rgb(161, 66, 245)'},
                {'name': 'Blue', 'color': 'rgb(66, 111, 245)'},
                {'name': 'Turqoise', 'color': 'rgb(66, 209, 245)'},
                {'name': 'Green', 'color': 'rgb(105, 245, 66)'},
                {'name': 'Yellow', 'color': 'rgb(245, 236, 66)'},
                {'name': 'Orange', 'color': 'rgb(245, 167, 66'},
                {'name': 'Red', 'color': 'rgb(245, 66, 66)'}
            ]
        })
    return {
        'widget': part,
        'doc': DOC_COLORS_TIPTAP,
        'title': 'Tiptap Widget with custom colors',
    }



def get_example():
    return [
        default_example(),
        order_example(),
        groups_example(),
        colors_example()
    ]
