from yafowil.base import factory
from yafowil.utils import entry_point
import os
import webresource as wr


resources_dir = os.path.join(os.path.dirname(__file__), 'resources')


##############################################################################
# Default
##############################################################################

# webresource ################################################################

scripts = wr.ResourceGroup(name='scripts')
scripts.add(wr.ScriptResource(
    name='tiptap-js',
    # actually it not depends on jquery, but yafowil-tiptap-js does
    # think about multiple depends values in webresource
    depends='jquery-js',
    directory=resources_dir,
    resource='tiptap.js',
    compressed='tiptap.min.js'
))
scripts.add(wr.ScriptResource(
    name='yafowil-tiptap-js',
    depends='tiptap-js',
    directory=resources_dir,
    resource='widget.js',
    compressed='widget.min.js'
))

styles = wr.ResourceGroup(name='styles')
styles.add(wr.StyleResource(
    name='yafowil-tiptap-css',
    directory=resources_dir,
    resource='widget.css'
))

resources = wr.ResourceGroup(name='tiptap-resources')
resources.add(scripts)
resources.add(styles)

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

    # Default
    factory.register_theme(
        'default', 'yafowil.widget.tiptap', resources_dir,
        js=js, css=css, resources=resources
    )
