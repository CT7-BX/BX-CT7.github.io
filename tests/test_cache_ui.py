import unittest
from cache_ui import improve_cache_page


class CacheUiTests(unittest.TestCase):
    def fixture(self):
        return ('<html><head><meta content="initial-scale=1.0, maximum-scale=1"></head><body>'
                '<div class="progress-bar-wrap"></div>'
                '<div class="cache-subtitle" id="cacheStatus">Preparando...</div>'
                '<script>\n var fwVersion = getPs4FwVersion();\n originalCacheController();\n</script></body></html>')

    def test_replaces_only_cache_presentation_and_adds_accessible_recovery(self):
        result = improve_cache_page(self.fixture())
        self.assertIn('src="./includes/js/cache-status.js"', result)
        self.assertNotIn('originalCacheController()', result)
        self.assertIn('role="progressbar"', result)
        self.assertIn('Tentar novamente', result)
        self.assertIn('Voltar ao site', result)
        self.assertNotIn('maximum-scale=1', result)

    def test_changed_upstream_markup_aborts_instead_of_silently_shipping(self):
        with self.assertRaisesRegex(ValueError, 'controller markup changed'):
            improve_cache_page(self.fixture().replace('var fwVersion', 'var changed'))
        with self.assertRaisesRegex(ValueError, 'status markup changed'):
            improve_cache_page(self.fixture().replace('Preparando...', 'changed'))
