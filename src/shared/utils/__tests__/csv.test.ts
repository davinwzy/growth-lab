import { describe, it, expect } from 'vitest';
import { escapeCsvValue, toCsvRow } from '../csv';

describe('csv utils', () => {
  it('escapes commas and quotes', () => {
    expect(escapeCsvValue('a,b')).toBe('"a,b"');
    expect(escapeCsvValue('a"b')).toBe('"a""b"');
  });

  it('joins rows with proper escaping', () => {
    expect(toCsvRow(['a', 'b,c', 'd'])).toBe('a,"b,c",d');
  });
});
