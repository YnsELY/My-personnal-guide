import { useAuth } from '@/context/AuthContext';
import { useReservations } from '@/context/ReservationsContext';
import { supabase } from '@/lib/supabase';
import * as SecureStore from 'expo-secure-store';
import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';

type ReplacementPopupItem = {
    reservationId: string;
    pilgrimName: string;
    serviceName: string;
};

const GUIDE_SEEN_REASSIGNED_KEY_PREFIX = 'guide_seen_reassigned_reservation_ids_v1_';

const parseSeenReservationIds = (value: string | null): string[] => {
    if (!value) return [];

    try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((id) => typeof id === 'string' && id.length > 0);
    } catch {
        return [];
    }
};

export default function GuideReplacementGlobalPopup() {
    const { profile } = useAuth();
    const { getReservationsByRole, refreshReservations } = useReservations();

    const [isReady, setIsReady] = React.useState(false);
    const [popupQueue, setPopupQueue] = React.useState<ReplacementPopupItem[]>([]);
    const seenReservationIdsRef = React.useRef(new Set<string>());

    const guideReservations = React.useMemo(() => {
        if (profile?.role !== 'guide') return [];
        return getReservationsByRole('guide', profile?.id || '1');
    }, [getReservationsByRole, profile?.id, profile?.role]);

    const persistSeenReservationIds = React.useCallback(async () => {
        if (!profile?.id) return;

        try {
            await SecureStore.setItemAsync(
                `${GUIDE_SEEN_REASSIGNED_KEY_PREFIX}${profile.id}`,
                JSON.stringify(Array.from(seenReservationIdsRef.current))
            );
        } catch (error) {
            console.error('Failed to persist seen reassigned reservations for guide:', error);
        }
    }, [profile?.id]);

    React.useEffect(() => {
        if (profile?.role !== 'guide' || !profile?.id) {
            seenReservationIdsRef.current = new Set();
            setPopupQueue([]);
            setIsReady(false);
            return;
        }

        let isMounted = true;
        const storageKey = `${GUIDE_SEEN_REASSIGNED_KEY_PREFIX}${profile.id}`;
        setIsReady(false);

        SecureStore.getItemAsync(storageKey)
            .then((rawValue) => {
                if (!isMounted) return;
                seenReservationIdsRef.current = new Set(parseSeenReservationIds(rawValue));
                setIsReady(true);
            })
            .catch((error) => {
                console.error('Failed to load seen reassigned reservations for guide:', error);
                if (!isMounted) return;
                seenReservationIdsRef.current = new Set();
                setIsReady(true);
            });

        return () => {
            isMounted = false;
        };
    }, [profile?.id, profile?.role]);

    React.useEffect(() => {
        if (profile?.role !== 'guide' || !profile?.id) return;

        refreshReservations().catch((error) => {
            console.error('Failed to refresh reservations for global guide replacement popup:', error);
        });
    }, [profile?.id, profile?.role, refreshReservations]);

    React.useEffect(() => {
        if (profile?.role !== 'guide' || !profile?.id) return;

        const channel = supabase
            .channel(`global-guide-replacements-${profile.id}`)
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
                        console.error('Failed to refresh reservations after global guide replacement update:', error);
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
                console.error('Failed to refresh reservations from global guide replacement polling:', error);
            });
        }, 10000);

        return () => {
            clearInterval(intervalId);
        };
    }, [profile?.id, profile?.role, refreshReservations]);

    React.useEffect(() => {
        if (!isReady || profile?.role !== 'guide' || !profile?.id) return;

        const unseenReassigned = guideReservations.filter((reservation: any) => {
            const isNewGuideAssignment =
                !!reservation.reassignedAt
                && !!reservation.reassignedFromGuideId
                && reservation.guideId === profile.id
                && reservation.guideId !== reservation.reassignedFromGuideId
                && reservation.status !== 'cancelled';

            return isNewGuideAssignment && !seenReservationIdsRef.current.has(reservation.id);
        });

        if (unseenReassigned.length === 0) return;

        for (const reservation of unseenReassigned) {
            seenReservationIdsRef.current.add(reservation.id);
        }
        persistSeenReservationIds();

        setPopupQueue((previousQueue) => {
            const alreadyQueued = new Set(previousQueue.map((item) => item.reservationId));
            const nextItems = unseenReassigned
                .filter((reservation: any) => !alreadyQueued.has(reservation.id))
                .map((reservation: any) => ({
                    reservationId: reservation.id,
                    pilgrimName: reservation.pilgrimName || 'Le pelerin',
                    serviceName: reservation.serviceName || 'service',
                }));

            if (nextItems.length === 0) return previousQueue;
            return [...previousQueue, ...nextItems];
        });
    }, [guideReservations, isReady, persistSeenReservationIds, profile?.id, profile?.role]);

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
                        <Text className="text-white text-xl font-bold">Nouvelle attribution</Text>
                        <View className="bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full">
                            <Text className="text-emerald-300 text-xs font-semibold">Information</Text>
                        </View>
                    </View>

                    <Text className="text-zinc-300 text-base leading-6 mt-4">
                        Une nouvelle prestation vous a ete attribuee:
                        {' '}<Text className="text-white font-semibold">{activePopup?.serviceName}</Text>.
                        {' '}Pelerin concerne:{' '}
                        <Text className="text-white font-semibold">{activePopup?.pilgrimName}</Text>.
                    </Text>

                    {popupQueue.length > 1 && (
                        <Text className="text-zinc-500 text-xs mt-3">
                            {popupQueue.length - 1} autre(s) attribution(s) en attente.
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
