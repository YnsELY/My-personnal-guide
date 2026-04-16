# PRD + Plan d’Implémentation — Localisation complète FR/AR avec RTL

## Résumé
- Objectif: permettre à tout utilisateur de basculer l’application entre français et arabe depuis les paramètres, avec une application entièrement traduite quand l’arabe est actif.
- Décision produit retenue: la langue est persistée à la fois sur le compte et sur l’appareil; `profiles.language` reste la source de vérité côté compte, et un cache local sert au bootstrap.
- Décision UX retenue: le mode arabe est un vrai mode RTL complet, pas seulement une traduction de texte.
- Décision de périmètre retenue: la couverture arabe inclut l’UI, les messages système, les validations, les contenus légaux in-app, les chartes, les contenus éditoriaux et les documents/PDF statiques associés.
- État actuel du repo: l’app est Expo/React Native, le champ `profiles.language` existe déjà en base avec `fr|ar`, mais il n’y a pas encore de couche i18n; le texte est aujourd’hui codé en dur dans les écrans, composants, constantes et notifications.

## Exigences Produit
- L’utilisateur doit pouvoir changer la langue depuis `Profil > Application > Langue de l’application`.
- Le changement de langue doit être visible immédiatement dans toute l’app, sans déconnexion ni réinstallation.
- La langue active doit être résolue dans cet ordre: cache local, puis `profiles.language` si connecté, puis langue appareil (`ar*` vers `ar`, sinon `fr`), puis fallback `fr`.
- Lorsqu’un utilisateur connecté change de langue, l’app doit mettre à jour l’état UI, persister en local, mettre à jour `profiles.language`, et synchroniser aussi `auth.user.user_metadata.language` pour garder un état cohérent pendant les phases transitoires d’auth.
- L’écran d’inscription conserve un choix de langue initial; l’écran d’édition de profil ne reste plus la source principale du réglage de langue pour éviter le doublon avec les paramètres d’application.
- En arabe, toute l’interface doit passer en RTL: alignements, ordre visuel des rangées, chevrons/flèches, headers, tab bar, modales, cartes, formulaires et navigation directionnelle.
- Les champs fonctionnels comme email, mot de passe, téléphone, codes et saisies numériques restent en LTR même en arabe pour éviter les erreurs de saisie.
- Les formats de date, heure et devise doivent utiliser des helpers centralisés avec `fr-FR` en français et `ar-SA` en arabe.
- Le calendrier reste grégorien dans cette phase; aucun calendrier hégirien n’est introduit.
- Les contenus détenus par l’app doivent être traduits; les contenus générés par les utilisateurs ou issus de la donnée métier libre ne sont pas auto-traduits.
- Les notifications push, alertes locales, placeholders, messages d’erreur métier, labels admin/guide/pèlerin et textes légaux doivent respecter la langue active ou la langue du destinataire.

## Changements d’Implémentation
- Introduire une vraie couche i18n basée sur `i18next` + `react-i18next`, avec `expo-localization` pour la détection initiale et un wrapper maison pour exposer `language`, `setLanguage`, `isRTL`, `t`, `formatDate`, `formatTime`, `formatDateTime` et `formatCurrency`.
- Structurer les traductions par namespaces stables: `common`, `auth`, `tabs`, `profile`, `booking`, `guide`, `admin`, `legal`, `content`, `notifications`, avec des clés typées et un check de parité FR/AR.
- Monter le provider de langue au niveau racine afin que l’intégralité des écrans, composants globaux, popups et options de navigation consomment la même source de vérité.
- Ajouter une clé de stockage locale dédiée, par exemple `app.language`, et une action unique `setAppLanguage(language)` qui orchestre cache local, mise à jour du profil distant et synchro auth metadata.
- Déplacer le point d’entrée UX du réglage de langue dans la section `APPLICATION` du profil; le sélecteur d’inscription reste une valeur initiale, et le réglage du profil personnel n’est plus dupliqué ailleurs.
- Remplacer systématiquement les chaînes codées en dur dans `app/`, `components/`, `constants/`, `context/`, `lib/notifications.ts` et les écrans légaux par des clés de traduction avec interpolation.
- Sortir les gros blocs éditoriaux des fichiers inline actuels vers des modules localisés: chartes, règlements guides, CGVU, politique de confidentialité, politique d’annulation, descriptions de services, hadiths, labels de filtres et contenus de home.
- Ajouter des utilitaires directionnels pour éviter un patch manuel incohérent: alignement texte, `row`/`row-reverse`, inversion des icônes directionnelles, ordre visuel de la tab bar, placement des boutons retour/fermeture, et helpers de mise en page pour les cartes/formulaires.
- Normaliser toutes les dates/horaires/devise actuellement figés en `fr-FR` vers des helpers centralisés afin d’éviter les restes de français dans les vues de réservation, dashboards, interviews, rapports, preuves et recherche.
- Localiser aussi les notifications push envoyées aux guides/admins en fonction de la langue du destinataire; le flux qui récupère les tokens doit donc retourner également la langue du profil ou la résoudre avant composition du message.
- Introduire un helper de traduction d’erreurs pour encapsuler les `error.message` bruts; les fallback restent possibles, mais tous les cas connus doivent afficher un message localisé côté UI.
- Ajouter une police arabe compatible pour les textes longs, retenue par défaut comme `Noto Naskh Arabic`, chargée via Expo Font; les textes français conservent la police actuelle.
- Créer des variantes documentaires FR/AR pour les contenus statiques juridiques et PDF, avec sélection par langue active; les docs de référence du repo restent également alignés en bilingue pour éviter les divergences futures.
- Ajouter un script de validation i18n qui échoue si FR et AR n’ont pas exactement le même set de clés, et l’intégrer au pipeline qualité avec le lint existant.
- Ordre de livraison imposé: 1. fondation i18n + persistance + switch settings, 2. shell app + auth + tabs + composants globaux, 3. flux pèlerin, 4. flux guide, 5. backoffice admin, 6. légal/éditorial/documents, 7. QA bilingue complète.

## Interfaces Et Impacts Publics
- Nouveau type public: `AppLanguage = 'fr' | 'ar'`.
- Nouveau contrat de contexte global: `LanguageContextValue` avec `language`, `setLanguage`, `isRTL`, `t`, `formatDate`, `formatTime`, `formatDateTime`, `formatCurrency`.
- Nouveau comportement de persistance: `profiles.language` devient le réglage applicatif officiel pour les utilisateurs connectés.
- Nouvelle API interne recommandée: `setAppLanguage(language: AppLanguage)`; elle remplace les mises à jour diffuses du champ `language`.
- Aucun changement de schéma SQL n’est requis; le schéma actuel supporte déjà `fr` et `ar`.
- Le contrat de récupération des destinataires de notifications doit inclure la langue pour permettre la composition localisée du push.

## Critères d’Acceptation
- En mode français, toute l’application reste fonctionnellement identique à l’existant.
- En mode arabe, aucun texte détenu par l’application ne reste en français sur les écrans audités.
- Le changement de langue depuis le profil met à jour immédiatement les onglets, headers, boutons, placeholders, modales, écrans légaux, messages d’alerte et popups globaux.
- Après fermeture/réouverture de l’app, la langue choisie est conservée.
- Après connexion sur un autre appareil avec le même compte, la langue du compte est restaurée.
- Les écrans majeurs n’ont ni overflow, ni texte tronqué critique, ni alignement incohérent en arabe.
- Les champs email/mot de passe/téléphone restent correctement saisissables en mode arabe.
- Les notifications push reçues par un utilisateur francophone restent en français, et celles reçues par un utilisateur arabophone sont en arabe.
- Les liens/écrans/documents juridiques affichent bien la version correspondant à la langue active.

## Plan De Test
- Vérification statique: `expo lint` reste vert; le script de parité i18n doit passer; la compilation TypeScript ne doit pas introduire de clés orphelines.
- Smoke tests UI en français et en arabe sur démarrage à froid, bootstrap invité, login, register, logout, relaunch et retour arrière.
- Parcours pèlerin à tester dans les deux langues: accueil, recherche, sélection de date, fiche guide, réservation, paiement, réservations, annulation, avis, support, profil.
- Parcours guide à tester dans les deux langues: onboarding, profil guide, création de service, dashboard, entretiens, preuves Omra Badal, messages, pending approval.
- Parcours admin à tester dans les deux langues: dashboard, guides, réservations, services, comptes, interviews, finance, wallets, payouts, reports.
- Vérifications RTL ciblées: tab bar, flèches retour, chevrons, cartes horizontales, listes, modales fullscreen, formulaires, calendriers, widgets home, écrans légaux.
- Vérifications contenu: chartes, règlements, CGVU, politique de confidentialité, politique d’annulation, descriptions de services, hadiths, labels de langues et documents PDF.
- Vérifications régression: aucun changement de logique métier lié aux règles SQL/migrations existantes; seule la couche de présentation, de contenu et de persistance de préférence doit être impactée.

## Hypothèses Et Défauts Choisis
- La langue applicative est le même concept que `profiles.language`; il n’y aura pas de second réglage séparé.
- Le calendrier reste grégorien dans cette v1 bilingue.
- Les contenus utilisateurs, noms propres, messages libres, adresses et données métier entrées manuellement ne sont pas traduits automatiquement.
- La locale arabe de référence est `ar-SA`; la locale française de référence est `fr-FR`.
- Les warnings lint actuels ne sont pas bloquants pour ce chantier, mais ils doivent être surveillés pendant l’intégration pour ne pas masquer des régressions i18n.
