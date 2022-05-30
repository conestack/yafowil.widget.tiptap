from yafowil.base import factory
from yafowil.utils import entry_point
import os
import webresource as wr


resources_dir = os.path.join(os.path.dirname(__file__), 'resources')


##############################################################################
# Default
##############################################################################

# webresource ################################################################

resources = wr.ResourceGroup(
    name='yafowil.widget.tiptap',
    directory=resources_dir,
    path='yafowil-tiptap'
)
resources.add(wr.ScriptResource(
    name='tiptap-js',
    resource='tiptap.js',
    compressed='tiptap.min.js'
))
resources.add(wr.ScriptResource(
    name='yafowil-tiptap-js',
    depends=['jquery-js', 'tiptap-js'],
    resource='widget.js',
    compressed='widget.min.js'
))
resources.add(wr.StyleResource(
    name='yafowil-tiptap-css',
    resource='widget.css'
))

# B/C resources ##############################################################

js = [{
    'group': 'yafowil.widget.tiptap.dependencies',
    'resource': 'tiptap.js',
    'order': 21,
}, {
    'group': 'yafowil.widget.tiptap.common',
    'resource': 'widget.js',
    'order': 21,
}]
css = [{
    'group': 'yafowil.widget.tiptap.common',
    'resource': 'widget.css',
    'order': 21,
}]


##############################################################################
# Registration
##############################################################################

@entry_point(order=10)
def register():
    from yafowil.widget.tiptap import widget  # noqa

    widget_name = 'yafowil.widget.tiptap'

    # Default
    factory.register_theme(
        'default',
        widget_name,
        resources_dir,
        js=js,
        css=css
    )
    factory.register_resources('default', widget_name, resources)
