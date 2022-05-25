from yafowil.base import factory
from yafowil.utils import entry_point
import os
import webresource as wr


resources_dir = os.path.join(os.path.dirname(__file__), 'resources')


##############################################################################
# Default
##############################################################################

# webresource ################################################################

scripts = wr.ResourceGroup(
    name='yafowil-tiptap-scripts',
    path='yafowil.widget.tiptap'
)
scripts.add(wr.ScriptResource(
    name='tiptap-js',
    directory=resources_dir,
    resource='tiptap.js',
    compressed='tiptap.min.js'
))
scripts.add(wr.ScriptResource(
    name='yafowil-tiptap-js',
    depends=['jquery-js', 'tiptap-js'],
    directory=resources_dir,
    resource='widget.js',
    compressed='widget.min.js'
))

styles = wr.ResourceGroup(
    name='yafowil-tiptap-styles',
    path='yafowil.widget.tiptap'
)
styles.add(wr.StyleResource(
    name='yafowil-tiptap-css',
    directory=resources_dir,
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

    # Default
    factory.register_theme(
        'default', 'yafowil.widget.tiptap', resources_dir,
        js=js, css=css
    )
    factory.register_scripts('default', 'yafowil.widget.tiptap', scripts)
    factory.register_styles('default', 'yafowil.widget.tiptap', styles)
