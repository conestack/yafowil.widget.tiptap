from yafowil.compat import IS_PY2
from yafowil.tests import YafowilTestCase
import yafowil.loader  # noqa


if not IS_PY2:
    from importlib import reload


class TestTiptapWidget(YafowilTestCase):

    def setUp(self):
        super(TestTiptapWidget, self).setUp()
        from yafowil.widget.tiptap import widget
        reload(widget)

    def test_edit_renderer(self):
        pass

    def test_display_renderer(self):
        pass
