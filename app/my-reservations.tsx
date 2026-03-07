import { SlideToConfirmModal } from '@/components/SlideToConfirmModal';
import { useAuth } from '@/context/AuthContext';
import { useReservations } from '@/context/ReservationsContext';
import { resolveProfileAvatarSource } from '@/lib/avatar';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, MapPin, MessageCircle } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(value || 0);

export default function ReservationsScreen() {
    const router = useRouter();
    const {
        cancelReservationAsPilgrim,
        confirmVisitEndAsPilgrim,
        confirmVisitStartAsPilgrim,
        getReservationsByRole,
        isLoading
    } = useReservations();
    const { user } = useAuth();
    const [pendingAction, setPendingAction] = React.useState<{ type: 'start' | 'end' | 'cancel'; reservation: any } | null>(null);
    const [isSubmittingAction, setIsSubmittingAction] = React.useState(false);

    const reservations = getReservationsByRole('pilgrim', user?.id || 'p1');

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'in_progress': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            case 'completed': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            case 'cancelled': return 'text-red-500 bg-red-500/10 border-red-500/20';
            default: return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'confirmed': return 'Confirmé';
            case 'in_progress': return 'En cours';
            case 'completed': return 'Terminé';
            case 'cancelled': return 'Annulé';
            default: return 'En attente';
        }
    };

    const transportSummary = (reservation: any) => {
        if (reservation.transportPickupType === 'haram') {
            return 'Transport: Rendez-vous au haram';
        }

        if (reservation.transportPickupType === 'hotel') {
            const hotelAddress = reservation.hotelAddress ? ` - ${reservation.hotelAddress}` : '';
            const distancePart = reservation.hotelOver2KmByCar === true
                ? ` (${reservation.hotelDistanceKm || '?'} km)`
                : reservation.hotelOver2KmByCar === false
                    ? ' (<= 2 km)'
                    : '';
            const feePart = Number(reservation.transportExtraFeeAmount || 0) > 0 ? ' +10 €' : '';
            return `Transport: Rendez-vous à l’hôtel${hotelAddress}${distancePart}${feePart}`;
        }

        return 'Transport: non renseigné';
    };

    const closePendingAction = () => {
        if (isSubmittingAction) return;
        setPendingAction(null);
    };

    const confirmPendingAction = async () => {
        if (!pendingAction || isSubmittingAction) return;
        setIsSubmittingAction(true);

        try {
            if (pendingAction.type === 'start') {
                const result = await confirmVisitStartAsPilgrim(pendingAction.reservation.id);
                if (result?.status === 'in_progress') {
                    Alert.alert('Visite démarrée', 'Le guide et vous avez confirmé le début de la visite.');
                } else {
                    Alert.alert('Confirmation enregistrée', 'Votre confirmation de début a été prise en compte.');
                }
            } else if (pendingAction.type === 'end') {
                const result = await confirmVisitEndAsPilgrim(pendingAction.reservation.id);
                if (result?.status === 'completed') {
                    Alert.alert('Visite terminée', 'Le guide et vous avez confirmé la fin de la visite.');
                } else {
                    Alert.alert('Confirmation enregistrée', 'Votre confirmation de fin a été prise en compte.');
                }
            } else {
                const result = await cancelReservationAsPilgrim(pendingAction.reservation.id);
                const creditedAmount = Number(result?.creditedAmount || 0);

                if (creditedAmount > 0) {
                    Alert.alert(
                        'Réservation annulée',
                        `Votre réservation a été annulée. ${formatCurrency(creditedAmount)} ont été crédités dans votre cagnotte.`
                    );
                } else {
                    Alert.alert(
                        'Réservation annulée',
                        'Votre réservation a été annulée. Aucun avoir n’a été crédité car l’annulation est à moins de 48h du début du service.'
                    );
                }
            }

            setPendingAction(null);
        } catch (error) {
            console.error('Failed to confirm pilgrim visit action:', error);

            if (pendingAction.type === 'cancel') {
                const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
                if (errorMessage.includes('non eligible')) {
                    Alert.alert('Action impossible', 'Cette réservation ne peut plus être annulée.');
                } else {
                    Alert.alert('Erreur', "Impossible d'annuler cette réservation pour le moment.");
                }
            } else {
                Alert.alert('Erreur', 'Impossible de confirmer cette action pour le moment.');
            }
        } finally {
            setIsSubmittingAction(false);
        }
    };

    const modalTitle = pendingAction?.type === 'start'
        ? 'Confirmer le début'
        : pendingAction?.type === 'end'
            ? 'Confirmer la fin'
            : 'Annuler la réservation';

    const modalMessage = pendingAction?.type === 'start'
        ? 'Est-ce que vous êtes sûr de vouloir confirmer le début de la visite maintenant ?'
        : pendingAction?.type === 'end'
            ? 'Est-ce que vous êtes sûr de vouloir confirmer la fin de la visite maintenant ?'
            : 'Si vous annulez plus de 48h avant le début, vous recevez 100% en cagnotte. À 48h ou moins, aucun avoir. Confirmer l’annulation ?';

    const modalSliderLabel = pendingAction?.type === 'start'
        ? 'Glissez pour valider le début'
        : pendingAction?.type === 'end'
            ? 'Glissez pour valider la fin'
            : 'Glissez pour annuler';

    return (
        <View className="flex-1 bg-white dark:bg-zinc-900">
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="default" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="flex-row items-center px-6 py-4 mb-2">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 -ml-2 bg-black/10 dark:bg-zinc-800 rounded-full">
                        <ArrowLeft size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-gray-900 dark:text-white">Mes Réservations</Text>
                </View>

                {isLoading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#b39164" />
                    </View>
                ) : (
                    <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
                        {reservations.length === 0 ? (
                            <View className="items-center justify-center py-20">
                                <Text className="text-gray-500 text-center">Vous n&apos;avez aucune réservation pour le moment.</Text>
                            </View>
                        ) : (
                            <View className="gap-4 pb-20">
                                {reservations.map((item) => (
                                    <View key={item.id} className="bg-gray-50 dark:bg-zinc-800 rounded-2xl p-4 border border-gray-200 dark:border-white/5">
                                        <View className="flex-row justify-between items-start mb-4">
                                            <View className="flex-row items-center flex-1 mr-2">
                                                <Image
                                                    source={resolveProfileAvatarSource(item.guideAvatar)}
                                                    className="w-10 h-10 rounded-full bg-gray-200"
                                                />
                                                <View className="ml-3 flex-1">
                                                    <Text className="font-bold text-gray-900 dark:text-white" numberOfLines={1}>{item.serviceName}</Text>
                                                    <Text className="text-gray-500 text-xs">{item.guideName}</Text>
                                                </View>
                                            </View>
                                            <View className="flex-row items-center gap-2">
                                                <TouchableOpacity
                                                    onPress={() => router.push(`/chat/${item.guideId || '1'}`)}
                                                    className="bg-black/10 dark:bg-zinc-700 p-2 rounded-full"
                                                >
                                                    <MessageCircle size={20} color="white" />
                                                </TouchableOpacity>
                                                <View className={`px-3 py-1 rounded-full border ${getStatusColor(item.status).split(' ')[2]} ${getStatusColor(item.status).split(' ')[1]}`}>
                                                    <Text className={`text-xs font-bold ${getStatusColor(item.status).split(' ')[0]}`}>{getStatusLabel(item.status)}</Text>
                                                </View>
                                            </View>
                                        </View>

                                        <View className="flex-row items-center mb-2">
                                            <Calendar size={14} color="#9CA3AF" />
                                            <Text className="text-gray-600 dark:text-gray-300 ml-2 text-sm">{item.date}{item.time ? ` à ${item.time}` : ''}</Text>
                                        </View>

                                        <View className="flex-row items-center mb-4">
                                            <MapPin size={14} color="#9CA3AF" />
                                            <Text className="text-gray-600 dark:text-gray-300 ml-2 text-sm" numberOfLines={1}>{item.location}</Text>
                                        </View>

                                        <Text className="text-gray-500 text-xs mb-4" numberOfLines={2}>
                                            {transportSummary(item)}
                                        </Text>

                                        {item.status === 'confirmed' && !item.guideStartConfirmedAt && (
                                            <View className="mb-4 bg-gray-100 dark:bg-zinc-700 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2">
                                                <Text className="text-gray-500 dark:text-gray-300 text-xs">
                                                    En attente: le guide doit d&apos;abord lancer la visite.
                                                </Text>
                                            </View>
                                        )}

                                        {item.status === 'confirmed' && item.guideStartConfirmedAt && !item.pilgrimStartConfirmedAt && (
                                            <TouchableOpacity
                                                className="mb-4 bg-[#b39164] rounded-xl py-3 items-center"
                                                onPress={() => setPendingAction({ type: 'start', reservation: item })}
                                            >
                                                <Text className="text-white font-semibold text-sm">Confirmer le début de la visite</Text>
                                            </TouchableOpacity>
                                        )}

                                        {item.status === 'in_progress' && !item.guideEndConfirmedAt && (
                                            <View className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl px-3 py-2">
                                                <Text className="text-blue-600 dark:text-blue-300 text-xs">
                                                    Visite en cours: le guide doit d&apos;abord demander la fin de visite.
                                                </Text>
                                            </View>
                                        )}

                                        {item.status === 'in_progress' && item.guideEndConfirmedAt && !item.pilgrimEndConfirmedAt && (
                                            <TouchableOpacity
                                                className="mb-4 bg-[#b39164] rounded-xl py-3 items-center"
                                                onPress={() => setPendingAction({ type: 'end', reservation: item })}
                                            >
                                                <Text className="text-white font-semibold text-sm">Terminer la visite</Text>
                                            </TouchableOpacity>
                                        )}

                                        {(item.status === 'pending' || item.status === 'confirmed') && (
                                            <TouchableOpacity
                                                className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl py-3 items-center"
                                                onPress={() => setPendingAction({ type: 'cancel', reservation: item })}
                                            >
                                                <Text className="text-red-500 font-semibold text-sm">Annuler la réservation</Text>
                                            </TouchableOpacity>
                                        )}

                                        <View className="pt-3 border-t border-gray-200 dark:border-white/5 flex-row justify-between items-center">
                                            <Text className="text-gray-500 text-xs">Total payé</Text>
                                            <Text className="font-bold text-primary text-lg">{formatCurrency(Number(item.price || 0))}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </ScrollView>
                )}
            </SafeAreaView>

            <SlideToConfirmModal
                visible={!!pendingAction}
                title={modalTitle}
                message={modalMessage}
                sliderLabel={modalSliderLabel}
                isProcessing={isSubmittingAction}
                onClose={closePendingAction}
                onConfirm={confirmPendingAction}
            />
        </View>
    );
}
