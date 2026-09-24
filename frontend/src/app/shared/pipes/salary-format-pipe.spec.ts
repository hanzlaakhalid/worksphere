import { SalaryFormatPipe } from './salary-format-pipe';

describe('SalaryFormatPipe', () => {
  const pipe = new SalaryFormatPipe();

  it('formats a number as whole-dollar currency', () => {
    expect(pipe.transform(98000)).toBe('$98,000');
  });

  it('formats a numeric string (as returned by the API for Decimal fields)', () => {
    expect(pipe.transform('128000.00')).toBe('$128,000');
  });

  it('returns an em dash for null, undefined, or empty values', () => {
    expect(pipe.transform(null)).toBe('—');
    expect(pipe.transform(undefined)).toBe('—');
    expect(pipe.transform('')).toBe('—');
  });

  it('returns an em dash for a non-numeric string', () => {
    expect(pipe.transform('not-a-number')).toBe('—');
  });
});
