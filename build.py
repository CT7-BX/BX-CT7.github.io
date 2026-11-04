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
# Afterglow 13.52/14.00 is independent from WebKitty. Keep the author
# sources and licenses intact in a dedicated static route. Pin a reviewed SHA.
AFTERGLOW_SHA = 'acf25a831725f0d44fcb64725d4ce35acbba8f9d'
AFTERGLOW_URL = 'https://codeload.github.com/well0nez/afterglow-web/tar.gz/' + AFTERGLOW_SHA
afterglow = dest / 'afterglow'
afterglow.mkdir()
print('Baixando Afterglow fixado:', AFTERGLOW_SHA)
with urllib.request.urlopen(urllib.request.Request(AFTERGLOW_URL,headers={'User-Agent':'BX-CT7-rebuild/1.0'}),timeout=75) as resp:
    data = resp.read()
with tarfile.open(fileobj=io.BytesIO(data), mode='r:gz') as archive:
    for member in archive.getmembers():
        parts = Path(member.name).parts[1:]
        if not parts: continue
        if member.issym() or member.islnk() or member.isdev(): continue
        rel = Path(*parts)
        if rel.is_absolute() or '..' in rel.parts: raise ValueError('Invalid Afterglow tar path')
        target = afterglow / rel
        if member.isdir(): target.mkdir(parents=True, exist_ok=True)
        elif member.isfile():
            target.parent.mkdir(parents=True, exist_ok=True)
            with archive.extractfile(member) as src, target.open('wb') as out:
                shutil.copyfileobj(src, out)

# Don't silently start a kernel exploit from a mere navigation. Explicit
# action is required on the original author's landing screen.
afterglow_index = afterglow / 'index.html'
html = afterglow_index.read_text(encoding='utf-8')
if '<input type="checkbox" id="auto" checked />' not in html:
    raise RuntimeError('Afterglow autostart markup changed; review integration')
html = html.replace('<input type="checkbox" id="auto" checked />',
                    '<input type="checkbox" id="auto" />')
afterglow_index.write_text(html, encoding='utf-8')
for relative in ('LICENSE','LICENSE-raw13g','README.md','TECHNICAL.md','jb.html',
                 'launch.js','jb.js','afterglow.js','goldhen.bin','hen.bin',
                 'patchset-1400.bin','patchset-1352.bin'):
    if not (afterglow / relative).is_file():
        raise RuntimeError('Afterglow dependency missing: '+relative)


subprocess.run([sys.executable,str(root/'patch_runtime.py'),str(dest)],check=True)
(dest/'.nojekyll').touch()
print('Reconstrução disponível em:',dest)
