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
    part = factory(u'fieldset', name='yafowil.widget.tiptap')
    part['tiptap'] = factory(
        '#field:tiptap',
        value='<p>Hello World!</p>',
        props={
            'label': 'Default Widget'
        })
    return {
        'widget': part,
        'doc': DOC_DEFAULT_TIPTAP,
        'title': 'Tiptap'
    }


DOC_ACTIONS_TIPTAP = """
Tiptap widget actions
---------------------

Actions of the tiptap widget can be customized. Action buttons can be grouped
together by putting them in a list.

.. code-block:: python

    tiptap = factory(
        'tiptap',
        value='<p>This widget has customized actions.</p>',
        props={
            'label': 'Tiptap Widget with customized actions',
            'actions': [
                ['heading', 'color'],
                ['bold', 'italic', 'underline'],
                ['bulletList', 'orderedList', 'indent', 'outdent'],
                ['html'],
                ['image', 'link'],
                ['code', 'codeBlock']
            ]
        })
"""


def actions_example():
    part = factory(u'fieldset', name='yafowil.widget.tiptap')
    part['tiptap'] = factory(
        '#field:tiptap',
        value='<p>This widget has customized actions.</p>',
        props={
            'label': 'Tiptap Widget with customized actions',
            'actions': [
                ['heading', 'color'],
                ['bold', 'italic', 'underline'],
                ['bulletList', 'orderedList', 'indent', 'outdent'],
                ['html'],
                ['image', 'link'],
                ['code', 'codeBlock']
            ]
        })
    return {
        'widget': part,
        'doc': DOC_ACTIONS_TIPTAP,
        'title': 'Tiptap Widget with customized actions',
    }



DOC_COLORS_TIPTAP = """
Tiptap Widget colors
--------------------

To customize the color selection of the ``colors`` action, pass a list
of colors to widget properties.

Colors can only be supplied as rgb() values.

.. code-block:: python

    tiptap = factory(
        'tiptap',
        value=(
            '<p>'
              '<span style="color: rgb(66,209,245)">This widget</span> has '
              '<span style="color: rgb(161,66,245)">custom colors</span>.'
            '</p>'
        ),
        props={
            'label': 'Tiptap Widget with custom colors',
            'actions': ['color'],
            'colors': [
                {'name': 'Purple', 'color': 'rgb(161,66,245)'},
                {'name': 'Blue', 'color': 'rgb(66,111,245)'},
                {'name': 'Turqoise', 'color': 'rgb(66,209,245)'},
                {'name': 'Green', 'color': 'rgb(105,245,66)'},
                {'name': 'Yellow', 'color': 'rgb(245,236,66)'},
                {'name': 'Orange', 'color': 'rgb(245,167,66'},
                {'name': 'Red', 'color': 'rgb(245,66,66)'}
            ]
        })
"""


def colors_example():
    part = factory(u'fieldset', name='yafowil.widget.tiptap')
    part['tiptap'] = factory(
        'tiptap',
        value=(
            '<p>'
              '<span style="color: rgb(66,209,245)">This widget</span> has '
              '<span style="color: rgb(161,66,245)">custom colors</span>.'
            '</p>'
        ),
        props={
            'label': 'Tiptap Widget with custom colors',
            'actions': ['color'],
            'colors': [
                {'name': 'Purple', 'color': 'rgb(161,66,245)'},
                {'name': 'Blue', 'color': 'rgb(66,111,245)'},
                {'name': 'Turqoise', 'color': 'rgb(66,209,245)'},
                {'name': 'Green', 'color': 'rgb(105,245,66)'},
                {'name': 'Yellow', 'color': 'rgb(245,236,66)'},
                {'name': 'Orange', 'color': 'rgb(245,167,66'},
                {'name': 'Red', 'color': 'rgb(245,66,66)'}
            ]
        })
    return {
        'widget': part,
        'doc': DOC_COLORS_TIPTAP,
        'title': 'Tiptap Widget with custom colors',
    }


DOC_DISPLAY_TIPTAP = """
Display Mode
------------

In Display Mode, the widget is not editable and Actions will not be rendered.
The ``display_class`` widget property can be used to style the div containing the
widget value.

.. code-block:: python

    tiptap = factory(
        'tiptap',
        value=(
            '<p>'
              'This widget is in '
              '<strong style="color: rgb(66,209,245)">display mode</strong>, '
              'but it will still show <strong>custom formatting</strong>.'
              '<br />'
              'Its border was adding with the <strong>display_class</strong> property.'
            '</p>'
        ),
        props={
            'label': 'Tiptap Widget in display mode',
            'actions': ['color'],
            'colors': [
                {'name': 'Purple', 'color': 'rgb(161,66,245)'},
                {'name': 'Blue', 'color': 'rgb(66,111,245)'},
                {'name': 'Turqoise', 'color': 'rgb(66,209,245)'},
                {'name': 'Green', 'color': 'rgb(105,245,66)'},
                {'name': 'Yellow', 'color': 'rgb(245,236,66)'},
                {'name': 'Orange', 'color': 'rgb(245,167,66'},
                {'name': 'Red', 'color': 'rgb(245,66,66)'}
            ],
            'display_class': 'form-control border-2 border-info'
        },
        mode='display')
"""


def display_example():
    part = factory(u'fieldset', name='yafowil.widget.tiptap')
    part['tiptap'] = factory(
        'tiptap',
        value=(
            '<p>'
              'This widget is in '
              '<strong style="color: rgb(66,209,245)">display mode</strong>, '
              'but it will still show <strong>custom formatting</strong>.'
              '<br />'
              'Its border was adding with the <strong>display_class</strong> property.'
            '</p>'
        ),
        props={
            'label': 'Tiptap Widget in display mode',
            'actions': ['color'],
            'colors': [
                {'name': 'Purple', 'color': 'rgb(161,66,245)'},
                {'name': 'Blue', 'color': 'rgb(66,111,245)'},
                {'name': 'Turqoise', 'color': 'rgb(66,209,245)'},
                {'name': 'Green', 'color': 'rgb(105,245,66)'},
                {'name': 'Yellow', 'color': 'rgb(245,236,66)'},
                {'name': 'Orange', 'color': 'rgb(245,167,66'},
                {'name': 'Red', 'color': 'rgb(245,66,66)'}
            ],
            'display_class': 'form-control border-2 border-info'
        }, mode='display')
    return {
        'widget': part,
        'doc': DOC_DISPLAY_TIPTAP,
        'title': 'Tiptap Widget in display mode',
    }


def get_example():
    return [
        default_example(),
        actions_example(),
        colors_example(),
        display_example()
    ]
