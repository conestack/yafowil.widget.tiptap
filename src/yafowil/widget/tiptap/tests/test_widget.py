from node.utils import UNSET
from yafowil.base import factory
from yafowil.compat import IS_PY2
from yafowil.tests import YafowilTestCase
import unittest
import os


if not IS_PY2:
    from importlib import reload


def np(path):
    return path.replace('/', os.path.sep)


class TestTiptapWidget(YafowilTestCase):

    def setUp(self):
        super(TestTiptapWidget, self).setUp()
        from yafowil.widget import tiptap
        from yafowil.widget.tiptap import widget
        reload(widget)
        tiptap.register()

    def test_edit_renderer(self):
        widget = factory('tiptap', value='<p>Hello Tiptap</p>', name='tiptap')
        self.checkOutput((
            '<div class="tiptap-editor" '
                'data-tiptap-actions=\'['
                    '["heading"], '
                    '["bold", "italic", "underline"], '
                    '["color"], '
                    '["bulletList", "orderedList", "indent", "outdent"], '
                    '["html"], '
                    '["image"], '
                    '["link"], '
                    '["code"], '
                    '["codeBlock"]'
                ']\' '
                'data-tiptap-colors=\'['
                    '{"name": "Blue", "color": "rgb(53,39,245)"}, '
                    '{"name": "Lime", "color": "rgb(204,255,0)"}, '
                    '{"name": "Teal", "color": "rgb(42,202,234)"}, '
                    '{"name": "Red", "color": "rgb(208,6,10)"}'
                ']\'>'
                '<textarea class="tiptap-editor" id="input-tiptap" name="tiptap">'
                  '<p>Hello Tiptap</p>'
                '</textarea>'
            '</div>'),
            widget()
        )

        widget = factory('tiptap',
            name='tiptap',
            props={
                'actions': None,
                'colors': None,
                'helpLink': None
            })
        self.checkOutput((
            '<div class="tiptap-editor">'
              '<textarea class="tiptap-editor" id="input-tiptap" name="tiptap">'
              '</textarea>'
            '</div>'
        ), widget())

    def test_display_renderer(self):
        widget = factory('tiptap',
            name='tiptap',
            value='<p>Hello Tiptap</p>',
            mode='display'
        )
        self.checkOutput((
            '<div class="display-tiptap">'
              '<p>Hello Tiptap</p>'
            '</div>'
        ), widget())

    def test_extractor(self):
        widget = factory('tiptap', name='tiptap')

        data = widget.extract(request={})
        self.assertEqual(data.name, 'tiptap')
        self.assertEqual(data.value, UNSET)
        self.assertEqual(data.extracted, UNSET)

        data = widget.extract(request={'tiptap': ''})
        self.assertEqual(data.name, 'tiptap')
        self.assertEqual(data.value, UNSET)
        self.assertEqual(data.extracted, '')

        data = widget.extract(request={'tiptap': '<p>Updated Text</p>'})
        self.assertEqual(data.name, 'tiptap')
        self.assertEqual(data.value, UNSET)
        self.assertEqual(data.extracted, '<p>Updated Text</p>')

    def test_extractor_with_preset_value(self):
        widget = factory('tiptap',
            name='tiptap',
            value='<p>Hello Tiptap</p>'
        )

        data = widget.extract(request={})
        self.assertEqual(data.name, 'tiptap')
        self.assertEqual(data.value, '<p>Hello Tiptap</p>')
        self.assertEqual(data.extracted, UNSET)

        data = widget.extract(request={'tiptap': ''})
        self.assertEqual(data.name, 'tiptap')
        self.assertEqual(data.value, '<p>Hello Tiptap</p>')
        self.assertEqual(data.extracted, '')

        data = widget.extract(request={'tiptap': '<p>Updated Text</p>'})
        self.assertEqual(data.name, 'tiptap')
        self.assertEqual(data.value, '<p>Hello Tiptap</p>')
        self.assertEqual(data.extracted, '<p>Updated Text</p>')

    def test_extractor_with_emptyvalue(self):
        widget = factory(
            'tiptap',
            name='tiptap',
            props={
                'emptyvalue': UNSET
            })

        data = widget.extract(request={})
        self.assertEqual(data.name, 'tiptap')
        self.assertEqual(data.value, UNSET)
        self.assertEqual(data.extracted, UNSET)

        data = widget.extract(request={'tiptap': ''})
        self.assertEqual(data.name, 'tiptap')
        self.assertEqual(data.value, UNSET)
        self.assertEqual(data.extracted, UNSET)

        data = widget.extract(request={'tiptap': '<p>Updated Text</p>'})
        self.assertEqual(data.name, 'tiptap')
        self.assertEqual(data.value, UNSET)
        self.assertEqual(data.extracted, '<p>Updated Text</p>')

    def test_resources(self):
        factory.theme = 'default'
        resources = factory.get_resources('yafowil.widget.tiptap')
        self.assertTrue(resources.directory.endswith(np('/tiptap/resources')))
        self.assertEqual(resources.name, 'yafowil.widget.tiptap')
        self.assertEqual(resources.path, 'yafowil-tiptap')

        scripts = resources.scripts
        self.assertEqual(len(scripts), 2)

        self.assertTrue(scripts[0].directory.endswith(np('/tiptap/resources/tiptap')))
        self.assertEqual(scripts[0].path, 'yafowil-tiptap/tiptap')
        self.assertEqual(scripts[0].file_name, 'tiptap.min.js')
        self.assertTrue(os.path.exists(scripts[0].file_path))

        self.assertTrue(scripts[1].directory.endswith(np('/tiptap/resources/default')))
        self.assertEqual(scripts[1].path, 'yafowil-tiptap/default')
        self.assertEqual(scripts[1].file_name, 'widget.min.js')
        self.assertTrue(os.path.exists(scripts[1].file_path))

        styles = resources.styles
        self.assertEqual(len(styles), 1)

        self.assertTrue(styles[0].directory.endswith(np('/tiptap/resources/default')))
        self.assertEqual(styles[0].path, 'yafowil-tiptap/default')
        self.assertEqual(styles[0].file_name, 'widget.min.css')
        self.assertTrue(os.path.exists(styles[0].file_path))


if __name__ == '__main__':
    unittest.main()
