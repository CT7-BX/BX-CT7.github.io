#!/usr/bin/env python3
"""Read-only GoldHEN menu/resource feasibility audit. Never writes to the .bin.

Answers whether our pinned binary exposes plain-text menu labels or familiar
embedded image formats. This does NOT prove it can be safely patched.
"""
from __future__ import annotations
from pathlib import Path
import hashlib
import json
import sys

EXPECTED_GIT_BLOB = "682bea0de0be660d0522e018d3d250e7d1b7ee83"
EXPECTED_SIZE = 297496
LABELS = (
    "GoldHEN", "★ GoldHEN ★", "Debug Settings", "Cheat Settings",
    "Plugin Settings", "Game Overlay Settings", "Servers Settings",
    "Utilities", "Klog Settings", "About", "SiSTRo",
)
SIGNATURES = {
    "PNG": b"\x89PNG\r\n\x1a\n",
    "JPEG": b"\xff\xd8\xff",
    "GIF": b"GIF89a",
    "DDS": b"DDS ",
    "WebP": b"RIFF",
    "ZIP": b"PK\x03\x04",
}

def offsets(data: bytes, needle: bytes) -> list[int]:
    out = []
    start = 0
    while True:
        pos = data.find(needle, start)
        if pos < 0:
            break
        out.append(pos)
        start = pos + len(needle)
    return out

def inspect(binary: Path) -> dict:
    data = binary.read_bytes()
    git_hash = hashlib.sha1(("blob %d\0" % len(data)).encode() + data).hexdigest()
    if len(data) != EXPECTED_SIZE or git_hash != EXPECTED_GIT_BLOB:
        raise ValueError("Binary does not match pinned WebKitty GoldHEN resource; audit aborted")
    label_matches = {}
    for label in LABELS:
        matches = {}
        for encoding in ("utf-8", "utf-16-le", "utf-16-be"):
            hits = offsets(data, label.encode(encoding))
            if hits:
                matches[encoding] = hits[:12]
        label_matches[label] = matches
    signature_matches = {
        name: offsets(data, magic)[:12]
        for name, magic in SIGNATURES.items()
    }
    return {
        "read_only": True,
        "source": "ArabPixel/WebKitty@6bdb9f764ba428978cb657a718296c3d6752e9b0",
        "file_size": len(data),
        "sha256": hashlib.sha256(data).hexdigest(),
        "git_blob_sha1": git_hash,
        "header_hex": data[:16].hex(),
        "label_occurrences": label_matches,
        "possible_embedded_file_signatures": signature_matches,
        "conclusion": (
            "A label or magic signature match is not proof of a safe editing "
            "interface. No public API or source for the built-in settings UI "
            "was found in the official project documentation. Replacing the "
            "PS4 Settings menu cannot be accomplished by modifying website CSS "
            "or by launching an independent homebrew application."
        ),
        "changes_made_to_binary": False,
    }

def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("Usage: audit_goldhen_menu.py INPUT.bin OUTPUT.json")
    result = inspect(Path(sys.argv[1]))
    output = Path(sys.argv[2])
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n",
                      encoding="utf-8")
    print("GoldHEN settings/menu asset audit: original hash verified, no modification")
    print("Binary SHA-256:", result["sha256"])
    for label, hit in result["label_occurrences"].items():
        print(f"{label}: {hit or 'no plain-text match'}")
    for fmt, hits in result["possible_embedded_file_signatures"].items():
        print(f"{fmt} signatures: {hits or 'none'}")
    print(result["conclusion"])

if __name__ == "__main__":
    main()
