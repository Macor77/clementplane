import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './LegalPage.css';

const operator = <>ALTER PREVENTION, SAS au capital de 2 000 €, SIREN 799 902 069, SIRET siège 799 902 069 00027, TVA intracommunautaire FR36 799 902 069, siège social : Boîte 293, 19 avenue du Maréchal Foch, 77500 Chelles, France.</>;

const pages = {
  '/mentions-legales': {
    title: 'Mentions légales', updated: '29 août 2026',
    sections: [
      ['Éditeur', <><p>Le service Clementplane est édité et exploité par {operator}</p><p>Directeur de la publication : Vincent Macor, en qualité de président d’Alter Prévention.</p><p>Contact : <a href="mailto:contact@clementplane.fr">contact@clementplane.fr</a>.</p></>],
      ['Hébergement', <><p>L’application et le site sont déployés notamment auprès de Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis. Les données applicatives principales sont hébergées via Supabase dans la région européenne sélectionnée pour Clementplane (Stockholm, Suède).</p><p>Les traitements et transferts éventuels sont encadrés contractuellement conformément aux règles applicables en matière de protection des données.</p></>],
      ['Propriété intellectuelle', <p>La marque, l’identité visuelle, les textes, interfaces, éléments graphiques et logiciels propres à Clementplane sont protégés par les droits applicables. Toute reproduction ou exploitation non autorisée est interdite, sous réserve des droits des tiers et des exceptions prévues par la loi.</p>],
      ['Responsabilité', <p>Clementplane fournit un outil de gestion et de mise en relation professionnelle. Les utilisateurs restent responsables des informations qu’ils saisissent, des décisions prises dans le cadre de leurs relations professionnelles et du respect de leurs propres obligations légales et contractuelles.</p>],
    ],
  },
  '/cgu': {
    title: 'Conditions générales d’utilisation', updated: 'Version du 29 août 2026',
    sections: [
      ['1. Objet', <p>Les présentes CGU encadrent l’accès et l’utilisation de Clementplane, service destiné à faciliter la gestion des relations entre organismes de formation et formateurs indépendants : réseau professionnel, disponibilités, propositions et suivi de missions, planning et fonctions associées.</p>],
      ['2. Exploitant et acceptation', <><p>Clementplane est exploité par {operator}</p><p>La création d’un compte nécessite l’acceptation des présentes CGU. La version acceptée et la date d’acceptation peuvent être conservées à titre de preuve.</p></>],
      ['3. Compte et sécurité', <p>L’utilisateur fournit des informations exactes, maintient ses données à jour et protège ses identifiants. Il ne doit pas permettre l’utilisation de son compte par une personne non autorisée et doit signaler sans délai tout usage suspect.</p>],
      ['4. Données relatives aux formateurs', <><p>Un organisme peut référencer dans son réseau professionnel un formateur avec lequel il travaille ou envisage légitimement de travailler. Il doit veiller à la pertinence, l’exactitude et la licéité des informations saisies.</p><p>Un formateur existant peut être identifié afin d’éviter la création de doublons, même si son profil n’est pas revendiqué. Les informations affichées sont limitées à celles nécessaires pour identifier la bonne personne. Les informations propres aux organismes restent cloisonnées.</p></>],
      ['5. Informations privées des organismes', <p>Les notes, tarifs, statuts internes et autres informations propres au réseau d’un organisme ne sont pas destinés aux autres organismes ni au formateur lorsqu’ils constituent des données internes de l’organisme. Chaque organisme demeure responsable du contenu qu’il saisit.</p>],
      ['6. Contenus interdits', <p>Il est interdit de saisir des contenus illicites, injurieux, discriminatoires, excessifs ou sans rapport avec la finalité professionnelle du service. Les champs libres ne doivent pas être utilisés pour enregistrer inutilement des données sensibles ou des informations relatives à la vie privée.</p>],
      ['7. Missions et disponibilités', <p>Clementplane facilite l’échange d’informations et de propositions. Une disponibilité affichée ou une proposition envoyée ne constitue pas, à elle seule, un engagement contractuel définitif entre un organisme et un formateur. Les parties restent responsables de leurs accords professionnels.</p>],
      ['8. Fonctionnement du service', <p>Clementplane peut faire évoluer, sécuriser, suspendre temporairement ou maintenir certaines fonctionnalités. Aucun service informatique ne pouvant être garanti sans interruption, l’exploitant met en œuvre des moyens raisonnables pour assurer la disponibilité et la sécurité du service.</p>],
      ['9. Utilisation loyale', <p>L’utilisateur s’interdit notamment de contourner les contrôles d’accès, d’extraire massivement les données, de perturber le service, d’usurper l’identité d’un tiers ou d’utiliser Clementplane à des fins de prospection abusive.</p>],
      ['10. Suppression du compte', <p>L’utilisateur peut demander ou déclencher la suppression de son compte lorsque la fonctionnalité est disponible. Certaines données professionnelles peuvent être conservées ou dissociées du compte lorsqu’elles restent nécessaires aux organismes concernés, à la prévention des doublons, au respect d’une obligation légale ou à la défense de droits.</p>],
      ['11. Données personnelles', <p>Les traitements de données personnelles sont décrits dans la <Link to="/confidentialite">Politique de confidentialité</Link>, qui précise notamment les finalités, bases juridiques, durées de conservation, destinataires et droits des personnes.</p>],
      ['12. Évolution des CGU', <p>Les CGU peuvent être mises à jour pour tenir compte d’évolutions fonctionnelles, juridiques ou de sécurité. Lorsqu’une nouvelle acceptation est nécessaire, l’utilisateur en est informé de manière appropriée.</p>],
      ['13. Droit applicable', <p>Les présentes CGU sont soumises au droit français. Les parties recherchent en priorité une résolution amiable de tout différend, sans priver un utilisateur des règles impératives de compétence dont il pourrait bénéficier.</p>],
    ],
  },
  '/confidentialite': {
    title: 'Politique de confidentialité', updated: 'Version du 29 août 2026',
    sections: [
      ['1. Responsable et contact', <><p>Pour les traitements réalisés pour l’exploitation de Clementplane, le responsable du traitement est {operator}</p><p>Pour toute question ou exercice de droits : <a href="mailto:contact@clementplane.fr">contact@clementplane.fr</a>.</p></>],
      ['2. Données traitées', <p>Selon votre usage : identité et coordonnées professionnelles, informations de compte et d’authentification, appartenance à un organisme, profil professionnel, compétences, zone géographique, disponibilités, missions et réponses, relations entre organismes et formateurs, messages adressés au support, préférences, événements techniques et journaux nécessaires à la sécurité et au fonctionnement du service.</p>],
      ['3. Finalités et bases juridiques', <><p>Les données sont utilisées pour créer et sécuriser les comptes, fournir les fonctionnalités demandées, gérer les réseaux professionnels, disponibilités et missions, communiquer sur les opérations du service, assurer le support, prévenir les abus, diagnostiquer les erreurs et établir des statistiques d’utilisation.</p><p>Selon le traitement, Clementplane s’appuie sur l’exécution des CGU ou de mesures précontractuelles, le respect d’obligations légales et l’intérêt légitime à exploiter, sécuriser et améliorer le service. Lorsqu’un consentement est juridiquement requis pour une fonctionnalité distincte, il est demandé séparément.</p></>],
      ['4. Formateurs référencés sans compte', <><p>Un organisme de formation peut référencer un formateur dans son réseau avant que celui-ci ne crée un compte. Les données proviennent alors de l’organisme concerné ou de données professionnelles déjà légitimement détenues dans Clementplane.</p><p>Lors d’un premier contact ou d’une invitation, Clementplane indique au formateur l’origine de cette relation et lui permet d’accéder aux informations utiles sur le traitement de ses données. L’inscription reste facultative.</p></>],
      ['5. Cloisonnement et destinataires', <p>Les données sont accessibles uniquement aux personnes et organismes autorisés selon leur rôle. Les informations internes propres à un organisme, notamment ses notes, tarifs ou statuts relationnels, sont cloisonnées. Des prestataires techniques peuvent traiter les données dans la limite nécessaire à leur mission.</p>],
      ['6. Prestataires et transferts', <p>Clementplane utilise notamment Supabase pour la base de données, l’authentification et des fonctions serveur, Vercel pour le déploiement, Brevo pour certains e-mails et Google Workspace pour les outils de communication. Les prestataires sont encadrés contractuellement. Certains traitements peuvent impliquer des transferts hors de l’Espace économique européen ; ceux-ci sont encadrés par les mécanismes prévus par le RGPD, notamment lorsque nécessaire par des clauses contractuelles types.</p>],
      ['7. Conservation', <><p>Les données ne sont pas conservées indéfiniment. À titre de politique interne : les empreintes techniques du dispositif anti-abus du formulaire public sont supprimées au-delà de 24 heures ; les événements produit sont conservés au maximum 12 mois ; les journaux techniques d’erreur au maximum 6 mois ; les journaux techniques d’e-mails au maximum 12 mois ; les demandes de support clôturées au maximum 3 ans après leur clôture.</p><p>Les données de compte, de réseau professionnel et de missions sont conservées pendant la relation ou aussi longtemps qu’elles restent nécessaires à la finalité professionnelle concernée, puis supprimées, anonymisées ou archivées lorsque la loi ou la défense de droits l’exige.</p></>],
      ['8. Vos droits', <p>Dans les conditions prévues par le RGPD, vous pouvez demander l’accès à vos données, leur rectification, leur effacement, la limitation du traitement, leur portabilité lorsque celle-ci s’applique, ou vous opposer à certains traitements fondés sur l’intérêt légitime. Vous pouvez exercer vos droits à contact@clementplane.fr. Une vérification raisonnable de votre identité peut être demandée en cas de doute.</p>],
      ['9. Réclamation', <p>Vous pouvez introduire une réclamation auprès de la Commission nationale de l’informatique et des libertés (CNIL) si vous estimez, après nous avoir contactés, que vos droits ne sont pas respectés.</p>],
      ['10. Sécurité et violations', <p>Clementplane met en œuvre des mesures techniques et organisationnelles adaptées au risque, notamment des contrôles d’accès et un cloisonnement des données. Les incidents de sécurité impliquant des données personnelles sont analysés, documentés et, lorsque le RGPD l’exige, notifiés à la CNIL et aux personnes concernées.</p>],
      ['11. Mise à jour', <p>Cette politique peut évoluer avec le service ou la réglementation. La date de la version en vigueur figure en haut de la page.</p>],
    ],
  },
  '/traceurs': {
    title: 'Traceurs et stockage local', updated: '29 août 2026',
    sections: [
      ['Principe', <p>Clementplane n’utilise actuellement pas de traceur publicitaire ni d’outil de mesure d’audience nécessitant un consentement préalable. Aucun bandeau de consentement n’est donc affiché à ce jour.</p>],
      ['Stockages nécessaires', <p>Le navigateur peut conserver des informations strictement nécessaires ou fonctionnelles, par exemple pour maintenir une session, mémoriser l’espace actif, gérer l’installation de l’application web ou conserver certaines préférences d’interface. Ces éléments servent au fonctionnement du service et ne sont pas utilisés pour établir un profil publicitaire.</p>],
      ['Évolution', <p>Si Clementplane ajoute ultérieurement des traceurs non strictement nécessaires, cette page sera mise à jour et, lorsque la réglementation l’exige, un mécanisme de consentement sera proposé avant leur dépôt.</p>],
    ],
  },
};

export default function LegalPage() {
  const page = pages[window.location.pathname] || pages['/mentions-legales'];
  useEffect(() => {
    document.title = `${page.title} — Clementplane`;
    let meta = document.querySelector('meta[name="robots"]');
    const created = !meta;
    if (!meta) { meta = document.createElement('meta'); meta.name = 'robots'; document.head.appendChild(meta); }
    const previous = meta.content;
    meta.content = 'noindex,follow';
    return () => { if (created) meta.remove(); else meta.content = previous; };
  }, [page.title]);

  return <div className="legal-page">
    <header className="legal-header"><Link to="/" aria-label="Retour à Clementplane"><img src="/brand/clementplane-logo.svg" alt="Clementplane" /></Link></header>
    <main className="legal-main">
      <p className="legal-kicker">CLEMENTPLANE</p><h1>{page.title}</h1><p className="legal-updated">{page.updated}</p>
      {page.sections.map(([title, body]) => <section key={title}><h2>{title}</h2>{body}</section>)}
    </main>
    <footer className="legal-footer"><Link to="/mentions-legales">Mentions légales</Link><Link to="/cgu">CGU</Link><Link to="/confidentialite">Confidentialité</Link><Link to="/traceurs">Traceurs</Link><Link to="/">Accueil</Link></footer>
  </div>;
}
