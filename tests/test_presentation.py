"""Presentation and offline revision regressions; no console execution."""
import tempfile
import unittest
from pathlib import Path

from presentation import improve_html, ensure_hen_cache, stamp_manifests
from diagnostics.generate_report import build_report
from diagnostics import verify_site


class PresentationTests(unittest.TestCase):
    def fixture(self):
        return ('<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1">'
                '<link id="main-stylesheet" href=""><link id="color-stylesheet" href="">'
                '<button id="pslogo" onclick="originalLaunch()"></button><button id="scrollDown"></button>'
                '<input id="ps4IpInput"><select id="ps4FwSelect"></select>'
                '<script src="original-kernel.js"></script>')

    def test_accessibility_preserves_original_handlers_and_scripts(self):
        result = improve_html(self.fixture())
        self.assertNotIn('maximum-scale', result)
        self.assertIn('aria-label="Iniciar host PS4"', result)
        self.assertIn('layouts/index.css', result)
        self.assertIn('colors/default.css', result)
        self.assertIn('onclick="originalLaunch()"', result)
        self.assertIn('<script src="original-kernel.js"></script>', result)

    def test_changed_upstream_markup_fails_before_publication(self):
        with self.assertRaisesRegex(ValueError, 'Control markup changed'):
            improve_html(self.fixture().replace('id="pslogo"', 'id="renamed"'))

    def test_cache_revision_is_repeatable_and_changes_with_asset_bytes(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            cache = root / 'includes/caches/manifest'
            cache.mkdir(parents=True)
            manifest = cache / 'test.manifest'
            manifest.write_text('CACHE MANIFEST\nCACHE:\n../../../index.html\n')
            asset = root / 'index.html'
            asset.write_text('first version')
            first = stamp_manifests(root)
            self.assertEqual(first, stamp_manifests(root))
            asset.write_text('second version')
            self.assertNotEqual(first, stamp_manifests(root))
            self.assertEqual(manifest.read_text().count('# BX-CT7 content:'), 1)

    def test_history_count_matches_capped_results(self):
        raw = [dict(id=i, status='completed', conclusion='success', created_at='2026-11-10T00:00:00Z')
               for i in range(45)]
        report = build_report(raw, '2026-11-10T01:00:00Z')
        self.assertEqual(report['record_count'], len(report['runs']))
        self.assertEqual(report['record_count'], 30)

    def test_cache_verifier_rejects_missing_resources_and_path_escape(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            cache = root / 'includes/caches/manifest'
            cache.mkdir(parents=True)
            manifest = cache / 'test.manifest'
            asset = root / 'index.html'
            asset.write_text('test')
            original_site = verify_site.SITE
            verify_site.SITE = root
            try:
                for entry, error in [('missing.css', 'Missing cache resource'),
                                     ('../../../../outside', 'Cache entry escapes site')]:
                    manifest.write_text('CACHE MANIFEST\nCACHE:\n' + entry + '\n')
                    for asset in ('includes/payloads/HEN/nexHEN-ps4.elf', 'includes/payloads/Bins/elfldr.bin',
                                  'includes/payloads/Bins/elfldr.elf'):
                        file = root / asset
                        file.parent.mkdir(parents=True, exist_ok=True)
                        file.write_bytes(b'unchanged fixture')
                    ensure_hen_cache(root)
                    stamp_manifests(root)
                    with self.assertRaisesRegex(ValueError, error):
                        verify_site.check_cache()
                manifest.write_text('CACHE MANIFEST\nCACHE:\n../../../index.html\nNETWORK:\n*\n')
                ensure_hen_cache(root)
                stamp_manifests(root)
                verify_site.check_cache()
            finally:
                verify_site.SITE = original_site

    def test_hen_cache_is_idempotent_and_preserves_payload_bytes(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            cache = root / 'includes/caches/manifest'
            cache.mkdir(parents=True)
            manifest = cache / '1302-1352.manifest'
            manifest.write_text('CACHE MANIFEST\nCACHE:\nNETWORK:\n*\n')
            for asset in ('includes/payloads/HEN/nexHEN-ps4.elf', 'includes/payloads/Bins/elfldr.bin',
                          'includes/payloads/Bins/elfldr.elf'):
                file = root / asset
                file.parent.mkdir(parents=True, exist_ok=True)
                file.write_bytes(b'original binary')
            ensure_hen_cache(root)
            first = manifest.read_bytes()
            ensure_hen_cache(root)
            self.assertEqual(first, manifest.read_bytes())
            self.assertEqual(first.count(b'nexHEN-ps4.elf'), 1)
            self.assertEqual((root / 'includes/payloads/HEN/nexHEN-ps4.elf').read_bytes(), b'original binary')
            (root / 'includes/payloads/Bins/elfldr.bin').unlink()
            with self.assertRaisesRegex(ValueError, 'Missing nexHEN dependency'):
                ensure_hen_cache(root)


if __name__ == '__main__':
    unittest.main()
