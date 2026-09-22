import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

const componentPath = new URL('../../src/components/tutorials/TutorialLibrary.jsx', import.meta.url);
const discoverPath = new URL('../../src/pages/DiscoverClementplane.jsx', import.meta.url);
const landingPath = new URL('../../src/pages/PublicLanding.jsx', import.meta.url);

describe('illustrated tutorial library UI', () => {
  it('provides an accessible carousel with navigation and PDF download', () => {
    const source = fs.readFileSync(componentPath, 'utf8');

    expect(source).toContain('role="dialog"');
    expect(source).toContain("event.key === 'Escape'");
    expect(source).toContain('Étape {activeStep + 1} sur {tutorial.steps.length}');
    expect(source).toContain('Étape précédente');
    expect(source).toContain('Étape suivante');
    expect(source).toContain('Télécharger le PDF');
    expect(source).toContain('Ce qui se passe ensuite');
    expect(source).toContain('returnFocusRef');
    expect(source).toContain('focusableElements');
    expect(source).toContain("event.key === 'Tab'");
    expect(source).toContain('returnFocusElement?.focus()');
    expect(source).not.toContain('autoFocus');
  });

  it('uses the same tracked navigation for keyboard arrows and visible controls', () => {
    const source = fs.readFileSync(componentPath, 'utf8');
    expect(source).toContain("onEvent?.('step', tutorial, nextStep)");
    expect(source).toContain('moveStepRef.current(-1)');
    expect(source).toContain('moveStepRef.current(1)');
    expect(source).not.toContain('setActiveStep((currentStep)');
  });

  it('embeds the profile-filtered library in Discover Clementplane', () => {
    const source = fs.readFileSync(discoverPath, 'utf8');

    expect(source).toContain("getTutorialsForAudience(audience)");
    expect(source).toContain('<TutorialLibrary tutorials={tutorials}');
    expect(source).not.toContain('Les captures d’écran pourront être ajoutées ensuite');
  });

  it('shows the concise public tutorial selection on the landing page', () => {
    const source = fs.readFileSync(landingPath, 'utf8');

    expect(source).toContain('getPublicTutorials()');
    expect(source).toContain('<TutorialLibrary');
    expect(source).toContain('Voir Clementplane en action');
  });
});
