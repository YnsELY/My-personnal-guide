import { useAuth } from '@/context/AuthContext';
import { useReservations } from '@/context/ReservationsContext';
import { getMyReviewedReservationIds } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { persistentStorage } from '@/lib/persistentStorage';
import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';

type ReviewPromptItem = {
    reservationId: string;
    guideName: string;
    serviceName: string;
};

const PILGRIM_SEEN_REVIEW_PROMPT_KEY_PREFIX = 'pilgrim_seen_review_prompt_reservation_ids_v1_';

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

export default function PilgrimReviewPromptGlobalPopup() {
    const router = useRouter();
    const { profile } = useAuth();
    const { getReservationsByRole, refreshReservations } = useReservations();

    const [isReady, setIsReady] = React.useState(false);
    const [popupQueue, setPopupQueue] = React.useState<ReviewPromptItem[]>([]);
    const [reviewedReservationIds, setReviewedReservationIds] = React.useState<Set<string>>(new Set());
    const seenReservationIdsRef = React.useRef(new Set<string>());

    const pilgrimReservations = React.useMemo(() => {
        if (profile?.role !== 'pilgrim') return [];
        return getReservationsByRole('pilgrim', profile?.id || 'p1');
    }, [getReservationsByRole, profile?.id, profile?.role]);

    const persistSeenReservationIds = React.useCallback(async () => {
        if (!profile?.id) return;

        try {
            await persistentStorage.setItemAsync(
                `${PILGRIM_SEEN_REVIEW_PROMPT_KEY_PREFIX}${profile.id}`,
                JSON.stringify(Array.from(seenReservationIdsRef.current))
            );
        } catch (error) {
            console.error('Failed to persist seen review prompts for pilgrim:', error);
        }
    }, [profile?.id]);

    const refreshReviewedReservationIds = React.useCallback(async () => {
        if (profile?.role !== 'pilgrim' || !profile?.id) {
            setReviewedReservationIds(new Set());
            return;
        }

        try {
            const ids = await getMyReviewedReservationIds();
            setReviewedReservationIds(new Set(ids));
        } catch (error) {
            console.error('Failed to load reviewed reservation ids for review prompt:', error);
            setReviewedReservationIds(new Set());
        }
    }, [profile?.id, profile?.role]);

    React.useEffect(() => {
        if (profile?.role !== 'pilgrim' || !profile?.id) {
            seenReservationIdsRef.current = new Set();
            setPopupQueue([]);
            setIsReady(false);
            return;
        }

        let isMounted = true;
        const storageKey = `${PILGRIM_SEEN_REVIEW_PROMPT_KEY_PREFIX}${profile.id}`;
        setIsReady(false);

        persistentStorage.getItemAsync(storageKey)
            .then((rawValue) => {
                if (!isMounted) return;
                seenReservationIdsRef.current = new Set(parseSeenReservationIds(rawValue));
                setIsReady(true);
            })
            .catch((error) => {
                console.error('Failed to load seen review prompts for pilgrim:', error);
                if (!isMounted) return;
                seenReservationIdsRef.current = new Set();
                setIsReady(true);
            });

        return () => {
            isMounted = false;
        };
    }, [profile?.id, profile?.role]);

    React.useEffect(() => {
        if (profile?.role !== 'pilgrim' || !profile?.id) return;

        refreshReservations({ silent: true }).catch((error) => {
            console.error('Failed to refresh reservations for global review prompt popup:', error);
        });
        refreshReviewedReservationIds().catch((error) => {
            console.error('Failed to refresh reviewed ids for global review prompt popup:', error);
        });
    }, [profile?.id, profile?.role, refreshReservations, refreshReviewedReservationIds]);

    React.useEffect(() => {
        if (profile?.role !== 'pilgrim' || !profile?.id) return;

        const channel = supabase
            .channel(`global-pilgrim-review-prompts-${profile.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'reservations',
                    filter: `user_id=eq.${profile.id}`,
                },
                () => {
                    refreshReservations({ silent: true }).catch((error) => {
                        console.error('Failed to refresh reservations after global review prompt update:', error);
                    });
                    refreshReviewedReservationIds().catch((error) => {
                        console.error('Failed to refresh reviewed ids after global review prompt update:', error);
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [profile?.id, profile?.role, refreshReservations, refreshReviewedReservationIds]);

    React.useEffect(() => {
        if (profile?.role !== 'pilgrim' || !profile?.id) return;

        const intervalId = setInterval(() => {
            refreshReservations({ silent: true }).catch((error) => {
                console.error('Failed to refresh reservations from global review prompt polling:', error);
            });
            refreshReviewedReservationIds().catch((error) => {
                console.error('Failed to refresh reviewed ids from global review prompt polling:', error);
            });
        }, 10000);

        return () => {
            clearInterval(intervalId);
        };
    }, [profile?.id, profile?.role, refreshReservations, refreshReviewedReservationIds]);

    React.useEffect(() => {
        if (!isReady || profile?.role !== 'pilgrim' || !profile?.id) return;

        const unseenCompletedNotReviewed = pilgrimReservations.filter((reservation: any) => {
            const eligible =
                reservation.pilgrimId === profile.id
                && reservation.status === 'completed'
                && !reviewedReservationIds.has(reservation.id);

            return eligible && !seenReservationIdsRef.current.has(reservation.id);
        });

        if (unseenCompletedNotReviewed.length === 0) return;

        for (const reservation of unseenCompletedNotReviewed) {
            seenReservationIdsRef.current.add(reservation.id);
        }
        persistSeenReservationIds();

        setPopupQueue((previousQueue) => {
            const alreadyQueued = new Set(previousQueue.map((item) => item.reservationId));
            const nextItems = unseenCompletedNotReviewed
                .filter((reservation: any) => !alreadyQueued.has(reservation.id))
                .map((reservation: any): ReviewPromptItem => ({
                    reservationId: reservation.id,
                    guideName: reservation.guideName || 'Votre guide',
                    serviceName: reservation.serviceName || 'service',
                }));

            if (nextItems.length === 0) return previousQueue;
            return [...previousQueue, ...nextItems];
        });
    }, [isReady, persistSeenReservationIds, pilgrimReservations, profile?.id, profile?.role, reviewedReservationIds]);

    const activePopup = popupQueue.length > 0 ? popupQueue[0] : null;

    const closePopup = () => {
        setPopupQueue((previousQueue) => previousQueue.slice(1));
    };

    const rateNow = () => {
        closePopup();
        router.push('/my-reservations');
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
                        <Text className="text-white text-xl font-bold">Visite terminée</Text>
                        <View className="bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-full">
                            <Text className="text-amber-300 text-xs font-semibold">Avis</Text>
                        </View>
                    </View>

                    <Text className="text-zinc-300 text-base leading-6 mt-4">
                        Votre service{' '}
                        <Text className="text-white font-semibold">{activePopup?.serviceName}</Text>
                        {' '}avec{' '}
                        <Text className="text-white font-semibold">{activePopup?.guideName}</Text>
                        {' '}est terminé.
                        {' '}Vous pouvez laisser un avis.
                    </Text>

                    {popupQueue.length > 1 && (
                        <Text className="text-zinc-500 text-xs mt-3">
                            {popupQueue.length - 1} autre(s) visite(s) en attente d&apos;avis.
                        </Text>
                    )}

                    <View className="flex-row gap-3 mt-6">
                        <TouchableOpacity
                            onPress={closePopup}
                            className="flex-1 bg-zinc-700 py-3 rounded-xl items-center"
                        >
                            <Text className="text-white font-semibold">Plus tard</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={rateNow}
                            className="flex-1 bg-[#b39164] py-3 rounded-xl items-center"
                        >
                            <Text className="text-white font-semibold">Noter maintenant</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
