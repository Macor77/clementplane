// Microsoft Graph transport and event projection. No credentials are stored here.
// Deliberately separate from the Google-specific reconcile contract: Graph IDs
// are server-generated and must be persisted after create before reconciliation.
export const OWNER_PROPERTY = 'String {6e1358d4-6dd1-4a87-aec5-17b0a0f32f09} Name clementplaneOwner';
export const KEY_PROPERTY = 'String {6e1358d4-6dd1-4a87-aec5-17b0a0f32f09} Name clementplaneKey';
export const expandOwnership = 'singleValueExtendedProperties($filter=id eq ' + "'" + OWNER_PROPERTY + "' or id eq '" + KEY_PROPERTY + "')";
const BASE = 'https://graph.microsoft.com/v1.0';
export class MicrosoftGraphError extends Error {
  constructor(status, retryAfter = 0) {
    super('MICROSOFT_GRAPH_REQUEST_FAILED');
    this.status = status;
    this.retryAfter = retryAfter;
    this.retryable = status === 429 || status >= 500;
  }
}

export async function graphJson(fetcher, token, path, { method = 'GET', body, etag } = {}) {
  if (!path.startsWith('/me/')) throw new Error('INVALID_GRAPH_PATH');
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json', Prefer: 'IdType="ImmutableId"' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (etag) headers['If-Match'] = etag;
  let response;
  try {
    response = await fetcher(BASE + path, {
      method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(10000),
    });
  } catch { throw new MicrosoftGraphError(503); }
  if (!response.ok) {
    throw new MicrosoftGraphError(response.status,
      Math.min(86400, Math.max(0, Number(response.headers.get('Retry-After')) || 0)));
  }
  if (response.status === 204) return null;
  return response.json();
}

export function toMicrosoftEvent(event, owner, key) {
  if (!owner || !key || event.extendedProperties?.private?.clementplaneOwner !== owner ||
      event.extendedProperties?.private?.clementplaneKey !== key) throw new Error('INVALID_EVENT_OWNER');
  const allDay = Boolean(event.start?.date);
  const date = x => allDay ? `${x.date}T00:00:00` : x.dateTime;
  const timeZone = allDay ? 'Europe/Paris' : event.start.timeZone;
  if (!event.start || !event.end || !timeZone) throw new Error('INVALID_EVENT_TIME');
  return {
    subject: event.summary,
    body: { contentType: 'HTML', content: event.description.replace(/\n/g, '<br>') },
    start: { dateTime: date(event.start), timeZone },
    end: { dateTime: date(event.end), timeZone },
    isAllDay: allDay,
    showAs: event.transparency === 'opaque' ? 'busy' : 'free',
    sensitivity: 'private',
    isReminderOn: false,
    responseRequested: false,
    attendees: [],
    location: { displayName: event.location || '' },
    // Graph extension values allow ownership verification before mutation.
    singleValueExtendedProperties: [
      { id: OWNER_PROPERTY, value: owner },
      { id: KEY_PROPERTY, value: key },
    ],
  };
}

export class MicrosoftCalendar {
  constructor({ fetch, token, calendarId }) {
    if (!calendarId) throw new Error('MISSING_MICROSOFT_CALENDAR');
    this.fetch = fetch;
    this.token = token;
    this.path = `/me/calendars/${encodeURIComponent(calendarId)}/events`;
  }
  async get(id) {
    try {
      return await graphJson(this.fetch, this.token,
        `${this.path}/${encodeURIComponent(id)}?${new URLSearchParams({$expand:expandOwnership})}`);
    } catch (error) {
      if (error.status === 404) return null;
      throw error;
    }
  }
  async find(key) {
    const query = new URLSearchParams({$filter: propertyFilter(KEY_PROPERTY, key), $top:'2'});
    const result = await graphJson(this.fetch,this.token,`${this.path}?${query}`);
    if (!Array.isArray(result.value)) throw new Error('INVALID_GRAPH_RESPONSE');
    if (result.value.length > 1 || result['@odata.nextLink']) throw new Error('DUPLICATE_MANAGED_EVENT');
    return result.value.length ? this.get(result.value[0].id) : null;
  }
  insert(event, transactionId) {
    return graphJson(this.fetch, this.token, this.path, {
      method: 'POST', body: { ...event, transactionId },
    });
  }
  update(id, event, etag) {
    return graphJson(this.fetch, this.token,
      `${this.path}/${encodeURIComponent(id)}`, { method: 'PATCH', body: event, etag });
  }
  async remove(id, etag) {
    try {
      return await graphJson(this.fetch, this.token,
        `${this.path}/${encodeURIComponent(id)}`, { method: 'DELETE', etag });
    } catch (error) {
      if (error.status !== 404) throw error;
      return null;
    }
  }
}

export function propertyFilter(id,value) {
  const quote = text => String(text).replace(/'/g, "''");
  return `singleValueExtendedProperties/Any(ep: ep/id eq '${quote(id)}' and ep/value eq '${quote(value)}')`;
}
export async function findMicrosoftCalendar(fetch, token, owner) {
  const query = new URLSearchParams({$filter:propertyFilter(OWNER_PROPERTY,owner),$top:'2'});
  const result = await graphJson(fetch,token,`/me/calendars?${query}`);
  if (!Array.isArray(result.value)) throw new Error('INVALID_GRAPH_RESPONSE');
  if (result.value.length > 1 || result['@odata.nextLink']) throw new Error('CALENDAR_CREATION_UNCERTAIN');
  return result.value[0] || null;
}
