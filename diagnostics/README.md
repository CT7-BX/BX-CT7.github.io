# BX-HEN Test Monitor

This folder contains the source for the automatic build and deployment monitor.

- `generate_report.py` retrieves finished GitHub Actions runs, keeps up to 30 summaries, and generates `dist/bx-hen/test-history.json`.
- Publishing runs upload `diagnostics/latest-report.json` as an Actions artifact; scheduled and verify-only runs do not republish the site.
- The BX-HEN dashboard shows the report on GitHub Pages.
- Monitoring runs at 08:00, 14:00 and 20:00 Mato Grosso (UTC−4), subject to GitHub Actions scheduler delays.
- Only public workflow metadata is stored: run IDs, dates, conclusions, commit prefixes, event type, and links. No logs, tokens, user data, IP addresses or payloads.
- The report is a snapshot of previously completed runs; the generating run is not yet complete.
- A successful build is not a real PS4 jailbreak test.

## Source and generated-site verification

`verify_site.py` inspects all versioned repository text files and new source
files, parses Python/JSON and checks JavaScript syntax without executing it.
Inline JSON data is validated as JSON; inline ES modules use module syntax.
The generated host scripts, store, cache pages and standalone BX-GTA previews
are also checked. Local references must resolve inside the generated site.
Kernel/payload bytes are checked against the frozen SHA-256 inventory.
C++ and workflow sources receive text inspection; this is not a native build
or a proof of console behavior. See [REVIEW.md](../REVIEW.md).
