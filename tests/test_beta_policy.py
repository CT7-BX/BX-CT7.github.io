"""Prevent accidental beta deployment without changing the stable host."""
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class BetaPolicyTests(unittest.TestCase):
    def test_beta_workflow_is_test_only_and_has_no_publish_credentials(self):
        source = (ROOT / ".github/workflows/beta-validation.yml").read_text(encoding="utf-8")
        self.assertIn("branches: [beta]", source)
        self.assertIn("refs/heads/beta", source)
        self.assertIn("contents: read", source)
        self.assertIn("node --test tests/*.integration.cjs", source)
        self.assertNotIn("deploy-pages", source)
        self.assertNotIn("upload-pages-artifact", source)
        self.assertNotIn("pages: write", source)
        self.assertNotIn("id-token: write", source)

    def test_stable_workflow_still_publishes_main_only(self):
        source = (ROOT / ".github/workflows/pages.yml").read_text(encoding="utf-8")
        self.assertIn("branches: [main]", source)
        self.assertNotIn("branches: [main, beta]", source)
        self.assertIn("steps.policy.outputs.publish == 'true'", source)
