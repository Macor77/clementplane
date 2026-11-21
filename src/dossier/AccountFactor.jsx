import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AccountFactor({ onVerified }) {
  const [factor, setFactor] = useState(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function start() {
    setBusy(true);
    setError('');
    try {
      const listed = await supabase.auth.mfa.listFactors();
      if (listed.error) throw listed.error;
      const existing = listed.data.totp.find((f) => f.status === 'verified');
      if (existing) {
        setFactor({ id: existing.id });
        return;
      }
      const result = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'Clementplane',
      });
      if (result.error) throw result.error;
      setFactor({ id: result.data.id, qr: result.data.totp.qr_code });
    } catch {
      setError('Configuration indisponible. Reconnectez-vous puis réessayez.');
    } finally {
      setBusy(false);
    }
  }
  async function verify(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await supabase.auth.mfa.challengeAndVerify({
        factorId: factor.id,
        code,
      });
      if (result.error) throw result.error;
      setCode('');
      setFactor(null);
      onVerified();
    } catch {
      setError(
        'Vérification impossible. Saisissez un nouveau code de votre application.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <h2>Double authentification</h2>
      {factor ? (
        <form onSubmit={verify}>
          {factor.qr && (
            <>
              <p>
                Scannez ce QR code avec votre application d’authentification.
              </p>
              <img
                width="180"
                alt="QR code personnel d’inscription"
                src={factor.qr}
              />
            </>
          )}
          <label>
            Code à six chiffres
            <input
              required
              inputMode="numeric"
              pattern="[0-9]{6}"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </label>
          <button disabled={busy}>Vérifier le code</button>
        </form>
      ) : (
        <button disabled={busy} onClick={start}>
          Vérifier mon second facteur
        </button>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
