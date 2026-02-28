# PRD - Partie Admin (Backoffice) - Guide Omra

## 1. Contexte
L'application actuelle permet:
- aux pèlerins de rechercher/réserver des services,
- aux guides de créer des services et gérer leurs demandes,
- de suivre les réservations via les statuts `pending`, `confirmed`, `completed`, `cancelled`.

Le projet ne possède pas encore de véritable espace **admin** centralisé pour piloter l'activité globale.

## 2. Vision Produit
Créer une partie admin qui donne une vue d'ensemble de l'application et permet de piloter:
- la validation des inscriptions guides,
- la gestion des comptes (guides + pèlerins),
- la supervision des services publiés,
- le suivi des commandes/réservations et de leurs états,
- le suivi financier (chiffre d'affaires, montants dus aux guides, paiements).

## 3. Objectifs
1. Permettre à l'admin d'approuver/refuser les nouveaux guides.
2. Donner une visibilité complète sur tous les utilisateurs actifs.
3. Donner une visibilité complète sur tous les services en ligne.
4. Donner une visibilité complète sur toutes les commandes et leurs statuts opérationnels.
5. Donner une visibilité financière exploitable pour distribuer les paiements aux guides.

## 4. Hors périmètre (MVP)
- Automatisation bancaire des virements (API de paiement sortant).
- Outils d'analytics avancés (cohortes, LTV, attribution marketing).
- CRM externe.

## 5. Personas
- **Admin principal**: pilote opérationnel et financier.
- **Ops support** (optionnel): traite les validations, incidents et litiges.

## 6. Périmètre Fonctionnel

### 6.1 Dashboard global (vue d'ensemble)
Afficher en un écran:
- nombre de guides en attente de validation,
- nombre total de comptes (guides, pèlerins),
- nombre de services actifs,
- nombre de réservations par statut (`pending`, `confirmed`, `completed`, `cancelled`),
- chiffre d'affaires brut (GMV),
- montant net plateforme,
- montant à payer aux guides.

Filtres minimaux:
- période (`7j`, `30j`, `90j`, personnalisée),
- ville (`La Mecque`, `Médine`, etc.),
- statut commande.

### 6.2 Validation des guides
Liste "Guides en attente":
- informations de profil guide,
- date d'inscription,
- complétude du profil,
- bouton **Approuver** / **Refuser**,
- champ motif en cas de refus.

Règles:
- un guide non approuvé ne doit pas être visible publiquement dans les résultats pèlerin,
- chaque action de validation doit être tracée (qui, quand, décision).

### 6.3 Gestion des comptes
Liste consolidée des comptes:
- type (`guide`, `pilgrim`, futur `admin`),
- état (`actif`, `suspendu`, `supprimé logique`),
- date d'inscription,
- activité récente (réservations/services).

Actions admin:
- rechercher/filtrer,
- ouvrir la fiche détail,
- suspendre/réactiver un compte,
- pour un guide: voir ses services, réservations, CA généré.

### 6.4 Gestion des services
Catalogue admin des services:
- titre, catégorie, prix, guide associé, ville, disponibilité,
- statut publication (`actif`, `masqué`, `archivé`).

Actions admin:
- consulter le service (comme côté pèlerin),
- masquer/réactiver un service,
- rechercher par guide, catégorie, ville, plage de prix.

### 6.5 Gestion des commandes/réservations
Vue commandes globale:
- pèlerin, guide, service, date, montant,
- statut opérationnel (`pending`, `confirmed`, `completed`, `cancelled`),
- timeline des changements de statut.

Actions admin:
- consultation complète de la commande,
- forçage de statut (droits limités, avec justification),
- marquage litige (optionnel v2).

### 6.6 Finance & Paiements guides
Vue finance admin:
- GMV total période,
- commission plateforme,
- revenu net guide par commande,
- agrégation par guide.

Vue "Paiements guides":
- pour chaque guide: CA généré, commission, net dû, déjà payé, reste à payer,
- statut de paiement (`to_pay`, `processing`, `paid`, `failed`),
- export CSV pour traitement manuel.

Règles de calcul (MVP):
- `GMV = somme(total_price des réservations completed)`
- `commission_plateforme = GMV * taux_commission`
- `net_guide = GMV - commission_plateforme`
- possibilité d'override manuel au niveau commande (si litige/remise).

## 7. User Stories (MVP)
1. En tant qu'admin, je veux voir les guides en attente afin d'approuver/refuser leur inscription.
2. En tant qu'admin, je veux voir tous les comptes (guides + pèlerins) afin de contrôler l'état des utilisateurs.
3. En tant qu'admin, je veux parcourir tous les services afin de modérer l'offre en ligne.
4. En tant qu'admin, je veux voir toutes les commandes et leurs statuts afin de piloter les opérations.
5. En tant qu'admin, je veux voir le CA global et le montant dû par guide afin de déclencher les paiements.

## 8. Critères d'acceptation (extraits)

### Validation guide
- Si un guide est en `pending_review`, il apparaît dans la file admin.
- Quand l'admin approuve, le guide passe en `approved` et devient visible côté pèlerin.
- Quand l'admin refuse, le guide passe en `rejected` avec motif enregistré.

### Comptes
- L'admin peut rechercher un utilisateur par nom/email/ID.
- L'admin peut suspendre un compte; un compte suspendu ne peut plus se connecter.

### Services
- L'admin voit tous les services, même non visibles côté pèlerin.
- L'admin peut masquer un service; un service masqué n'apparaît plus dans l'exploration pèlerin.

### Commandes
- L'admin peut filtrer les commandes par statut, guide, pèlerin, période.
- Chaque changement de statut effectué par admin est historisé.

### Finance
- Le tableau financier calcule les montants uniquement sur les commandes `completed`.
- L'admin peut exporter la liste des montants à payer par guide.

## 9. Évolutions Data Model / Backend (Supabase)

### 9.1 `profiles`
- Étendre `role` avec `admin`.
- Ajouter `account_status` (`active`, `suspended`).

### 9.2 `guides`
- Ajouter `onboarding_status` (`pending_review`, `approved`, `rejected`).
- Ajouter `approved_at`, `approved_by`, `rejected_at`, `rejected_by`, `rejection_reason`.

### 9.3 `services`
- Ajouter `service_status` (`active`, `hidden`, `archived`).

### 9.4 `reservations`
- Ajouter `commission_rate`, `platform_fee_amount`, `guide_net_amount`.
- Ajouter `payout_status` (`not_due`, `to_pay`, `processing`, `paid`, `failed`).
- Ajouter `completed_at` (utile pour la finance par période de réalisation).

### 9.5 Nouvelles tables
- `guide_payouts`:
  - `id`, `guide_id`, `period_start`, `period_end`,
  - `gross_amount`, `platform_fee`, `net_amount`,
  - `status`, `paid_at`, `payment_reference`, `notes`.
- `admin_audit_logs`:
  - `id`, `admin_id`, `entity_type`, `entity_id`, `action`, `payload`, `created_at`.

### 9.6 Sécurité / RLS
- Définir des policies spécifiques admin (lecture globale + actions contrôlées).
- Restreindre l'accès admin aux comptes dont `profiles.role = 'admin'`.
- Journaliser les actions critiques (validation guide, suspension, forçage statut, paiement).

## 10. UX Admin (Navigation recommandée)
- `Dashboard`
- `Guides à valider`
- `Comptes`
- `Services`
- `Commandes`
- `Finance`
- `Paiements`
- `Logs`

## 11. KPIs de succès
- Délai moyen de validation guide.
- Taux de guides approuvés/refusés.
- Taux de commandes complétées.
- Délai moyen entre `completed` et `paid`.
- Écart entre montant dû et montant payé.

## 12. Plan de livraison

### Phase 1 (MVP Opérations)
- Rôle admin + accès sécurisé.
- Dashboard global.
- Validation guides.
- Liste comptes/services/commandes en lecture + filtres.

### Phase 2 (MVP Finance)
- Calcul des montants guide par commande complétée.
- Vue finance agrégée + export CSV.
- Workflow de paiement manuel + statuts.

### Phase 3 (Hardening)
- Audit logs complets.
- Forçage de statut avec justification.
- alerting basique (guides en attente > X jours, paiements en retard).

## 13. Risques et dépendances
- **RLS/Sécurité**: risque critique si policies admin mal définies.
- **Qualité des données**: commandes incomplètes => calculs finance faux.
- **Statuts métier**: besoin d'unifier les transitions autorisées.
- **Paiements**: MVP manuel, dépendance process interne pour exécution fiable.

## 14. Questions ouvertes
1. Quel est le taux de commission plateforme (global ou variable par guide/service) ?
2. Le paiement guide est-il déclenché par commande ou en cycle (hebdo/mensuel) ?
3. Un guide refusé peut-il resoumettre son dossier ?
4. L'admin peut-il modifier le montant net guide en cas de litige ?
5. Faut-il gérer plusieurs niveaux d'admin (super admin vs support) ?

