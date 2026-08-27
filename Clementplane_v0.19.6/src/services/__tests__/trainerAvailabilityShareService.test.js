import { describe, expect, it } from 'vitest';
import { getPublicSharedDayState, getSharedDayState } from '../trainerAvailabilityShareService';

const day = '2026-09-15';

describe('trainerAvailabilityShareService — visibilité par destinataire', () => {
  it('affiche la mission au destinataire concerné', () => {
    expect(getSharedDayState({ day, availabilityByDay: { [day]: 'dispo' }, commitmentsByDay: { [day]: [{ status: 'mission', organizationId: 'of-a' }] }, recipientOrganizationId: 'of-a' }).key).toBe('mission_with_recipient');
  });

  it('masque une mission appartenant à un autre OF derrière Indisponible', () => {
    const state = getSharedDayState({ day, availabilityByDay: { [day]: 'dispo' }, commitmentsByDay: { [day]: [{ status: 'mission', organizationId: 'of-b' }] }, recipientOrganizationId: 'of-a' });
    expect(state).toMatchObject({ key: 'unavailable', label: 'Indisponible' });
  });

  it('affiche Option uniquement à l’OF qui possède cette option', () => {
    const own = getSharedDayState({ day, availabilityByDay: { [day]: 'dispo' }, commitmentsByDay: { [day]: [{ status: 'option', organizationId: 'of-a' }] }, recipientOrganizationId: 'of-a' });
    const other = getSharedDayState({ day, availabilityByDay: { [day]: 'dispo' }, commitmentsByDay: { [day]: [{ status: 'option', organizationId: 'of-a' }] }, recipientOrganizationId: 'of-b' });
    expect(own.key).toBe('option_with_recipient');
    expect(other).toMatchObject({ key: 'available', otherOptionsCount: 1 });
  });

  it('la version publique ne révèle jamais les options', () => {
    const state = getPublicSharedDayState({ day, declaredByDay: { [day]: 'dispo' }, commitmentsByDay: { [day]: [{ status: 'option', organizationId: 'of-a' }] } });
    expect(state).toEqual({ key: 'available', label: 'Disponible' });
  });

  it('une indisponibilité déclarée reste prioritaire sur une option', () => {
    const state = getSharedDayState({ day, availabilityByDay: { [day]: 'indispo' }, commitmentsByDay: { [day]: [{ status: 'option', organizationId: 'of-a' }] }, recipientOrganizationId: 'of-a' });
    expect(state.key).toBe('unavailable');
  });
});
