import unittest
from diagnostics.release_policy import should_publish


class ReleasePolicyTests(unittest.TestCase):
    def test_only_reviewed_push_or_explicit_publish_dispatch_can_publish(self):
        for event, verification, expected in [
            ('push', False, True), ('push', True, True),
            ('workflow_dispatch', False, True), ('workflow_dispatch', 'false', True),
            ('workflow_dispatch', True, False), ('workflow_dispatch', 'true', False),
            ('workflow_dispatch', 'unexpected', False),
            ('schedule', False, False), ('pull_request', False, False),
            ('pull_request_target', False, False), ('', False, False), ('unknown', False, False)
        ]:
            with self.subTest(event=event, verification=verification):
                self.assertEqual(should_publish(event, verification), expected)
