"""Prevent accidental appearance changes in BX-HEN's checked-in pages and themes.

Every original HTML/CSS file is compared byte for byte with its reviewed
Git blob hash. No changes to graphics, menus or layout are necessary for
runtime reliability fixes. An explicit, later visual redesign may update
the review baseline in the same PR.
"""
import hashlib
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "diagnostics/visual-baseline.json"


class VisualBaselineTests(unittest.TestCase):
    def test_html_and_css_match_approved_appearance(self):
        baseline = json.loads(SOURCE.read_text(encoding="utf-8"))
        self.assertEqual(baseline["schema_version"], 1)
        wanted = baseline["files"]
        self.assertGreaterEqual(len(wanted), 14)
        actual = {
            str(path.relative_to(ROOT))
            for path in (ROOT / "overrides").rglob("*")
            if path.is_file() and path.suffix in (".html", ".css")
        }
        self.assertEqual(actual, set(wanted), "Added/removed visual sources require explicit review")
        for name, expected_sha in wanted.items():
            data = (ROOT / name).read_bytes()
            blob_sha = hashlib.sha1(
                b"blob " + str(len(data)).encode("ascii") + bytes([0]) + data
            ).hexdigest()
            with self.subTest(file=name):
                self.assertEqual(blob_sha, expected_sha, "Visual source changed without approval")
