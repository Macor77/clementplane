import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { faqItems } from '../content/discoverContent';
import './PublicLanding.css';

const publicFaq = faqItems.filter((item) =>
  [
    'Ma liste de formateurs est-elle visible par les autres organismes ?',
    'Le profil d’un formateur peut-il être consulté par plusieurs organismes ?',
    'Les organismes voient-ils le détail de toutes les missions d’un formateur ?',
    'Que se passe-t-il lorsqu’une mission est affectée à un formateur ?',
    'Un formateur doit-il être inscrit pour recevoir une proposition ?',
  ].includes(item.question),
);

const features = [
  ['Disponibilités partagées', 'Le formateur tient son planning professionnel à jour une seule fois. Ses partenaires consultent la dernière information utile.'],
  ['Recherche ciblée', 'Disponibilités, distance, compétences et informations de votre propre réseau aident à identifier les profils pertinents.'],
  ['Réseau privé', 'Chaque organisme conserve son propre réseau, ses notes et ses informations internes.'],
  ['Propositions de missions', 'Envoyez une proposition, centralisez les réponses et affectez ensuite le formateur retenu.'],
  ['Planning synchronisé', 'Une mission affectée bloque automatiquement le créneau concerné dans les disponibilités du formateur.'],
  ['Profil professionnel', 'Le formateur maîtrise un profil de référence cohérent pour ses différentes collaborations.'],
];

const visuals = {
  diagrams: {
    sync: '/landing/diagrams/01-synchronisation-formateur-of.png',
    privacy: '/landing/diagrams/02-reseau-prive-of.png',
    search: '/landing/diagrams/03-recherche-formateur.png',
  },
  screenshots: {
    search: '/landing/screenshots/01-recherche-formateurs-of.png',
    availability: '/landing/screenshots/02-disponibilites-formateur.png',
    planning: '/landing/screenshots/03-planning-formateur.png',
    proposals: '/landing/screenshots/04-propositions-formateur.png',
    mission: '/landing/screenshots/05-suivi-mission-of.png',
  },
};

function ProductVisual({ src, alt, className = '' }) {
  return (
    <figure className={`public-product-visual ${className}`.trim()}>
      <div className="public-product-visual__bar" aria-hidden="true"><span /><span /><span /></div>
      <img src={src} alt={alt} loading="lazy" />
    </figure>
  );
}

export default function PublicLanding() {
  const [accountChooserOpen, setAccountChooserOpen] = useState(false);

  useEffect(() => {
    if (!accountChooserOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setAccountChooserOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [accountChooserOpen]);

  return (
    <div className="public-site">
      <header className="public-header">
        <div className="public-wrap public-header__inner">
          <a className="public-brand" href="#top" aria-label="Formaplane — accueil">
            <img src="/brand/formaplane-logo.svg" alt="Formaplane" />
          </a>
          <nav className="public-nav" aria-label="Navigation du site">
            <a href="#fonctionnalites">Fonctionnalités</a>
            <a href="#of">Pour les OF</a>
            <a href="#formateurs">Pour les formateurs</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="public-header__actions">
            <Link className="public-link-button" to="/connexion">Se connecter</Link>
            <button className="public-button public-button--small public-account-trigger" type="button" onClick={() => setAccountChooserOpen(true)}>Créer un compte</button>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="public-hero">
          <div className="public-wrap public-hero__grid">
            <div>
              <p className="public-eyebrow">OF + FORMATEURS INDÉPENDANTS</p>
              <h1>Vos missions et vos disponibilités, enfin au même endroit.</h1>
              <p className="public-hero__lead">Formaplane connecte les organismes de formation et leurs formateurs indépendants : disponibilités, recherche, propositions de missions et affectations réunies dans un même outil.</p>
              <div className="public-actions" id="commencer">
                <Link className="public-button" to="/inscription-organisme">Je suis un organisme de formation</Link>
                <Link className="public-button public-button--secondary" to="/inscription">Je suis formateur indépendant</Link>
              </div>
              <p className="public-hero__note">Un outil conçu pour simplifier la collaboration, sans transformer les réseaux professionnels en base publique.</p>
            </div>
            <ProductVisual
              src={visuals.screenshots.search}
              alt="Exemple de recherche de formateurs dans l’espace organisme de formation de Formaplane"
              className="public-product-visual--hero"
            />
          </div>
        </section>

        <section className="public-section public-section--soft">
          <div className="public-wrap">
            <div className="public-section-heading public-section-heading--center">
              <p className="public-eyebrow">MOINS D’ÉCHANGES DISPERSÉS</p>
              <h2>Le planning ne devrait pas circuler entre cinq boîtes mail.</h2>
              <p>Disponibilités demandées par e-mail, réponses par SMS, missions proposées séparément, planning qui change entre-temps… Formaplane crée un point de référence commun.</p>
            </div>
            <div className="public-problems">
              <span>Planning envoyé puis déjà dépassé</span><span>Disponibilités redemandées</span><span>Réponses éparpillées</span><span>Double saisie des missions</span>
            </div>
          </div>
        </section>

        <section className="public-section" id="of">
          <div className="public-wrap public-split-section">
            <div className="public-split-copy">
              <p className="public-eyebrow">ORGANISMES DE FORMATION</p>
              <h2>Votre réseau. Vos missions. Une information à jour.</h2>
              <p>Centralisez votre réseau privé, trouvez en deux clics les formateurs adaptés aux demandes de vos clients, consultez leurs disponibilités et suivez vos propositions jusqu’à l’affectation.</p>
              <ul className="public-check-list">
                <li>Réseau formateurs propre à votre organisme</li>
                <li>Recherche par disponibilité, distance et compétences</li>
                <li>Propositions et réponses centralisées</li>
                <li>Planning des missions</li>
              </ul>
              <Link className="public-text-link" to="/inscription-organisme">Créer mon espace OF →</Link>
            </div>
            <ProductVisual
              src={visuals.screenshots.search}
              alt="Recherche et filtrage de formateurs dans le réseau privé d’un organisme de formation"
            />
          </div>
        </section>

        <section className="public-section public-section--soft" id="formateurs">
          <div className="public-wrap public-split-section public-split-section--reverse">
            <ProductVisual
              src={visuals.screenshots.availability}
              alt="Calendrier des disponibilités d’un formateur dans Formaplane"
            />
            <div className="public-split-copy">
              <p className="public-eyebrow">FORMATEURS INDÉPENDANTS</p>
              <h2>Un seul planning pour vos différents partenaires.</h2>
              <p>Mettez à jour votre disponibilité professionnelle, recevez vos propositions et retrouvez vos missions depuis votre espace Formaplane.</p>
              <ul className="public-check-list">
                <li>Vos disponibilités à jour pour tous vos OF</li>
                <li>Votre planning de missions centralisé</li>
                <li>Réception et réponse simplifiées aux propositions de mission</li>
                <li>Vos disponibilités actualisées automatiquement après chaque mission</li>
              </ul>
              <Link className="public-text-link" to="/inscription">Créer mon espace formateur →</Link>
            </div>
          </div>
        </section>

        <section className="public-section public-section--navy">
          <div className="public-wrap">
            <div className="public-section-heading public-section-heading--light public-section-heading--center">
              <p className="public-eyebrow">UN PROCESSUS CONTINU</p>
              <h2>Une mise à jour. Tous vos OF sont alignés.</h2>
              <p>Le formateur tient ses disponibilités à jour, reçoit les propositions et, lorsqu’une mission est affectée, le créneau devient automatiquement indisponible pour les autres organismes.</p>
            </div>
            <figure className="public-diagram public-diagram--on-dark">
              <img src={visuals.diagrams.sync} alt="Schéma de synchronisation entre disponibilités, proposition de mission, acceptation et mise à jour automatique du planning" loading="lazy" />
            </figure>
          </div>
        </section>

        <section className="public-section" id="fonctionnalites">
          <div className="public-wrap">
            <div className="public-section-heading">
              <p className="public-eyebrow">FONCTIONNALITÉS</p>
              <h2>Le nécessaire pour collaborer, sans multiplier les outils.</h2>
            </div>
            <div className="public-feature-grid">
              {features.map(([title, text], index) => <article className="public-feature" key={title}><span>{String(index + 1).padStart(2, '0')}</span><h3>{title}</h3><p>{text}</p></article>)}
            </div>
          </div>
        </section>

        <section className="public-section public-section--soft">
          <div className="public-wrap public-visual-story">
            <div className="public-section-heading public-section-heading--center">
              <p className="public-eyebrow">TROUVER LE BON FORMATEUR</p>
              <h2>Votre client donne les contraintes. Formaplane vous aide à exploiter votre réseau.</h2>
              <p>Compétence, lieu, disponibilité et distance permettent de faire remonter rapidement les profils pertinents parmi les formateurs que vous connaissez déjà.</p>
            </div>
            <figure className="public-diagram">
              <img src={visuals.diagrams.search} alt="Schéma expliquant la recherche d’un formateur selon la compétence, la date, le lieu et la distance" loading="lazy" />
            </figure>
          </div>
        </section>

        <section className="public-section public-section--product-story">
          <div className="public-wrap">
            <div className="public-section-heading public-section-heading--center">
              <p className="public-eyebrow">DU CÔTÉ DU FORMATEUR</p>
              <h2>Les propositions arrivent au même endroit. Les missions aussi.</h2>
              <p>Le formateur répond à ses propositions puis retrouve ses engagements dans un planning unique, même lorsqu’ils proviennent de plusieurs organismes.</p>
            </div>
            <div className="public-product-duo">
              <div>
                <ProductVisual src={visuals.screenshots.proposals} alt="Proposition de mission reçue par un formateur dans Formaplane" />
                <p className="public-product-caption"><strong>Répondre simplement</strong><span>Une proposition claire, avec les informations utiles et une réponse centralisée.</span></p>
              </div>
              <div>
                <ProductVisual src={visuals.screenshots.planning} alt="Planning centralisé des missions d’un formateur dans Formaplane" />
                <p className="public-product-caption"><strong>Retrouver toutes ses missions</strong><span>Les engagements confirmés et les options sont visibles dans un planning unique.</span></p>
              </div>
            </div>
          </div>
        </section>

        <section className="public-section public-section--soft">
          <div className="public-wrap public-split-section">
            <div className="public-split-copy">
              <p className="public-eyebrow">SUIVI CÔTÉ OF</p>
              <h2>De la sélection à l’affectation, sans perdre le fil.</h2>
              <p>Une mission garde la trace des formateurs sélectionnés, des propositions envoyées, des réponses et de l’affectation finale.</p>
              <ul className="public-check-list">
                <li>Recherche appliquée directement au besoin de la mission</li>
                <li>Statut visible pour chaque formateur suivi</li>
                <li>Historique des actions et réponses</li>
                <li>Affectation finale depuis la même vue</li>
              </ul>
            </div>
            <ProductVisual src={visuals.screenshots.mission} alt="Suivi des formateurs et affectation d’une mission dans l’espace organisme de formation" />
          </div>
        </section>

        <section className="public-section public-section--privacy">
          <div className="public-wrap public-visual-story">
            <div className="public-section-heading public-section-heading--center">
              <p className="public-eyebrow">CONFIDENTIALITÉ</p>
              <h2>Votre réseau reste votre réseau.</h2>
              <p>Un même formateur peut travailler avec plusieurs OF sur Formaplane sans que ces organismes aient accès aux réseaux, notes ou informations internes des autres.</p>
            </div>
            <figure className="public-diagram">
              <img src={visuals.diagrams.privacy} alt="Schéma montrant deux réseaux privés d’organismes de formation partageant un même formateur sans accès croisé" loading="lazy" />
            </figure>
          </div>
        </section>

        <section className="public-section" id="faq">
          <div className="public-wrap public-faq-layout">
            <div className="public-section-heading"><p className="public-eyebrow">FAQ</p><h2>Quelques réponses avant de commencer.</h2><p>Formaplane explique clairement ce qui est partagé, ce qui reste privé et comment fonctionne la collaboration.</p></div>
            <div className="public-faq-list">{publicFaq.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>
          </div>
        </section>

        <section className="public-section public-section--contact" id="contact">
          <div className="public-wrap public-contact">
            <div><p className="public-eyebrow">UNE QUESTION ?</p><h2>Parlons de Formaplane.</h2><p>Vous êtes organisme de formation, formateur indépendant ou simplement curieux du projet ? Écrivez-nous.</p></div>
            <div className="public-contact__box"><strong>Le formulaire public arrive dans ce Sprint.</strong><p>Son raccordement au mini-CRM sera sécurisé côté serveur. En attendant, le site ne simule aucun envoi.</p><a className="public-button" href="mailto:contact@formaplane.fr">contact@formaplane.fr</a></div>
          </div>
        </section>

        <section className="public-final-cta">
          <div className="public-wrap"><img src="/brand/formaplane-symbol.svg" alt="" /><h2>Prêt à simplifier la collaboration entre OF et formateurs ?</h2><div className="public-actions public-actions--center"><Link className="public-button" to="/inscription-organisme">Créer un espace OF</Link><Link className="public-button public-button--secondary-light" to="/inscription">Créer un espace formateur</Link></div></div>
        </section>
      </main>

      {accountChooserOpen && (
        <div className="public-account-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setAccountChooserOpen(false); }}>
          <section className="public-account-modal__panel" role="dialog" aria-modal="true" aria-labelledby="public-account-modal-title">
            <button className="public-account-modal__close" type="button" aria-label="Fermer" onClick={() => setAccountChooserOpen(false)}>×</button>
            <p className="public-eyebrow">CRÉER UN COMPTE</p>
            <h2 id="public-account-modal-title">Quel espace souhaitez-vous créer ?</h2>
            <p className="public-account-modal__intro">Choisissez votre profil pour accéder directement au bon parcours d’inscription.</p>
            <div className="public-account-modal__choices">
              <Link className="public-account-choice" to="/inscription-organisme" onClick={() => setAccountChooserOpen(false)}>
                <strong>Organisme de formation</strong>
                <span>Centraliser votre réseau, consulter les disponibilités et gérer vos propositions de missions.</span>
                <b>Créer mon espace OF →</b>
              </Link>
              <Link className="public-account-choice public-account-choice--trainer" to="/inscription" onClick={() => setAccountChooserOpen(false)}>
                <strong>Formateur indépendant</strong>
                <span>Mettre vos disponibilités à jour, recevoir vos propositions et suivre votre planning de missions.</span>
                <b>Créer mon espace formateur →</b>
              </Link>
            </div>
            <div className="public-account-modal__dual">
              <strong>Vous êtes à la fois organisme de formation et formateur ?</strong>
              <p>Aucun problème. Créez d’abord l’un de vos espaces avec votre adresse e-mail habituelle. Vous pourrez ensuite créer ou rattacher votre second profil avec <strong>cette même adresse e-mail</strong>.</p>
              <p>Votre e-mail fait le lien entre vos deux profils : <strong>un seul compte, deux espaces Formaplane.</strong></p>
            </div>
            <p className="public-account-modal__login">Vous avez déjà un compte ? <Link to="/connexion" onClick={() => setAccountChooserOpen(false)}>Se connecter</Link></p>
          </section>
        </div>
      )}

      <footer className="public-footer"><div className="public-wrap public-footer__inner"><img src="/brand/formaplane-logo-light.svg" alt="Formaplane" /><p>La collaboration entre organismes de formation et formateurs indépendants, plus simplement.</p><div><Link to="/connexion">Connexion</Link><a href="#faq">FAQ</a><a href="mailto:contact@formaplane.fr">Contact</a></div></div></footer>
    </div>
  );
}
