import { describe, expect, it } from 'vitest';
import { normalizeError } from '../monitoringService';

describe('monitoringService', () => {
  it('normalise une Error sans exposer un objet non sérialisable', () => {
    const result = normalizeError(new TypeError('Boom'));
    expect(result.name).toBe('TypeError');
    expect(result.message).toBe('Boom');
    expect(typeof result.stack).toBe('string');
  });

  it('tronque les messages trop longs', () => {
    expect(normalizeError('x'.repeat(900)).message).toHaveLength(500);
  });
});
