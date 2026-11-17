"""Publish an evidence-labelled firmware matrix into the existing diagnostics code.

Only metadata is changed. No page controls, CSS, firmware routing, payload
selection or executable host components are changed by this module.
"""
import json
import pathlib
import re

SOURCE = pathlib.Path(__file__).with_name("compatibility-matrix.json")
MARKER = "/* BX_SUPPORT_MATRIX */ null"
ALLOWED = {"configured", "not_configured"}


def validate(data):
    if not isinstance(data, dict) or data.get("schema_version") != 1:
        raise ValueError("Unknown compatibility matrix schema")
    if data.get("project") != "BX-HEN" or data.get("publication_channel") != "stable":
        raise ValueError("Invalid matrix metadata")
    if data.get("physical_ps4_tested") is not False or data.get("jailbreak_validated") is not False:
        raise ValueError("Matrix must not claim unverified console tests")
    entries = data.get("entries")
    if not isinstance(entries, list) or not 1 <= len(entries) <= 30:
        raise ValueError("Invalid matrix entries")
    seen = set()
    for row in entries:
        if not isinstance(row, dict):
            raise ValueError("Invalid firmware record")
        fw = row.get("firmware")
        if not isinstance(fw, str) or not re.fullmatch(r"[0-9]{1,2}\.[0-9]{2}", fw):
            raise ValueError("Bad firmware version")
        if fw in seen or row.get("host_profile") not in ALLOWED:
            raise ValueError("Duplicate firmware or unsupported profile status")
        if row.get("console_test") != "not_verified":
            raise ValueError("No physical test has been supplied")
        expected = "static_routing_only" if row["host_profile"] == "configured" else "none"
        if row.get("automatic_checks") != expected:
            raise ValueError("Inconsistent evidence")
        seen.add(fw)
    return data


def publish(site, source=SOURCE):
    """Inject the same validated JSON into the read-only diagnostic bundle.

    The generated JSON is also available for external review. An existing
    marker is required; we do not insert HTML or alter visible layout.
    """
    site = pathlib.Path(site)
    data = validate(json.loads(pathlib.Path(source).read_text(encoding="utf-8")))
    js = site / "includes/js/dev-diagnostics.js"
    text = js.read_text(encoding="utf-8")
    if text.count(MARKER) != 1:
        raise ValueError("BX-HEN report injection marker missing/duplicated")
    compact = json.dumps(data, ensure_ascii=True, separators=(",", ":")).replace("<", "\\u003c")
    js.write_text(text.replace(MARKER, compact, 1), encoding="utf-8")
    (site / "compatibility-matrix.json").write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return data
