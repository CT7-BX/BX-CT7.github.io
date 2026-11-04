# BX-HEN Test Monitor

This folder contains the source for the automatic build and deployment monitor.

- `generate_report.py` retrieves finished GitHub Actions runs, keeps up to 30 summaries, and generates `dist/bx-hen/test-history.json`.
- Every run uploads `diagnostics/latest-report.json` as a GitHub Actions artifact subject to retention settings.
- The BX-HEN dashboard shows the report on GitHub Pages.
- Monitoring runs at 08:00, 14:00 and 20:00 Mato Grosso (UTC−4), subject to GitHub Actions scheduler delays.
- Only public workflow metadata is stored: run IDs, dates, conclusions, commit prefixes, event type, and links. No logs, tokens, user data, IP addresses or payloads.
- The report is a snapshot of previously completed runs; the generating run is not yet complete.
- A successful build is not a real PS4 jailbreak test.
