import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deepseekClient } from '../../src/services/deepseek-client';

describe('deepseekClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends messages and returns content on success', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: '{"result": "ok"}' } }],
      }),
    });

    const result = await deepseekClient.chat(
      [{ role: 'user', content: 'hello' }],
      { responseFormat: 'json_object', timeout: 5000 },
    );

    expect(result).toBe('{"result": "ok"}');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('throws on non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: () => Promise.resolve({ error: { message: 'Rate limited' } }),
    });

    await expect(
      deepseekClient.chat([{ role: 'user', content: 'hello' }]),
    ).rejects.toThrow();
  });

  it('retries on failure', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 500, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'retry works' } }],
        }),
      });

    const result = await deepseekClient.chat(
      [{ role: 'user', content: 'hello' }],
      { retries: 2 },
    );

    expect(result).toBe('retry works');
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
