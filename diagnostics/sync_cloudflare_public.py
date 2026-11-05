"""Sync only public BX-HEN assets from Cloudflare to GitHub Pages output.

Never fetch /teste/, private-web, native sources, credentials or API routes.
If Cloudflare is unavailable, keep the existing GitHub Pages build.
"""
from pathlib import Path
from urllib.request import Request, urlopen
import hashlib
import json
import re

BASE = "https://bx-hen.4rt949zpj8.workers.dev/"
FILES = ("index.html", "style.css", "core.js", "diagnostic.js", "app.js", "brand.svg", "release.json")
DEST = Path("dist/bx-hen")
MAX_BYTES = 250_000


def fetch(name):
    request = Request(BASE + name, headers={"User-Agent": "BX-HEN-GitHub-Pages-public-sync/1"})
    with urlopen(request, timeout=12) as response:
        if response.status != 200:
            raise RuntimeError("HTTP status " + str(response.status))
        data = response.read(MAX_BYTES + 1)
    if not data or len(data) > MAX_BYTES:
        raise ValueError("Unexpected asset size: " + name)
    return data


def main():
    try:
        assets = {name: fetch(name) for name in FILES}
        release = json.loads(assets["release.json"])
        if release.get("project") != "BX-HEN":
            raise ValueError("Unexpected project")
        for item in release.get("files", []):
            name = item["name"]
            if name in assets and hashlib.sha256(assets[name]).hexdigest() != item["sha256"]:
                raise ValueError("SHA-256 mismatch: " + name)
        html = assets["index.html"].decode("utf-8")
        if "BX-HEN" not in html or 'id="desbloqueio"' not in html:
            raise ValueError("Unexpected public HTML")
        # The Cloudflare restricted area is NOT hosted on static GitHub Pages.
        html = re.sub(r'<a\s+href="/teste/"[^>]*>[^<]*</a>', '', html)
        html = html.replace('href="/teste/"', 'href="#projeto"')
        assets["index.html"] = html.encode("utf-8")
    except Exception as exc:
        print("Public sync skipped; retaining previous GitHub dashboard:", exc)
        return
    DEST.mkdir(parents=True, exist_ok=True)
    for name, data in assets.items():
        (DEST / name).write_bytes(data)
    print("BX-HEN public Cloudflare site synced:", release.get("version", "unknown"))


if __name__ == "__main__":
    main()
