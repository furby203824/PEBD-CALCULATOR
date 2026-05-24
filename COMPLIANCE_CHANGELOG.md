# PEBD Calculator - Compliance + Portal Style + UX Rebuild Changelog

- Baseline: github.com/furby203824/PEBD-CALCULATOR commit f520e9e (2026-03-15)
- Compliance pass: 2026-05-23
- Portal style rebuild: 2026-05-23
- UX audit + remediation: 2026-05-23
- Auditor: Semper Admin Compliance Strategist
- Files modified: index.html
- Files added: semper-tokens.css, semper-tokens.json, COMPLIANCE_CHANGELOG.md

## UX AUDIT REMEDIATION (2026-05-23)

Two top-of-page UI patterns failed UX scrutiny and were rebuilt:

### Pattern 1 - Select Calculation Mode (UX-1A)
- Removed the mode-selector DOM block (Basic / Advanced buttons).
- Removed the setMode() function, MODE constant, currentMode global, .advanced-features class system, and the DOMContentLoaded setMode(MODE.BASIC) init call.
- Moved the four previously-gated tool buttons into the sticky floating-pill topbar as a topbar-tools cluster:
  - Validate (calls validateAllPeriods)
  - Import (triggers a hidden file input that calls importCSV)
  - Export (calls exportToCSV)
  - Template (calls downloadTemplate)
- Each tool button uses a 16px stroke SVG icon plus a short label.
- Topbar wraps on mobile so the tools cluster takes a second row centered.
- Removed the Import / Export Data section from the page body entirely.
- Removed the redundant Validate All button from the service periods block.

### Pattern 2 - PEBD Corrective Action Workflow (UX-2A)
- Removed the collapsible reference-section panel at the top of the page.
- Removed the toggleWorkflow function.
- Built a new What's Next panel inside the existing resultsModal.
- The panel renders 4 steps as a horizontal stepper with role-color chips drawn from semper-tokens.css role accents:
  - Step 1 Marine: --color-role-marine (#B82230)
  - Step 2 PAC / Reporting Unit: --color-role-leader (#B89042)
  - Step 3 MMPB-21 Escalation: --color-role-commander (theme-aware)
  - Step 4 MISSO 9: --color-role-admin (#2F8F5C)
- Each step shows a round numbered badge, role label, and body copy.
- Added a primary CTA button "Email MMPB-21 with This Calculation" that calls a new emailMmpb21Package() function.
- emailMmpb21Package() opens the user's mail client (mailto:) with subject and body pre-filled from calculationResult. Body contains the CUI marking, inputs, results, and attachment instructions. No PII auto-included beyond the user-supplied filename tag, which is regex-sanitized first. Toast warns if URL exceeds 1900 chars.

### Result
- First-fold noise reduced. The page now opens directly to the calculator form after the header.
- The corrective action workflow lives where users need it (after a calculation produces a result), not where it merely existed (at the top of the page).
- Tool actions are always discoverable in the sticky topbar.

## INCIDENT - TRUNCATED SYNC (2026-05-23, repaired)

The first sync of the UX-rebuilt index.html to D:\Coding\PEBD-CALCULATOR truncated the file at line 2961 (mid-string inside the print report template). Cause: the sandbox bash mount served a stale snapshot during cp. The missing 201 lines included the DoD consent button click handler, so the I Acknowledge and Consent button did nothing in the browser. Repair was performed via the file-tool Edit against the destination directly. The destination now matches source line-for-line. Future syncs go through file-tool Read/Write only, never bash cp.

## PORTAL STYLE REBUILD (Semper Admin Portal Style Guide v1.2, 2026-05-04)

Decisions accepted from user 2026-05-23:

- Path B - full Portal-style rebuild
- Fonts will live in the app repo at assets/fonts/
- Companion files (semper-tokens.css, semper-tokens.json) ship alongside index.html
- Dark theme default for the app, light theme forced on all exports

### Files delivered

1. `semper-tokens.css` - paste-ready CSS variables for the full v1.2 token set, light + dark overrides, gradient-accent helper, ambient-bloom helper, chrome-floating helper, focus-visible ring, prefers-reduced-motion gate.
2. `semper-tokens.json` - flat token export consumable by Tailwind v4, Style Dictionary, Figma plugins.
3. Rewritten inline `<style>` block in index.html that references tokens, defines stat tiles, mode buttons, modal, toast, tables, forms, validation states, and a print-only @media block that forces the light parchment palette.

### Index.html changes

- `<html>` now defaults to `class="dark"` per principle 1 ("Default theme is dark navy").
- Head adds `<link rel="stylesheet" href="semper-tokens.css">` ahead of the inline style.
- CSP meta gains `font-src 'self'` to permit self-hosted Inter, Bebas Neue, JetBrains Mono.
- Floating pill topbar with backdrop blur, brand dot accent, and theme toggle button injected above the header.
- Container wrapped in `ambient-bloom` so the radial gradient activates in dark mode.
- Page title wraps "(PEBD)" in `<span class="gradient-accent">` per section 9.5 (one hero keyword per page).
- Result summary block rebuilt as three `.stat-tile` cards with 32px brass icons, eyebrow labels, 44px Bebas Neue numerics, meta lines, hover lift.
- Logo restored from assets/images/logo.png.
- Status colors swapped to brand: --color-status-fresh, --color-status-aging, --color-status-stale, --color-status-info.
- Bootstrap-era hex (#dc3545, #28a745, #17a2b8, #fd7e14) eliminated from the inline style.
- Print report stylesheet (generateHTMLReport) rewritten with the light parchment palette per user directive. Title uses Bebas Neue, body uses Inter, accents use --color-marine-blue and --color-usmc-scarlet. CUI banner color preserved.

### Fonts setup required by the developer

Drop the following files into `assets/fonts/` in the app repo before deployment:

- `InterVariable.woff2` - Inter Variable from rsms/inter or fontsource-variable
- `BebasNeue-Regular.woff2` - Bebas Neue from Google Fonts or fontsource
- `JetBrainsMono-Variable.woff2` - JetBrains Mono Variable from fontsource-variable

`@font-face` declarations in the inline style block point to these relative paths. CSP `font-src 'self'` permits loading.

### CUI marking color rationale

The CUI banner uses #6f42c1 (purple). This is OFF the Semper brand palette intentionally. CUI marking convention follows the CUI Registry visual standard. Substituting brand colors weakens cross-component marking recognition. Documented as a deliberate regulatory override, not a brand violation. Inline style comment in the CSS calls this out.

### Print export theme directive

User directive 2026-05-23: "dark per the guide but exports should be light." Two enforcements:

1. The main `@media print` rule in the inline style block forces light parchment colors and hides topbar / theme toggle / toast container / DoD overlay / app footer.
2. The `generateHTMLReport()` function injects a fresh light-theme stylesheet into the print window. It does not inherit dark mode because the new window has no `.dark` class on its `<html>`.

### Style-guide compliance status against pitfall list

- Pitfall 1 (hardcoded hex breaks dark swap): RESOLVED for in-app styles. Remaining hex inside `generateHTMLReport` is by design (the print window does not import semper-tokens.css). CUI banner hex (#6f42c1) is the deliberate regulatory override.
- Pitfall 2 (Bebas everywhere flattens hierarchy): RESOLVED. Bebas used only on hero title and stat-tile numerics. Inter owns h2, h3.
- Pitfall 3 (off-scale spacing): RESOLVED for new portal classes. Existing inline `style="margin: 30px..."` instances in the result modal need a follow-on pass to normalize.
- Pitfall 4 (skipping prefers-reduced-motion): RESOLVED via semper-tokens.css gate.
- Pitfall 5 (gradient text on long copy fails contrast): RESOLVED. Single-keyword "(PEBD)" only.
- Pitfall 6 (floating chrome without backdrop blur): RESOLVED. chrome-floating class includes backdrop-filter blur 14px.

## COMPLIANCE PASS (prior session, preserved)

### CR-01 DoD Notice and Consent Banner (DoDI 8500.01 Encl 3)
Click-through interstitial overlay using verbatim long-form DoD banner text. Body `consent-pending` class blurs and disables the app until acknowledged. "Decline and Exit" wipes the DOM.

### CR-02 Filename Tag Hardening (Privacy Act of 1974)
Section retitled "Export Filename Tag." Placeholder changed to "Reference label (avoid full names or EDIPI)." Input pattern restricts to A-Z, a-z, 0-9, space, underscore, hyphen, max 40 chars. PII warning displayed under the input. On CSV export, the tag is sanitized and appended to filename as `_TAG_CUI.csv`.

### CR-03 Strip localStorage (44 U.S.C. 3301, MCO 5210.11F)
All four localStorage call sites removed. Save/View/Clear UI retained but operates against session-only memory.

### CR-04 Remove Commercial Outbound Links (DoDI 8500.01)
linktr.ee link removed. Defunct Sentinel feedback link removed. Replaced with mailto: to SMB_Pay_Entry_Base_Date_Correction@usmc.mil.

### CR-05 + CR-09 CUI Markings (DoDI 5200.48)
Dynamic on-screen CUI//SP-PRVCY banner. Hidden by default. Activates on any form input. Renders at top and bottom of viewport. CSV export prepends CUI header rows and appends CUI trailer row. CSV export shows confirmation dialog warning user file is CUI. Print report includes CUI header above title and CUI footer below verification section.

### CR-10 Banner Config Object
`window.COMPLIANCE_CONFIG` single source of truth for appName, appOwner, cuiMarking, feedbackMailto, paaReference, maradminReference.

### CR-11 Content Security Policy (NIST SP 800-53 SC-18)
CSP meta with default-src 'self', frame-ancestors 'none', form-action 'self', font-src 'self'. Script-src retains 'unsafe-inline' pending CR-12.

### CR-13 SharePoint Link Hygiene
rel="noopener noreferrer" added to both header reference anchors.

## DEFERRED TO FOLLOW-ON PASSES

### CR-06 CAC Authentication (DoDI 8520.03)
Risk Accepted by Stephen on 2026-05-23. POA&M item. Implementation belongs at the .mil web server tier.

### CR-07 Audit Logging (NIST SP 800-53 AU-2..AU-12)
Risk Accepted by Stephen on 2026-05-23. POA&M item. Implementation belongs at the .mil server tier.

### CR-08 XSS Hardening of innerHTML Sinks (DoDI 5200.44)
Not applied. 30+ sites including notes field render-back. Use DOMPurify or replace innerHTML with textContent + DOM construction.

### CR-12 Inline Event Handler Refactor
Not applied. Required to drop 'unsafe-inline' from CSP script-src.

### CR-14 Code Defect Closure (Test/App Divergence)
Not applied. parseDate timezone divergence and calculateCreditableDaysFromBlocks divergence remain. Extract pebd-core.js as shared module.

## VERIFICATION RESULTS (post Portal-rebuild)

- Functional localStorage calls: 0
- Commercial outbound href links: 0
- CSP meta tag: 1
- DoD consent overlay references: 11
- CUI banner references: 7
- rel="noopener noreferrer" on SharePoint and marines.mil links: 2
- Semper Portal token sheet linked: 1
- Floating topbar present: 1
- Theme toggle button present: 1
- Gradient accent on "(PEBD)" keyword: 1
- Stat tiles in result summary: 3
- Ambient bloom container wrap: 1
- Dark class on `<html>`: 1
- Final file line count: ~3,162 lines

## PRE-MIGRATION CHECKLIST (handoff to .mil deployment)

1. Drop the three font files into `assets/fonts/` in the GitLab repo.
2. Open the remediated index.html locally. DoD banner appears first.
3. Acknowledge consent. UI renders in dark navy theme by default.
4. Click "Light theme" in the topbar. Theme switches to parchment.
5. Switch back to dark. Type any character in any input. Purple CUI banner activates.
6. Run a calculation. Result modal shows three stat tiles with brass icons and Bebas Neue numerics.
7. Export to CSV. CUI confirmation prompt fires. Downloaded file contains CUI header and trailer.
8. Print Report. Print preview renders in light parchment, NOT dark theme. CUI banner color preserved.
9. DevTools console reports no CSP violations.
10. Re-run the 54-test suite in test-calculations.js. No regressions.
11. Confirm the .mil server tier enforces CAC PKI on the route serving the app (CR-06).
12. Confirm the .mil log forwarder receives audit events when wired (CR-07).
