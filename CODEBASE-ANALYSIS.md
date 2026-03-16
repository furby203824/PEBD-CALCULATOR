# PEBD Calculator — Codebase Analysis Report

**Date:** 2026-03-11
**Analyzed by:** Claude Code Skills (simplify, session-start-hook)
**Scope:** Full codebase analysis — no code changes made

---

## Executive Summary

The PEBD Calculator is a well-functioning, single-file Marine Corps Pay Entry Base Date calculator with 54 passing tests. However, analysis across three dimensions (code reuse, code quality, and efficiency) reveals **40+ findings** ranging from critical (potential XSS, timezone bugs) to low-priority (minor CSS optimizations). The most impactful improvements would be extracting shared business logic into a module, eliminating DOM query duplication, and addressing accessibility gaps.

---

## 1. Code Reuse Findings (18 issues)

### Critical: Test/App Code Divergence

| # | Finding | Test Lines | App Lines | Severity |
|---|---------|-----------|-----------|----------|
| 1 | `SERVICE_TYPES` duplicated & diverged (28 vs 34 entries) | 8-28 | 1361-1404 | **High** |
| 2 | `TIME_LOSS_TYPES` duplicated & diverged (11 vs 16 entries) | 30-42 | 1407-1424 | **High** |
| 3 | `isServiceCreditable()` duplicated (compact vs verbose) | 44-50 | 1436-1449 | Medium |
| 4 | `isTimeLossDeductible()` exact duplicate | 52-54 | 1452-1454 | Medium |
| 5 | `parseDate()` duplicated with **behavioral divergence** — test uses local time, app uses UTC for YYYY-MM-DD | 56-69 | 1531-1548 | **High (Bug)** |
| 6 | `calculateDaysInclusive()` exact duplicate | 71-76 | 1551-1556 | Medium |
| 7 | `groupAllPeriodsIntoContinuousBlocks()` exact duplicate | 78-107 | 1564-1603 | Medium |
| 8 | `calculateCreditableDaysFromBlocks()` duplicated with divergence | 109-126 | 1606-1630 | **High** |
| 9 | `computePEBD()` duplicates entire `calculatePEBD()` core (~75 lines) | 129-205 | 2185-2412 | **High** |

**Recommendation:** Extract business logic into a shared `pebd-core.js` module importable by both app and tests.

### Internal Duplication in index.html

| # | Finding | Lines | Severity |
|---|---------|-------|----------|
| 10 | `calculateDays()` is a redundant wrapper for `calculateDaysInclusive()` | 1559-1561 | Low |
| 11 | Hand-rolled `.replace(/-/g, '')` instead of `dateToYYYYMMDD()` utility (3 locations) | 1552, 2198 | Low |
| 12 | Date-to-YYYYMMDD string formatting duplicated 3 times | 1642-1645, 2410-2412 | Medium |
| 13 | `validateServicePeriod` / `validateTimeLossPeriod` near-clone | 1649-1696 | Medium |
| 14 | Day display + validation icon rendering duplicated verbatim | 1727-1743, 1795-1812 | Medium |
| 15 | `renumberServicePeriods` / `renumberTimeLossPeriods` identical except element ID | 2062-2079 | Low |
| 16 | `removeServicePeriod` / `removeTimeLossPeriod` near-identical | 2024-2058 | Medium |
| 17 | Load-period-into-form pattern triplicated | 2686-2719, 2800-2839, 2980-3015 | Medium |
| 18 | `displayResults()` recomputes `afterTimeLoss` inconsistently | 2482-2485 | **High (Bug)** |

---

## 2. Code Quality Findings (40 issues)

### Redundant State (4 issues)
- **1a.** `calculationResult` stores `years/months/days` redundantly with `normalized.*` (lines 2434-2436)
- **1b.** `validationErrors` global array rebuilt every call, never read externally (line 1431)
- **1c.** `afterTimeLoss` recomputed in `displayResults` with different logic than `calculatePEBD` — **inconsistency bug** (lines 2482-2485)
- **1d.** `servicePeriodCount`/`timeLossPeriodCount` duplicate DOM child count (lines 1432-1433)

### Copy-Paste with Variation (7 issues)
- **3a.** Validation functions near-identical (lines 1649-1696)
- **3b.** Update functions share 14 lines verbatim (lines 1727-1744 vs 1795-1812)
- **3c.** Renumber functions identical except element ID (lines 2062-2079)
- **3d.** Load functions duplicate period-loading logic (lines 2672-2721 vs 2784-2843)
- **3e.** Remove functions near-identical (lines 2024-2059)
- **3f.** 9 functions fully duplicated between index.html and test file
- **3g.** Dead branch in `loadCalculation` — both if/else do the same thing (lines 2800-2806)

### Leaky Abstractions (3 issues)
- **4a.** `calculatePEBD` is 280 lines mixing DOM, validation, business logic, CSS, and history — **untestable** (lines 2185-2468)
- **4b.** `parseDate` timezone divergence between app and tests — **latent bug**
- **4c.** HTML built via template literals with unescaped user input (notes fields) — **potential XSS** (lines 2566, 2602)

### Stringly-Typed Code (5 issues)
- **5a.** `'Enlisted'` / `'Officer'` raw strings at 15+ locations — should be constants
- **5b.** `pathwayType.includes("Officer")` — fragile substring match (line 1441)
- **5c.** Mode values as raw strings constructing element IDs (line 1462)
- **5d.** Toast type parameter unvalidated (line 1347)
- **5e.** `data-field` attribute names repeated as strings throughout

### Global State (3 issues)
- **6a.** 7 global mutable variables with no encapsulation (lines 1427-1433)
- **6b.** `calculatePEBD` relies on implicit `event` global — **breaks in Firefox strict mode** (line 2188)
- **6c.** ~30 functions polluting global namespace

### Error Handling Gaps (6 issues)
- **7a.** `JSON.parse(localStorage...)` at startup can crash entire app on corrupt data (line 1430) — **High**
- **7b.** CSV import uses naive comma-split — breaks on commas in quoted fields (line 2954)
- **7c.** `window.open()` return not null-checked — crashes if popup blocked (line 3038)
- **7d.** Element existence not checked before `.remove()` — race condition (lines 2024-2025)
- **7e.** No `QuotaExceededError` handling for `localStorage.setItem` (lines 2745, 3308)
- **7f.** Error handler references potentially-undefined `event.target` (line 2465)

### Accessibility (10 issues)
- **8a.** Modal has no focus trap — **WCAG 2.1 Level A violation** (line 1260)
- **8b.** Modal lacks `role="dialog"`, `aria-modal`, `aria-labelledby`
- **8c.** Toast container missing `role="status"` / `aria-live="polite"` (line 1028)
- **8d.** Validation errors not announced to screen readers (line 2126)
- **8e.** History items use `onclick` on `div` — not keyboard-accessible (line 2658)
- **8f.** Table cells use inappropriate `role="gridcell"` without grid keyboard behavior
- **8g.** Labels containing only `&nbsp;` provide no accessible name (lines 1097-1105)
- **8h.** Color alone distinguishes creditable/non-creditable status (lines 374-382)
- **8i.** `innerHTML` replacement destroys focus state in table headers (lines 1837-1860)
- **8j.** `confirm()` dialogs block UI without ARIA announcements

---

## 3. Efficiency Findings (22 issues)

### High Priority

| # | Finding | Lines | Impact |
|---|---------|-------|--------|
| 1 | Double DOM querying: validation + calculation query every input twice | 2207, 2222-2333 | ~130 extra querySelector calls per calculate |
| 2 | `collectAllInputData()` re-queries all DOM a third time | 2449 | Triples DOM queries |
| 3 | `updateTimeLossTableStructure` destroys/recreates all rows to toggle one column | 1829-1876 | 14+ DOM queries per row |

### Medium Priority

| # | Finding | Lines | Impact |
|---|---------|-------|--------|
| 4 | SERVICE_TYPES options HTML rebuilt (34 entries) on every `addServicePeriod` | 1972 | Could cache |
| 5 | `innerHTML +=` inside validation loop causes repeated reparse | 2098-2119 | DOM thrashing |
| 6 | `transition: all` on every input/select element | 282 | Browser tracks all CSS properties |
| 7 | No localStorage quota error handling | 2745, 3308 | Silent data loss |
| 8 | No size limit on savedCalculations | 2744 | Unbounded growth |
| 9 | Synchronous JSON.parse at module scope blocks initialization | 1430 | Startup delay |
| 10 | `loadCalculation` triggers `resetAll()` confirm dialog then rebuilds everything twice | 2797 | Poor UX + wasted DOM work |

### Low Priority

| # | Finding | Lines | Impact |
|---|---------|-------|--------|
| 11 | Complex CSS starfield with multiple box-shadows on body | 34-113 | Paint cost |
| 12 | `max-height: 600px` transition for collapsible content | 709-717 | Layout thrashing |
| 13 | Keyboard listener checks 5 conditions on every keypress | 3276-3296 | Minimal |
| 14 | `printReport` uses 250ms setTimeout instead of load event | 3042 | Fragile timing |
| 15 | `renumber*` functions query `.empty-state` on each child | 2062-2079 | Minor with max 20 rows |
| 16 | Object URL potentially revoked before download completes | 2914-2921 | Browser-dependent race |
| 17 | `updateAllPeriods` re-renders all periods when only Academy creditability changes | 1816-1826 | Over-broad update |
| 18 | `showSavedCalculations` rebuilds entire list HTML on every call | 2752-2781 | Minor |
| 19 | Full history serialized on every page unload even if unchanged | 3308 | Wasted serialization |
| 20 | Two localStorage reads + JSON.parse at startup | 1430, 3299-3303 | Startup cost |
| 21 | Button hover transforms promote elements to compositing layers | 432-472 | Minor |
| 22 | `actuallyDeductible` computed but never used | 1772 | Dead code |

---

## 4. Session-Start Hook Analysis

**Project characteristics:**
- Zero external dependencies (vanilla HTML/CSS/JS)
- Tests run with `node test-calculations.js` (Node.js required)
- No build step, linter, or package manager configured

**Hook setup:** Created `.claude/hooks/session-start.sh` and `.claude/settings.json` to verify Node.js availability in remote Claude Code sessions.

---

## Priority Recommendations (No Code Changes Made)

### Immediate (Bugs & Security)
1. **Fix `parseDate` timezone divergence** between app (UTC) and tests (local time) — line 1543 vs test line 64
2. **Escape user input in HTML templates** to prevent XSS — lines 2566, 2602
3. **Wrap `localStorage` JSON.parse in try/catch** — line 1430 crashes app on corrupt data
4. **Fix `afterTimeLoss` inconsistency** between `calculatePEBD` and `displayResults` — line 2482
5. **Add null check for `window.open()`** — line 3038

### High Value Refactors
6. **Extract business logic into `pebd-core.js`** — eliminates 9 duplicated functions between app and tests
7. **Parameterize duplicated DOM functions** — validate, update, renumber, remove, load patterns
8. **Add modal focus trap and ARIA attributes** — WCAG compliance
9. **Cache DOM queries** — eliminate triple-querying on every calculation

### Nice to Have
10. Define string constants for marine status, pathway types, mode values
11. Add toast container `aria-live` region
12. Limit saved calculations count and handle quota errors
13. Replace `transition: all` with specific properties
