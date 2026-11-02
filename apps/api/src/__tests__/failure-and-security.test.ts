import { describe, it, expect } from 'vitest';

const API_BASE = 'http://localhost:3001';
const AUTH_HEADER = {
  'Authorization': 'Bearer demo-token',
  'Content-Type': 'application/json',
};

describe('WORKFLOW 6: Failure Conditions & Edge Cases', () => {
  it('FC-1: Should reject atlas topic request when id is missing (400)', async () => {
    const res = await fetch(`${API_BASE}/api/atlas/topic`);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Missing topic id');
  });

  it('FC-2: Should return 404 for nonexistent syllabus topic ID', async () => {
    const res = await fetch(`${API_BASE}/api/atlas/topic?id=invalid-topic-xyz-999`);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toContain('Topic not found');
  });

  it('FC-3: Should reject search request with missing query (400)', async () => {
    const res = await fetch(`${API_BASE}/api/intelligence/search`, {
      method: 'POST',
      headers: AUTH_HEADER,
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('query is required');
  });

  it('FC-4: Should reject answer generation with invalid payload (400)', async () => {
    const res = await fetch(`${API_BASE}/api/answers/generate`, {
      method: 'POST',
      headers: AUTH_HEADER,
      body: JSON.stringify({ question: '', markValue: -5 }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Validation failed');
  });

  it('FC-5: Should handle non-existent user bookmark deletion gracefully', async () => {
    const res = await fetch(`${API_BASE}/api/bookmarks?id=00000000-0000-0000-0000-000000000000`, {
      method: 'DELETE',
      headers: AUTH_HEADER,
    });
    // Should return 200 with deleted count 0 or success, never 500
    expect([200, 404]).toContain(res.status);
  });
});

describe('SECURITY TESTING: Authentication & Authorization Boundaries', () => {
  it('SEC-1: Protected endpoint /api/subjects rejects request with missing token (401)', async () => {
    const res = await fetch(`${API_BASE}/api/subjects`);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain('Unauthorized');
  });

  it('SEC-2: Protected endpoint /api/preferences rejects request with missing token (401)', async () => {
    const res = await fetch(`${API_BASE}/api/preferences`);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain('Unauthorized');
  });

  it('SEC-3: Protected endpoint /api/bookmarks rejects request with missing token (401)', async () => {
    const res = await fetch(`${API_BASE}/api/bookmarks`);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain('Unauthorized');
  });

  it('SEC-4: Protected endpoint /api/annotations rejects request with missing token (401)', async () => {
    const res = await fetch(`${API_BASE}/api/annotations`);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain('Unauthorized');
  });

  it('SEC-5: Public endpoint /api/health is accessible without authorization (200)', async () => {
    const res = await fetch(`${API_BASE}/api/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('ok');
  });

  it('SEC-6: Public endpoint /api/atlas/subjects is accessible without authorization (200)', async () => {
    const res = await fetch(`${API_BASE}/api/atlas/subjects`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});
