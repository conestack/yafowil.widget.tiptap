from node.utils import UNSET
from yafowil.base import factory
from yafowil.compat import IS_PY2
from yafowil.tests import YafowilTestCase
import unittest
import yafowil.loader  # noqa


if not IS_PY2:
    from importlib import reload


class TestTiptapWidget(YafowilTestCase):

    def setUp(self):
        super(TestTiptapWidget, self).setUp()
        from yafowil.widget.tiptap import widget
        reload(widget)

    def test_edit_renderer(self):
        widget = factory('tiptap', value='<p>Hello Tiptap</p>', name='tiptap')
        self.check_output((
            '<div class="tiptap-editor" '
                'data-tiptap-actions=\'['
                    '"heading", '
                    '["bold", "italic", "underline"], '
                    '"color", '
                    '["bulletList", "orderedList", "indent", "outdent"], '
                    '"html", '
                    '"image", '
                    '"link", '
                    '"code", '
                    '"codeBlock"'
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
        self.check_output((
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
        self.check_output((
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


if __name__ == '__main__':
    from yafowil.widget.tiptap import tests
    import sys

    suite = unittest.TestSuite()
    suite.addTest(unittest.findTestCases(tests))
    runner = unittest.TextTestRunner(failfast=True)
    result = runner.run(suite)
    sys.exit(not result.wasSuccessful())
