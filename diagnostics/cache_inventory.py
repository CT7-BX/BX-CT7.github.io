"""Read-only audit of generated PS4 AppCache manifests.

This script reads paths and hashes only. It does not clear caches, install
software, execute payloads, connect to a console or claim a physical test.
"""
import hashlib
import json
import pathlib
from urllib.parse import unquote, urlsplit

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "diagnostics/cache-inventory.json"


def inventory(site):
    site = pathlib.Path(site).resolve()
    folder = site / "includes/caches/manifest"
    files = sorted(folder.glob("*.manifest"))
    if not files:
        raise ValueError("No generated offline manifests")
    results = []
    for manifest in files:
        text = manifest.read_text(encoding="utf-8")
        if not text.startswith("CACHE MANIFEST\n") or text.count("CACHE:") != 1:
            raise ValueError("Malformed cache manifest " + manifest.name)
        section = text.split("CACHE:", 1)[1].split("NETWORK:", 1)[0].split("FALLBACK:", 1)[0]
        entries = [line.strip() for line in section.splitlines()
                   if line.strip() and not line.lstrip().startswith("#")]
        seen = set()
        total_bytes = 0
        for raw in entries:
            url = urlsplit(raw)
            if url.scheme or url.netloc or not url.path:
                raise ValueError("Non-local cache entry " + manifest.name)
            target = (manifest.parent / unquote(url.path)).resolve()
            if target != site and site not in target.parents:
                raise ValueError("Cache entry escapes build " + manifest.name)
            if target.is_dir():
                target = target / "index.html"
            if not target.is_file():
                raise ValueError("Missing cache asset " + manifest.name)
            if raw not in seen:
                total_bytes += target.stat().st_size
            seen.add(raw)
        results.append({
            "manifest": manifest.name,
            "sha256": hashlib.sha256(manifest.read_bytes()).hexdigest(),
            "entries": len(entries),
            "unique_entries": len(seen),
            "duplicate_entries": len(entries) - len(seen),
            "approx_unique_asset_bytes": total_bytes,
            "missing_assets": 0,
        })
    release = json.loads((site / "release.json").read_text(encoding="utf-8"))
    return {
        "schema_version": 1,
        "revision": release.get("revision"),
        "scope": "static offline file inventory; PS4 AppCache runtime not tested",
        "physical_ps4_tested": False,
        "cache_recovery_performed": False,
        "manifests": results,
    }


def main():
    report = inventory(ROOT / "dist")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("BX-HEN cache inventory: %d manifests validated" % len(report["manifests"]))


if __name__ == "__main__":
    main()
