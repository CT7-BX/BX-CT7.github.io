"""Firmware compatibility matrix is evidence-only; never infers console success."""
import json
import tempfile
import unittest
from pathlib import Path

from diagnostics import compatibility_matrix as matrix


class CompatibilityMatrixTests(unittest.TestCase):
    def test_checked_in_matrix_is_conservative_and_unique(self):
        data = matrix.validate(json.loads(matrix.SOURCE.read_text(encoding="utf-8")))
        versions = {r["firmware"]: r["host_profile"] for r in data["entries"]}
        self.assertEqual(versions["13.53"], "not_configured")
        self.assertEqual(versions["14.00"], "configured")
        self.assertEqual(versions["14.01"], "not_configured")
        self.assertEqual(versions["14.02"], "configured")
        self.assertEqual(versions["14.03"], "not_configured")
        self.assertFalse(data["physical_ps4_tested"])
        self.assertFalse(data["jailbreak_validated"])

    def test_publisher_requires_unique_marker_and_keeps_html_untouched(self):
        with tempfile.TemporaryDirectory() as folder:
            site = Path(folder)
            js = site / "includes/js/dev-diagnostics.js"
            js.parent.mkdir(parents=True)
            original = "var firmware = /* BX_SUPPORT_MATRIX */ null;\n"
            js.write_text(original, encoding="utf-8")
            page = site / "index.html"
            page.write_text("<html><body>Original host</body></html>", encoding="utf-8")
            data = matrix.publish(site)
            self.assertEqual(page.read_text(encoding="utf-8"), "<html><body>Original host</body></html>")
            self.assertIn('"firmware":"14.02"', js.read_text(encoding="utf-8"))
            self.assertNotIn(matrix.MARKER, js.read_text(encoding="utf-8"))
            self.assertEqual(json.loads((site/"compatibility-matrix.json").read_text())["entries"], data["entries"])

    def test_no_unsupported_evidence_or_ambiguous_firmware_versions(self):
        base = json.loads(matrix.SOURCE.read_text(encoding="utf-8"))
        for edit in [
            lambda d: d.update(physical_ps4_tested=True),
            lambda d: d.update(jailbreak_validated=True),
            lambda d: d["entries"][0].update(firmware="13.5"),
            lambda d: d["entries"][0].update(console_test="verified"),
            lambda d: d["entries"][0].update(automatic_checks="none"),
            lambda d: d["entries"].append(dict(d["entries"][0])),
        ]:
            broken = json.loads(json.dumps(base))
            edit(broken)
            with self.assertRaises(ValueError):
                matrix.validate(broken)

    def test_duplicate_or_missing_marker_rejected_before_writing(self):
        with tempfile.TemporaryDirectory() as folder:
            site = Path(folder)
            js = site/"includes/js/dev-diagnostics.js"
            js.parent.mkdir(parents=True)
            for contents in ["var marker = null;", matrix.MARKER+";"+matrix.MARKER]:
                js.write_text(contents, encoding="utf-8")
                with self.assertRaises(ValueError):
                    matrix.publish(site)
                self.assertFalse((site/"compatibility-matrix.json").exists())


    def test_expanded_compatibility_catalog_rejects_invented_goldhen_support(self):
        import copy
        original = matrix.validate(json.loads(matrix.SOURCE.read_text(encoding="utf-8")))
        data = copy.deepcopy(original)
        data["goldhen_options"] = [
            {"version": "GHv2.4b18.14",
             "binary": "includes/payloads/HEN/goldhen_v2.4b18.14.bin",
             "sha256": "a" * 64,
             "verification": "file_and_menu_only", "physical_ps4_tested": False}
        ]
        data["goldhen_option_count"] = 1
        data["firmware_option_count"] = 1
        for entry in data["entries"]:
            entry["ui_listed"] = entry["firmware"] == "14.02"
            entry["goldhen_options_checked"] = ["GHv2.4b18.14"] if entry["firmware"] == "14.02" else []
        matrix.validate(data)
        for edit in [
            lambda d: d["goldhen_options"][0].update(physical_ps4_tested=True),
            lambda d: d["goldhen_options"][0].update(binary="../untrusted.bin"),
            lambda d: d["goldhen_options"][0].update(sha256="short"),
            lambda d: d["entries"][0].update(goldhen_options_checked=["GHv2.4b18.99"]),
            lambda d: d.update(firmware_option_count=100),
            lambda d: next(x for x in d["entries"] if x["host_profile"] == "not_configured").update(goldhen_options_checked=["GHv2.4b18.14"]),
        ]:
            bad = copy.deepcopy(data)
            edit(bad)
            with self.assertRaises(ValueError):
                matrix.validate(bad)


    def test_offline_cache_evidence_rejects_missing_or_untrusted_paths(self):
        import copy
        data = json.loads(matrix.SOURCE.read_text(encoding="utf-8"))
        configured = next(entry for entry in data["entries"] if entry["host_profile"] == "configured")
        configured.update(
            cache_page="includes/caches/cache1400.html",
            offline_manifest="includes/caches/manifest/1400.manifest",
            offline_evidence="generated_files_only",
        )
        matrix.validate(data)
        for key, value in [
            ("cache_page", "../escape.html"),
            ("offline_manifest", "http://example.test/offline.manifest"),
            ("offline_evidence", "physical_success"),
        ]:
            bad = copy.deepcopy(data)
            next(x for x in bad["entries"] if x["host_profile"] == "configured")[key] = value
            with self.assertRaises(ValueError):
                matrix.validate(bad)
        unsupported = copy.deepcopy(data)
        next(x for x in unsupported["entries"] if x["host_profile"] == "not_configured").update(
            offline_evidence="generated_files_only", cache_page="includes/caches/cache1400.html",
            offline_manifest="includes/caches/manifest/1400.manifest")
        with self.assertRaises(ValueError):
            matrix.validate(unsupported)
