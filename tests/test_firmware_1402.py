import hashlib
import io
from pathlib import Path
import tarfile
import tempfile
import unittest
from unittest import mock
from firmware_1402 import download_selected


def archive_bytes(files):
    buffer = io.BytesIO()
    with tarfile.open(fileobj=buffer, mode='w:gz') as archive:
        for name, content in files:
            info = tarfile.TarInfo('upstream-pinned/' + name)
            info.size = len(content)
            archive.addfile(info, io.BytesIO(content))
    return buffer.getvalue()


class FirmwareComponentIntegrityTests(unittest.TestCase):
    def test_unexpected_component_bytes_are_rejected_before_destination_is_written(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            with mock.patch('urllib.request.urlopen', return_value=io.BytesIO(archive_bytes([('payload.bin', b'wrong')]))):
                with self.assertRaisesRegex(ValueError, 'checksum mismatch'):
                    download_selected(root, 'owner/repo', 'a'*40, {'payload.bin':('reviewed/payload.bin', '0'*40)})
            self.assertFalse((root/'reviewed/payload.bin').exists())

    def test_missing_or_duplicate_components_fail_closed(self):
        data = b'original'
        digest = hashlib.sha1(b'blob 8\0' + data).hexdigest()
        for files, message in [([], 'Missing pinned'), ([('payload.bin',data),('payload.bin',data)], 'duplicate')]:
            with tempfile.TemporaryDirectory() as directory:
                with mock.patch('urllib.request.urlopen', return_value=io.BytesIO(archive_bytes(files))):
                    with self.assertRaisesRegex(ValueError, message):
                        download_selected(Path(directory), 'owner/repo', 'a'*40, {'payload.bin':('reviewed/payload.bin', digest)})

    def test_reviewed_download_cannot_replace_an_existing_component(self):
        data = b'original'
        digest = hashlib.sha1(b'blob 8\0' + data).hexdigest()
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root/'payload.bin').write_bytes(b'keep old firmware bytes')
            with mock.patch('urllib.request.urlopen', return_value=io.BytesIO(archive_bytes([('payload.bin',data)]))):
                with self.assertRaisesRegex(ValueError, 'overwrite an existing'):
                    download_selected(root, 'owner/repo', 'a'*40, {'payload.bin':('payload.bin',digest)})
            self.assertEqual((root/'payload.bin').read_bytes(), b'keep old firmware bytes')
