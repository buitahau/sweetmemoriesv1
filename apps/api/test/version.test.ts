import { afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const SHA = '0123456789abcdef0123456789abcdef01234567';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('GET /api/version', () => {
  it('returns the commit from GIT_SHA as JSON', async () => {
    vi.stubEnv('GIT_SHA', SHA);
    const res = await request(createApp()).get('/api/version');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.text).toBe(`{"commit":"${SHA}"}`);
  });

  it('returns unknown for a missing or invalid GIT_SHA', async () => {
    const app = createApp();
    const invalid = ['', 'abc', SHA.replace('a', 'A'), `${SHA}8`, '<script>'];
    for (const value of invalid) {
      vi.stubEnv('GIT_SHA', value);
      const res = await request(app).get('/api/version');
      expect(res.status).toBe(200);
      expect(res.text).toBe('{"commit":"unknown"}');
    }
    vi.stubEnv('GIT_SHA', undefined);
    const res = await request(app).get('/api/version');
    expect(res.text).toBe('{"commit":"unknown"}');
  });

  it('sets no-store and no cookie or framework headers, also when a Cookie is sent', async () => {
    vi.stubEnv('GIT_SHA', SHA);
    const app = createApp();
    for (const res of [
      await request(app).get('/api/version'),
      await request(app).get('/api/version').set('Cookie', 'session=fake-value'),
    ]) {
      expect(res.status).toBe(200);
      expect(res.headers['cache-control']).toBe('no-store');
      expect(res.headers['set-cookie']).toBeUndefined();
      expect(res.headers['x-powered-by']).toBeUndefined();
    }
  });

  it('answers HEAD with an empty body, and accepts a trailing slash and a query string', async () => {
    vi.stubEnv('GIT_SHA', SHA);
    const app = createApp();
    const head = await request(app).head('/api/version');
    expect(head.status).toBe(200);
    expect(head.text ?? '').toBe('');
    for (const path of ['/api/version/', '/api/version?x=1']) {
      const res = await request(app).get(path);
      expect(res.status).toBe(200);
      expect(res.text).toBe(`{"commit":"${SHA}"}`);
    }
  });

  it('returns 404 not_found for POST', async () => {
    const res = await request(createApp()).post('/api/version');
    expect(res.status).toBe(404);
    expect(res.text).toBe('{"error":"not_found"}');
  });

  it('leaves GET /api/health unchanged', async () => {
    const res = await request(createApp()).get('/api/health');
    expect(res.text).toBe('{"status":"ok"}');
  });
});
