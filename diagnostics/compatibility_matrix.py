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
    if not isinstance(entries, list) or not 1 <= len(entries) <= 150:
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
        if "ui_listed" in row and not isinstance(row["ui_listed"], bool):
            raise ValueError("Invalid selector evidence")
        if "default_chain_id" in row and row["default_chain_id"] is not None and (
            not isinstance(row["default_chain_id"], int) or isinstance(row["default_chain_id"], bool)):
            raise ValueError("Invalid default chain evidence")
        seen.add(fw)
    if "goldhen_options" in data:
        versions = data["goldhen_options"]
        if not isinstance(versions, list) or not 1 <= len(versions) <= 25:
            raise ValueError("Invalid GoldHEN options")
        known = set()
        for option in versions:
            if not isinstance(option, dict) or not re.fullmatch(
                    r"GHv2\.4b18\.[0-9]{1,2}", str(option.get("version", ""))):
                raise ValueError("Invalid GoldHEN version label")
            version = option["version"]
            binary = option.get("binary")
            if (version in known or not isinstance(binary, str) or
                    not re.fullmatch(r"includes/payloads/HEN/goldhen_[a-zA-Z0-9._-]+\.bin", binary) or
                    not re.fullmatch(r"[a-f0-9]{64}", str(option.get("sha256", ""))) or
                    option.get("verification") != "file_and_menu_only" or
                    option.get("physical_ps4_tested") is not False):
                raise ValueError("Invalid GoldHEN source or evidence")
            known.add(version)
        if data.get("goldhen_option_count") != len(known):
            raise ValueError("GoldHEN option count mismatch")
        if data.get("firmware_option_count") != sum(row.get("ui_listed", False) for row in entries):
            raise ValueError("Firmware option count mismatch")
        for row in entries:
            selected = row.get("goldhen_options_checked")
            if not isinstance(selected, list) or len(selected) != len(set(selected)) or not set(selected).issubset(known):
                raise ValueError("Invalid GoldHEN selection evidence")
            if row["host_profile"] == "not_configured" and selected:
                raise ValueError("Unconfigured firmware must not list GoldHEN selections")
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
