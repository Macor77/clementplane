import { beforeEach, describe, expect, it, vi } from 'vitest';

const invoke = vi.fn();
vi.mock('../../lib/supabaseClient', () => ({ supabase: { functions: { invoke }, rpc: vi.fn() } }));
const { sendTrainerAvailabilityShareEmail } = await import('../emailService');

describe('emailService — partage des disponibilités', () => {
  beforeEach(() => invoke.mockReset());

  it('refuse un envoi sans destinataire', async () => {
    await expect(sendTrainerAvailabilityShareEmail({ contactId: '', months: ['2026-09'] })).rejects.toThrow('contact destinataire');
    expect(invoke).not.toHaveBeenCalled();
  });

  it('refuse un envoi sans mois', async () => {
    await expect(sendTrainerAvailabilityShareEmail({ contactId: 'contact-1', months: [] })).rejects.toThrow('au moins un mois');
    expect(invoke).not.toHaveBeenCalled();
  });

  it('transmet uniquement le payload attendu au moteur transactionnel', async () => {
    invoke.mockResolvedValue({ data: { success: true, emailLogId: 'log-1' }, error: null });
    const result = await sendTrainerAvailabilityShareEmail({
      contactId: 'contact-1',
      months: ['2026-09', '2026-10'],
      message: '  Bonjour  ',
      copyToSender: true,
    });

    expect(invoke).toHaveBeenCalledWith('send-transactional-email', {
      body: {
        type: 'trainer_availability_share',
        contactId: 'contact-1',
        months: ['2026-09', '2026-10'],
        message: 'Bonjour',
        copyToSender: true,
      },
    });
    expect(result.success).toBe(true);
  });

  it('propage le message serveur lorsque le cooldown bloque l’envoi', async () => {
    invoke.mockResolvedValue({ data: { success: false, message: 'Un partage a déjà été envoyé récemment à ce contact.' }, error: null });
    await expect(sendTrainerAvailabilityShareEmail({ contactId: 'contact-1', months: ['2026-09'] })).rejects.toThrow('déjà été envoyé récemment');
  });
});
