from yafowil.base import factory
from yafowil.utils import entry_point
import os
import webresource as wr


resources_dir = os.path.join(os.path.dirname(__file__), 'resources')


##############################################################################
# Tiptap
##############################################################################

# webresource ################################################################

tiptap_js = wr.ScriptResource(
    name='tiptap-js',
    directory=os.path.join(resources_dir, 'tiptap'),
    path='yafowil-tiptap/tiptap',
    resource='tiptap.js',
    compressed='tiptap.min.js'
)

##############################################################################
# Default
##############################################################################

# webresource ################################################################

resources = wr.ResourceGroup(
    name='yafowil.widget.tiptap',
    directory=resources_dir,
    path='yafowil-tiptap'
)
resources.add(tiptap_js)
resources.add(wr.ScriptResource(
    name='yafowil-tiptap-js',
    directory=os.path.join(resources_dir, 'default'),
    path='yafowil-tiptap/default',
    depends=['jquery-js', 'tiptap-js'],
    resource='widget.js',
    compressed='widget.min.js'
))
resources.add(wr.StyleResource(
    name='yafowil-tiptap-css',
    directory=os.path.join(resources_dir, 'default'),
    path='yafowil-tiptap/default',
    resource='widget.min.css'
))

# B/C resources ##############################################################

js = [{
    'group': 'yafowil.widget.tiptap.dependencies',
    'resource': 'tiptap/tiptap.js',
    'order': 21,
}, {
    'group': 'yafowil.widget.tiptap.common',
    'resource': 'default/widget.js',
    'order': 21,
}]
css = [{
    'group': 'yafowil.widget.tiptap.common',
    'resource': 'default/widget.min.css',
    'order': 21,
}]

##############################################################################
# Bootstrap 5
##############################################################################

# webresource ################################################################

bootstrap5_resources = wr.ResourceGroup(
    name='yafowil.widget.tiptap',
    directory=resources_dir,
    path='yafowil-tiptap'
)
bootstrap5_resources.add(tiptap_js)
bootstrap5_resources.add(wr.ScriptResource(
    name='yafowil-tiptap-js',
    directory=os.path.join(resources_dir, 'bootstrap5'),
    path='yafowil-tiptap/bootstrap5',
    depends=['jquery-js', 'tiptap-js'],
    resource='widget.js',
    compressed='widget.min.js'
))
bootstrap5_resources.add(wr.StyleResource(
    name='yafowil-tiptap-css',
    directory=os.path.join(resources_dir, 'bootstrap5'),
    path='yafowil-tiptap/bootstrap5',
    resource='widget.min.css'
))
# B/C resources ##############################################################

bootstrap5_js = [{
    'group': 'yafowil.widget.tiptap.dependencies',
    'resource': 'tiptap/tiptap.js',
    'order': 20,
}, {
    'group': 'yafowil.widget.tiptap.common',
    'resource': 'bootstrap5/widget.js',
    'order': 21,
}]
bootstrap5_css = [{
    'group': 'yafowil.widget.tiptap.common',
    'resource': 'bootstrap5/widget.min.css',
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

    # Bootstrap 5
    factory.register_theme(
        ['bootstrap5'],
        widget_name,
        resources_dir,
        js=bootstrap5_js,
        css=bootstrap5_css
    )

    factory.register_resources(
        ['bootstrap5'],
        widget_name,
        bootstrap5_resources
    )
