#!/usr/bin/env python3
"""Verify BX-HEN UI assets and PKG Store before publishing.

Local syntax/integrity checks are not proof of PS4 compatibility.
"""
import hashlib
import json
import pathlib
import re
import subprocess
import sys
import tempfile
from html.parser import HTMLParser
from urllib.parse import urlsplit

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = ROOT / "dist"
CHECK_FILES = [
    "patch_runtime.py",
    "overrides/minimal.css",
    "overrides/bx-hen-launch.css",
    "overrides/bx-hen-launch.js",
    "dist/index.html",
    "dist/neon.html",
    "dist/includes/css/minimal.css",
    "dist/includes/css/bx-hen-launch.css",
    "overrides/bx-hen-site/index.html",
    "overrides/bx-hen-site/extras.js",
    "overrides/bx-hen-site/core.js",
    "dist/bx-hen/core.js",
    "dist/includes/js/bx-hen-launch.js",
    "overrides/bx-hen-site/test-monitor.js",
    "overrides/bx-hen-site/compatibility.js",
    "overrides/bx-hen-site/store/index.html",
    "overrides/bx-hen-site/store/catalog.json",
    "overrides/bx-hen-site/extras.css",
    "overrides/bx-hen-site/test-monitor.css",
    "overrides/bx-hen-site/compatibility.css",
    "overrides/bx-theme-bridge.css",
    "dist/bx-hen/index.html",
    "dist/bx-hen/store/index.html",
    "dist/bx-hen/store/catalog.json",
]
JS_ASSETS = [
    "dist/includes/js/bx-hen-launch.js",
    "dist/bx-hen/extras.js",
    "dist/bx-hen/core.js",
    "dist/bx-hen/test-monitor.js",
    "dist/bx-hen/compatibility.js",
]


def check(condition, message):
    if not condition:
        raise ValueError(message)


class PageInspector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.refs = []
        self.scripts = []
        self.in_script = False
        self.script_buffer = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get("id"):
            check(attrs["id"] not in self.ids, "HTML duplicate id: " + attrs["id"])
            self.ids.add(attrs["id"])
        for attr in ("src", "href"):
            if attrs.get(attr):
                self.refs.append(attrs[attr])
        if tag == "script" and not attrs.get("src"):
            self.in_script = True
            self.script_buffer = []

    def handle_data(self, data):
        if self.in_script:
            self.script_buffer.append(data)

    def handle_endtag(self, tag):
        if tag == "script" and self.in_script:
            self.scripts.append("".join(self.script_buffer))
            self.in_script = False


def check_html(rel):
    path = SITE / rel
    parsed = PageInspector()
    parsed.feed(path.read_text(encoding="utf-8"))
    for ref in parsed.refs:
        if ref.startswith(("#", "mailto:", "data:")):
            continue
        url = urlsplit(ref)
        if url.scheme or url.netloc:
            check(url.scheme == "https", "Non-HTTPS external link in " + rel + ": " + ref)
            continue
        dest = (path.parent / url.path).resolve()
        check(dest == SITE.resolve() or SITE.resolve() in dest.parents, "Reference escapes site: " + ref)
        check(dest.is_file() or (dest.is_dir() and (dest / "index.html").is_file()),
              "Missing local reference " + ref + " in " + rel)
    for script in parsed.scripts:
        if script.strip():
            with tempfile.NamedTemporaryFile(mode="w", suffix=".js", encoding="utf-8") as tmp:
                tmp.write(script)
                tmp.flush()
                subprocess.run(["node", "--check", tmp.name], check=True, capture_output=True, text=True)


def check_catalog():
    data = json.loads((SITE / "bx-hen/store/catalog.json").read_text(encoding="utf-8"))
    check(data.get("schema_version") == 1, "Wrong catalog schema")
    check(isinstance(data.get("items"), list), "Missing catalog items")
    ids = set()
    for item in data["items"]:
        check(isinstance(item, dict), "Bad item")
        name = item.get("id")
        check(isinstance(name, str) and bool(re.fullmatch(r"[a-z0-9-]{2,70}", name)), "Bad item ID")
        check(name not in ids, "Duplicate item ID " + name)
        ids.add(name)
        for field in ("title", "version", "category", "description", "license"):
            check(isinstance(item.get(field), str) and bool(item[field].strip()), "Missing item field " + field)
        check(item.get("status") in ("available", "planned"), "Invalid item status")
        if item["status"] == "available":
            url = item.get("download_url")
            check(isinstance(url, str) and url.startswith("https://"), "Available file lacks HTTPS link")
            urlparts = urlsplit(url)
            check(urlparts.scheme == "https" and bool(urlparts.hostname) and not urlparts.username,
                  "Invalid PKG URL")
            check(re.fullmatch(r"[a-fA-F0-9]{64}", item.get("sha256") or ""), "Available file missing SHA-256")
            check(item["license"] != "A confirmar", "Available file without verified distribution permission")
        else:
            check(item.get("download_url") is None, "Planned files must not show download URLs")



def check_minimal_host():
    """Guard the single-page presentation and offline cache against regressions."""
    html = (SITE / "index.html").read_text(encoding="utf-8")
    css = (SITE / "includes/css/minimal.css").read_text(encoding="utf-8")
    legacy_html = (SITE / "bx-hen/index.html").read_text(encoding="utf-8")
    check(html.count('href="./includes/css/minimal.css"') == 1,
          "Minimal stylesheet missing or duplicated in main host")
    check("bx-minimal-v1" in html and "localStorage.setItem('theme','index')" in html,
          "Minimal theme migration not injected before page startup")
    check('window.location.replace("../")' in legacy_html,
          "Legacy dashboard does not redirect to the single main page")
    check('href="./includes/css/bx-hen-launch.css"' in html,
          "BX-HEN Neon launch stylesheet absent from main host")
    check('src="./includes/js/bx-hen-launch.js"' in html,
          "BX-HEN Neon launch script absent from main host")
    neon = (SITE / "neon.html").read_text(encoding="utf-8")
    launch_css = (SITE / "includes/css/bx-hen-launch.css").read_text(encoding="utf-8")
    check(neon == html, "Neon shortcut must use the same native host document")
    check("<html lang=" in neon and "manifest=" not in neon,
          "Neon shortcut must not be tied to an old AppCache manifest")
    check("var goToHttps = false;" in html,
          "Unexpected external HTTPS-to-HTTP navigation could bypass BX-HEN")
    check('content:"BX-HEN v2.2  /  PERSONALIZACAO: RUOK999"' in launch_css,
          "Neon branding not visible on the initial PS4 launch screen")
    check("width:max-content" not in css, "Unsupported legacy width remains in minimal CSS")
    check("flex-direction:row!important" in css,
          "HEN option layout may inherit a conflicting mobile flex direction")
    manifests = list((SITE / "includes/caches/manifest").glob("*.manifest"))
    check(bool(manifests), "No offline cache manifests generated")
    for manifest in manifests:
        data = manifest.read_text(encoding="utf-8")
        check("../../../includes/css/minimal.css" in data,
              "Minimal CSS missing in cache manifest: " + manifest.name)
        check("../../../includes/css/bx-hen-launch.css" in data,
              "BX-HEN Neon CSS missing in cache manifest: " + manifest.name)
        check("../../../includes/js/bx-hen-launch.js" in data,
              "BX-HEN Neon JS missing in cache manifest: " + manifest.name)


def main():
    for rel in CHECK_FILES + JS_ASSETS:
        path = ROOT / rel
        check(path.is_file(), "Missing " + rel)
        raw = path.read_bytes()
        check(b"\r" not in raw, "Unexpected CR/CRLF line breaks: " + rel)
        raw.decode("utf-8")
        check(raw.endswith(b"\n"), "Missing final newline: " + rel)
    check_minimal_host()
    check_html("bx-hen/index.html")
    check_html("bx-hen/store/index.html")
    for rel in JS_ASSETS:
        subprocess.run(["node", "--check", str(ROOT / rel)], check=True, capture_output=True, text=True)
    check_catalog()
    print("BX-HEN verification: syntax, UTF-8, LF line breaks, references and catalog OK")
    print("Note: no PS4 or kernel capability is tested here.")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, subprocess.CalledProcessError) as exc:
        print("BX-HEN verification failed:", exc, file=sys.stderr)
        sys.exit(1)
