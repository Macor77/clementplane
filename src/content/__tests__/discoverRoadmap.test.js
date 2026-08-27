import { describe, expect, it } from 'vitest';
import { faqItems, publicRoadmap } from '../discoverContent.js';

describe('Discover Sprint 20 content', () => {
  it('documents mobile installation in FAQ', () => {
    expect(faqItems.some((item) => /installer Clementplane/i.test(item.question))).toBe(true);
  });

  it('keeps trainer-created missions before Google Agenda in future roadmap', () => {
    const missionIndex = publicRoadmap.future.findIndex((item) => /créer lui-même une mission/i.test(item));
    const googleIndex = publicRoadmap.future.findIndex((item) => /Google Agenda/i.test(item));
    expect(missionIndex).toBeGreaterThanOrEqual(0);
    expect(googleIndex).toBeGreaterThan(missionIndex);
    expect(publicRoadmap.future.some((item) => /installer Clementplane/i.test(item))).toBe(false);
  });
});
