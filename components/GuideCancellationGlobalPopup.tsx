import { useAuth } from '@/context/AuthContext';
import { useReservations } from '@/context/ReservationsContext';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '@/lib/supabase';
import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';

type CancellationPopupItem = {
    reservationId: string;
    pilgrimName: string;
    serviceName: string;
};

const GUIDE_SEEN_CANCELLED_KEY_PREFIX = 'guide_seen_cancelled_reservation_ids_v3_';

const parseSeenCancellationIds = (value: string | null): string[] => {
    if (!value) return [];

    try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((id) => typeof id === 'string' && id.length > 0);
    } catch {
        return [];
    }
};

export default function GuideCancellationGlobalPopup() {
    const { profile } = useAuth();
    const { getReservationsByRole, refreshReservations } = useReservations();

    const [isSeenCancellationsReady, setIsSeenCancellationsReady] = React.useState(false);
    const [popupQueue, setPopupQueue] = React.useState<CancellationPopupItem[]>([]);
    const seenCancelledReservationIdsRef = React.useRef(new Set<string>());

    const guideReservations = React.useMemo(() => {
        if (profile?.role !== 'guide') return [];
        return getReservationsByRole('guide', profile?.id || '1');
    }, [getReservationsByRole, profile?.id, profile?.role]);

    const persistSeenCancellationIds = React.useCallback(async () => {
        if (!profile?.id) return;

        try {
            await SecureStore.setItemAsync(
                `${GUIDE_SEEN_CANCELLED_KEY_PREFIX}${profile.id}`,
                JSON.stringify(Array.from(seenCancelledReservationIdsRef.current))
            );
        } catch (error) {
            console.error('Failed to persist seen cancelled reservations for guide:', error);
        }
    }, [profile?.id]);

    React.useEffect(() => {
        if (profile?.role !== 'guide' || !profile?.id) {
            seenCancelledReservationIdsRef.current = new Set();
            setPopupQueue([]);
            setIsSeenCancellationsReady(false);
            return;
        }

        let isMounted = true;
        const storageKey = `${GUIDE_SEEN_CANCELLED_KEY_PREFIX}${profile.id}`;
        setIsSeenCancellationsReady(false);

        SecureStore.getItemAsync(storageKey)
            .then((rawValue) => {
                if (!isMounted) return;

                const ids = parseSeenCancellationIds(rawValue);
                seenCancelledReservationIdsRef.current = new Set(ids);
                setIsSeenCancellationsReady(true);
            })
            .catch((error) => {
                console.error('Failed to load seen cancelled reservations for guide:', error);
                if (!isMounted) return;
                seenCancelledReservationIdsRef.current = new Set();
                setIsSeenCancellationsReady(true);
            });

        return () => {
            isMounted = false;
        };
    }, [profile?.id, profile?.role]);

    React.useEffect(() => {
        if (profile?.role !== 'guide' || !profile?.id) return;

        refreshReservations().catch((error) => {
            console.error('Failed to refresh reservations for global guide cancellation popup:', error);
        });
    }, [profile?.id, profile?.role, refreshReservations]);

    React.useEffect(() => {
        if (profile?.role !== 'guide' || !profile?.id) return;

        const channel = supabase
            .channel(`global-guide-cancellations-${profile.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'reservations',
                    filter: `guide_id=eq.${profile.id}`,
                },
                () => {
                    refreshReservations().catch((error) => {
                        console.error('Failed to refresh reservations after global cancellation update:', error);
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [profile?.id, profile?.role, refreshReservations]);

    React.useEffect(() => {
        if (profile?.role !== 'guide' || !profile?.id) return;

        const intervalId = setInterval(() => {
            refreshReservations().catch((error) => {
                console.error('Failed to refresh reservations from global cancellation polling:', error);
            });
        }, 10000);

        return () => {
            clearInterval(intervalId);
        };
    }, [profile?.id, profile?.role, refreshReservations]);

    React.useEffect(() => {
        if (!isSeenCancellationsReady || profile?.role !== 'guide') return;

        const unseenCancelledByPilgrim = guideReservations.filter((reservation: any) => {
            const cancelledByPilgrim = reservation.status === 'cancelled' && !!reservation.cancelledAt;
            return cancelledByPilgrim && !seenCancelledReservationIdsRef.current.has(reservation.id);
        });

        if (unseenCancelledByPilgrim.length === 0) return;

        for (const reservation of unseenCancelledByPilgrim) {
            seenCancelledReservationIdsRef.current.add(reservation.id);
        }
        persistSeenCancellationIds();

        setPopupQueue((previousQueue) => {
            const alreadyQueued = new Set(previousQueue.map((item) => item.reservationId));
            const nextItems = unseenCancelledByPilgrim
                .filter((reservation: any) => !alreadyQueued.has(reservation.id))
                .map((reservation: any) => ({
                    reservationId: reservation.id,
                    pilgrimName: reservation.pilgrimName || 'Le pelerin',
                    serviceName: reservation.serviceName || 'service',
                }));

            if (nextItems.length === 0) return previousQueue;
            return [...previousQueue, ...nextItems];
        });
    }, [guideReservations, isSeenCancellationsReady, persistSeenCancellationIds, profile?.role]);

    const activePopup = popupQueue.length > 0 ? popupQueue[0] : null;
    const closePopup = () => {
        setPopupQueue((previousQueue) => previousQueue.slice(1));
    };

    return (
        <Modal
            visible={!!activePopup}
            transparent
            animationType="fade"
            onRequestClose={closePopup}
        >
            <View className="flex-1 bg-black/70 justify-center px-6">
                <View className="bg-zinc-900 border border-white/10 rounded-3xl p-5 shadow-2xl">
                    <View className="flex-row items-center justify-between">
                        <Text className="text-white text-xl font-bold">Service annule</Text>
                        <View className="bg-red-500/15 border border-red-500/30 px-3 py-1 rounded-full">
                            <Text className="text-red-300 text-xs font-semibold">Notification</Text>
                        </View>
                    </View>

                    <Text className="text-zinc-300 text-base leading-6 mt-4">
                        <Text className="text-white font-semibold">{activePopup?.pilgrimName}</Text>
                        {' '}a annule le service{' '}
                        <Text className="text-white font-semibold">{activePopup?.serviceName}</Text>.
                    </Text>

                    {popupQueue.length > 1 && (
                        <Text className="text-zinc-500 text-xs mt-3">
                            {popupQueue.length - 1} autre(s) annulation(s) en attente.
                        </Text>
                    )}

                    <TouchableOpacity
                        onPress={closePopup}
                        className="mt-6 bg-[#b39164] py-3 rounded-xl items-center"
                    >
                        <Text className="text-white font-semibold">J&apos;ai compris</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}
