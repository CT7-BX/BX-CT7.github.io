import json
import tempfile
import unittest
import urllib.error
from pathlib import Path
from unittest.mock import patch

from diagnostics import generate_report


class ReportCollectionTests(unittest.TestCase):
    def test_network_failure_produces_explicit_unavailable_report_without_error_details(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / 'report.json'
            artifact = Path(directory) / 'artifact.json'
            with patch.object(generate_report, 'OUTPUT', output), patch.object(generate_report, 'ARTIFACT', artifact), \
                 patch.object(generate_report, 'from_api', side_effect=urllib.error.URLError('private-error-content')):
                generate_report.main()
            data = json.loads(output.read_text())
            self.assertEqual(data['collection_status'], 'unavailable')
            self.assertEqual(data['runs'], [])
            self.assertFalse(data['console_tested'])
            self.assertFalse(data['jailbreak_validated'])
            self.assertNotIn('private-error-content', output.read_text())
            self.assertEqual(output.read_bytes(), artifact.read_bytes())

    def test_invalid_items_are_skipped_without_accepting_boolean_or_negative_ids(self):
        runs = [None, 3, {'status': 'completed', 'conclusion': 'success', 'id': True, 'created_at': 'test'},
                {'status': 'completed', 'conclusion': 'success', 'id': -1, 'created_at': 'test'},
                {'status': 'completed', 'conclusion': 'success', 'id': 123, 'created_at': 'test'}]
        report = generate_report.build_report(runs, 'test')
        self.assertEqual(report['record_count'], 1)
        self.assertEqual(report['runs'][0]['id'], 123)
        with self.assertRaises(ValueError):
            generate_report.build_report({}, 'test')
