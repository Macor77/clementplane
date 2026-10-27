import { describe, expect, it, vi } from 'vitest';
import { MicrosoftCalendar, MicrosoftGraphError, graphJson, toMicrosoftEvent } from '../../supabase/functions/_shared/calendar/microsoft.js';
const owner = 'owner-1';
const key = 'of:mission-1:2026-11-02';
const event = {
  summary: 'Mission confirmée — SST', description: 'Formation : SST', location: 'Paris',
  start: { dateTime: '2026-11-02T09:00:00', timeZone: 'Europe/Paris' },
  end: { dateTime: '2026-11-02T17:00:00', timeZone: 'Europe/Paris' },
  transparency: 'opaque',
  extendedProperties: { private: { clementplaneOwner: owner, clementplaneKey: key } },
};
describe('Microsoft Graph projection', () => {
  it('preserves private visibility and busy status without attendees', () => {
    const result = toMicrosoftEvent(event, owner, key);
    expect(result.sensitivity).toBe('private');
    expect(result.showAs).toBe('busy');
    expect(result.attendees).toEqual([]);
    expect(result.start.timeZone).toBe('Europe/Paris');
    expect(result.singleValueExtendedProperties).toHaveLength(2);
  });
  it('maps options to free and incomplete hours to all-day', () => {
    const result = toMicrosoftEvent({ ...event, start: { date: '2026-11-02' }, end: { date: '2026-11-03' }, transparency: 'transparent' }, owner, key);
    expect(result.isAllDay).toBe(true);
    expect(result.showAs).toBe('free');
    expect(result.end.dateTime).toBe('2026-11-03T00:00:00');
  });
  it('rejects ownership mismatch', () => {
    expect(() => toMicrosoftEvent(event, 'another-user', key)).toThrow('INVALID_EVENT_OWNER');
  });
});
describe('Microsoft Graph transport', () => {
  it('does not send requests outside the fixed /me API', async () => {
    await expect(graphJson(vi.fn(), 'token', '/users/other/events')).rejects.toThrow('INVALID_GRAPH_PATH');
  });
  it('classifies throttling without leaking response content', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: false, status: 429, headers: { get: () => '15' } });
    await expect(graphJson(fetch, 'token', '/me/calendars')).rejects.toMatchObject({ retryable: true, retryAfter: 15 });
  });
  it('uses Microsoft-generated IDs and transaction ID on insert', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: 'graph-event-id' }) });
    const provider = new MicrosoftCalendar({ fetch, token: 'token', calendarId: 'calendar-id' });
    expect(await provider.insert(toMicrosoftEvent(event, owner, key), 'transaction-1')).toEqual({ id: 'graph-event-id' });
    const [url, options] = fetch.mock.calls[0];
    expect(url).toContain('/me/calendars/calendar-id/events');
    expect(JSON.parse(options.body).transactionId).toBe('transaction-1');
  });
});
