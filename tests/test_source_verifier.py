"""Regression checks for the repository/preview verifier; no payload execution."""
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from diagnostics import verify_site


class SourceVerifierTests(unittest.TestCase):
    def test_json_script_is_data_and_modules_keep_their_script_type(self):
        page = verify_site.PageInspector()
        page.feed('<script type="application/json">{"name":"menu"}</script>'
                  '<script type="application/ld+json">{"name":"host"}</script>'
                  '<script type="module">export const ok = true;</script>'
                  '<script>var safe = true;</script>')
        self.assertEqual(len(page.json_scripts), 2)
        self.assertEqual(len(page.scripts), 2)
        self.assertEqual(page.module_scripts, {0})
        self.assertEqual(json.loads(page.json_scripts[0]), {'name': 'menu'})

    def test_html_check_accepts_json_and_valid_module_syntax_without_running_it(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'page.html').write_text('<script type="application/json">{"ok":true}</script>'
                                           '<script type="module">export const value = 1;</script>')
            with patch.object(verify_site, 'SITE', root):
                verify_site.check_html('page.html')
                (root / 'page.html').write_text('<script type="application/json">{broken}</script>')
                with self.assertRaises(json.JSONDecodeError):
                    verify_site.check_html('page.html')

    def test_duplicate_ids_are_rejected_even_inside_previews(self):
        page = verify_site.PageInspector()
        with self.assertRaisesRegex(ValueError, 'duplicate id'):
            page.feed('<div id="same"></div><button id="same"></button>')

    def test_encoded_local_references_resolve_but_cannot_escape_the_site(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'asset name.css').write_text('body { color: white; }')
            (root / 'page.html').write_text('<link href="asset%20name.css">')
            with patch.object(verify_site, 'SITE', root):
                verify_site.check_html('page.html')
                (root / 'page.html').write_text('<link href="%2e%2e/outside.css">')
                with self.assertRaisesRegex(ValueError, 'escapes site'):
                    verify_site.check_html('page.html')
