import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { createSupportRequest } from '../services/supportRequestService';
import {
  FORMPLANE_VERSION,
  discoverFeatures,
  faqItems,
  organizationTutorials,
  publicRoadmap,
  trainerTutorials,
} from '../content/discoverContent';

import './DiscoverClementplane.css';

const CONTACT_EMAIL = 'contact@clementplane.fr';

const contactCategories = [
  { key: 'general_question', label: 'Question sur Clementplane' },
  { key: 'technical_issue', label: 'Problème technique' },
  { key: 'account_question', label: 'Question sur mon compte' },
  { key: 'feature_request', label: 'Suggestion d’amélioration' },
  { key: 'privacy_data', label: 'Confidentialité / données' },
  { key: 'other', label: 'Autre demande' },
];

function TutorialCard({ tutorial }) {
  const [open, setOpen] = useState(false);

  return (
    <article className={`discover-tutorial${open ? ' discover-tutorial--open' : ''}`}>
      <button
        type="button"
        className="discover-tutorial__summary"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className="discover-tutorial__icon" aria-hidden="true">•</span>
        <span className="discover-tutorial__copy">
          <strong>{tutorial.title}</strong>
          <span>{tutorial.summary}</span>
        </span>
        <span className="discover-tutorial__time">Guide pas à pas</span>
        <span className="discover-tutorial__chevron" aria-hidden="true">⌄</span>
      </button>

      {open && (
        <div className="discover-tutorial__content">
          <ol>
            {tutorial.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>

          {tutorial.tip && (
            <div className="discover-tip">
              <strong>À savoir</strong>
              <span>{tutorial.tip}</span>
            </div>
          )}

          <Link className="button button--primary" to={tutorial.route}>
            {tutorial.routeLabel}
          </Link>
        </div>
      )}
    </article>
  );
}

export default function DiscoverClementplane({ audience }) {
  const location = useLocation();

  const {
    currentOrganization,
  } = useAuth();

  const [faqQuery, setFaqQuery] = useState('');
  const [contactCategory, setContactCategory] = useState(contactCategories[0].key);
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactFeedback, setContactFeedback] = useState(null);

  const isTrainer = audience === 'trainer';
  const tutorials = isTrainer ? trainerTutorials : organizationTutorials;

  useEffect(() => {
    if (location.hash !== '#contact') return;

    const frame = window.requestAnimationFrame(() => {
      document.getElementById('contact')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [location.hash]);

  const filteredFaq = useMemo(() => {
    const query = faqQuery.trim().toLocaleLowerCase('fr');

    return faqItems.filter((item) => {
      if (!item.audiences.includes(audience)) return false;
      if (!query) return true;

      return `${item.question} ${item.answer} ${item.category}`
        .toLocaleLowerCase('fr')
        .includes(query);
    });
  }, [audience, faqQuery]);

  const visibleFeatures = discoverFeatures.filter((feature) =>
    feature.audiences.includes(audience),
  );


  const submitContactRequest = async () => {
    if (!contactMessage.trim() || contactSubmitting) return;

    setContactSubmitting(true);
    setContactFeedback(null);

    try {
      const request = await createSupportRequest({
        audience,
        organizationId: isTrainer ? null : currentOrganization?.id || null,
        category: contactCategory,
        message: contactMessage,
        appVersion: FORMPLANE_VERSION,
      });

      setContactMessage('');
      setContactFeedback({
        type: request.notificationSent ? 'success' : 'warning',
        message: request.notificationSent
          ? 'Votre demande a bien été envoyée à Clementplane.'
          : `Votre demande a bien été enregistrée. Si elle est urgente, vous pouvez aussi écrire à ${CONTACT_EMAIL}.`,
      });
    } catch (error) {
      setContactFeedback({
        type: 'error',
        message: error?.message || "Impossible d'envoyer votre demande pour le moment.",
      });
    } finally {
      setContactSubmitting(false);
    }
  };

  return (
    <div className="page-container discover-page">
      <header className="discover-hero">
        <div className="discover-hero__content">
          <p className="page-eyebrow">DÉCOUVRIR CLEMENTPLANE</p>
          <h1>Utiliser Clementplane simplement</h1>
          <p>
            Comprenez comment Clementplane simplifie la collaboration entre organismes et formateurs : planning à jour, recherche, propositions de missions et suivi centralisé.
          </p>
          <div className="discover-hero__actions">
            <a className="button button--primary" href="#tutoriels">Voir les guides</a>
            <a className="button" href="#contact">Contacter Clementplane</a>
          </div>
        </div>

        <div className="discover-hero__meta">
          <span>Votre contexte</span>
          <strong>{isTrainer ? 'Formateur' : 'Organisme de Formation'}</strong>
          <small>Contenu adapté automatiquement à votre espace.</small>
        </div>
      </header>

      <section className="discover-section" aria-labelledby="discover-start-title">
        <div className="discover-section__heading">
          <div>
            <p className="page-eyebrow">BIEN DÉMARRER</p>
            <h2 id="discover-start-title">Ce que Clementplane simplifie concrètement</h2>
          </div>
          <p>{isTrainer ? 'Un seul endroit pour tenir votre profil et vos disponibilités à jour, suivre vos missions et partager uniquement ce qui est utile à vos partenaires.' : 'Moins de fichiers, de relances et de messages dispersés : Clementplane relie votre réseau de formateurs, leurs disponibilités et vos missions.'}</p>
        </div>

        <div className="discover-feature-grid">
          {visibleFeatures.map((feature) => (
            <article className="discover-feature-card" key={feature.title}>
              <span className="discover-feature-card__kicker">{feature.kicker}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="discover-section" id="tutoriels" aria-labelledby="tutorials-title">
        <div className="discover-section__heading">
          <div>
            <p className="page-eyebrow">GUIDES PAS À PAS</p>
            <h2 id="tutorials-title">Comment faire dans Clementplane ?</h2>
          </div>
          <p>Ouvrez un guide pour suivre les étapes. Les captures d’écran pourront être ajoutées ensuite au fil de la stabilisation de l’interface.</p>
        </div>

        <div className="discover-tutorial-list">
          {tutorials.map((tutorial) => (
            <TutorialCard tutorial={tutorial} key={tutorial.id} />
          ))}
        </div>
      </section>

      <section className="discover-section" id="faq" aria-labelledby="faq-title">
        <div className="discover-section__heading">
          <div>
            <p className="page-eyebrow">FAQ</p>
            <h2 id="faq-title">Questions fréquentes</h2>
          </div>
          <p>Recherchez un mot-clé ou parcourez les questions liées à votre espace.</p>
        </div>

        <label className="discover-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={faqQuery}
            onChange={(event) => setFaqQuery(event.target.value)}
            placeholder="Rechercher dans la FAQ…"
          />
        </label>

        <div className="discover-faq-list">
          {filteredFaq.length > 0 ? (
            filteredFaq.map((item) => (
              <details className="discover-faq" key={item.question}>
                <summary>
                  <span>{item.question}</span>
                  <small>{item.category}</small>
                </summary>
                <p>{item.answer}</p>
              </details>
            ))
          ) : (
            <div className="discover-empty">Aucune réponse ne correspond à votre recherche.</div>
          )}
        </div>
      </section>

      <section className="discover-section" id="transparence" aria-labelledby="transparency-title">
        <div className="discover-section__heading">
          <div>
            <p className="page-eyebrow">TRANSPARENCE PRODUIT</p>
            <h2 id="transparency-title">Où en est Clementplane ?</h2>
          </div>
          <div className="discover-version">
            <span>Version actuellement publiée</span>
            <strong>{FORMPLANE_VERSION}</strong>
          </div>
        </div>

        <div className="discover-roadmap discover-roadmap--public">
          <article className="discover-roadmap__item discover-roadmap__item--available">
            <span className="discover-status discover-status--done">
              {publicRoadmap.available.status}
            </span>
            <h3>{publicRoadmap.available.title}</h3>
            <p>{publicRoadmap.available.description}</p>
          </article>

          <article className="discover-roadmap__future">
            <span className="discover-roadmap__future-label">ÉVOLUTIONS ENVISAGÉES</span>
            <h3>Ce que nous souhaitons encore améliorer</h3>
            <ul>
              {publicRoadmap.future.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>

        <div className="discover-principles">
          <h3>Nos principes</h3>
          <p>
            Clementplane est conçu pour simplifier la collaboration entre organismes et formateurs, sans transformer les données personnelles en annuaire public. Les fonctionnalités évoluent progressivement à partir des usages réels et des retours utilisateurs.
          </p>
        </div>
      </section>

      <section className="discover-section discover-contact" id="contact" aria-labelledby="contact-title">
        <div className="discover-contact__intro">
          <p className="page-eyebrow">CONTACT</p>
          <h2 id="contact-title">Besoin d’aide ou envie de nous faire un retour ?</h2>
          <p>
            Décrivez votre demande. Clementplane prépare automatiquement le contexte utile pour éviter de vous demander les mêmes informations plusieurs fois.
          </p>
          <div className="discover-contact__identity">
            <span>Message préparé pour</span>
            <strong>{CONTACT_EMAIL}</strong>
            <small>Une seule adresse pour les questions, problèmes et suggestions.</small>
          </div>
        </div>

        <div className="discover-contact__form">
          <label>
            <span>Catégorie</span>
            <select value={contactCategory} onChange={(event) => { setContactCategory(event.target.value); setContactFeedback(null); }}>
              {contactCategories.map((category) => (
                <option key={category.key} value={category.key}>{category.label}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Votre message</span>
            <textarea
              rows="7"
              value={contactMessage}
              onChange={(event) => { setContactMessage(event.target.value); setContactFeedback(null); }}
              placeholder="Expliquez votre question, votre problème ou votre suggestion…"
            />
          </label>

          <button
            type="button"
            className="button button--primary"
            disabled={!contactMessage.trim() || contactSubmitting}
            onClick={submitContactRequest}
          >
            {contactSubmitting ? 'Envoi en cours…' : 'Envoyer ma demande'}
          </button>

          {contactFeedback && (
            <div className={`discover-contact__feedback discover-contact__feedback--${contactFeedback.type}`} role="status">
              {contactFeedback.message}
            </div>
          )}

          <p className="discover-contact__note">
            Votre demande est enregistrée dans Clementplane avec le contexte de votre compte afin d’en faciliter le suivi.
          </p>
        </div>
      </section>
    </div>
  );
}
