#!/usr/bin/env python3
"""Rebuild a pinned public upstream tree without modifying original upstream repository."""
import io, tarfile, urllib.request, shutil, subprocess, sys
from pathlib import Path

SHA = '6bdb9f764ba428978cb657a718296c3d6752e9b0'
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
subprocess.run([sys.executable,str(root/'patch_runtime.py'),str(dest)],check=True)
(dest/'.nojekyll').touch()
print('Reconstrução disponível em:',dest)
