# Guide Omra - Documentation du Projet

Ce document regroupe toutes les informations techniques et fonctionnelles concernant l'application mobile **Guide Omra**.

## 1. Vue d'ensemble
**Guide Omra** est une application mobile destinée à mettre en relation des pèlerins effectuant la Omra ou le Hajj avec des guides francophones locaux. L'application permet aux pèlerins de trouver des accompagnateurs pour leurs rites religieux, visites (Ziyara), ou autres services, et aux guides de proposer leurs prestations.

## 2. Stack Technique
L'application est construite avec les technologies modernes suivantes :

*   **Framework Mobile** : [React Native](https://reactnative.dev/) avec [Expo](https://expo.dev/) (SDK 50+).
*   **Langage** : [TypeScript](https://www.typescriptlang.org/).
*   **Routing** : [Expo Router](https://docs.expo.dev/router/introduction/) (navigation basée sur les fichiers).
*   **Styling** : [NativeWind](https://www.nativewind.dev/) (Tailwind CSS pour React Native).
*   **Backend / Base de Données** : [Supabase](https://supabase.com/) (PostgreSQL + Auth + Storage).
*   **Icônes** : [Lucide React Native](https://lucide.dev/).
*   **Gestion d'état** : React Context API (AuthContext, ReservationsContext).

## 3. Fonctionnalités Clés

### Authentification & Profils
*   **Inscription/Connexion** : Email & Mot de passe.
*   **Rôles** : Distinction entre **Pèlerin** et **Guide**.
*   **Charte du Pèlerin** : Acceptation obligatoire de la charte éthique lors de l'inscription (via pop-up) ou de la réservation.
*   **Profils** :
    *   Gestion des informations personnelles (Nom, Genre, Date de naissance, Langue).
    *   **Guide** : Profil enrichi avec Bio, Expérience, Langues parlées, Prix de base, Localisation, Vérification (Badge).

### Pour les Guides
*   **Création de Services** : Ajout de prestations (Omra, Ziyara, Badal, etc.) avec description, prix, dates de disponibilité, image.
*   **Points de Rendez-vous** : Définition de lieux de prise en charge spécifiques avec suppléments éventuels.
*   **Dashboard** : Vue d'ensemble des réservations et des services actifs.

### Pour les Pèlerins
*   **Recherche** : Exploration des guides et services disponibles.
*   **Réservation** :
    *   Sélection de date et heure.
    *   Choix du lieu de rendez-vous (parmi ceux définis par le guide).
    *   Ajout de pèlerins accompagnants (Calcul automatique du prix).
    *   Confirmation avec rappel de la charte.
*   **Gestion des Réservations** : Suivi du statut (En attente, Confirmé, Terminé).

### Communication & Social
*   **Messagerie** : Chat en temps réel entre pèlerins et guides.
*   **Avis** : Notation et commentaires sur les guides après prestation.

## 4. Structure de la Base de Données (Supabase)

### Tables

#### `profiles`
Stocke les utilisateurs de base (liés à `auth.users`).
*   `id` (UUID, PK)
*   `email`, `full_name`, `avatar_url`
*   `role` ('pilgrim' | 'guide')
*   `gender`

#### `guides`
Extension du profil pour les utilisateurs "Guide".
*   `id` (FK -> profiles.id)
*   `bio`, `location`
*   `price_per_day`, `currency`, `price_unit`
*   `languages` (Array)
*   `verified` (Boolean), `rating`, `reviews_count`
*   `specialty`, `experience_since`

#### `services`
Les offres publiées par les guides.
*   `id` (UUID, PK)
*   `guide_id` (FK -> profiles.id)
*   `title`, `category` (ex: 'Omra accompagnée', 'Ziyara')
*   `description`, `image_url`
*   `price_override` (Prix spécifique au service)
*   `availability_start`, `availability_end`
*   `meeting_points` (JSONB: Array de {name, supplement})

#### `reservations`
Les commandes passées par les pèlerins.
*   `id` (UUID, PK)
*   `user_id` (Pèlerin), `guide_id` (Guide)
*   `service_name`
*   `start_date`, `end_date`, `visit_time`
*   `location` (Lieu de RDV choisi)
*   `pilgrims_names` (Liste des accompagnants)
*   `total_price`, `status` ('pending', 'confirmed', etc.)

#### `reviews`
Avis laissés par les pèlerins.
*   `id` (UUID, PK)
*   `reviewer_id`, `guide_id`
*   `rating`, `comment`

#### `messages`
Messages du chat.
*   `sender_id`, `receiver_id`
*   `content`, `is_read`

## 5. Architecture de l'Application (Dossier `app/`)

*   `app/(auth)/` : Écrans d'authentification (Login, Register).
*   `app/(tabs)/` : Navigation principale (Barre de navigation en bas).
    *   `index.tsx` : Accueil / Recherche.
    *   `messages.tsx` : Liste des conversations.
    *   `profile.tsx` : Profil utilisateur.
    *   `guide-dashboard.tsx` : Tableau de bord guide.
*   `app/guide/` : Pages spécifiques aux guides (Détails, Création de service, Complétion profil).
*   `app/service/` : Détails des services (si séparé).
*   `components/` : Composants réutilisables (BookingModal, ServiceGridCard, etc.).
*   `context/` : Gestionnaires d'état globaux (Auth, Reservations).
*   `lib/` : Utilitaires et configuration API (Supabase client).
*   `constants/` : Données statiques (Catégories, Textes de charte).

## 6. Flux Métier Importants

### Flux d'Inscription
1.  L'utilisateur remplit ses informations.
2.  S'il est **Pèlerin**, il doit accepter la **Charte du Pèlerin** via une modale avant validation.
3.  S'il est **Guide**, il est redirigé vers une page de complétion de profil (`complete-profile`) après l'inscription de base.

### Flux de Réservation
1.  Le pèlerin consulte une page Guide ou Service.
2.  Il clique sur "Réserver".
3.  La modale de réservation s'ouvre, pré-configurée avec le service actif.
    *   Le prix s'ajuste selon le nombre de pèlerins et le lieu de RDV.
    *   Les lieux disponibles sont ceux définis par le guide pour ce service.
4.  Validation -> Création de la réservation en statut `pending`.

---
*Ce document est une référence vivante du projet et doit être mis à jour à chaque évolution majeure.*
