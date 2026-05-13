export interface DateRange {
  start: Date;
  end: Date;
}

export interface LabeledRange {
  label: string;
  range: DateRange;
}

export function getToday(): DateRange {
  const d = new Date();
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return { start, end: start };
}

export function getCurrentMonth(): DateRange {
  const d = new Date();
  return {
    start: new Date(d.getFullYear(), d.getMonth(), 1),
    end: new Date(d.getFullYear(), d.getMonth() + 1, 0)
  };
}

export function getPreviousMonth(): DateRange {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return {
    start: new Date(d.getFullYear(), d.getMonth(), 1),
    end: new Date(d.getFullYear(), d.getMonth() + 1, 0)
  };
}

export function getCurrentYear(): DateRange {
  const d = new Date();
  return {
    start: new Date(d.getFullYear(), 0, 1),
    end: new Date(d.getFullYear() + 1, 0, 0)
  };
}

export function getLastYear(): DateRange {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth() - 11, 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
  };
}

export function getLast7Days(): DateRange {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);
  return { start, end };
}

export function getLast30Days(): DateRange {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29);
  return { start, end };
}

export function getLast12Months(): DateRange {
  const end = new Date();
  const start = new Date();
  start.setMonth(end.getMonth() - 11);
  start.setDate(1);
  return { start, end };
}

export function getStatRanges(): LabeledRange[] {
  return [
    { label: 'common.ranges.today', range: getToday() },
    { label: 'common.ranges.currentMonth', range: getCurrentMonth() },
    { label: 'common.ranges.previousMonth', range: getPreviousMonth() },
    { label: 'common.ranges.currentYear', range: getCurrentYear() }
  ];
}

export function getDashboardRanges(): LabeledRange[] {
  return [
    { label: 'common.ranges.today', range: getToday() },
    { label: 'common.ranges.currentMonth', range: getCurrentMonth() },
    { label: 'common.ranges.previousMonth', range: getPreviousMonth() },
    { label: 'common.ranges.currentYear', range: getCurrentYear() },
    { label: 'common.ranges.lastYear', range: getLastYear() }
  ];
}

export function getTransactionRanges(): LabeledRange[] {
  return [
    { label: 'common.ranges.today', range: getToday() },
    { label: 'common.ranges.currentMonth', range: getCurrentMonth() },
    { label: 'common.ranges.previousMonth', range: getPreviousMonth() },
    { label: 'common.ranges.last12Months', range: getLast12Months() },
    { label: 'common.ranges.currentYear', range: getCurrentYear() }
  ];
}

export function getUptimeRanges(): LabeledRange[] {
  return [
    { label: 'common.ranges.today', range: getToday() },
    { label: 'common.ranges.last7Days', range: getLast7Days() },
    { label: 'common.ranges.last30Days', range: getLast30Days() },
    { label: 'common.ranges.currentMonth', range: getCurrentMonth() }
  ];
}
