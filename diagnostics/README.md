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


## Compatibility matrix and privacy-safe incident reports

`diagnostics/compatibility-matrix.json` is the single, reviewed metadata
source for selected PS4 firmware profiles. It distinguishes "configured in
this host" from "not configured"; **neither means that a PS4 was physically
tested or that a jailbreak succeeded**. The matrix is validated and embedded
in the *existing* read-only diagnostic JavaScript during the build; the same
data is available at the public `/compatibility-matrix.json` URL. No
navigation menu, CSS, buttons, or layout are added.

The existing **Copiar diagnóstico** button includes the matrix interpretation
in its copied report. The report labels are available in Portuguese, English,
and Spanish according to the browser language. The on-screen interface and
styles remain unchanged. Common IP addresses, Bearer credentials, and
token/API-key/password parameters are masked in the copied text. Users must
still review their reports manually before sharing; **no automatic submission
or telemetry occurs**.

## Offline cache inventory

`diagnostics/cache_inventory.py` inspects each generated AppCache manifest
after the build. It fails if an asset is missing or escapes the build root and
writes `diagnostics/cache-inventory.json`, including SHA-256, file counts and
duplicate entries. The GitHub Actions firmware-audit artifact contains both
firmware and cache inventories. This is static validation, **not** a test of
the PS4 cache runtime or a command that clears/resets console data.

For recovery from an incomplete cache: keep the last working page, check the
build report and file inventory, and use the existing manual cache-update
control when the console can reach the published host. Do not clear the
console's browser data as an automatic reaction to an error. Physical testing
is necessary to confirm that the updated cache actually loads.

## Stable versus beta

- `main` is the only branch deployed through `pages.yml`.
- `beta` runs `.github/workflows/beta-validation.yml` for browser tests,
  source checks, build, static firmware routing and cache-inventory inspection.
  It uploads a preview artifact for manual review but **does not deploy**.
- Promote changes by reviewed PR into `main`, after checks pass. A green
  beta workflow verifies software artifacts only, not successful console
  execution. Rollback of a bad website version should be a reviewed Git
  revert, not an invisible edit to kernel or payload files.

### Appearance invariant

These changes do not edit page markup or CSS. Existing visual themes,
screen layout, links, button labels and the original host controls stay
unchanged. A reduced-effects visual theme was intentionally not added because
the owner requested no visual changes.
