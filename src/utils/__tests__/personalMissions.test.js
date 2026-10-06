import { describe, expect, it } from 'vitest';
import { validatePersonalMission, personalMissionToAgenda, findMissionConflicts, countUniqueMissions, missionHref, shouldSuggestOrganization } from '../personalMissions';
const input = {
  title: ' Client final ',
  formation: ' SST ',
  site_name: 'Centre Démo',
  address: '10 rue de la Formation',
  postal_code: ' 93200 ',
  city: ' Saint-Denis ',
  dates: [{ date: '2026-10-12', heure_debut: '09:00', heure_fin: '17:00' }],
};
describe('missions personnelles', () => {
  it('accepte le minimum et conserve un tarif nul', () => {
    const result = validatePersonalMission(input);
    expect(result.title).toBe('Client final');
    expect(result.formation).toBe('SST');
    expect(result.postal_code).toBe('93200');
    expect(result.city).toBe('Saint-Denis');
    expect(result.location).toBe('Centre Démo, 10 rue de la Formation, 93200 Saint-Denis');
    expect(validatePersonalMission({...input, fee: 0, fee_unit: 'day'}).fee).toBe(0);
  });
  it.each(['2026-02-30','2026-13-01','12/10/2026',''])('refuse une date invalide %s', date => {
    expect(() => validatePersonalMission({...input, dates:[{date}]})).toThrow();
  });
  it('refuse horaires inversés, incomplets, dates dupliquées et tarif sans unité', () => {
    for (const dates of [[{date:'2026-10-12',heure_debut:'17:00',heure_fin:'09:00'}],[{date:'2026-10-12',heure_debut:'09:00'}],[input.dates[0],input.dates[0]]]) expect(() => validatePersonalMission({...input,dates})).toThrow();
    expect(() => validatePersonalMission({...input,fee:200})).toThrow();
  });
  it('distingue origine et lien sans inventer un OF', () => {
    const row=personalMissionToAgenda({...input,id:'abc',status:'confirmed',client_name:'Client test'});
    expect(row.origin).toBe('personal'); expect(row.organization_id).toBeNull();
    expect(row.mission_title).toBe('SST');
    expect(row.client_final).toBe('Client final');
    expect(row.order_giver).toBe('Client test');
    expect(row.status).toBe('affecte'); expect(missionHref(row)).toBe('/formateur/missions/personnelles/abc');
  });
  it('exige le code postal et la ville du lieu de formation', () => {
    expect(() => validatePersonalMission({...input,postal_code:''})).toThrow('code postal');
    expect(() => validatePersonalMission({...input,city:''})).toThrow('ville');
  });
  it('propose un ajout seulement si le donneur d’ordre est absent de Mes OF', () => {
    const contacts=[{organization_name:'École Prévention'}];
    expect(shouldSuggestOrganization('  ecole   prevention ',contacts)).toBe(false);
    expect(shouldSuggestOrganization('Atelier Démo',contacts)).toBe(true);
    expect(shouldSuggestOrganization('',contacts)).toBe(false);
  });
  it('compte une mission multidate une seule fois et distingue les origines', () => {
    expect(countUniqueMissions([{missionId:'a',origin:'personal'},{missionId:'a',origin:'personal'},{missionId:'a',origin:'organization'}])).toBe(2);
  });
  it('détecte un chevauchement, une journée sans horaire, mais exclut annulation et mission éditée', () => {
    const other={mission_id:'b',origin:'personal',status:'affecte',dates:input.dates};
    expect(findMissionConflicts(input.dates,[other]).length).toBe(1);
    expect(findMissionConflicts([{date:'2026-10-12',heure_debut:'17:00',heure_fin:'18:00'}],[other])).toEqual([]);
    expect(findMissionConflicts([{date:'2026-10-12'}],[other]).length).toBe(1);
    expect(findMissionConflicts(input.dates,[{...other,status:'annule'}])).toEqual([]);
    expect(findMissionConflicts(input.dates,[other],'b')).toEqual([]);
  });
});
