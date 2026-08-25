import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import './FeatureNewsUnsubscribe.css';

export default function FeatureNewsUnsubscribe() {
  const [params] = useSearchParams();
  const token = useMemo(() => params.get('token'), [params]);
  const [state, setState] = useState(token ? 'confirm' : 'error');

  const confirmUnsubscribe = async () => {
    if (!token || state === 'loading') return;
    setState('loading');
    const { data, error } = await supabase.rpc('unsubscribe_feature_news', { p_token: token });
    setState(!error && data ? 'done' : 'error');
  };

  return (
    <main className="news-unsubscribe-page">
      <section className="news-unsubscribe-card">
        <div className="news-unsubscribe-brand">
          <img src="/brand/formaplane-logo.svg" alt="Formaplane" />
        </div>
        <div className="news-unsubscribe-eyebrow">PRÉFÉRENCES E-MAIL</div>
        <h1>Désabonnement des nouveautés</h1>

        {state === 'confirm' && <>
          <p>Vous êtes sur le point de vous désabonner uniquement de la liste d’envoi des <strong>mises à jour et nouveautés de Formaplane</strong>.</p>
          <div className="news-unsubscribe-info">Vous continuerez à recevoir les e-mails nécessaires à votre activité sur Formaplane : propositions de mission, réponses, affectations, modifications de mission et autres notifications indispensables au fonctionnement du service.</div>
          <div className="news-unsubscribe-actions">
            <button className="news-unsubscribe-primary" type="button" onClick={confirmUnsubscribe}>Confirmer mon désabonnement</button>
            <a className="news-unsubscribe-secondary" href="/">Annuler</a>
          </div>
        </>}

        {state === 'loading' && <p>Traitement de votre demande…</p>}
        {state === 'done' && <>
          <div className="news-unsubscribe-success">Votre désabonnement aux e-mails de mises à jour et nouveautés Formaplane est confirmé.</div>
          <p>Les e-mails liés à votre activité sur Formaplane restent actifs. Vous pourrez vous réabonner ultérieurement depuis les paramètres de votre compte.</p>
          <a className="news-unsubscribe-primary news-unsubscribe-link" href="/">Retour à Formaplane</a>
        </>}
        {state === 'error' && <>
          <div className="news-unsubscribe-error">Ce lien de désabonnement est invalide ou n’a pas pu être traité.</div>
          <a className="news-unsubscribe-secondary news-unsubscribe-link" href="/">Retour à Formaplane</a>
        </>}
      </section>
    </main>
  );
}
