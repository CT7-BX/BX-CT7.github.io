#!/usr/bin/env python3
"""Rebuild a pinned public upstream tree without modifying original upstream repository."""
import io, tarfile, urllib.request, shutil, subprocess, sys, hashlib, json
from pathlib import Path

SHA = '21c2d899c7381cc9f98e4dfb8da8504d2581b831'
URL = 'https://codeload.github.com/ArabPixel/WebKitty/tar.gz/' + SHA
root=Path(__file__).resolve().parent
dest=root/'dist'
if dest.exists():
    shutil.rmtree(dest)
dest.mkdir()
print('Baixando WebKitty fixado:', SHA)
with urllib.request.urlopen(urllib.request.Request(URL,headers={'User-Agent':'BX-CT7-rebuild/1.0'}),timeout=75) as resp:
    data=resp.read()
with tarfile.open(fileobj=io.BytesIO(data), mode='r:gz') as archive:
    # Extract only regular files/directories, with path traversal protections.
    for member in archive.getmembers():
        parts=Path(member.name).parts[1:]
        if not parts: continue
        if member.issym() or member.islnk() or member.isdev(): continue
        path=Path(*parts)
        if path.is_absolute() or '..' in path.parts: raise ValueError('Invalid tar path')
        target=dest/path
        if member.isdir(): target.mkdir(parents=True,exist_ok=True)
        elif member.isfile():
            target.parent.mkdir(parents=True,exist_ok=True)
            with archive.extractfile(member) as src, target.open('wb') as out:
                shutil.copyfileobj(src,out)
from firmware_1402 import prepare_components, integrate_host
firmware_addon = prepare_components(dest)
# Freeze both original and separately pinned 14.02 components before presentation edits.
protected = {str(p.relative_to(dest)): hashlib.sha256(p.read_bytes()).hexdigest()
             for folder in ('src', 'includes/payloads') for p in (dest/folder).rglob('*') if p.is_file()}
subprocess.run([sys.executable,str(root/'patch_runtime.py'),str(dest)],check=True)
integrate_host(dest)
for name, digest in protected.items():
    if not (dest/name).is_file() or hashlib.sha256((dest/name).read_bytes()).hexdigest() != digest:
        raise RuntimeError('Protected upstream file changed: ' + name)
(dest/'upstream-integrity.json').write_text(json.dumps({
    'repository': 'ArabPixel/WebKitty', 'revision': SHA,
    'protected_files': protected, 'physical_ps4_tested': False,
    'firmware_addons': [firmware_addon]
}, indent=2) + '\n', encoding='utf-8')
# Metadata participates in the offline content revision too.
from presentation import stamp_manifests
(dest/'.nojekyll').touch()
stamp_manifests(dest)
print('Reconstrução disponível em:',dest)
