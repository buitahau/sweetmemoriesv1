import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('GET /api/health', () => {
  it('returns 200 {"status":"ok"} as JSON', async () => {
    const res = await request(createApp()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual({ status: 'ok' });
    expect(res.text).toBe('{"status":"ok"}');
  });

  it('sets no-store and no cookie or framework headers, also when a Cookie is sent', async () => {
    const app = createApp();
    for (const res of [
      await request(app).get('/api/health'),
      await request(app).get('/api/health').set('Cookie', 'session=fake-value'),
    ]) {
      expect(res.status).toBe(200);
      expect(res.headers['cache-control']).toBe('no-store');
      expect(res.headers['set-cookie']).toBeUndefined();
      expect(res.headers['x-powered-by']).toBeUndefined();
    }
  });

  it('answers HEAD with 200 and an empty body', async () => {
    const res = await request(createApp()).head('/api/health');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.headers['content-type']).toContain('application/json');
    expect(res.text ?? '').toBe('');
  });

  it('accepts a trailing slash and a query string', async () => {
    const app = createApp();
    for (const path of ['/api/health/', '/api/health?probe=1']) {
      const res = await request(app).get(path);
      expect(res.status).toBe(200);
      expect(res.text).toBe('{"status":"ok"}');
    }
  });

  it('returns 404 not_found for POST', async () => {
    const res = await request(createApp()).post('/api/health');
    expect(res.status).toBe(404);
    expect(res.text).toBe('{"error":"not_found"}');
  });
});
