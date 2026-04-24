import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Show notification alert when the app is in the foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
    if (!Device.isDevice) return null;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#b39164',
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    try {
        const tokenData = await Notifications.getExpoPushTokenAsync();
        return tokenData.data;
    } catch (e) {
        console.warn('[Notifications] Failed to get push token:', e);
        return null;
    }
}

export async function savePushToken(userId: string, token: string): Promise<void> {
    const { error } = await supabase
        .from('profiles')
        .update({ push_token: token })
        .eq('id', userId);
    if (error) console.warn('[Notifications] Failed to save push token:', error.message);
}

// ─── Internal helpers ───────────────────────────────────────────────────────

const _sendPush = async (messages: Array<{
    to: string;
    sound: 'default';
    title: string;
    body: string;
    data: Record<string, unknown>;
}>) => {
    if (!messages.length) return;
    try {
        await fetch('https://exp.host/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-Encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(messages),
        });
    } catch (e) {
        console.warn('[Notifications] Failed to send:', e);
    }
};

const _msg = (to: string, title: string, body: string, data: Record<string, unknown> = {}) => ({
    to,
    sound: 'default' as const,
    title,
    body,
    data,
});

const _getToken = async (userId: string): Promise<string | null> => {
    const { data } = await supabase
        .from('profiles')
        .select('push_token')
        .eq('id', userId)
        .maybeSingle();
    return (data as any)?.push_token ?? null;
};

const _getAdminTokens = async (): Promise<string[]> => {
    const { data } = await supabase
        .from('profiles')
        .select('push_token')
        .eq('role', 'admin')
        .not('push_token', 'is', null);
    return ((data ?? []) as any[]).map((d) => d.push_token).filter(Boolean);
};

export const getUserDisplayName = async (userId: string): Promise<string> => {
    const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .maybeSingle();
    return (data as any)?.full_name ?? 'Utilisateur';
};

// ─── G-1 / A-1 — Nouvelle réservation (déjà implémenté, conservé) ─────────

export async function sendBookingNotifications(params: {
    guideId: string;
    pilgrimName: string;
    serviceName: string;
}): Promise<void> {
    const { guideId, pilgrimName, serviceName } = params;
    const { data: tokens, error } = await supabase.rpc('get_notification_tokens_for_guide', {
        p_guide_id: guideId,
    });
    if (error) { console.warn('[Notifications] Failed to fetch tokens:', error.message); return; }
    if (!tokens || tokens.length === 0) return;
    const messages = (tokens as { push_token: string; role: string }[]).map((t) => _msg(
        t.push_token,
        t.role === 'admin' ? 'Nouvelle commande de service' : 'Nouvelle demande de réservation',
        t.role === 'admin'
            ? `${pilgrimName} a commandé "${serviceName}"`
            : `Vous avez reçu une demande de réservation pour "${serviceName}"`,
        { type: 'new_booking' },
    ));
    await _sendPush(messages);
}

// ─── P-1 — Réservation confirmée par le guide ────────────────────────────

export async function notifyPilgrimReservationConfirmed(
    pilgrimId: string, guideName: string, serviceName: string,
): Promise<void> {
    const token = await _getToken(pilgrimId);
    if (!token) return;
    await _sendPush([_msg(token, 'Réservation confirmée ✅',
        `Votre réservation pour « ${serviceName} » a été confirmée par ${guideName}`,
        { type: 'reservation_confirmed' })]);
}

// ─── P-2 — Réservation refusée par le guide ──────────────────────────────

export async function notifyPilgrimReservationRefused(
    pilgrimId: string, serviceName: string,
): Promise<void> {
    const token = await _getToken(pilgrimId);
    if (!token) return;
    await _sendPush([_msg(token, 'Réservation refusée',
        `Votre réservation pour « ${serviceName} » a été refusée`,
        { type: 'reservation_refused' })]);
}

// ─── P-3 — Guide a confirmé le début ────────────────────────────────────

export async function notifyPilgrimGuideConfirmedStart(
    pilgrimId: string, guideName: string,
): Promise<void> {
    const token = await _getToken(pilgrimId);
    if (!token) return;
    await _sendPush([_msg(token, 'Début de visite',
        `${guideName} a confirmé le début de la visite. Confirmez de votre côté pour démarrer.`,
        { type: 'guide_confirmed_start' })]);
}

// ─── P-4 + G-3 — Visite officiellement démarrée (les deux parties) ───────

export async function notifyVisitStarted(
    pilgrimId: string, guideId: string, serviceName: string,
): Promise<void> {
    const [pt, gt] = await Promise.all([_getToken(pilgrimId), _getToken(guideId)]);
    const messages = ([pt, gt].filter(Boolean) as string[]).map((t) =>
        _msg(t, 'Visite démarrée 🚀', `La visite « ${serviceName} » a démarré !`, { type: 'visit_started' }));
    await _sendPush(messages);
}

// ─── P-5 — Guide a confirmé la fin ──────────────────────────────────────

export async function notifyPilgrimGuideConfirmedEnd(
    pilgrimId: string, guideName: string,
): Promise<void> {
    const token = await _getToken(pilgrimId);
    if (!token) return;
    await _sendPush([_msg(token, 'Fin de visite',
        `${guideName} a confirmé la fin de la visite. Confirmez de votre côté pour clôturer.`,
        { type: 'guide_confirmed_end' })]);
}

// ─── P-6 + G-5 + A-6 — Visite complétée ─────────────────────────────────

export async function notifyVisitCompleted(params: {
    pilgrimId: string;
    guideId: string;
    guideName: string;
    serviceName: string;
    guideNetAmount: number;
    reservationId: string;
}): Promise<void> {
    const { pilgrimId, guideId, guideName, serviceName, guideNetAmount, reservationId } = params;
    const [pt, gt, adminTokens] = await Promise.all([
        _getToken(pilgrimId),
        _getToken(guideId),
        _getAdminTokens(),
    ]);
    const messages: ReturnType<typeof _msg>[] = [];
    if (pt) messages.push(_msg(pt, 'Visite terminée ⭐',
        `Votre visite « ${serviceName} » est terminée. Laissez un avis à ${guideName} !`,
        { type: 'visit_completed' }));
    if (gt) messages.push(_msg(gt, 'Prestation terminée 💰',
        `La visite « ${serviceName} » est terminée. ${guideNetAmount.toFixed(2)}€ disponible pour paiement.`,
        { type: 'visit_completed_guide' }));
    adminTokens.forEach((t) => messages.push(_msg(t, 'Visite terminée',
        `La visite #${reservationId.slice(0, 8)} est terminée. Paiement guide en attente : ${guideNetAmount.toFixed(2)}€`,
        { type: 'visit_completed_admin' })));
    await _sendPush(messages);
}

// ─── P-7 + G-7 — Annulation par l'admin ─────────────────────────────────

export async function notifyReservationCancelledByAdmin(
    pilgrimId: string, guideId: string, reason?: string,
): Promise<void> {
    const [pt, gt] = await Promise.all([_getToken(pilgrimId), _getToken(guideId)]);
    const body = `Votre réservation a été annulée par l'administration.${reason ? ` ${reason}` : ''}`;
    const messages: ReturnType<typeof _msg>[] = [];
    if (pt) messages.push(_msg(pt, 'Réservation annulée', body, { type: 'reservation_cancelled_admin' }));
    if (gt) messages.push(_msg(gt, 'Réservation annulée', body, { type: 'reservation_cancelled_admin' }));
    await _sendPush(messages);
}

// ─── P-8 — Guide remplacé ────────────────────────────────────────────────

export async function notifyPilgrimGuideReplaced(
    pilgrimId: string, serviceName: string, newGuideName: string,
): Promise<void> {
    const token = await _getToken(pilgrimId);
    if (!token) return;
    await _sendPush([_msg(token, 'Guide remplacé',
        `Votre guide a changé pour « ${serviceName} ». Nouveau guide : ${newGuideName}`,
        { type: 'guide_replaced' })]);
}

// ─── P-9 — Crédit de remboursement appliqué ──────────────────────────────

export async function notifyPilgrimWalletCredited(
    pilgrimId: string, amount: number,
): Promise<void> {
    const token = await _getToken(pilgrimId);
    if (!token) return;
    await _sendPush([_msg(token, 'Crédit ajouté 💳',
        `Un crédit de ${amount.toFixed(2)}€ a été ajouté à votre portefeuille suite à l'annulation`,
        { type: 'wallet_credited' })]);
}

// ─── P-10 — Ajustement portefeuille pèlerin (admin) ──────────────────────

export async function notifyPilgrimWalletAdjusted(
    pilgrimId: string, amount: number, reason?: string,
): Promise<void> {
    const token = await _getToken(pilgrimId);
    if (!token) return;
    const sign = amount >= 0 ? '+' : '';
    await _sendPush([_msg(token, 'Portefeuille ajusté',
        `Votre portefeuille a été ajusté de ${sign}${amount.toFixed(2)}€ par l'administration.${reason ? ` ${reason}` : ''}`,
        { type: 'wallet_adjusted_pilgrim' })]);
}

// ─── P-11 + G-19 — Nouveau message ───────────────────────────────────────

export async function notifyNewMessage(
    receiverId: string, senderName: string,
): Promise<void> {
    const token = await _getToken(receiverId);
    if (!token) return;
    await _sendPush([_msg(token, 'Nouveau message 💬',
        `${senderName} vous a envoyé un message`,
        { type: 'new_message' })]);
}

// ─── G-2 — Pèlerin a confirmé le début ───────────────────────────────────

export async function notifyGuidePilgrimConfirmedStart(
    guideId: string, pilgrimName: string, serviceName: string,
): Promise<void> {
    const token = await _getToken(guideId);
    if (!token) return;
    await _sendPush([_msg(token, 'Début de visite',
        `${pilgrimName} a confirmé le début de la visite. Confirmez de votre côté pour démarrer.`,
        { type: 'pilgrim_confirmed_start' })]);
}

// ─── G-4 — Pèlerin a confirmé la fin ─────────────────────────────────────

export async function notifyGuidePilgrimConfirmedEnd(
    guideId: string, pilgrimName: string,
): Promise<void> {
    const token = await _getToken(guideId);
    if (!token) return;
    await _sendPush([_msg(token, 'Fin de visite',
        `${pilgrimName} a confirmé la fin de la visite. Confirmez de votre côté pour clôturer.`,
        { type: 'pilgrim_confirmed_end' })]);
}

// ─── G-6 + A-5 — Annulation par le pèlerin ───────────────────────────────

export async function notifyReservationCancelledByPilgrim(params: {
    guideId: string;
    pilgrimName: string;
    serviceName: string;
    reservationId?: string;
}): Promise<void> {
    const { guideId, pilgrimName, serviceName, reservationId } = params;
    const [gt, adminTokens] = await Promise.all([_getToken(guideId), _getAdminTokens()]);
    const messages: ReturnType<typeof _msg>[] = [];
    if (gt) messages.push(_msg(gt, 'Réservation annulée',
        `${pilgrimName} a annulé la réservation pour « ${serviceName} »`,
        { type: 'reservation_cancelled_pilgrim' }));
    adminTokens.forEach((t) => messages.push(_msg(t, 'Annulation pèlerin',
        `${pilgrimName} a annulé la réservation${reservationId ? ` #${reservationId.slice(0, 8)}` : ''} pour « ${serviceName} »`,
        { type: 'reservation_cancelled_pilgrim_admin' })));
    await _sendPush(messages);
}

// ─── G-8 — Paiement (payout) effectué ────────────────────────────────────

export async function notifyGuidePayoutSent(
    guideId: string, netAmount: number, paymentReference?: string,
): Promise<void> {
    const token = await _getToken(guideId);
    if (!token) return;
    await _sendPush([_msg(token, 'Virement effectué 💸',
        `Votre virement de ${netAmount.toFixed(2)}€ a été effectué.${paymentReference ? ` Réf : ${paymentReference}` : ''}`,
        { type: 'payout_sent' })]);
}

// ─── G-9 — Ajustement portefeuille guide (admin) ─────────────────────────

export async function notifyGuideWalletAdjusted(
    guideId: string, amount: number, reason?: string,
): Promise<void> {
    const token = await _getToken(guideId);
    if (!token) return;
    const sign = amount >= 0 ? '+' : '';
    await _sendPush([_msg(token, 'Portefeuille ajusté',
        `Votre portefeuille a été ajusté de ${sign}${amount.toFixed(2)}€ par l'administration.${reason ? ` ${reason}` : ''}`,
        { type: 'wallet_adjusted_guide' })]);
}

// ─── G-10 — Entretien proposé par l'admin ────────────────────────────────

export async function notifyGuideInterviewProposed(
    guideId: string, scheduledAt: string,
): Promise<void> {
    const token = await _getToken(guideId);
    if (!token) return;
    const date = new Date(scheduledAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
    await _sendPush([_msg(token, 'Entretien proposé 📅',
        `Un entretien vous est proposé le ${date}. Acceptez ou contre-proposez.`,
        { type: 'interview_proposed' })]);
}

// ─── G-11 — Admin a accepté la contre-proposition du guide ───────────────

export async function notifyGuideInterviewAcceptedByAdmin(
    guideId: string, scheduledAt: string,
): Promise<void> {
    const token = await _getToken(guideId);
    if (!token) return;
    const date = new Date(scheduledAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
    await _sendPush([_msg(token, 'Entretien confirmé ✅',
        `L'administration a confirmé votre entretien le ${date}`,
        { type: 'interview_confirmed_by_admin' })]);
}

// ─── G-12 — Admin a fait une contre-proposition ──────────────────────────

export async function notifyGuideInterviewCounterProposedByAdmin(
    guideId: string, scheduledAt: string,
): Promise<void> {
    const token = await _getToken(guideId);
    if (!token) return;
    const date = new Date(scheduledAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
    await _sendPush([_msg(token, "Nouvelle proposition d'entretien",
        `L'administration propose un nouvel horaire : ${date}`,
        { type: 'interview_counter_proposed_by_admin' })]);
}

// ─── G-13 — Candidature approuvée ────────────────────────────────────────

export async function notifyGuideApplicationApproved(guideId: string): Promise<void> {
    const token = await _getToken(guideId);
    if (!token) return;
    await _sendPush([_msg(token, 'Candidature approuvée 🎉',
        'Félicitations ! Votre profil de guide a été approuvé. Vous pouvez maintenant recevoir des réservations.',
        { type: 'application_approved' })]);
}

// ─── G-14 — Candidature refusée ──────────────────────────────────────────

export async function notifyGuideApplicationRejected(
    guideId: string, reason?: string,
): Promise<void> {
    const token = await _getToken(guideId);
    if (!token) return;
    await _sendPush([_msg(token, 'Candidature non retenue',
        `Votre candidature de guide n'a pas été retenue.${reason ? ` ${reason}` : ''}`,
        { type: 'application_rejected' })]);
}

// ─── G-15 — Nouvel avis reçu ─────────────────────────────────────────────

export async function notifyGuideNewReview(
    guideId: string, pilgrimName: string, rating: number, serviceName: string,
): Promise<void> {
    const token = await _getToken(guideId);
    if (!token) return;
    await _sendPush([_msg(token, 'Nouvel avis reçu ⭐',
        `${pilgrimName} vous a laissé un avis ${rating}★ pour « ${serviceName} »`,
        { type: 'new_review' })]);
}

// ─── G-16 — Service masqué/archivé par l'admin ───────────────────────────

export async function notifyGuideServiceStatusChanged(
    guideId: string, serviceName: string, status: string, reason?: string,
): Promise<void> {
    const token = await _getToken(guideId);
    if (!token) return;
    const label = status === 'hidden' ? 'masqué' : status === 'archived' ? 'archivé' : status;
    await _sendPush([_msg(token, 'Service modifié',
        `Votre service « ${serviceName} » a été ${label} par l'administration.${reason ? ` ${reason}` : ''}`,
        { type: 'service_status_changed' })]);
}

// ─── G-17 — Compte suspendu ──────────────────────────────────────────────

export async function notifyAccountSuspended(userId: string): Promise<void> {
    const token = await _getToken(userId);
    if (!token) return;
    await _sendPush([_msg(token, 'Compte suspendu',
        "Votre compte a été suspendu par l'administration. Contactez le support.",
        { type: 'account_suspended' })]);
}

// ─── G-18 — Compte réactivé ───────────────────────────────────────────────

export async function notifyAccountReactivated(userId: string): Promise<void> {
    const token = await _getToken(userId);
    if (!token) return;
    await _sendPush([_msg(token, 'Compte réactivé ✅',
        "Votre compte a été réactivé. Vous pouvez de nouveau utiliser l'application.",
        { type: 'account_reactivated' })]);
}

// ─── A-2 — Nouvelle candidature guide ────────────────────────────────────

export async function notifyAdminNewGuideApplication(guideName: string): Promise<void> {
    const tokens = await _getAdminTokens();
    await _sendPush(tokens.map((t) => _msg(t, 'Nouvelle candidature guide',
        `Nouvelle candidature guide de ${guideName} à examiner`,
        { type: 'new_guide_application' })));
}

// ─── A-3 — Guide a accepté un entretien ──────────────────────────────────

export async function notifyAdminGuideInterviewAccepted(
    guideName: string, scheduledAt: string,
): Promise<void> {
    const tokens = await _getAdminTokens();
    const date = new Date(scheduledAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
    await _sendPush(tokens.map((t) => _msg(t, 'Entretien accepté',
        `${guideName} a confirmé l'entretien du ${date}`,
        { type: 'interview_accepted_by_guide' })));
}

// ─── A-4 — Guide a contre-proposé un entretien ───────────────────────────

export async function notifyAdminGuideInterviewCounterProposed(
    guideName: string, scheduledAt: string,
): Promise<void> {
    const tokens = await _getAdminTokens();
    const date = new Date(scheduledAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
    await _sendPush(tokens.map((t) => _msg(t, "Contre-proposition d'entretien",
        `${guideName} propose un nouvel horaire : ${date}`,
        { type: 'interview_counter_proposed_by_guide' })));
}

// ─── A-7 — Nouveau signalement ────────────────────────────────────────────

export async function notifyAdminNewReport(
    reporterName: string, targetName: string, category: string,
): Promise<void> {
    const tokens = await _getAdminTokens();
    await _sendPush(tokens.map((t) => _msg(t, 'Nouveau signalement',
        `Nouveau signalement : ${reporterName} a signalé ${targetName} (${category})`,
        { type: 'new_report' })));
}
