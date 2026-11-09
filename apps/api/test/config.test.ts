import { describe, expect, it } from 'vitest';
import { parsePort } from '../src/config.js';

describe('parsePort', () => {
  it('returns 3000 when undefined', () => {
    expect(parsePort(undefined)).toBe(3000);
  });

  it('returns 3000 when empty', () => {
    expect(parsePort('')).toBe(3000);
  });

  it.each([
    ['4000', 4000],
    ['1', 1],
    ['65535', 65535],
  ])('accepts %j', (value, expected) => {
    expect(parsePort(value)).toBe(expected);
  });

  it.each(['0', '65536', 'abc', '-1', '3000.5', ' 3000'])('throws for %j', (value) => {
    expect(() => parsePort(value)).toThrow(`Invalid PORT: ${value}`);
  });
});
