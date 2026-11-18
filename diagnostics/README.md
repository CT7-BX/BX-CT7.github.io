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


## Automatic inventory of every firmware and GoldHEN choice

The previously reviewed seven firmware records are retained as **guards**,
not used as the complete published inventory. On every build,
`diagnostics/generate_compatibility_catalog.cjs` reads the actual generated
firmware and GoldHEN selectors and evaluates the firmware/selection-only
JavaScript in a sandbox with mocked browser APIs. No jailbreak, payload,
network connection or console code is executed.

The build fails when a reviewed firmware changes routing unexpectedly, a
GoldHEN radio choice lacks a local binary, a reported path is absent, or the
14.02 selector no longer limits itself to the reviewed 2.4b18.13/14 choices.
The output is validated by `compatibility_matrix.py` and published as
`compatibility-matrix.json`, with evidence for **every firmware listed**
in the original selector and every GoldHEN version in the original radio
menu. Additional reviewed unsupported versions remain explicitly documented.

`goldhen_options_checked` means that an isolated simulated selector
assigned a local file path. It does **not** prove compatibility or activation
on an actual PS4. The existing layout, controls and original binaries are
untouched. Source firmware boundaries are not widened just to advertise
a version.


## Read-only firmware preflight and offline mapping

The existing **Copiar diagnóstico** action now includes read-only checks for
the selected firmware's static support profile, the saved GoldHEN selection,
browser connectivity and the browser's AppCache status. The static GoldHEN
version whitelist is explicitly described as a *selection check*, not a
successful launch or real-console test. No automatic telemetry, network
requests or retry attempts are triggered by this report.

During each site build, the compatibility generator resolves every configured
firmware's offline cache HTML and its manifest under the generated build
directory, rejects paths outside the intended directories and requires an
AppCache manifest header. Those paths are published in
`compatibility-matrix.json` alongside a precise
`offline_evidence: generated_files_only` marker. These fields are also
validated by the Python release policy and Node integration tests.

No console firmware is changed. Neither static file presence nor a successful
CI run proves that the AppCache was installed or that GoldHEN executed on a
physical PS4. The existing visual interface and original payloads are
unchanged.
