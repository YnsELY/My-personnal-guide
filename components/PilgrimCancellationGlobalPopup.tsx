import { useAuth } from '@/context/AuthContext';
import { useReservations } from '@/context/ReservationsContext';
import { supabase } from '@/lib/supabase';
import * as SecureStore from 'expo-secure-store';
import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';

type CancellationPopupItem = {
    reservationId: string;
    guideName: string;
    serviceName: string;
};

const PILGRIM_SEEN_CANCELLED_BY_GUIDE_KEY_PREFIX = 'pilgrim_seen_cancelled_by_guide_reservation_ids_v1_';

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

export default function PilgrimCancellationGlobalPopup() {
    const { profile } = useAuth();
    const { getReservationsByRole, refreshReservations } = useReservations();

    const [isSeenCancellationsReady, setIsSeenCancellationsReady] = React.useState(false);
    const [popupQueue, setPopupQueue] = React.useState<CancellationPopupItem[]>([]);
    const seenCancelledReservationIdsRef = React.useRef(new Set<string>());

    const pilgrimReservations = React.useMemo(() => {
        if (profile?.role !== 'pilgrim') return [];
        return getReservationsByRole('pilgrim', profile?.id || 'p1');
    }, [getReservationsByRole, profile?.id, profile?.role]);

    const persistSeenCancellationIds = React.useCallback(async () => {
        if (!profile?.id) return;

        try {
            await SecureStore.setItemAsync(
                `${PILGRIM_SEEN_CANCELLED_BY_GUIDE_KEY_PREFIX}${profile.id}`,
                JSON.stringify(Array.from(seenCancelledReservationIdsRef.current))
            );
        } catch (error) {
            console.error('Failed to persist seen cancelled-by-guide reservations for pilgrim:', error);
        }
    }, [profile?.id]);

    React.useEffect(() => {
        if (profile?.role !== 'pilgrim' || !profile?.id) {
            seenCancelledReservationIdsRef.current = new Set();
            setPopupQueue([]);
            setIsSeenCancellationsReady(false);
            return;
        }

        let isMounted = true;
        const storageKey = `${PILGRIM_SEEN_CANCELLED_BY_GUIDE_KEY_PREFIX}${profile.id}`;
        setIsSeenCancellationsReady(false);

        SecureStore.getItemAsync(storageKey)
            .then((rawValue) => {
                if (!isMounted) return;

                const ids = parseSeenCancellationIds(rawValue);
                seenCancelledReservationIdsRef.current = new Set(ids);
                setIsSeenCancellationsReady(true);
            })
            .catch((error) => {
                console.error('Failed to load seen cancelled-by-guide reservations for pilgrim:', error);
                if (!isMounted) return;
                seenCancelledReservationIdsRef.current = new Set();
                setIsSeenCancellationsReady(true);
            });

        return () => {
            isMounted = false;
        };
    }, [profile?.id, profile?.role]);

    React.useEffect(() => {
        if (profile?.role !== 'pilgrim' || !profile?.id) return;

        refreshReservations().catch((error) => {
            console.error('Failed to refresh reservations for global pilgrim cancellation popup:', error);
        });
    }, [profile?.id, profile?.role, refreshReservations]);

    React.useEffect(() => {
        if (profile?.role !== 'pilgrim' || !profile?.id) return;

        const channel = supabase
            .channel(`global-pilgrim-cancellations-${profile.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'reservations',
                    filter: `user_id=eq.${profile.id}`,
                },
                () => {
                    refreshReservations().catch((error) => {
                        console.error('Failed to refresh reservations after global pilgrim cancellation update:', error);
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [profile?.id, profile?.role, refreshReservations]);

    React.useEffect(() => {
        if (profile?.role !== 'pilgrim' || !profile?.id) return;

        const intervalId = setInterval(() => {
            refreshReservations().catch((error) => {
                console.error('Failed to refresh reservations from global pilgrim cancellation polling:', error);
            });
        }, 10000);

        return () => {
            clearInterval(intervalId);
        };
    }, [profile?.id, profile?.role, refreshReservations]);

    React.useEffect(() => {
        if (!isSeenCancellationsReady || profile?.role !== 'pilgrim') return;

        const unseenCancelledByGuide = pilgrimReservations.filter((reservation: any) => {
            const cancelledByGuide =
                reservation.status === 'cancelled'
                && !!reservation.cancelledAt
                && !!reservation.cancelledBy
                && reservation.cancelledBy === reservation.guideId;

            return cancelledByGuide && !seenCancelledReservationIdsRef.current.has(reservation.id);
        });

        if (unseenCancelledByGuide.length === 0) return;

        for (const reservation of unseenCancelledByGuide) {
            seenCancelledReservationIdsRef.current.add(reservation.id);
        }
        persistSeenCancellationIds();

        setPopupQueue((previousQueue) => {
            const alreadyQueued = new Set(previousQueue.map((item) => item.reservationId));
            const nextItems = unseenCancelledByGuide
                .filter((reservation: any) => !alreadyQueued.has(reservation.id))
                .map((reservation: any) => ({
                    reservationId: reservation.id,
                    guideName: reservation.guideName || 'Votre guide',
                    serviceName: reservation.serviceName || 'service',
                }));

            if (nextItems.length === 0) return previousQueue;
            return [...previousQueue, ...nextItems];
        });
    }, [isSeenCancellationsReady, persistSeenCancellationIds, pilgrimReservations, profile?.role]);

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
                        <Text className="text-white font-semibold">{activePopup?.guideName}</Text>
                        {' '}a annule le service{' '}
                        <Text className="text-white font-semibold">{activePopup?.serviceName}</Text>.
                        {' '}Un autre guide va vous etre attribue et vous serez informe tres rapidement de la suite.
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
