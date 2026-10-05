import { describe, expect, it } from 'vitest';
import { validatePersonalMission, personalMissionToAgenda, findMissionConflicts, countUniqueMissions, missionHref } from '../personalMissions';
const input = { title: 'SST', dates: [{ date: '2026-10-12', heure_debut: '09:00', heure_fin: '17:00' }] };
describe('missions personnelles', () => {
  it('accepte le minimum et conserve un tarif nul', () => {
    expect(validatePersonalMission(input).title).toBe('SST');
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
    expect(row.status).toBe('affecte'); expect(missionHref(row)).toBe('/formateur/missions/personnelles/abc');
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
