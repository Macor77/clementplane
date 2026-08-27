import { describe, expect, it } from 'vitest';

import {
  formatNextInvitationLabel,
  getOrganizationInvitationTarget,
  isOrganizationInvitationCoolingDown,
} from '../../utils/trainerOrganizationInvitation';

describe('trainerOrganizationsService invitation helpers', () => {
  it('considère le cooldown actif tant que la date serveur est dans le futur', () => {
    expect(
      isOrganizationInvitationCoolingDown(
        '2026-09-02T08:00:00.000Z',
        new Date('2026-09-01T08:00:00.000Z'),
      ),
    ).toBe(true);

    expect(
      isOrganizationInvitationCoolingDown(
        '2026-09-02T08:00:00.000Z',
        new Date('2026-09-02T08:00:01.000Z'),
      ),
    ).toBe(false);
  });

  it('formate la prochaine date d’invitation en français', () => {
    const label = formatNextInvitationLabel(
      '2026-09-02T08:15:00.000Z',
    );

    expect(label).toContain('02/09/2026');
  });

  it('construit la destination de la fiche formateur en espace OF', () => {
    expect(
      getOrganizationInvitationTarget('trainer-123'),
    ).toBe('/formateur/view/trainer-123?space=organization');
  });
});
