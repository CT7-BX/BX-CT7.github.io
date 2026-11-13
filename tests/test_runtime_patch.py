from pathlib import Path
import tempfile
import unittest
from runtime_patch import replace_required


class RuntimePatchTests(unittest.TestCase):
    def test_missing_marker_cannot_silently_publish_partial_customization(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            file = root/'index.html'
            file.write_text('upstream changed')
            with self.assertRaisesRegex(RuntimeError, 'review required'):
                replace_required(root, 'index.html', 'original marker', 'new')
            self.assertEqual(file.read_text(), 'upstream changed')
            with self.assertRaisesRegex(RuntimeError, 'file missing'):
                replace_required(root, 'missing.html', 'original', 'new')
