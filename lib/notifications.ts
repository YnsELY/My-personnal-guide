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

/**
 * Requests push notification permission and returns the Expo Push Token.
 * Returns null if permission is denied or device is a simulator.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
    if (!Device.isDevice) {
        // Simulators cannot receive push notifications
        return null;
    }

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

    if (finalStatus !== 'granted') {
        return null;
    }

    try {
        const tokenData = await Notifications.getExpoPushTokenAsync();
        return tokenData.data;
    } catch (e) {
        console.warn('[Notifications] Failed to get push token:', e);
        return null;
    }
}

/**
 * Saves the Expo Push Token for the authenticated user in their profile row.
 */
export async function savePushToken(userId: string, token: string): Promise<void> {
    const { error } = await supabase
        .from('profiles')
        .update({ push_token: token })
        .eq('id', userId);

    if (error) {
        console.warn('[Notifications] Failed to save push token:', error.message);
    }
}

/**
 * Sends booking notification to the guide and all admins via Expo Push API.
 * Called client-side right after a successful reservation creation.
 */
export async function sendBookingNotifications(params: {
    guideId: string;
    pilgrimName: string;
    serviceName: string;
}): Promise<void> {
    const { guideId, pilgrimName, serviceName } = params;

    const { data: tokens, error } = await supabase.rpc('get_notification_tokens_for_guide', {
        p_guide_id: guideId,
    });

    if (error) {
        console.warn('[Notifications] Failed to fetch tokens:', error.message);
        return;
    }

    if (!tokens || tokens.length === 0) return;

    const messages = (tokens as { push_token: string; role: string }[]).map((t) => ({
        to: t.push_token,
        sound: 'default' as const,
        title: t.role === 'admin' ? 'Nouvelle commande de service' : 'Nouvelle demande de réservation',
        body:
            t.role === 'admin'
                ? `${pilgrimName} a commandé "${serviceName}"`
                : `Vous avez reçu une demande de réservation pour "${serviceName}"`,
        data: { type: 'new_booking' },
    }));

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
        console.warn('[Notifications] Failed to send push notifications:', e);
    }
}
