import { cancelStripeCheckoutReservation, getReservations, getStripeCheckoutReservationStatus } from '@/lib/api';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { AlertTriangle, ArrowLeft, CheckCircle2, LoaderCircle, RefreshCcw, Wallet } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type CheckoutStatus = 'pending' | 'finalized' | 'conflict_credited' | 'failed' | 'cancelled' | 'expired';

export default function PaymentStatusScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const pendingCheckoutId = typeof params.pendingCheckoutId === 'string' ? params.pendingCheckoutId : '';
    const checkoutSessionId = typeof params.checkoutSessionId === 'string' ? params.checkoutSessionId : '';
    const routeStatus = typeof params.status === 'string' ? params.status : '';

    const [status, setStatus] = useState<CheckoutStatus>('pending');
    const [message, setMessage] = useState<string | null>(null);
    const [reservationId, setReservationId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [polling, setPolling] = useState(false);
    const [retryToken, setRetryToken] = useState(0);
    const hasHandledTerminalRef = useRef(false);

    const canPoll = useMemo(() => !!pendingCheckoutId || !!checkoutSessionId, [pendingCheckoutId, checkoutSessionId]);

    useEffect(() => {
        let isMounted = true;
        let timer: any = null;

        const runPoll = async () => {
            if (!canPoll || hasHandledTerminalRef.current) return;
            setPolling(true);
            try {
                const result = await getStripeCheckoutReservationStatus({
                    pendingCheckoutId: pendingCheckoutId || null,
                    checkoutSessionId: checkoutSessionId || null,
                });
                if (!isMounted) return;
                setStatus(result.status);
                setReservationId(result.reservationId || null);
                setMessage(result.message || null);

                if (result.status === 'finalized') {
                    hasHandledTerminalRef.current = true;
                    setLoading(false);
                    const reservations = await getReservations();
                    const reservation = reservations.find((item: any) => item.id === result.reservationId);
                    if (reservation) {
                        router.replace({
                            pathname: '/booking-confirmation',
                            params: {
                                reservationId: reservation.id,
                                serviceName: reservation.serviceName,
                                date: reservation.startDate || reservation.date,
                                time: reservation.time,
                                price: reservation.price,
                                walletAmountUsed: reservation.walletAmountUsed || 0,
                                cardAmountPaid: reservation.cardAmountPaid || 0,
                                location: reservation.location || '',
                                guideName: reservation.guideName || 'Guide',
                                transportPickupType: reservation.transportPickupType || '',
                                hotelAddress: reservation.hotelAddress || '',
                                hotelOver2KmByCar: reservation.hotelOver2KmByCar === null || reservation.hotelOver2KmByCar === undefined ? '' : String(reservation.hotelOver2KmByCar),
                                hotelDistanceKm: reservation.hotelDistanceKm === null || reservation.hotelDistanceKm === undefined ? '' : String(reservation.hotelDistanceKm),
                                transportExtraFeeAmount: String(reservation.transportExtraFeeAmount || 0),
                            },
                        });
                        return;
                    }
                    router.replace('/my-reservations');
                    return;
                }

                if (result.status !== 'pending') {
                    hasHandledTerminalRef.current = true;
                    setLoading(false);
                    return;
                }
            } catch (error: any) {
                if (!isMounted) return;
                setMessage(error?.message || 'Impossible de vérifier le statut du paiement.');
            } finally {
                if (isMounted) {
                    setPolling(false);
                    setLoading(false);
                }
            }

            timer = setTimeout(runPoll, 2500);
        };

        const handleCancelReturn = async () => {
            if (!canPoll) {
                setStatus('failed');
                setMessage('Identifiant de paiement introuvable.');
                setLoading(false);
                return;
            }

            if (routeStatus === 'cancel') {
                try {
                    await cancelStripeCheckoutReservation({
                        pendingCheckoutId: pendingCheckoutId || null,
                        checkoutSessionId: checkoutSessionId || null,
                        reason: 'checkout_cancelled_by_user_return',
                    });
                } catch (error: any) {
                    if (isMounted) {
                        setMessage(error?.message || 'Impossible de finaliser l’annulation du paiement.');
                    }
                }
            }

            await runPoll();
        };

        handleCancelReturn();

        return () => {
            isMounted = false;
            if (timer) clearTimeout(timer);
        };
    }, [canPoll, checkoutSessionId, pendingCheckoutId, retryToken, routeStatus, router]);

    const retry = () => {
        hasHandledTerminalRef.current = false;
        setStatus('pending');
        setLoading(true);
        setMessage(null);
        setRetryToken((prev) => prev + 1);
    };

    return (
        <View className="flex-1 bg-white dark:bg-zinc-900">
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="light-content" />
            <SafeAreaView className="flex-1">
                <View className="px-6 py-4 flex-row items-center border-b border-gray-100 dark:border-white/5">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 items-center justify-center mr-3"
                    >
                        <ArrowLeft size={20} color="white" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-gray-900 dark:text-white">Statut du paiement</Text>
                </View>

                <View className="flex-1 px-6 justify-center">
                    {status === 'pending' && (
                        <View className="items-center">
                            <LoaderCircle size={42} color="#b39164" />
                            <Text className="text-white text-xl font-bold mt-4">Validation en cours</Text>
                            <Text className="text-gray-400 text-center mt-2">
                                Nous confirmons votre paiement et finalisons votre réservation.
                            </Text>
                            <View className="mt-6">
                                {polling || loading ? <ActivityIndicator color="#b39164" /> : null}
                            </View>
                        </View>
                    )}

                    {status === 'conflict_credited' && (
                        <View className="items-center">
                            <Wallet size={42} color="#b39164" />
                            <Text className="text-white text-xl font-bold mt-4">Créneau indisponible</Text>
                            <Text className="text-gray-300 text-center mt-2">
                                {message || 'Le créneau a été pris pendant le paiement. Le montant a été crédité dans votre cagnotte.'}
                            </Text>
                            <TouchableOpacity
                                className="mt-6 bg-[#b39164] rounded-xl px-5 py-3"
                                onPress={() => router.replace('/my-reservations')}
                            >
                                <Text className="text-white font-semibold">Voir mes réservations</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {(status === 'failed' || status === 'cancelled' || status === 'expired') && (
                        <View className="items-center">
                            <AlertTriangle size={42} color="#ef4444" />
                            <Text className="text-white text-xl font-bold mt-4">Paiement non finalisé</Text>
                            <Text className="text-gray-300 text-center mt-2">
                                {message || 'Votre paiement n’a pas pu être finalisé. Vous pouvez réessayer.'}
                            </Text>
                            <View className="flex-row mt-6 gap-3">
                                <TouchableOpacity
                                    className="bg-zinc-700 rounded-xl px-4 py-3"
                                    onPress={() => router.replace('/my-reservations')}
                                >
                                    <Text className="text-white font-semibold">Mes réservations</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className="bg-[#b39164] rounded-xl px-4 py-3 flex-row items-center"
                                    onPress={retry}
                                >
                                    <RefreshCcw size={16} color="white" />
                                    <Text className="text-white font-semibold ml-2">Rafraîchir</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {status === 'finalized' && !reservationId && (
                        <View className="items-center">
                            <CheckCircle2 size={42} color="#16a34a" />
                            <Text className="text-white text-xl font-bold mt-4">Paiement validé</Text>
                            <Text className="text-gray-300 text-center mt-2">
                                Votre réservation est confirmée. Redirection en cours...
                            </Text>
                        </View>
                    )}
                </View>
            </SafeAreaView>
        </View>
    );
}
