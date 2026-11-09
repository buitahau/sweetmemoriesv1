import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('createApp', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 404 not_found for an unknown path', async () => {
    const res = await request(createApp()).get('/anything');
    expect(res.status).toBe(404);
    expect(res.text).toBe('{"error":"not_found"}');
  });

  it('returns 500 internal_error when a route throws', async () => {
    const app = createApp({
      testRoutes: (app) =>
        app.get('/__throw', () => {
          throw new Error('boom');
        }),
    });
    const res = await request(app).get('/__throw');
    expect(res.status).toBe(500);
    expect(res.text).toBe('{"error":"internal_error"}');
    expect(res.text).not.toContain('boom');
    expect(res.text).not.toContain('Error:');
    expect(res.text).not.toContain(' at ');
  });
});
