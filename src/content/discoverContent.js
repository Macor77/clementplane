export const FORMPLANE_VERSION = 'v0.18.0';

export const discoverFeatures = [
  {
    title: 'Un planning partagé, toujours à jour',
    kicker: 'Moins de messages, plus de visibilité',
    description: 'Le formateur met ses disponibilités à jour dans Formaplane. Les organismes partenaires peuvent consulter l’information actualisée directement dans la plateforme, sans redemander le planning par e-mail, SMS ou WhatsApp.',
    audiences: ['organization', 'trainer'],
  },
  {
    title: 'Trouver le bon formateur pour une mission',
    kicker: 'Disponibilité, distance, compétences…',
    description: 'L’organisme crée sa mission puis recherche les profils les plus pertinents selon les critères utiles : disponibilités, localisation, compétences et informations de son réseau.',
    audiences: ['organization'],
  },
  {
    title: 'Proposer une mission en quelques clics',
    kicker: 'Même si le formateur n’est pas inscrit',
    description: 'La proposition part directement depuis Formaplane. Le formateur reçoit un e-mail avec les informations utiles et peut accepter ou refuser. L’organisme est averti et suit les réponses depuis la mission.',
    audiences: ['organization'],
  },
  {
    title: 'Votre réseau reste votre réseau',
    kicker: 'Une liste privée pour chaque organisme',
    description: 'Les formateurs ajoutés ou importés dans votre espace constituent votre propre réseau de travail. Cette liste, vos notes et vos informations internes ne deviennent pas une base de données consultable par les autres organismes.',
    audiences: ['organization'],
  },
  {
    title: 'Votre profil professionnel, à jour au même endroit',
    kicker: 'Une seule fiche à maintenir',
    description: 'Vous tenez à jour vos informations de référence dans Formaplane. Les organismes avec lesquels vous travaillez peuvent ainsi consulter un profil fiable, sans que vous ayez à renvoyer vos informations à chacun.',
    audiences: ['trainer'],
  },
  {
    title: 'Les missions bloquent automatiquement les disponibilités',
    kicker: 'Pas de double saisie',
    description: 'Lorsqu’une mission est affectée à un formateur, Formaplane rend automatiquement la période concernée indisponible pour les autres organismes. L’OF connaît ainsi automatiquement et en temps réel la disponibilité du formateur, sans nouvelle saisie ni échange supplémentaire.',
    audiences: ['organization', 'trainer'],
  },
  {
    title: 'Un planning de missions sans agenda public',
    kicker: 'Partager la disponibilité, pas toute sa vie',
    description: 'Le formateur retrouve ses missions et ses indisponibilités dans Formaplane. Les organismes voient ce dont ils ont besoin pour travailler avec lui, sans accéder à un agenda personnel détaillé de type Google Agenda.',
    audiences: ['trainer'],
  },
  {
    title: 'Un suivi plus simple des affectations',
    kicker: 'Une mission, un historique clair',
    description: 'Propositions envoyées, réponses reçues et formateur finalement affecté restent regroupés autour de la mission. L’organisme sait plus facilement où il en est et limite les relances dispersées.',
    audiences: ['organization'],
  },
];

export const organizationTutorials = [
  {
    id: 'of-network', title: 'Construire mon réseau privé de formateurs', summary: 'Ajouter, rechercher ou importer des formateurs tout en gardant une liste propre à mon organisme.', route: '/listing', routeLabel: 'Ouvrir mes formateurs',
    steps: ['Depuis « Formateurs », ajoutez un profil manuellement, recherchez un formateur existant ou utilisez l’import en masse.', 'Lorsque Formaplane trouve un profil correspondant, ajoutez-le à votre réseau plutôt que de créer une seconde fiche.', 'Les formateurs de votre réseau, vos notes et vos informations internes restent propres à votre organisme : les autres OF ne consultent pas cette liste.', 'Lorsqu’un formateur revendique son profil, ses informations personnelles de référence sont maintenues par lui et peuvent être utilisées par ses différents OF partenaires.'],
    tip: 'Formaplane distingue le profil partagé du formateur et la relation privée que chaque organisme entretient avec lui.',
  },
  {
    id: 'of-mission', title: 'Créer une mission et trouver les bons formateurs', summary: 'Passer du besoin de formation à une sélection pertinente grâce aux disponibilités, distances, compétences et autres critères.', route: '/missions', routeLabel: 'Ouvrir mes missions',
    steps: ['Créez la mission et renseignez sa date, son lieu, ses horaires et les informations utiles.', 'Utilisez la recherche pour identifier les formateurs les plus pertinents selon leur disponibilité, leur distance, leurs compétences et les données de votre réseau.', 'Sélectionnez un ou plusieurs profils puis envoyez les propositions directement depuis Formaplane.', 'Le formateur peut recevoir la proposition par e-mail et répondre même s’il n’utilise pas encore activement Formaplane.', 'Vous êtes averti de sa réponse et retrouvez l’état des sollicitations au même endroit, dans la mission.'],
    tip: 'L’objectif est d’éviter les recherches dans plusieurs fichiers puis les séries d’e-mails ou de SMS pour savoir qui est disponible.',
  },
  {
    id: 'of-assignment', title: 'Suivre les réponses et affecter la mission', summary: 'Voir qui a accepté ou refusé puis confirmer le formateur retenu sans perdre le fil.', route: '/missions', routeLabel: 'Suivre mes missions',
    steps: ['Ouvrez la mission pour retrouver les propositions envoyées et leur statut.', 'Comparez les réponses reçues sans devoir reconstituer l’historique depuis votre messagerie.', 'Affectez le formateur retenu lorsque votre choix est fait.', 'Une fois la mission affectée, Formaplane met automatiquement à jour l’indisponibilité du formateur pour cette période.'],
    tip: 'Les autres organismes n’ont pas accès au contenu de votre mission. Ils voient simplement que le formateur n’est plus disponible sur le créneau concerné.',
  },
  {
    id: 'of-availability', title: 'Consulter un planning formateur à jour', summary: 'Savoir quand un partenaire est disponible sans lui redemander son planning à chaque besoin.', route: '/listing', routeLabel: 'Voir mes formateurs',
    steps: ['Ouvrez la fiche d’un formateur de votre réseau.', 'Consultez ses disponibilités mises à jour dans Formaplane.', 'Utilisez cette information au moment de préparer une mission ou une proposition.', 'Lorsque le formateur actualise son planning, vous bénéficiez de la nouvelle information sans qu’un nouveau fichier ou message soit nécessaire.'],
    tip: 'Le partage par e-mail peut attirer votre attention sur une mise à jour, mais Formaplane reste la source à consulter pour disposer de l’état le plus récent.',
  },
  {
    id: 'of-privacy', title: 'Comprendre ce qui est partagé — et ce qui reste privé', summary: 'Distinguer votre réseau interne du profil que le formateur partage avec ses organismes partenaires.', route: '/listing', routeLabel: 'Voir mon réseau',
    steps: ['Votre liste de formateurs est propre à votre organisme : elle n’est pas publiée comme une base commune accessible à tous les OF.', 'Vos notes et informations internes restent liées à votre relation avec le formateur.', 'Un formateur revendiqué maintient en revanche son profil de référence : celui-ci peut être consulté par les organismes partenaires qui travaillent avec lui.', 'Les disponibilités permettent de savoir si le formateur peut être sollicité sans révéler le détail de son agenda personnel ou le contenu des missions confiées par d’autres organismes.'],
  },
];

export const trainerTutorials = [
  {
    id: 'trainer-profile', title: 'Garder un profil fiable pour mes OF partenaires', summary: 'Maintenir une seule fiche de référence plutôt que transmettre les mêmes informations à chaque organisme.', route: '/formateur/profil', routeLabel: 'Ouvrir mon profil',
    steps: ['Ouvrez « Mon profil » et vérifiez vos coordonnées, votre localisation, vos compétences et votre matériel.', 'Mettez à jour les informations qui ont changé.', 'Enregistrez vos modifications : votre profil revendiqué devient votre référence dans Formaplane.', 'Les organismes partenaires qui travaillent avec vous peuvent ainsi consulter une information cohérente et récente.'],
    tip: 'Votre profil professionnel peut être utilisé par vos organismes partenaires, mais Formaplane n’a pas vocation à exposer librement votre adresse précise ou votre agenda personnel.',
  },
  {
    id: 'trainer-availability', title: 'Mettre mon planning à jour une seule fois', summary: 'Informer mes OF partenaires en temps réel sans renvoyer constamment un planning par e-mail, SMS ou WhatsApp.', route: '/formateur/disponibilites', routeLabel: 'Gérer mes disponibilités',
    steps: ['Ouvrez « Mes disponibilités » et choisissez la période à mettre à jour.', 'Indiquez les jours où vous êtes disponible ou indisponible et ajoutez une note si nécessaire.', 'Enregistrez vos changements dès que votre situation évolue.', 'Les organismes partenaires peuvent ensuite consulter l’état actuel dans Formaplane sans vous redemander un fichier à jour.'],
    tip: 'Formaplane devient le point de référence pour votre disponibilité professionnelle : vous mettez à jour l’information, vos partenaires consultent la dernière version.',
  },
  {
    id: 'trainer-automatic', title: 'Comprendre les indisponibilités automatiques', summary: 'Une mission affectée bloque automatiquement le créneau pour les autres organismes.', route: '/formateur/missions', routeLabel: 'Voir mes missions',
    steps: ['Lorsqu’un organisme vous affecte officiellement à une mission, celle-ci apparaît dans votre suivi de missions.', 'La période concernée est automatiquement considérée comme indisponible dans votre planning.', 'Les autres organismes voient donc que vous n’êtes pas disponible, sans connaître le détail de la mission ni l’organisme qui vous l’a confiée.', 'Vous n’avez pas besoin de reporter manuellement cette indisponibilité une seconde fois.'],
    tip: 'Vous partagez votre disponibilité utile au travail, pas un agenda public avec le détail de vos activités.',
  },
  {
    id: 'trainer-share', title: 'Partager mes disponibilités avec un organisme', summary: 'Prévenir un contact que mon planning est à jour et l’inviter à consulter Formaplane.', route: '/formateur/partage-disponibilites', routeLabel: 'Partager mes disponibilités',
    steps: ['Ajoutez ou sélectionnez le contact de l’organisme que vous souhaitez informer.', 'Choisissez les mois de disponibilités à partager.', 'Vérifiez le destinataire puis envoyez le partage depuis Formaplane.', 'Après un envoi, un délai de 20 jours complets s’applique pour ce même couple formateur + contact afin d’éviter les relances répétées.'],
    tip: 'Si une mise à jour doit être signalée avant la fin du délai, indiquez simplement à l’organisme que vos disponibilités sont actualisées et consultables en permanence dans Formaplane.',
  },
  {
    id: 'trainer-proposals', title: 'Répondre simplement à une proposition de mission', summary: 'Recevoir les informations utiles et accepter ou refuser sans multiplier les échanges.', route: '/formateur/propositions', routeLabel: 'Voir mes propositions',
    steps: ['Consultez la proposition reçue et les informations de la mission.', 'Acceptez ou refusez selon votre disponibilité et votre intérêt.', 'Votre réponse est enregistrée dans Formaplane et l’organisme est informé.', 'Si l’organisme vous retient ensuite, la mission confirmée rejoint votre suivi et votre planning se met à jour automatiquement.'],
  },
  {
    id: 'trainer-missions', title: 'Retrouver mon planning de missions', summary: 'Centraliser mes interventions professionnelles sans partager le détail de mon agenda personnel.', route: '/formateur/missions', routeLabel: 'Voir mes missions',
    steps: ['Ouvrez « Mes missions » pour retrouver les interventions qui vous concernent.', 'Sélectionnez une mission pour consulter ses informations utiles.', 'Utilisez ce suivi comme vue professionnelle de vos engagements Formaplane.', 'Vos organismes partenaires n’accèdent pas pour autant à la totalité de ce planning : ils voient principalement les informations nécessaires à leur collaboration avec vous et votre disponibilité.'],
  },
];

export const faqItems = [
  { question: 'Ma liste de formateurs est-elle visible par les autres organismes ?', answer: 'Non. Le réseau que vous construisez ou importez dans Formaplane est propre à votre organisme. Les autres OF ne peuvent pas parcourir votre liste, vos notes ni vos informations internes comme s’il s’agissait d’une base de données commune.', audiences: ['organization'], category: 'Confidentialité' },
  { question: 'Le profil d’un formateur peut-il être consulté par plusieurs organismes ?', answer: 'Oui, lorsqu’un formateur travaille avec plusieurs organismes partenaires, son profil de référence peut être utilisé dans ces différentes relations. Cela évite qu’il existe plusieurs versions contradictoires de ses informations. En revanche, les données privées propres à chaque organisme restent séparées.', audiences: ['organization', 'trainer'], category: 'Confidentialité' },
  { question: 'Les organismes voient-ils le détail de toutes les missions d’un formateur ?', answer: 'Non. Formaplane permet de partager l’information utile de disponibilité sans transformer le planning du formateur en agenda public. Lorsqu’un créneau est occupé, un autre organisme doit surtout savoir que le formateur n’est pas disponible, pas nécessairement pourquoi ni pour qui.', audiences: ['organization', 'trainer'], category: 'Confidentialité' },
  { question: 'Que se passe-t-il lorsqu’une mission est affectée à un formateur ?', answer: 'La mission rejoint le suivi du formateur et le créneau concerné devient automatiquement indisponible. Le formateur n’a pas besoin de saisir une seconde fois son indisponibilité pour empêcher d’autres sollicitations sur la même période.', audiences: ['organization', 'trainer'], category: 'Planning' },
  { question: 'Dois-je encore demander le planning d’un formateur par e-mail ?', answer: 'L’objectif est justement de ne plus avoir à le faire systématiquement. Si le formateur tient ses disponibilités à jour, son organisme partenaire peut consulter la dernière information directement dans Formaplane. Les e-mails de partage servent surtout à signaler qu’un planning a été actualisé.', audiences: ['organization'], category: 'Disponibilités' },
  { question: 'Pourquoi maintenir mes disponibilités à jour dans Formaplane ?', answer: 'Parce qu’une seule mise à jour peut ensuite servir à vos différents organismes partenaires. Vous limitez les fichiers, captures d’écran et messages envoyés individuellement, tout en gardant la maîtrise de votre disponibilité professionnelle.', audiences: ['trainer'], category: 'Disponibilités' },
  { question: 'Comment Formaplane aide-t-il à trouver un formateur pour une mission ?', answer: 'L’organisme crée d’abord la mission puis peut rechercher les profils pertinents en tenant compte notamment des disponibilités, de la distance, des compétences et des informations de son propre réseau. Il peut ensuite envoyer les propositions directement depuis Formaplane.', audiences: ['organization'], category: 'Missions' },
  { question: 'Un formateur doit-il être inscrit pour recevoir une proposition ?', answer: 'Non. Formaplane permet à l’organisme d’envoyer une proposition à un formateur même si celui-ci n’utilise pas encore activement la plateforme. Il reçoit les informations par e-mail et peut répondre à la sollicitation.', audiences: ['organization'], category: 'Missions' },
  { question: 'Une proposition de mission confirme-t-elle la mission ?', answer: 'Non. Une proposition permet d’abord au formateur d’indiquer s’il accepte ou refuse la sollicitation. L’organisme suit les réponses puis affecte officiellement le formateur retenu.', audiences: ['organization', 'trainer'], category: 'Missions' },
  { question: 'Pourquoi ne puis-je pas renvoyer mes disponibilités immédiatement au même contact ?', answer: 'Formaplane applique un délai de 20 jours complets après un partage vers un même contact OF pour éviter les sollicitations répétées. Vos disponibilités peuvent néanmoins être mises à jour à tout moment et restent consultables dans Formaplane.', audiences: ['trainer'], category: 'Disponibilités' },
  { question: 'Puis-je avoir à la fois un espace OF et un espace Formateur ?', answer: 'Oui. Lorsqu’un même compte possède les deux rôles, Formaplane propose un choix d’espace et permet ensuite de passer de l’un à l’autre.', audiences: ['organization', 'trainer'], category: 'Compte' },
  { question: "Comment Formaplane s'assure-t-il que la plateforme reste fiable ?", answer: "Formaplane dispose de contrôles automatisés qui vérifient régulièrement ses principales fonctionnalités, certaines règles de sécurité et ses dépendances techniques. Ces contrôles sont également exécutés lors des mises à jour de la plateforme afin de détecter d'éventuelles régressions avant leur mise en ligne.", audiences: ['organization', 'trainer'], category: 'Fiabilité' },
  { question: 'Comment contacter Formaplane si je rencontre un problème ?', answer: 'Utilisez la rubrique « Contacter Formaplane » de cette page. Elle prépare un e-mail vers contact@formaplane.fr avec le contexte technique utile.', audiences: ['organization', 'trainer'], category: 'Support' },
];

export const publicRoadmap = {
  available: {
    status: 'Disponible',
    title: 'Le cœur de Formaplane',
    description: 'Réseau privé de formateurs, recherche, import, missions, propositions, disponibilités, planning, partage et communications transactionnelles.',
  },
  future: [
    'Améliorer l’expérience utilisateur.',
    'Optimiser l’utilisation de Formaplane depuis un mobile.',
    'Enrichir la fiche formateur pour lui permettre de détailler davantage son profil : expériences, compétences, formations et autres informations professionnelles.',
    'Stocker les documents et données de référencement d’un formateur et permettre leur partage maîtrisé : CV, NDA, avis SIREN et autres justificatifs.',
    'Ajouter une messagerie interne pour permettre aux organismes de formation et aux formateurs d’échanger directement dans Formaplane autour d’une session de formation.',
    'Permettre au formateur de créer lui-même une mission dans son agenda lorsque l’organisme qui la lui confie n’utilise pas encore Formaplane, afin de centraliser son planning et de mettre automatiquement ses disponibilités à jour.',
    'Permettre aux apprenants d’évaluer un formateur après une mission afin de construire progressivement un système de réputation interne à Formaplane.',
    'Une expérience encore plus fluide pour rechercher, proposer et affecter des missions.',
    'Des améliorations régulières issues des retours des organismes et des formateurs.',
  ],
};
