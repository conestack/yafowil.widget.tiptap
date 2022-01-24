from yafowil.base import factory
from yafowil.utils import entry_point
import os


resourcedir = os.path.join(os.path.dirname(__file__), 'resources')
js = [{
    'group': 'yafowil.widget.tiptap.dependencies',
    'resource': 'tiptap/tiptap.js',
    'order': 20,
}, {
    'group': 'yafowil.widget.tiptap.common',
    'resource': 'widget.js',
    'order': 21,
}]
default_css = [{
    'group': 'yafowil.widget.tiptap.common',
    'resource': 'widget.css',
    'order': 21,
}]


@entry_point(order=10)
def register():
    from yafowil.widget.tiptap import widget  # noqa
    factory.register_theme('default', 'yafowil.widget.tiptap',
                           resourcedir, js=js, css=default_css)
