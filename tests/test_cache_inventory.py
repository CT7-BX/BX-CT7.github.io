"""Read-only offline inventory regressions; no console or payload execution."""
import json
import tempfile
import unittest
from pathlib import Path
from diagnostics.cache_inventory import inventory


class CacheInventoryTests(unittest.TestCase):
    def setup_site(self, root):
        root = Path(root)
        manifest = root/"includes/caches/manifest/1400.manifest"
        manifest.parent.mkdir(parents=True)
        (root/"test.txt").write_text("offline", encoding="utf-8")
        (root/"release.json").write_text(json.dumps({"revision":"a"*40}))
        manifest.write_text(
            "CACHE MANIFEST\n# revision\nCACHE:\n../../../test.txt\n../../../test.txt\nNETWORK:\n*\n",
            encoding="utf-8")
        return root, manifest

    def test_reports_only_verified_static_cache_paths(self):
        with tempfile.TemporaryDirectory() as dirname:
            root, _ = self.setup_site(dirname)
            report = inventory(root)
            self.assertFalse(report["physical_ps4_tested"])
            self.assertFalse(report["cache_recovery_performed"])
            self.assertEqual(report["manifests"][0]["entries"], 2)
            self.assertEqual(report["manifests"][0]["duplicate_entries"], 1)
            self.assertEqual(report["manifests"][0]["unique_entries"], 1)
            self.assertEqual(report["manifests"][0]["approx_unique_asset_bytes"], 7)
            self.assertEqual(report["manifests"][0]["missing_assets"], 0)

    def test_missing_resource_or_escaping_path_fails_closed(self):
        with tempfile.TemporaryDirectory() as dirname:
            root, manifest = self.setup_site(dirname)
            manifest.write_text("CACHE MANIFEST\nCACHE:\n../../../absent.txt\n")
            with self.assertRaisesRegex(ValueError, "Missing cache asset"):
                inventory(root)
            manifest.write_text("CACHE MANIFEST\nCACHE:\n../../../../outside.txt\n")
            with self.assertRaisesRegex(ValueError, "escapes build"):
                inventory(root)

    def test_missing_manifest_is_not_reported_as_success(self):
        with tempfile.TemporaryDirectory() as dirname:
            with self.assertRaisesRegex(ValueError, "No generated offline manifests"):
                inventory(Path(dirname))
