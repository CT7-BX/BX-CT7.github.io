import importlib.util
from pathlib import Path
import unittest
from unittest import mock
import tempfile

spec = importlib.util.spec_from_file_location('upstream_update', Path(__file__).resolve().parents[1]/'scripts/upstream_update.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class UpstreamPinTests(unittest.TestCase):
    def test_updates_only_the_exact_pin(self):
        old, new = 'a'*40, 'b'*40
        text = "SHA = '"+old+"'\nURL = 'keep'\n"
        self.assertEqual(module.replace_pin(text, new), "SHA = '"+new+"'\nURL = 'keep'\n")

    def test_rejects_untrusted_revision_and_ambiguous_markers(self):
        text = "SHA = '"+'a'*40+"'\n"
        for value in ['main', '../main', 'a'*39, 'a'*40+'\n', 'A'*40]:
            with self.assertRaises(ValueError):
                module.replace_pin(text, value)
        for value in ['', text+text]:
            with self.assertRaises(ValueError):
                module.replace_pin(value, 'b'*40)


    def run_candidate(self, latest, comparison=None, tree=None):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        root = Path(temporary.name)
        original = "SHA = '" + 'a'*40 + "'\n"
        (root/'build.py').write_text(original)
        replies = [{'sha': latest}]
        if comparison is not None:
            replies.append(comparison)
            if comparison.get('status') == 'ahead' and len(comparison.get('files', [])) < 300:
                replies.append(tree if tree is not None else {'truncated': False, 'tree': []})
        with mock.patch.object(module, 'ROOT', root), mock.patch.object(module, 'fetch', side_effect=replies), \
             mock.patch('sys.argv', ['upstream_update.py']), mock.patch.dict(module.os.environ, {'GITHUB_OUTPUT':str(root/'output')}):
            module.main()
        return root, original

    def test_current_pin_does_not_change_build_or_create_proposal(self):
        root, original = self.run_candidate('a'*40)
        self.assertEqual((root/'build.py').read_text(), original)
        self.assertFalse((root/'upstream-review.md').exists())
        self.assertIn('changed=false', (root/'output').read_text())

    def test_new_pin_creates_review_with_sensitive_change_count(self):
        root, _ = self.run_candidate('b'*40, {'status':'ahead','files':[{'filename':'src/chain.js'},{'filename':'index.html'}]})
        self.assertIn('b'*40, (root/'build.py').read_text())
        self.assertEqual((root/'upstream-candidate.txt').read_text(), 'b'*40+'\n')
        self.assertIn('2 arquivos alterados', (root/'upstream-review.md').read_text())
        self.assertIn('1 em código', (root/'upstream-review.md').read_text())
        self.assertIn('Revisão humana obrigatória', (root/'upstream-review.md').read_text())

    def test_divergence_or_truncated_comparison_cannot_create_candidate(self):
        for comparison in [{'status':'diverged','files':[]}, {'status':'ahead','files':[{}]*300}]:
            with self.assertRaises(ValueError):
                self.run_candidate('b'*40, comparison)

    def test_pinned_targets_include_current_goldhen_and_isolated_fw1402(self):
        targets = module.addon_targets()
        self.assertIn('includes/payloads/HEN/goldhen_v2.4b18.14.bin', targets)
        self.assertIn('includes/payloads/HEN/PS4HEN_fw1402.bin', targets)
        self.assertIn('src/kpatches/1402.bin', targets)

    def test_existing_upstream_component_blocks_candidate_before_mutating_build(self):
        path = 'includes/payloads/HEN/goldhen_v2.4b18.14.bin'
        comparison = {'status': 'ahead', 'files': [{'filename': path, 'status': 'added'}]}
        tree = {'truncated': False, 'tree': [{'path': path, 'type': 'blob'}]}
        root, original = self.run_candidate('b'*40, comparison, tree)
        self.assertEqual((root/'build.py').read_text(), original)
        self.assertIn('changed=false', (root/'output').read_text())
        self.assertIn('blocked=true', (root/'output').read_text())
        report = (root/'upstream-review.md').read_text()
        self.assertIn('BLOQUEADO', report)
        self.assertIn(path, report)
        self.assertIn('NÃO foi aplicada', report)
        self.assertEqual((root/'upstream-candidate.txt').read_text(), 'b'*40+'\n')

    def test_incomplete_upstream_tree_fails_closed(self):
        comparison = {'status': 'ahead', 'files': [{'filename': 'README.md'}]}
        for tree in ({'truncated': True, 'tree': []}, {'tree': []},
                     {'truncated': False, 'tree': [{'bad': 'entry'}]}):
            with self.assertRaises(ValueError):
                self.run_candidate('b'*40, comparison, tree)

    def test_nonconflicting_candidate_still_runs_full_validation(self):
        comparison = {'status': 'ahead', 'files': [{'filename': 'README.md'}]}
        tree = {'truncated': False, 'tree': [{'path': 'README.md', 'type': 'blob'}]}
        root, original = self.run_candidate('b'*40, comparison, tree)
        self.assertNotEqual((root/'build.py').read_text(), original)
        self.assertIn('changed=true', (root/'output').read_text())
        self.assertIn('blocked=false', (root/'output').read_text())
