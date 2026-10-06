import { describe, expect, it } from 'vitest';
import { faqItems, publicRoadmap } from '../discoverContent.js';

describe('Discover Sprint 20 content', () => {
  it('documents mobile installation in FAQ', () => {
    expect(faqItems.some((item) => /installer Clementplane/i.test(item.question))).toBe(true);
  });

  it('lists personal missions as available and Google Agenda as future', () => {
    expect(publicRoadmap.available.description).toMatch(/missions personnelles/i);
    expect(publicRoadmap.future.some(item => /créer lui-même une mission/.test(item))).toBe(false);
    expect(publicRoadmap.future.some(item => /Google Agenda/.test(item))).toBe(true);
  });
});
