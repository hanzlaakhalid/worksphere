import { EmployeeStatusPipe } from './employee-status-pipe';

describe('EmployeeStatusPipe', () => {
  const pipe = new EmployeeStatusPipe();

  it('formats each known status into a readable label', () => {
    expect(pipe.transform('ACTIVE')).toBe('Active');
    expect(pipe.transform('ON_LEAVE')).toBe('On Leave');
    expect(pipe.transform('INACTIVE')).toBe('Inactive');
    expect(pipe.transform('TERMINATED')).toBe('Terminated');
  });

  it('returns an em dash for null or undefined', () => {
    expect(pipe.transform(null)).toBe('—');
    expect(pipe.transform(undefined)).toBe('—');
  });
});
