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
            props={
                'actions': None,
                'colors': None,
                'helpLink': None
            },
            mode='display'
        )
        self.check_output((
            '<div class="display-tiptap">'
            '</div>'
        ), widget())

    def test_extractor(self):
        pass


if __name__ == '__main__':
    from yafowil.widget.tiptap import tests
    import sys

    suite = unittest.TestSuite()
    suite.addTest(unittest.findTestCases(tests))
    runner = unittest.TextTestRunner(failfast=True)
    result = runner.run(suite)
    sys.exit(not result.wasSuccessful())
