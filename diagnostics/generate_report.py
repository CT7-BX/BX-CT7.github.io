#!/usr/bin/env python3
"""Generate a sanitized, machine-readable CI history for BX-HEN.

Only records public Actions run metadata. Never stores secrets, console data,
payload files, downloaded logs, or personal information. No console validation.
"""
import datetime
import json
import os
import pathlib
import urllib.error
import urllib.request

REPOSITORY = "CT7-BX/BX-CT7.github.io"
URL = "https://api.github.com/repos/" + REPOSITORY + "/actions/workflows/pages.yml/runs?per_page=50"
OUTPUT = pathlib.Path(os.environ.get("BX_REPORT_OUTPUT", "dist/bx-hen/test-history.json"))
ARTIFACT = pathlib.Path(os.environ.get("BX_REPORT_ARTIFACT", "diagnostics/latest-report.json"))
ALLOWED = {"success", "failure", "cancelled", "timed_out", "action_required", "skipped", "neutral"}


def from_api():
    headers = {"Accept": "application/vnd.github+json", "User-Agent": "BX-HEN-Test-Monitor/1.0"}
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = "Bearer " + token
    req = urllib.request.Request(URL, headers=headers)
    with urllib.request.urlopen(req, timeout=25) as response:
        payload = json.load(response)
    return payload.get("workflow_runs", [])


def build_report(raw_runs, generated):
    results = []
    for run in raw_runs:
        if run.get("status") != "completed":
            continue
        conclusion = run.get("conclusion")
        if conclusion not in ALLOWED:
            continue
        run_id = run.get("id")
        created = run.get("created_at")
        if not isinstance(run_id, int) or not isinstance(created, str):
            continue
        results.append({
            "id": run_id,
            "created_at": created,
            "conclusion": conclusion,
            "event": str(run.get("event", "unknown"))[:30],
            "commit": str(run.get("head_sha", ""))[:12],
            "url": "https://github.com/" + REPOSITORY + "/actions/runs/" + str(run_id),
        })
    results = results[:30]
    return {
        "schema_version": 1,
        "project": "BX-HEN Test Monitor",
        "generated_at_utc": generated,
        "timezone": "America/Cuiaba",
        "scope": "GitHub Actions build/deployment results, not PS4 jailbreak tests",
        "console_tested": False,
        "jailbreak_validated": False,
        "record_count": len(results),
        "runs": results,
    }


def main():
    generated = datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat()
    runs = from_api()
    report = build_report(runs, generated)
    for destination in (OUTPUT, ARTIFACT):
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("BX-HEN monitor: %d completed builds recorded" % report["record_count"])


if __name__ == "__main__":
    main()
