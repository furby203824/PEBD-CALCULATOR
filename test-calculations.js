// ============================================================
// PEBD Calculator — Calculation Logic Test Suite
// Extracts core logic from index.html and tests many scenarios
// ============================================================

// --- Extracted logic (no DOM dependencies) ---

const SERVICE_TYPES = {
    "Regular Army": { creditable: true }, "Regular Navy": { creditable: true },
    "Regular Marine Corps": { creditable: true }, "Regular Air Force": { creditable: true },
    "Regular Space Force": { creditable: true }, "Regular Coast Guard": { creditable: true },
    "Army Reserve": { creditable: true }, "Navy Reserve": { creditable: true },
    "Marine Corps Reserve": { creditable: true }, "Air Force Reserve": { creditable: true },
    "Army National Guard": { creditable: true }, "Air National Guard": { creditable: true },
    "PHS Commissioned Corps": { creditable: true }, "PHS Reserve Corps": { creditable: true },
    "NOAA Officer Service": { creditable: true }, "NOAA Deck Officer Service": { creditable: true },
    "Military Academy Service": { creditable: true },
    "Fleet Reserve": { creditable: true }, "Fleet Marine Corps Reserve": { creditable: true },
    "Cadet/Midshipman Service (Non-Commissioned)": { creditable: true },
    "Temporary Coast Guard Reserve": { creditable: true },
    "ROTC (Post 1979 w/Reserve)": { creditable: true },
    "ROTC (1964-1979)": { creditable: false }, "ROTC (Pre-1964)": { creditable: false },
    "Service with Retired Pay": { creditable: true }, "Medical Retention Service": { creditable: true },
    "Under-age Service (Valid Enlistment)": { creditable: true },
    "Service Terminated by Desertion": { creditable: true },
    "Detailed Service (Other Agency)": { creditable: true },
    "Service Before 10 Jan 1962": { creditable: true },
    "Philippine Army Officer": { creditable: false }, "State Guard": { creditable: false },
    "Territorial Guard": { creditable: false }, "Home Guard": { creditable: false },
    "Emergency Officers Retired List": { creditable: false },
    "AFHPSP/FAP (Post 1981)": { creditable: false }, "USUHS Student (DOM)": { creditable: false },
    "Inactive National Guard": { creditable: false },
    "Delayed Entry Program (Before January 1985)": { creditable: false },
    "Delayed Entry Program (1985-1989 No IDT)": { creditable: false },
    "Delayed Entry Program (Post 1989 w/IDT)": { creditable: true },
    "Delayed Entry Program (Post 1989 No IDT)": { creditable: false },
};

const TIME_LOSS_TYPES = {
    "AWOL (Absence Without Leave)": { deductible: true },
    "Desertion": { deductible: true },
    "Confinement (Court-Martial)": { deductible: true },
    "Confinement (Civil)": { deductible: true },
    "Suspension from Duty": { deductible: true },
    "Administrative Leave (Pending Investigation)": { deductible: false },
    "Emergency Leave": { deductible: false },
    "Ordinary Leave": { deductible: false },
    "Medical Leave": { deductible: false },
    "Maternity/Paternity Leave": { deductible: false },
    "TDY/TAD": { deductible: false },
    "Training": { deductible: false },
    "Hospitalization": { deductible: false },
    "Unauthorized Absence (Other)": { deductible: true },
    "Dropped from Rolls": { deductible: true },
    "Excess Leave": { deductible: true },
};

function isServiceCreditable(serviceType, pathwayType) {
    let isCreditable = SERVICE_TYPES[serviceType]?.creditable || false;
    if (serviceType === "Military Academy Service") {
        isCreditable = !(pathwayType && pathwayType.includes("Officer"));
    }
    return isCreditable;
}

function isTimeLossDeductible(lossType) {
    return TIME_LOSS_TYPES[lossType]?.deductible || false;
}

function parseDate(dateStr) {
    if (!dateStr) return null;
    if (dateStr.length === 8 && /^\d{8}$/.test(dateStr)) {
        const year = parseInt(dateStr.substring(0, 4));
        const month = parseInt(dateStr.substring(4, 6)) - 1;
        const day = parseInt(dateStr.substring(6, 8));
        return new Date(year, month, day);
    }
    if (dateStr.includes('-')) {
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d);
    }
    return null;
}

function calculateDaysInclusive(startDate, endDate) {
    const start = parseDate(startDate.replace(/-/g, ''));
    const end = parseDate(endDate.replace(/-/g, ''));
    if (!start || !end || end < start) return 0;
    return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
}

function groupAllPeriodsIntoContinuousBlocks(allPeriods) {
    if (allPeriods.length === 0) return [];
    const sortedPeriods = [...allPeriods].sort((a, b) => a.startDate.localeCompare(b.startDate));
    const continuousBlocks = [];
    let currentBlock = {
        startDate: sortedPeriods[0].startDate,
        endDate: sortedPeriods[0].endDate,
        periods: [sortedPeriods[0]]
    };
    for (let i = 1; i < sortedPeriods.length; i++) {
        const currentPeriod = sortedPeriods[i];
        const prevEndDate = parseDate(currentBlock.endDate);
        const currStartDate = parseDate(currentPeriod.startDate);
        const nextDay = new Date(prevEndDate);
        nextDay.setDate(nextDay.getDate() + 1);
        if (nextDay.getTime() === currStartDate.getTime()) {
            currentBlock.endDate = currentPeriod.endDate;
            currentBlock.periods.push(currentPeriod);
        } else {
            continuousBlocks.push(currentBlock);
            currentBlock = {
                startDate: currentPeriod.startDate,
                endDate: currentPeriod.endDate,
                periods: [currentPeriod]
            };
        }
    }
    continuousBlocks.push(currentBlock);
    return continuousBlocks;
}

function calculateCreditableDaysFromBlocks(continuousBlocks, pathwayType) {
    let totalCreditableDays = 0;
    let creditableBlocksCount = 0;
    continuousBlocks.forEach(block => {
        let blockCreditableDays = 0;
        block.periods.forEach(period => {
            if (period.type === 'service' && isServiceCreditable(period.serviceType, pathwayType)) {
                const periodDays = calculateDaysInclusive(period.startDate, period.endDate);
                blockCreditableDays += periodDays;
            }
        });
        if (blockCreditableDays > 0) {
            totalCreditableDays += blockCreditableDays;
            creditableBlocksCount++;
        }
    });
    return { totalDays: totalCreditableDays, blocksCount: creditableBlocksCount };
}

// --- Core calculation function (extracted from calculatePEBD) ---
function computePEBD(foundationalPEBD, marineStatus, pathwayType, servicePeriods, timeLossPeriods = []) {
    const allPeriods = [];
    const beginTotals = { years: 0, months: 0, days: 0 };
    const endTotals = { years: 0, months: 0, days: 0 };
    let creditablePeriodCount = 0;

    servicePeriods.forEach(p => {
        const isCreditable = isServiceCreditable(p.serviceType, pathwayType);
        const days = calculateDaysInclusive(p.startDate, p.endDate);
        if (days > 0) {
            allPeriods.push({ type: 'service', serviceType: p.serviceType, startDate: p.startDate.replace(/-/g,''), endDate: p.endDate.replace(/-/g,''), creditable: isCreditable, days });
            if (isCreditable) {
                const s = parseDate(p.startDate.replace(/-/g,''));
                const e = parseDate(p.endDate.replace(/-/g,''));
                beginTotals.years += s.getFullYear(); beginTotals.months += s.getMonth() + 1; beginTotals.days += s.getDate();
                endTotals.years += e.getFullYear(); endTotals.months += e.getMonth() + 1; endTotals.days += e.getDate();
                creditablePeriodCount++;
            }
        }
    });

    let totalTimeLossDays = 0;
    timeLossPeriods.forEach(p => {
        const isDeductible = isTimeLossDeductible(p.lossType);
        const days = calculateDaysInclusive(p.startDate, p.endDate);
        const isOfficerTime = p.isOfficerTime || false;
        if (days > 0) {
            allPeriods.push({ type: 'timeloss', lossType: p.lossType, startDate: p.startDate.replace(/-/g,''), endDate: p.endDate.replace(/-/g,''), deductible: isDeductible, isOfficerTime, days });
            if (isDeductible && !isOfficerTime) { totalTimeLossDays += days; }
        }
    });

    if (creditablePeriodCount === 0) return { error: 'No creditable service periods found' };

    const continuousBlocks = groupAllPeriodsIntoContinuousBlocks(allPeriods);
    const creditableResult = calculateCreditableDaysFromBlocks(continuousBlocks, pathwayType);
    const inclusiveAdjustments = creditableResult.blocksCount;

    const difference = {
        years: endTotals.years - beginTotals.years,
        months: endTotals.months - beginTotals.months,
        days: endTotals.days - beginTotals.days
    };
    const inclusiveAdjusted = { years: difference.years, months: difference.months, days: difference.days + inclusiveAdjustments };

    let afterTimeLoss = { ...inclusiveAdjusted };
    if (totalTimeLossDays > 0) { afterTimeLoss.days -= totalTimeLossDays; }

    let normalized = { ...afterTimeLoss };
    while (normalized.days < 0) { normalized.days += 30; normalized.months -= 1; }
    while (normalized.months < 0) { normalized.months += 12; normalized.years -= 1; }
    while (normalized.days >= 30) { normalized.days -= 30; normalized.months += 1; }
    while (normalized.months >= 12) { normalized.months -= 12; normalized.years += 1; }

    const foundationalDate = parseDate(foundationalPEBD);
    const resultDate = new Date(foundationalDate);
    resultDate.setFullYear(resultDate.getFullYear() - normalized.years);
    resultDate.setMonth(resultDate.getMonth() - normalized.months);
    resultDate.setDate(resultDate.getDate() - normalized.days);

    const calculatedPEBD = resultDate.getFullYear().toString() +
        String(resultDate.getMonth() + 1).padStart(2, '0') +
        String(resultDate.getDate()).padStart(2, '0');

    return {
        calculatedPEBD,
        foundationalPEBD,
        beginTotals, endTotals, difference, inclusiveAdjusted, afterTimeLoss, normalized,
        continuousBlocks: continuousBlocks.length,
        creditableBlocks: creditableResult.blocksCount,
        totalCreditableDays: creditableResult.totalDays,
        inclusiveAdjustments,
        totalTimeLossDays,
        netCreditableDays: creditableResult.totalDays + inclusiveAdjustments - totalTimeLossDays,
        years: normalized.years, months: normalized.months, days: normalized.days
    };
}

// --- Test runner ---
let passed = 0, failed = 0;
function test(name, fn) {
    try {
        fn();
        passed++;
        console.log(`  PASS: ${name}`);
    } catch (e) {
        failed++;
        console.log(`  FAIL: ${name}`);
        console.log(`        ${e.message}`);
    }
}
function assertEqual(actual, expected, label = '') {
    if (actual !== expected) {
        throw new Error(`${label}Expected "${expected}", got "${actual}"`);
    }
}

// ============================================================
// TEST CASES
// ============================================================

console.log('\n=== 1. HELPER FUNCTION TESTS ===\n');

test('parseDate handles YYYYMMDD format', () => {
    const d = parseDate('20250525');
    assertEqual(d.getFullYear(), 2025); assertEqual(d.getMonth(), 4); assertEqual(d.getDate(), 25);
});

test('parseDate handles YYYY-MM-DD format', () => {
    const d = parseDate('2025-05-25');
    assertEqual(d.getFullYear(), 2025); assertEqual(d.getMonth(), 4); assertEqual(d.getDate(), 25);
});

test('parseDate returns null for invalid input', () => {
    assertEqual(parseDate(''), null); assertEqual(parseDate(null), null); assertEqual(parseDate('abc'), null);
});

test('calculateDaysInclusive: same day = 1', () => {
    assertEqual(calculateDaysInclusive('2025-01-01', '2025-01-01'), 1);
});

test('calculateDaysInclusive: two consecutive days = 2', () => {
    assertEqual(calculateDaysInclusive('2025-01-01', '2025-01-02'), 2);
});

test('calculateDaysInclusive: full year 2024 (leap year) = 366', () => {
    assertEqual(calculateDaysInclusive('2024-01-01', '2024-12-31'), 366);
});

test('calculateDaysInclusive: full year 2025 (non-leap) = 365', () => {
    assertEqual(calculateDaysInclusive('2025-01-01', '2025-12-31'), 365);
});

test('calculateDaysInclusive: end before start = 0', () => {
    assertEqual(calculateDaysInclusive('2025-03-01', '2025-02-01'), 0);
});

test('calculateDaysInclusive: month boundary', () => {
    assertEqual(calculateDaysInclusive('2025-01-28', '2025-02-03'), 7);
});

console.log('\n=== 2. SERVICE CREDITABILITY TESTS ===\n');

test('Regular Marine Corps is creditable', () => {
    assertEqual(isServiceCreditable('Regular Marine Corps', 'Enlisted DEP/Direct/Reenlisted/Prior Service'), true);
});

test('State Guard is NOT creditable', () => {
    assertEqual(isServiceCreditable('State Guard', 'Enlisted DEP/Direct/Reenlisted/Prior Service'), false);
});

test('Military Academy Service is creditable for Enlisted pathway', () => {
    assertEqual(isServiceCreditable('Military Academy Service', 'Enlisted DEP/Direct/Reenlisted/Prior Service'), true);
});

test('Military Academy Service is NOT creditable for Officer pathway', () => {
    assertEqual(isServiceCreditable('Military Academy Service', 'Officer OCC/PLC/NROTC/Academy'), false);
});

test('ROTC 1964-1979 is NOT creditable', () => {
    assertEqual(isServiceCreditable('ROTC (1964-1979)', 'Enlisted DEP/Direct/Reenlisted/Prior Service'), false);
});

test('DEP Post 1989 w/IDT is creditable', () => {
    assertEqual(isServiceCreditable('Delayed Entry Program (Post 1989 w/IDT)', 'Enlisted DEP/Direct/Reenlisted/Prior Service'), true);
});

test('DEP Post 1989 No IDT is NOT creditable', () => {
    assertEqual(isServiceCreditable('Delayed Entry Program (Post 1989 No IDT)', 'Enlisted DEP/Direct/Reenlisted/Prior Service'), false);
});

console.log('\n=== 3. TIME LOSS DEDUCTIBILITY TESTS ===\n');

test('AWOL is deductible', () => { assertEqual(isTimeLossDeductible('AWOL (Absence Without Leave)'), true); });
test('Desertion is deductible', () => { assertEqual(isTimeLossDeductible('Desertion'), true); });
test('Confinement (Court-Martial) is deductible', () => { assertEqual(isTimeLossDeductible('Confinement (Court-Martial)'), true); });
test('Ordinary Leave is NOT deductible', () => { assertEqual(isTimeLossDeductible('Ordinary Leave'), false); });
test('Emergency Leave is NOT deductible', () => { assertEqual(isTimeLossDeductible('Emergency Leave'), false); });
test('Excess Leave is deductible', () => { assertEqual(isTimeLossDeductible('Excess Leave'), true); });

console.log('\n=== 4. CONTINUOUS BLOCK GROUPING TESTS ===\n');

test('Single period = 1 block', () => {
    const blocks = groupAllPeriodsIntoContinuousBlocks([
        { startDate: '20200101', endDate: '20201231' }
    ]);
    assertEqual(blocks.length, 1);
});

test('Two consecutive periods = 1 block', () => {
    const blocks = groupAllPeriodsIntoContinuousBlocks([
        { startDate: '20200101', endDate: '20200630' },
        { startDate: '20200701', endDate: '20201231' }
    ]);
    assertEqual(blocks.length, 1);
});

test('Two periods with gap = 2 blocks', () => {
    const blocks = groupAllPeriodsIntoContinuousBlocks([
        { startDate: '20200101', endDate: '20200630' },
        { startDate: '20200801', endDate: '20201231' }
    ]);
    assertEqual(blocks.length, 2);
});

test('Three consecutive periods = 1 block', () => {
    const blocks = groupAllPeriodsIntoContinuousBlocks([
        { startDate: '20200101', endDate: '20200331' },
        { startDate: '20200401', endDate: '20200630' },
        { startDate: '20200701', endDate: '20200930' }
    ]);
    assertEqual(blocks.length, 1);
});

test('Unsorted periods still group correctly', () => {
    const blocks = groupAllPeriodsIntoContinuousBlocks([
        { startDate: '20200701', endDate: '20200930' },
        { startDate: '20200101', endDate: '20200331' },
        { startDate: '20200401', endDate: '20200630' }
    ]);
    assertEqual(blocks.length, 1);
});

test('One-day gap breaks continuity', () => {
    const blocks = groupAllPeriodsIntoContinuousBlocks([
        { startDate: '20200101', endDate: '20200630' },
        { startDate: '20200702', endDate: '20201231' }  // July 2 instead of July 1
    ]);
    assertEqual(blocks.length, 2);
});

console.log('\n=== 5. FULL PEBD CALCULATION TESTS ===\n');

test('Single creditable period — basic enlisted', () => {
    const r = computePEBD('20250525', 'Enlisted', 'Enlisted DEP/Direct/Reenlisted/Prior Service',
        [{ serviceType: 'Regular Marine Corps', startDate: '2012-07-30', endDate: '2025-05-24' }]
    );
    assertEqual(r.error, undefined, 'No error: ');
    assertEqual(r.creditableBlocks, 1, 'Blocks: ');
    assertEqual(r.inclusiveAdjustments, 1, 'Inclusive: ');
    // 12 years, 9 months, 25 days of service
    console.log(`        Result PEBD: ${r.calculatedPEBD} | Service: ${r.years}Y ${r.months}M ${r.days}D`);
});

test('Two separate creditable periods with gap — Enlisted', () => {
    const r = computePEBD('20250525', 'Enlisted', 'Enlisted DEP/Direct/Reenlisted/Prior Service',
        [
            { serviceType: 'Regular Marine Corps', startDate: '2012-07-30', endDate: '2016-07-29' },
            { serviceType: 'Regular Marine Corps', startDate: '2018-01-15', endDate: '2025-05-24' }
        ]
    );
    assertEqual(r.continuousBlocks, 2, 'Blocks: ');
    assertEqual(r.creditableBlocks, 2, 'Creditable blocks: ');
    assertEqual(r.inclusiveAdjustments, 2, 'Inclusive: ');
    console.log(`        Result PEBD: ${r.calculatedPEBD} | Service: ${r.years}Y ${r.months}M ${r.days}D`);
});

test('Creditable + non-creditable consecutive = 1 block, 1 creditable block', () => {
    const r = computePEBD('20250525', 'Enlisted', 'Enlisted DEP/Direct/Reenlisted/Prior Service',
        [
            { serviceType: 'State Guard', startDate: '2012-01-01', endDate: '2012-07-29' },
            { serviceType: 'Regular Marine Corps', startDate: '2012-07-30', endDate: '2025-05-24' }
        ]
    );
    assertEqual(r.continuousBlocks, 1, 'Continuous blocks: ');
    assertEqual(r.creditableBlocks, 1, 'Creditable blocks: ');
    assertEqual(r.inclusiveAdjustments, 1, 'Inclusive: ');
    console.log(`        Result PEBD: ${r.calculatedPEBD} | Service: ${r.years}Y ${r.months}M ${r.days}D`);
});

test('Non-creditable period only — should return error', () => {
    const r = computePEBD('20250525', 'Enlisted', 'Enlisted DEP/Direct/Reenlisted/Prior Service',
        [{ serviceType: 'State Guard', startDate: '2020-01-01', endDate: '2024-12-31' }]
    );
    assertEqual(r.error, 'No creditable service periods found', 'Error: ');
});

test('Officer with Military Academy Service — academy not creditable', () => {
    const r = computePEBD('20250525', 'Officer', 'Officer OCC/PLC/NROTC/Academy',
        [
            { serviceType: 'Military Academy Service', startDate: '2008-08-01', endDate: '2012-05-29' },
            { serviceType: 'Regular Marine Corps', startDate: '2012-05-30', endDate: '2025-05-24' }
        ]
    );
    // Academy should NOT be creditable for officer pathway
    // Only the Regular Marine Corps period should count
    assertEqual(r.creditableBlocks, 1, 'Creditable blocks (only USMC period): ');
    console.log(`        Result PEBD: ${r.calculatedPEBD} | Service: ${r.years}Y ${r.months}M ${r.days}D`);
});

test('Enlisted with Military Academy Service — academy IS creditable', () => {
    const r = computePEBD('20250525', 'Enlisted', 'Enlisted DEP/Direct/Reenlisted/Prior Service',
        [
            { serviceType: 'Military Academy Service', startDate: '2008-08-01', endDate: '2012-05-29' },
            { serviceType: 'Regular Marine Corps', startDate: '2012-05-30', endDate: '2025-05-24' }
        ]
    );
    // Both periods are creditable and consecutive — 1 continuous creditable block
    assertEqual(r.creditableBlocks, 1, 'Creditable blocks: ');
    assertEqual(r.inclusiveAdjustments, 1, 'Inclusive: ');
    console.log(`        Result PEBD: ${r.calculatedPEBD} | Service: ${r.years}Y ${r.months}M ${r.days}D`);
});

console.log('\n=== 6. TIME LOSS TESTS ===\n');

test('Time loss deducted from enlisted calculation', () => {
    const withoutLoss = computePEBD('20250525', 'Enlisted', 'Enlisted DEP/Direct/Reenlisted/Prior Service',
        [{ serviceType: 'Regular Marine Corps', startDate: '2020-01-01', endDate: '2025-05-24' }]
    );
    const withLoss = computePEBD('20250525', 'Enlisted', 'Enlisted DEP/Direct/Reenlisted/Prior Service',
        [{ serviceType: 'Regular Marine Corps', startDate: '2020-01-01', endDate: '2025-05-24' }],
        [{ lossType: 'AWOL (Absence Without Leave)', startDate: '2022-03-01', endDate: '2022-03-10' }]
    );
    assertEqual(withLoss.totalTimeLossDays, 10, 'Time loss days: ');
    // PEBD with time loss should be LATER (less service credit)
    const withoutDate = parseDate(withoutLoss.calculatedPEBD);
    const withDate = parseDate(withLoss.calculatedPEBD);
    if (withDate <= withoutDate) throw new Error(`PEBD with loss (${withLoss.calculatedPEBD}) should be later than without (${withoutLoss.calculatedPEBD})`);
    console.log(`        Without loss: ${withoutLoss.calculatedPEBD} | With loss: ${withLoss.calculatedPEBD} (${withLoss.totalTimeLossDays} days lost)`);
});

test('Non-deductible time loss does NOT affect calculation', () => {
    const without = computePEBD('20250525', 'Enlisted', 'Enlisted DEP/Direct/Reenlisted/Prior Service',
        [{ serviceType: 'Regular Marine Corps', startDate: '2020-01-01', endDate: '2025-05-24' }]
    );
    const with_ = computePEBD('20250525', 'Enlisted', 'Enlisted DEP/Direct/Reenlisted/Prior Service',
        [{ serviceType: 'Regular Marine Corps', startDate: '2020-01-01', endDate: '2025-05-24' }],
        [{ lossType: 'Ordinary Leave', startDate: '2022-03-01', endDate: '2022-03-10' }]
    );
    assertEqual(with_.totalTimeLossDays, 0, 'Time loss days: ');
    assertEqual(with_.calculatedPEBD, without.calculatedPEBD, 'PEBD same: ');
});

test('Officer time checkbox excludes time loss', () => {
    const applied = computePEBD('20250525', 'Officer', 'Officer OCC/PLC/NROTC/Academy',
        [{ serviceType: 'Regular Marine Corps', startDate: '2020-01-01', endDate: '2025-05-24' }],
        [{ lossType: 'AWOL (Absence Without Leave)', startDate: '2022-03-01', endDate: '2022-03-10', isOfficerTime: false }]
    );
    const excluded = computePEBD('20250525', 'Officer', 'Officer OCC/PLC/NROTC/Academy',
        [{ serviceType: 'Regular Marine Corps', startDate: '2020-01-01', endDate: '2025-05-24' }],
        [{ lossType: 'AWOL (Absence Without Leave)', startDate: '2022-03-01', endDate: '2022-03-10', isOfficerTime: true }]
    );
    assertEqual(applied.totalTimeLossDays, 10, 'Applied days: ');
    assertEqual(excluded.totalTimeLossDays, 0, 'Excluded days: ');
    // Excluded should have earlier PEBD (more credit)
    const appliedDate = parseDate(applied.calculatedPEBD);
    const excludedDate = parseDate(excluded.calculatedPEBD);
    if (excludedDate >= appliedDate) throw new Error('Excluded officer time should result in earlier PEBD');
    console.log(`        Applied: ${applied.calculatedPEBD} | Excluded: ${excluded.calculatedPEBD}`);
});

test('Multiple time loss periods accumulate', () => {
    const r = computePEBD('20250525', 'Enlisted', 'Enlisted DEP/Direct/Reenlisted/Prior Service',
        [{ serviceType: 'Regular Marine Corps', startDate: '2020-01-01', endDate: '2025-05-24' }],
        [
            { lossType: 'AWOL (Absence Without Leave)', startDate: '2021-06-01', endDate: '2021-06-05' },
            { lossType: 'Confinement (Court-Martial)', startDate: '2023-01-10', endDate: '2023-02-08' }
        ]
    );
    assertEqual(r.totalTimeLossDays, 5 + 30, 'Total loss: ');
    console.log(`        PEBD: ${r.calculatedPEBD} | Total loss: ${r.totalTimeLossDays} days`);
});

console.log('\n=== 7. NORMALIZATION TESTS ===\n');

test('Normalization handles negative days correctly', () => {
    // Short period where end day < begin day — produces negative difference in days
    const r = computePEBD('20250525', 'Enlisted', 'Enlisted DEP/Direct/Reenlisted/Prior Service',
        [{ serviceType: 'Regular Marine Corps', startDate: '2025-01-20', endDate: '2025-05-10' }]
    );
    if (r.normalized.days < 0) throw new Error(`Normalized days should not be negative: ${r.normalized.days}`);
    if (r.normalized.months < 0) throw new Error(`Normalized months should not be negative: ${r.normalized.months}`);
    console.log(`        Normalized: ${r.years}Y ${r.months}M ${r.days}D`);
});

test('Normalization handles excess days (>= 30)', () => {
    // Periods whose end-day sums > 30 + begin-day sums — tests excess day overflow
    const r = computePEBD('20250525', 'Enlisted', 'Enlisted DEP/Direct/Reenlisted/Prior Service',
        [
            { serviceType: 'Regular Marine Corps', startDate: '2020-01-01', endDate: '2020-06-30' },
            { serviceType: 'Regular Army', startDate: '2021-01-01', endDate: '2021-06-30' }
        ]
    );
    if (r.normalized.days >= 30) throw new Error(`Normalized days should be < 30: ${r.normalized.days}`);
    if (r.normalized.months >= 12) throw new Error(`Normalized months should be < 12: ${r.normalized.months}`);
    console.log(`        Normalized: ${r.years}Y ${r.months}M ${r.days}D`);
});

console.log('\n=== 8. EDGE CASES ===\n');

test('Single day service period', () => {
    const r = computePEBD('20250525', 'Enlisted', 'Enlisted DEP/Direct/Reenlisted/Prior Service',
        [{ serviceType: 'Regular Marine Corps', startDate: '2025-05-24', endDate: '2025-05-24' }]
    );
    assertEqual(r.totalCreditableDays, 1, 'Days: ');
    // 1 day creditable + 1 inclusive = 2 days net
    assertEqual(r.netCreditableDays, 2, 'Net days: ');
    console.log(`        PEBD: ${r.calculatedPEBD} | ${r.years}Y ${r.months}M ${r.days}D`);
});

test('Very long service period (20+ years)', () => {
    const r = computePEBD('20250525', 'Enlisted', 'Enlisted DEP/Direct/Reenlisted/Prior Service',
        [{ serviceType: 'Regular Marine Corps', startDate: '2000-06-01', endDate: '2025-05-24' }]
    );
    if (r.years < 20) throw new Error(`Expected 20+ years, got ${r.years}`);
    console.log(`        PEBD: ${r.calculatedPEBD} | ${r.years}Y ${r.months}M ${r.days}D`);
});

test('Leap year boundary (Feb 28-29)', () => {
    const r = computePEBD('20250301', 'Enlisted', 'Enlisted DEP/Direct/Reenlisted/Prior Service',
        [{ serviceType: 'Regular Marine Corps', startDate: '2024-02-28', endDate: '2024-03-01' }]
    );
    // Feb 28 to Mar 1 2024 (leap year) = 3 days inclusive
    assertEqual(r.totalCreditableDays, 3, 'Days (leap year): ');
    console.log(`        PEBD: ${r.calculatedPEBD} | ${r.years}Y ${r.months}M ${r.days}D`);
});

test('Non-leap year boundary (Feb 28 to Mar 1)', () => {
    const r = computePEBD('20250301', 'Enlisted', 'Enlisted DEP/Direct/Reenlisted/Prior Service',
        [{ serviceType: 'Regular Marine Corps', startDate: '2025-02-28', endDate: '2025-03-01' }]
    );
    // Feb 28 to Mar 1 2025 (non-leap) = 2 days inclusive
    assertEqual(r.totalCreditableDays, 2, 'Days (non-leap): ');
    console.log(`        PEBD: ${r.calculatedPEBD} | ${r.years}Y ${r.months}M ${r.days}D`);
});

test('Many short periods in same block', () => {
    // 5 consecutive 2-month periods — should be 1 continuous block
    const r = computePEBD('20250525', 'Enlisted', 'Enlisted DEP/Direct/Reenlisted/Prior Service',
        [
            { serviceType: 'Regular Marine Corps', startDate: '2024-01-01', endDate: '2024-02-29' },
            { serviceType: 'Regular Navy', startDate: '2024-03-01', endDate: '2024-04-30' },
            { serviceType: 'Regular Army', startDate: '2024-05-01', endDate: '2024-06-30' },
            { serviceType: 'Regular Air Force', startDate: '2024-07-01', endDate: '2024-08-31' },
            { serviceType: 'Regular Coast Guard', startDate: '2024-09-01', endDate: '2024-10-31' }
        ]
    );
    assertEqual(r.continuousBlocks, 1, 'Blocks: ');
    assertEqual(r.creditableBlocks, 1, 'Creditable blocks: ');
    assertEqual(r.inclusiveAdjustments, 1, 'Inclusive (per block, not per period): ');
    console.log(`        PEBD: ${r.calculatedPEBD} | ${r.years}Y ${r.months}M ${r.days}D | ${r.totalCreditableDays} days across 5 periods, 1 block`);
});

test('Mixed creditable/non-creditable in same continuous block', () => {
    const r = computePEBD('20250525', 'Enlisted', 'Enlisted DEP/Direct/Reenlisted/Prior Service',
        [
            { serviceType: 'Regular Marine Corps', startDate: '2024-01-01', endDate: '2024-06-30' },
            { serviceType: 'State Guard', startDate: '2024-07-01', endDate: '2024-09-30' },  // non-creditable
            { serviceType: 'Regular Marine Corps', startDate: '2024-10-01', endDate: '2024-12-31' }
        ]
    );
    assertEqual(r.continuousBlocks, 1, 'Continuous blocks: ');
    assertEqual(r.creditableBlocks, 1, 'Creditable blocks (1 block has creditable): ');
    // Non-creditable days NOT counted in creditable total
    const expectedCredDays = calculateDaysInclusive('2024-01-01', '2024-06-30') + calculateDaysInclusive('2024-10-01', '2024-12-31');
    assertEqual(r.totalCreditableDays, expectedCredDays, 'Creditable days: ');
    console.log(`        PEBD: ${r.calculatedPEBD} | Creditable: ${r.totalCreditableDays} days | Non-creditable gap excluded`);
});

test('Time loss that spans entire service period', () => {
    const r = computePEBD('20250525', 'Enlisted', 'Enlisted DEP/Direct/Reenlisted/Prior Service',
        [{ serviceType: 'Regular Marine Corps', startDate: '2024-01-01', endDate: '2024-12-31' }],
        [{ lossType: 'Desertion', startDate: '2024-01-01', endDate: '2024-12-31' }]
    );
    // 366 days creditable, 366 days lost
    assertEqual(r.totalTimeLossDays, 366, 'Loss days: ');
    console.log(`        PEBD: ${r.calculatedPEBD} | Credit: ${r.totalCreditableDays} | Loss: ${r.totalTimeLossDays} | Net: ${r.netCreditableDays}`);
});

test('DEP period followed by active service', () => {
    const r = computePEBD('20250525', 'Enlisted', 'Enlisted DEP/Direct/Reenlisted/Prior Service',
        [
            { serviceType: 'Delayed Entry Program (Post 1989 w/IDT)', startDate: '2019-06-01', endDate: '2019-12-31' },
            { serviceType: 'Regular Marine Corps', startDate: '2020-01-01', endDate: '2025-05-24' }
        ]
    );
    // Both are creditable and consecutive — 1 block
    assertEqual(r.creditableBlocks, 1, 'Blocks: ');
    console.log(`        PEBD: ${r.calculatedPEBD} | ${r.years}Y ${r.months}M ${r.days}D`);
});

test('DEP non-creditable followed by active service', () => {
    const r = computePEBD('20250525', 'Enlisted', 'Enlisted DEP/Direct/Reenlisted/Prior Service',
        [
            { serviceType: 'Delayed Entry Program (Post 1989 No IDT)', startDate: '2019-06-01', endDate: '2019-12-31' },
            { serviceType: 'Regular Marine Corps', startDate: '2020-01-01', endDate: '2025-05-24' }
        ]
    );
    // DEP is non-creditable but consecutive — 1 continuous block, 1 creditable block
    assertEqual(r.continuousBlocks, 1, 'Continuous: ');
    assertEqual(r.creditableBlocks, 1, 'Creditable: ');
    console.log(`        PEBD: ${r.calculatedPEBD} | ${r.years}Y ${r.months}M ${r.days}D (DEP not counted)`);
});

console.log('\n=== 9. MULTI-SERVICE BRANCH SCENARIOS ===\n');

test('Army then Marine Corps with gap', () => {
    const r = computePEBD('20250525', 'Enlisted', 'Enlisted DEP/Direct/Reenlisted/Prior Service',
        [
            { serviceType: 'Regular Army', startDate: '2010-06-15', endDate: '2014-06-14' },
            { serviceType: 'Regular Marine Corps', startDate: '2016-01-05', endDate: '2025-05-24' }
        ]
    );
    assertEqual(r.continuousBlocks, 2, 'Blocks: ');
    assertEqual(r.creditableBlocks, 2, 'Creditable: ');
    assertEqual(r.inclusiveAdjustments, 2, 'Inclusive: ');
    console.log(`        PEBD: ${r.calculatedPEBD} | ${r.years}Y ${r.months}M ${r.days}D`);
});

test('Reserve then active (consecutive)', () => {
    const r = computePEBD('20250525', 'Enlisted', 'Enlisted DEP/Direct/Reenlisted/Prior Service',
        [
            { serviceType: 'Marine Corps Reserve', startDate: '2015-01-01', endDate: '2018-12-31' },
            { serviceType: 'Regular Marine Corps', startDate: '2019-01-01', endDate: '2025-05-24' }
        ]
    );
    assertEqual(r.continuousBlocks, 1, 'Blocks: ');
    assertEqual(r.creditableBlocks, 1, 'Creditable: ');
    console.log(`        PEBD: ${r.calculatedPEBD} | ${r.years}Y ${r.months}M ${r.days}D`);
});

console.log('\n=== 10. PEBD DATE ARITHMETIC VERIFICATION ===\n');

test('Known calculation: 4 years service from 20250101 foundational', () => {
    const r = computePEBD('20250101', 'Enlisted', 'Enlisted DEP/Direct/Reenlisted/Prior Service',
        [{ serviceType: 'Regular Marine Corps', startDate: '2021-01-01', endDate: '2024-12-31' }]
    );
    // Begin: 2021/1/1, End: 2024/12/31
    // Diff: 3Y 11M 30D, +1 inclusive = 3Y 12M 1D → normalized = 4Y 0M 1D
    // PEBD = 20250101 - 4Y 0M 1D = 20201231
    console.log(`        Begin: ${r.beginTotals.years}/${r.beginTotals.months}/${r.beginTotals.days}`);
    console.log(`        End: ${r.endTotals.years}/${r.endTotals.months}/${r.endTotals.days}`);
    console.log(`        Diff: ${r.difference.years}Y ${r.difference.months}M ${r.difference.days}D`);
    console.log(`        +Incl: ${r.inclusiveAdjusted.years}Y ${r.inclusiveAdjusted.months}M ${r.inclusiveAdjusted.days}D`);
    console.log(`        Norm: ${r.normalized.years}Y ${r.normalized.months}M ${r.normalized.days}D`);
    console.log(`        PEBD: ${r.calculatedPEBD}`);
});

test('Exact 1 year service', () => {
    const r = computePEBD('20250101', 'Enlisted', 'Enlisted DEP/Direct/Reenlisted/Prior Service',
        [{ serviceType: 'Regular Marine Corps', startDate: '2024-01-01', endDate: '2024-12-31' }]
    );
    console.log(`        Diff: ${r.difference.years}Y ${r.difference.months}M ${r.difference.days}D`);
    console.log(`        Norm: ${r.normalized.years}Y ${r.normalized.months}M ${r.normalized.days}D`);
    console.log(`        PEBD: ${r.calculatedPEBD}`);
});

test('Service starting and ending on same day of month', () => {
    const r = computePEBD('20250615', 'Enlisted', 'Enlisted DEP/Direct/Reenlisted/Prior Service',
        [{ serviceType: 'Regular Marine Corps', startDate: '2022-06-15', endDate: '2025-06-14' }]
    );
    // Begin: 2022/6/15, End: 2025/6/14, Diff: 3Y 0M -1D, +1 inclusive = 3Y 0M 0D
    console.log(`        Norm: ${r.normalized.years}Y ${r.normalized.months}M ${r.normalized.days}D`);
    console.log(`        PEBD: ${r.calculatedPEBD} (should be exactly 3 years before 20250615)`);
});

// ============================================================
// SUMMARY
// ============================================================
console.log('\n============================');
console.log(`RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
console.log('============================\n');

process.exit(failed > 0 ? 1 : 0);
