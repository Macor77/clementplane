import { describe, expect, it } from 'vitest';

import {
  getPublicTutorials,
  getTutorialsForAudience,
  tutorialLibrary,
} from '../tutorialLibrary.js';

describe('tutorial library', () => {
  it('exposes eleven illustrated tutorials with a PDF and at least one step', () => {
    expect(tutorialLibrary).toHaveLength(11);

    tutorialLibrary.forEach((tutorial) => {
      expect(tutorial.id).toMatch(/^[a-z0-9-]+$/);
      expect(tutorial.title).toBeTruthy();
      expect(tutorial.introduction).toBeTruthy();
      expect(tutorial.audiences.length).toBeGreaterThan(0);
      expect(tutorial.pdf).toMatch(/^\/tutorials\/pdf\/.+\.pdf$/);
      expect(tutorial.steps.length).toBeGreaterThan(0);

      tutorial.steps.forEach((step) => {
        expect(step.title).toBeTruthy();
        expect(step.description).toBeTruthy();
        expect(step.image).toMatch(/^\/tutorials\/images\/.+\.jpg$/);
        expect(step.consequence).toBeTruthy();
      });
    });
  });

  it('filters the library according to the connected profile', () => {
    const organizationTutorials = getTutorialsForAudience('organization');
    const trainerTutorials = getTutorialsForAudience('trainer');

    expect(organizationTutorials.every((item) => item.audiences.includes('organization'))).toBe(true);
    expect(trainerTutorials.every((item) => item.audiences.includes('trainer'))).toBe(true);
    expect(organizationTutorials.length).toBeGreaterThan(trainerTutorials.length);
    expect(trainerTutorials.some((item) => item.id === 'respond-to-proposal')).toBe(true);
    expect(trainerTutorials.some((item) => item.id === 'import-trainers')).toBe(false);
  });

  it('keeps a concise public selection focused on the core value', () => {
    const publicTutorials = getPublicTutorials();

    expect(publicTutorials).toHaveLength(4);
    expect(publicTutorials.every((item) => item.public === true)).toBe(true);
    expect(publicTutorials.map((item) => item.id)).toEqual([
      'create-mission',
      'search-trainer',
      'propose-mission',
      'accept-and-assign',
    ]);
  });
});
