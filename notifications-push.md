# Plan — Notifications Push complètes

## Contexte

L'application dispose déjà d'une infrastructure de notifications push (Expo Push API, `lib/notifications.ts`), mais une seule notification est actuellement implémentée : la nouvelle réservation (envoyée au guide + admins).

Ce document liste **toutes** les notifications à implémenter pour couvrir l'ensemble du parcours des trois rôles : pèlerin, guide, admin.

---

## État actuel

- **Fichier existant** : `lib/notifications.ts`
- **Seule notification implémentée** : `sendBookingNotifications()` — nouvelle réservation → Guide + Admins
- **Infrastructure** : token Expo stocké dans `profiles.push_token`, RPC `get_notification_tokens_for_guide` pour récupérer les tokens

---

## PÈLERIN — notifications reçues par le pèlerin

| # | Événement | Déclencheur | Message |
|---|-----------|-------------|---------|
| P-1 | Réservation confirmée par le guide | Guide accepte la demande en attente | "Votre réservation pour « {serviceName} » a été confirmée par {guideName}" |
| P-2 | Réservation refusée par le guide | Guide refuse la demande en attente | "Votre réservation pour « {serviceName} » a été refusée" |
| P-3 | Guide a confirmé le début de la visite | `confirmVisitStartAsGuide()` | "{guideName} a confirmé le début de la visite. Confirmez de votre côté pour démarrer." |
| P-4 | Visite officiellement démarrée | Les deux parties ont confirmé le début | "La visite « {serviceName} » a démarré !" |
| P-5 | Guide a confirmé la fin de la visite | `confirmVisitEndAsGuide()` | "{guideName} a confirmé la fin de la visite. Confirmez de votre côté pour clôturer." |
| P-6 | Réservation complétée | Statut passe à `completed` | "Votre visite « {serviceName} » est terminée. Laissez un avis à {guideName} !" |
| P-7 | Annulation par l'admin | `updateAdminReservationStatus(..., 'cancelled')` | "Votre réservation a été annulée par l'administration. {reason}" |
| P-8 | Guide remplacé | Admin assigne un guide de remplacement | "Votre guide a changé pour « {serviceName} ». Nouveau guide : {newGuideName}" |
| P-9 | Crédit de remboursement appliqué | Annulation pèlerin → wallet crédité | "Un crédit de {amount}€ a été ajouté à votre portefeuille suite à l'annulation" |
| P-10 | Ajustement de portefeuille (admin) | `admin_adjust_pilgrim_wallet()` | "Votre portefeuille a été ajusté de {amount}€ par l'administration. {reason}" |
| P-11 | Nouveau message reçu | `sendMessage()` dans le chat | "{senderName} vous a envoyé un message" |

---

## GUIDE — notifications reçues par le guide

| # | Événement | Déclencheur | Message |
|---|-----------|-------------|---------|
| G-1 | ✅ Nouvelle réservation reçue *(déjà implémenté)* | `createReservation()` | "Vous avez reçu une demande de réservation pour « {serviceName} »" |
| G-2 | Pèlerin a confirmé le début de la visite | `confirmVisitStartAsPilgrim()` | "{pilgrimName} a confirmé le début de la visite. Confirmez de votre côté pour démarrer." |
| G-3 | Visite officiellement démarrée | Les deux parties ont confirmé le début | "La visite « {serviceName} » a démarré !" |
| G-4 | Pèlerin a confirmé la fin de la visite | `confirmVisitEndAsPilgrim()` | "{pilgrimName} a confirmé la fin de la visite. Confirmez de votre côté pour clôturer." |
| G-5 | Réservation complétée — revenu disponible | Statut `completed`, `payout_status = 'to_pay'` | "La visite « {serviceName} » est terminée. {amount}€ disponible pour paiement." |
| G-6 | Réservation annulée par le pèlerin | `cancelReservationAsPilgrim()` | "{pilgrimName} a annulé la réservation pour « {serviceName} »" |
| G-7 | Réservation annulée par l'admin | `updateAdminReservationStatus(..., 'cancelled')` | "Votre réservation a été annulée par l'administration. {reason}" |
| G-8 | Paiement (payout) effectué | `markGuidePayoutAsPaid()` | "Votre virement de {netAmount}€ a été effectué. Réf : {paymentReference}" |
| G-9 | Ajustement de portefeuille (admin) | `admin_add_guide_wallet_adjustment()` | "Votre portefeuille a été ajusté de {amount}€ par l'administration. {reason}" |
| G-10 | Entretien proposé par l'admin | `proposeGuideInterview()` | "Un entretien vous est proposé le {scheduledAt}. Acceptez ou contre-proposez." |
| G-11 | Admin a accepté votre contre-proposition | `acceptGuideInterviewProposalAsAdmin()` | "L'administration a confirmé votre entretien le {scheduledAt}" |
| G-12 | Admin a fait une contre-proposition | `counterProposeGuideInterviewAsAdmin()` | "L'administration propose un nouvel horaire : {scheduledAt}" |
| G-13 | Candidature approuvée | `approveGuideApplication()` | "Félicitations ! Votre profil de guide a été approuvé. Vous pouvez maintenant recevoir des réservations." |
| G-14 | Candidature refusée | `rejectGuideApplication()` | "Votre candidature de guide n'a pas été retenue. {reason}" |
| G-15 | Nouvel avis reçu | `createReviewForCompletedReservation()` | "{pilgrimName} vous a laissé un avis {rating}★ pour « {serviceName} »" |
| G-16 | Service masqué/archivé par l'admin | `updateAdminServiceStatus()` | "Votre service « {serviceName} » a été {status} par l'administration. {reason}" |
| G-17 | Compte suspendu | `updateAdminAccountStatus(..., 'suspended')` | "Votre compte a été suspendu par l'administration. Contactez le support." |
| G-18 | Compte réactivé | `updateAdminAccountStatus(..., 'active')` | "Votre compte a été réactivé. Vous pouvez de nouveau utiliser l'application." |
| G-19 | Nouveau message reçu | `sendMessage()` dans le chat | "{senderName} vous a envoyé un message" |

---

## ADMIN — notifications reçues par les admins

| # | Événement | Déclencheur | Message |
|---|-----------|-------------|---------|
| A-1 | ✅ Nouvelle réservation *(déjà implémenté)* | `createReservation()` | "{pilgrimName} a commandé « {serviceName} »" |
| A-2 | Nouvelle candidature guide | `createGuideProfile()` | "Nouvelle candidature guide de {guideName} à examiner" |
| A-3 | Guide a accepté un entretien | `acceptGuideInterviewProposal()` | "{guideName} a confirmé l'entretien du {scheduledAt}" |
| A-4 | Guide a fait une contre-proposition d'entretien | `counterProposeGuideInterview()` | "{guideName} propose un nouvel horaire : {scheduledAt}" |
| A-5 | Réservation annulée par le pèlerin | `cancelReservationAsPilgrim()` | "{pilgrimName} a annulé la réservation #{reservationId} pour « {serviceName} »" |
| A-6 | Visite complétée | Transition vers `completed` | "La visite #{reservationId} est terminée. Paiement guide en attente : {amount}€" |
| A-7 | Nouveau signalement utilisateur | `reportUser()` | "Nouveau signalement : {reporterName} a signalé {targetName} ({category})" |
| A-8 | Réservation en attente depuis > 12h | Cron/détection timeout côté serveur | "La réservation #{reservationId} est en attente depuis plus de 12h. Un remplacement est peut-être nécessaire." |

---

## Récapitulatif

| Rôle | Notifications à implémenter | Déjà implémentées |
|------|-----------------------------|-------------------|
| Pèlerin | 11 | 0 |
| Guide | 19 | 1 (G-1) |
| Admin | 8 | 1 (A-1) |
| **Total** | **38** | **2** |

---

## Fichiers à modifier

| Fichier | Action |
|---------|--------|
| `lib/notifications.ts` | Ajouter toutes les nouvelles fonctions d'envoi |
| `lib/api.ts` | Appeler les fonctions aux bons endroits (confirmations, annulations, messages, avis…) |
| `lib/adminApi.ts` | Appeler les fonctions aux bons endroits (approbations, payouts, suspensions…) |

## Notes d'implémentation

- La RPC `get_notification_tokens_for_guide` existante ne couvre que guide + admins. Il faudra créer des équivalents pour : **pèlerin** (`get_push_token_for_user(userId)`) et **tous les admins** (`get_admin_push_tokens()`).
- Les notifications de chat (P-11, G-19) devront être supprimées si l'utilisateur est déjà dans la conversation ouverte (éviter le bruit).
- La notification A-8 (timeout réservation) nécessitera une Supabase Edge Function ou un cron côté serveur, pas un appel client-side.
