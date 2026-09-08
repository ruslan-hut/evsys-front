import { previousYearRange, shiftYears } from './date-ranges';

describe('shiftYears', () => {
  it('keeps the same calendar day', () => {
    expect(shiftYears(new Date(2026, 8, 30), -1)).toEqual(new Date(2025, 8, 30));
  });

  // 2024 is a leap year and 2023 is not; rolling into 1 March would move a
  // February range into the wrong month.
  it('pulls 29 February back to the last day of February', () => {
    expect(shiftYears(new Date(2024, 1, 29), -1)).toEqual(new Date(2023, 1, 28));
  });

  it('leaves 29 February alone when the target year is also a leap year', () => {
    expect(shiftYears(new Date(2024, 1, 29), -4)).toEqual(new Date(2020, 1, 29));
  });

  it('preserves the time of day', () => {
    expect(shiftYears(new Date(2026, 0, 15, 18, 40, 5), -1))
      .toEqual(new Date(2025, 0, 15, 18, 40, 5));
  });

  it('does not modify the date it is given', () => {
    const original = new Date(2026, 0, 15);
    shiftYears(original, -1);
    expect(original).toEqual(new Date(2026, 0, 15));
  });
});

describe('previousYearRange', () => {
  it('shifts both ends of the range back a year', () => {
    const range = { start: new Date(2025, 9, 1), end: new Date(2026, 8, 30) };

    expect(previousYearRange(range))
      .toEqual({ start: new Date(2024, 9, 1), end: new Date(2025, 8, 30) });
  });
});
