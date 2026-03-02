# Marine Corps Pay Entry Base Date (PEBD) Calculator

A web-based calculator for determining a Marine's Pay Entry Base Date (PEBD) in accordance with **PAA 04-25** (Creditable Service & PEBD) and **MARADMIN 052/26** (MCTFS PEBD Advisory).

## Overview

PEBD determines a service member's pay longevity and is calculated by subtracting total creditable service from the current date of entry. This tool automates the arithmetic defined in PAA 04-25, handling service period grouping, inclusive day adjustments, time loss deductions, and date normalization.

## Features

- **Basic and Advanced Modes** — Basic mode for straightforward calculations; Advanced mode adds CSV import/export and additional options
- **Multiple Service Periods** — Add unlimited service periods with start/end dates, service type, and branch of service
- **~35 Service Types** — Automatic creditability determination including special Military Academy logic (Officer vs. Enlisted pathways)
- **Time Loss Deductions** — Support for AWOL, confinement, civil authority detention, and other time loss types per DODFMR Chapter 1
- **Continuous Block Grouping** — Consecutive service periods are automatically grouped into continuous blocks with +1 inclusive day adjustments per creditable block
- **Real-Time Validation** — Date validation with visual feedback as you enter service periods
- **Results Modal** — Calculation results displayed in a popup with detailed breakdown tables
- **Print Report** — Generate a formatted print report with governing references, calculation details, and corrective action guidance
- **Save/Load Calculations** — Persist calculations to localStorage for later retrieval
- **Calculation History** — Clickable history entries to reload previous calculations into the form
- **CSV Import/Export** — Import service periods from CSV files or export current data (Advanced mode)
- **Toast Notifications** — Non-intrusive toast messages for user feedback
- **MARADMIN 052/26 Compliance** — Includes D188 remark guidance, corrective action workflow, and MMPB-21 contact information

## Governing References

| Reference | Description |
|-----------|-------------|
| [PAA 04-25](https://usmc.sharepoint-mil.us/sites/dcmra_mra_mi_missa/Lists/PAA/DispForm.aspx?ID=127&e=qD8Oj2) | Creditable Service & PEBD calculation methodology |
| [MARADMIN 052/26](https://www.marines.mil/News/Messages/Messages-Display/Article/4409903/marine-corps-total-force-system-advisory-to-identify-required-corrections-to-pa/) | MCTFS Advisory for PEBD corrections |
| DODFMR Volume 7A, Chapter 1 | Time loss deduction rules |
| MCO 1900.16 | Separation and retirement manual |
| MCO P1070.12K | IRAM (Individual Records Administration Manual) |
| SECNAVINST 1000.30B | Creditable service determination |

## Calculation Logic

1. **Input** — Foundational PEBD (current date of entry), Marine status (Officer/Enlisted), service periods, and time loss periods
2. **Creditability Check** — Each service period is evaluated against PAA 04-25 rules for the given pathway type
3. **Continuous Block Grouping** — Creditable periods are sorted chronologically and grouped into consecutive blocks (no gaps between end and next start)
4. **Inclusive Day Adjustment** — Each continuous block of creditable service receives +1 day for inclusive counting
5. **Summation** — Begin totals and end totals are calculated across all creditable blocks
6. **Difference** — End totals minus begin totals plus inclusive adjustments
7. **Time Loss Deduction** — Applicable time loss is subtracted from the total creditable service
8. **Normalization** — Days, months, and years are normalized (e.g., 35 days becomes 1 month and 5 days)
9. **PEBD Derivation** — Total creditable service is subtracted from the foundational PEBD to produce the calculated PEBD

## Project Structure

```
PEBD-CALCULATOR/
├── index.html              # Complete application (HTML, CSS, JS)
├── test-calculations.js    # Calculation logic test suite (54 tests)
├── README.md
└── assets/
    └── images/
        └── logo.png
```

## Usage

Open `index.html` in any modern web browser. No server, build step, or dependencies required.

1. Enter the Marine's current PEBD (foundational date of entry)
2. Select Marine status (Officer or Enlisted) and pathway type
3. Add service periods with dates, service type, and branch
4. Add time loss periods if applicable
5. Click **Calculate PEBD** to view results in the modal
6. Use **Print Report** to generate a formatted report

## Testing

The test suite verifies calculation correctness across 54 scenarios in 10 categories:

- Helper functions (date parsing, inclusive day counting)
- Service type creditability rules
- Time loss deductibility rules
- Continuous block grouping algorithm
- Full PEBD calculations
- Time loss integration
- Date normalization
- Edge cases (single day, 20+ years, leap year, many periods)
- Multi-service branch scenarios
- PEBD date arithmetic verification

Run with Node.js:

```bash
node test-calculations.js
```

## Technical Details

- **Single-page application** — Vanilla HTML, CSS, and JavaScript with no external dependencies
- **Client-side only** — All calculations run in the browser; no data is sent to any server
- **localStorage** — Saved calculations and history persist in the browser
- **Responsive design** — Works on desktop and mobile browsers
- **Print-optimized** — Dedicated print styles for report generation
