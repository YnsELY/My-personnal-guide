import { SlideToConfirmModal } from '@/components/SlideToConfirmModal';
import { useAuth } from '@/context/AuthContext';
import { useReservations } from '@/context/ReservationsContext';
import { formatSAR, toSar } from '@/lib/pricing';
import { Redirect } from 'expo-router';
import { Check, ChevronDown, ChevronUp, Clock, MapPin, User, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, ScrollView, StatusBar, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type DashboardView = 'requests' | 'upcoming' | 'ongoing';

export default function GuideDashboardScreen() {
    const { profile, isLoading: authLoading } = useAuth();
    const {
        confirmVisitEndAsGuide,
        confirmVisitStartAsGuide,
        getReservationsByRole,
        updateReservationStatus,
        isLoading: dataLoading,
    } = useReservations();

    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [activeView, setActiveView] = useState<DashboardView>('requests');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<{ type: 'start' | 'end' | 'cancel'; reservation: any } | null>(null);
    const [isActionSubmitting, setIsActionSubmitting] = useState(false);

    const viewLabels: Record<DashboardView, string> = {
        requests: 'Mes demandes',
        upcoming: 'Mes prochaines visites',
        ongoing: 'Mes visites en cours',
    };

    const viewSubtitles: Record<DashboardView, string> = {
        requests: 'Vos demandes en cours',
        upcoming: 'Vos prochaines visites confirmees',
        ongoing: 'Vos visites actuellement en cours',
    };

    const guideReservations = getReservationsByRole('guide', profile?.id || '1');
    const requests = guideReservations.filter((r) => r.status === 'pending');
    const upcomingVisits = guideReservations.filter((r) => r.status === 'confirmed');
    const ongoingVisits = guideReservations.filter((r) => r.status === 'in_progress');

    if (authLoading || dataLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-zinc-900">
                <Text className="text-gray-500">Chargement...</Text>
            </View>
        );
    }

    if (profile?.role !== 'guide') {
        return <Redirect href="/" />;
    }

    const handleAccept = (id: string, name: string) => {
        Alert.alert(
            'Accepter la demande',
            `Voulez-vous accepter la demande de ${name} ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Accepter',
                    onPress: async () => {
                        try {
                            await updateReservationStatus(id, 'confirmed');
                            Alert.alert('Succes', `Demande de ${name} acceptee avec succes.`);
                        } catch (error) {
                            console.error('Failed to accept reservation request:', error);
                            Alert.alert('Erreur', "Impossible d'accepter cette demande pour le moment.");
                        }
                    },
                },
            ]
        );
    };

    const handleRefuse = (id: string, name: string) => {
        Alert.alert(
            'Refuser la demande',
            `Voulez-vous refuser la demande de ${name} ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Refuser',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await updateReservationStatus(id, 'cancelled');
                            Alert.alert('Succes', `Demande de ${name} refusee.`);
                        } catch (error) {
                            console.error('Failed to decline reservation request:', error);
                            Alert.alert('Erreur', 'Impossible de refuser cette demande pour le moment.');
                        }
                    },
                },
            ]
        );
    };

    const openActionConfirmation = (type: 'start' | 'end' | 'cancel', reservation: any) => {
        setPendingAction({ type, reservation });
    };

    const closeActionConfirmation = () => {
        if (isActionSubmitting) return;
        setPendingAction(null);
    };

    const confirmPendingAction = async () => {
        if (!pendingAction || isActionSubmitting) return;
        setIsActionSubmitting(true);

        try {
            if (pendingAction.type === 'start') {
                const result = await confirmVisitStartAsGuide(pendingAction.reservation.id);
                if (result?.status === 'in_progress') {
                    Alert.alert('Visite demarree', 'Le guide et le pelerin ont confirme le debut de la visite.');
                } else {
                    Alert.alert('Confirmation envoyee', 'Le pelerin doit maintenant confirmer le debut de la visite.');
                }
            } else if (pendingAction.type === 'end') {
                const result = await confirmVisitEndAsGuide(pendingAction.reservation.id);
                if (result?.status === 'completed') {
                    Alert.alert('Visite terminee', 'Le guide et le pelerin ont confirme la fin de la visite.');
                } else {
                    Alert.alert('Confirmation envoyee', 'Le pelerin doit maintenant confirmer la fin de la visite.');
                }
            } else {
                await updateReservationStatus(pendingAction.reservation.id, 'cancelled');
                Alert.alert('Service annulé', 'La prestation a été annulée avec succès.');
            }

            setPendingAction(null);
        } catch (error) {
            console.error('Failed to confirm visit action:', error);
            Alert.alert('Erreur', 'Impossible de confirmer cette action pour le moment.');
        } finally {
            setIsActionSubmitting(false);
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
            const feePart = Number(reservation.transportExtraFeeAmount || 0) > 0 ? ` +${formatSAR(toSar(Number(reservation.transportExtraFeeAmount || 0)))}` : '';
            return `Transport: Rendez-vous à l’hôtel${hotelAddress}${distancePart}${feePart}`;
        }

        return 'Transport: non renseigné';
    };

    return (
        <View className="flex-1 bg-gray-50 dark:bg-zinc-900">
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-6 pt-4 pb-4 border-b border-gray-100 dark:border-white/5 flex-row justify-between items-start">
                    <View>
                        <Text className="text-2xl font-serif font-medium text-gray-900 dark:text-white">
                            Espace Guide
                        </Text>
                        <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            {viewSubtitles[activeView]}
                        </Text>
                    </View>

                    <View className="relative z-20">
                        <TouchableOpacity
                            onPress={() => setIsMenuOpen((prev) => !prev)}
                            className="bg-[#b39164]/10 px-4 py-2 rounded-full border border-[#b39164]/20 flex-row items-center"
                        >
                            <Text className="text-[#b39164] font-medium text-xs mr-1.5">
                                {viewLabels[activeView]}
                            </Text>
                            {isMenuOpen ? (
                                <ChevronUp size={14} color="#b39164" />
                            ) : (
                                <ChevronDown size={14} color="#b39164" />
                            )}
                        </TouchableOpacity>

                        {isMenuOpen && (
                            <View className="absolute top-11 right-0 w-52 bg-white dark:bg-zinc-800 border border-gray-100 dark:border-white/10 rounded-xl shadow-lg overflow-hidden">
                                {(['requests', 'upcoming', 'ongoing'] as DashboardView[]).map((view) => (
                                    <TouchableOpacity
                                        key={view}
                                        onPress={() => {
                                            setActiveView(view);
                                            setIsMenuOpen(false);
                                        }}
                                        className={`px-4 py-3 border-b border-gray-100 dark:border-white/10 ${activeView === view ? 'bg-[#b39164]/10' : ''}`}
                                    >
                                        <Text className={`${activeView === view ? 'text-[#b39164] font-semibold' : 'text-gray-700 dark:text-gray-200'} text-sm`}>
                                            {viewLabels[view]}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                </View>

                <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
                    {activeView === 'upcoming' && (
                        <>
                            <View className="gap-3 mb-8">
                                {upcomingVisits.length === 0 ? (
                                    <View className="items-center justify-center py-8 bg-white dark:bg-zinc-800 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700">
                                        <Text className="text-gray-400 text-sm">Aucune visite prevue pour le moment.</Text>
                                    </View>
                                ) : (
                                    upcomingVisits.map((visit) => (
                                        <View key={visit.id} className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
                                            <View className="flex-row items-center justify-between">
                                                <View className="flex-row items-center flex-1">
                                                    <View className="bg-green-500/10 p-3 rounded-full mr-3">
                                                        <User color="#22c55e" size={20} />
                                                    </View>
                                                    <View className="flex-1">
                                                        <Text className="text-gray-900 dark:text-white font-medium">{visit.pilgrimName}</Text>
                                                        <Text className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{visit.serviceName} - {visit.date}</Text>
                                                        <View className="flex-row items-center mt-1">
                                                            <MapPin size={10} color="#9CA3AF" />
                                                            <Text className="text-gray-400 text-[10px] ml-1">{visit.location || 'Lieu a definir'}</Text>
                                                        </View>
                                                        <Text className="text-gray-400 text-[10px] mt-1" numberOfLines={2}>
                                                            {transportSummary(visit)}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <View className="items-end ml-3">
                                                    <Text className="text-gray-900 dark:text-white font-bold">{visit.time}</Text>
                                                    <View className="bg-green-500/20 px-2 py-0.5 rounded-full mt-1">
                                                        <Text className="text-green-600 text-[10px] font-medium">Confirmee</Text>
                                                    </View>
                                                </View>
                                            </View>

                                            <View className="mt-4 gap-2">
                                                {visit.guideStartConfirmedAt ? (
                                                    <View className="bg-amber-100 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 py-3 rounded-lg items-center">
                                                        <Text className="text-amber-700 dark:text-amber-300 font-semibold text-sm">
                                                            En attente de confirmation du pelerin
                                                        </Text>
                                                    </View>
                                                ) : (
                                                    <TouchableOpacity
                                                        className="bg-[#b39164] py-3 rounded-lg items-center"
                                                        onPress={() => openActionConfirmation('start', visit)}
                                                    >
                                                        <Text className="text-white font-semibold text-sm">Commencer la visite</Text>
                                                    </TouchableOpacity>
                                                )}

                                                <TouchableOpacity
                                                    className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 py-3 rounded-lg items-center"
                                                    onPress={() => openActionConfirmation('cancel', visit)}
                                                >
                                                    <Text className="text-red-500 font-semibold text-sm">Annuler la prestation</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))
                                )}
                            </View>
                        </>
                    )}

                    {activeView === 'ongoing' && (
                        <>
                            <View className="gap-3 mb-8">
                                {ongoingVisits.length === 0 ? (
                                    <View className="items-center justify-center py-8 bg-white dark:bg-zinc-800 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700">
                                        <Text className="text-gray-400 text-sm">Aucune visite en cours.</Text>
                                    </View>
                                ) : (
                                    ongoingVisits.map((visit) => (
                                        <View key={visit.id} className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
                                            <View className="flex-row items-center justify-between">
                                                <View className="flex-row items-center flex-1">
                                                    <View className="bg-blue-500/10 p-3 rounded-full mr-3">
                                                        <User color="#3b82f6" size={20} />
                                                    </View>
                                                    <View className="flex-1">
                                                        <Text className="text-gray-900 dark:text-white font-medium">{visit.pilgrimName}</Text>
                                                        <Text className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{visit.serviceName} - {visit.date}</Text>
                                                        <View className="flex-row items-center mt-1">
                                                            <MapPin size={10} color="#9CA3AF" />
                                                            <Text className="text-gray-400 text-[10px] ml-1">{visit.location || 'Lieu a definir'}</Text>
                                                        </View>
                                                        <Text className="text-gray-400 text-[10px] mt-1" numberOfLines={2}>
                                                            {transportSummary(visit)}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <View className="items-end ml-3">
                                                    <Text className="text-gray-900 dark:text-white font-bold">{visit.time}</Text>
                                                    <View className="bg-blue-500/20 px-2 py-0.5 rounded-full mt-1">
                                                        <Text className="text-blue-600 text-[10px] font-medium">En cours</Text>
                                                    </View>
                                                </View>
                                            </View>

                                            {visit.guideEndConfirmedAt ? (
                                                <View className="mt-4 bg-amber-100 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 py-3 rounded-lg items-center">
                                                    <Text className="text-amber-700 dark:text-amber-300 font-semibold text-sm">
                                                        En attente de confirmation de fin par le pelerin
                                                    </Text>
                                                </View>
                                            ) : (
                                                <TouchableOpacity
                                                    className="mt-4 bg-[#b39164] py-3 rounded-lg items-center"
                                                    onPress={() => openActionConfirmation('end', visit)}
                                                >
                                                    <Text className="text-white font-semibold text-sm">Terminer la visite</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    ))
                                )}
                            </View>
                        </>
                    )}

                    {activeView === 'requests' && (
                        <>
                            {requests.length === 0 ? (
                                <View className="items-center justify-center py-8 bg-white dark:bg-zinc-800 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700">
                                    <Text className="text-gray-400 text-sm">Aucune demande en attente</Text>
                                </View>
                            ) : (
                                <View className="gap-3 mb-24">
                                    {requests.map((req) => (
                                        <View key={req.id} className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
                                            <View className="flex-row items-center justify-between mb-3">
                                                <View className="flex-row items-center flex-1">
                                                    <View className="bg-[#b39164]/10 p-3 rounded-full mr-3">
                                                        <Clock color="#b39164" size={20} />
                                                    </View>
                                                    <View className="flex-1">
                                                        <Text className="text-gray-900 dark:text-white font-medium">{req.pilgrimName}</Text>
                                                        <Text className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{req.serviceName}</Text>
                                                        <Text className="text-gray-500 dark:text-gray-400 text-xs">{req.date} a {req.time}</Text>
                                                        <Text className="text-gray-400 dark:text-gray-500 text-[10px] mt-1" numberOfLines={2}>
                                                            {transportSummary(req)}
                                                        </Text>
                                                    </View>
                                                </View>
                                                    <View className="items-end">
                                                    <Text className="text-[#b39164] font-bold text-lg">
                                                        {formatSAR(toSar(Number(req.guideNetAmountEur ?? req.price ?? 0)))}
                                                    </Text>
                                                </View>
                                            </View>

                                            <View className="flex-row gap-3 mt-1">
                                                <TouchableOpacity
                                                    className="flex-1 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 py-3 rounded-lg flex-row items-center justify-center"
                                                    onPress={() => handleRefuse(req.id, req.pilgrimName)}
                                                >
                                                    <X size={16} color="#ef4444" className="mr-2" />
                                                    <Text className="text-red-500 font-medium text-sm">Refuser</Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    className="flex-1 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 py-3 rounded-lg flex-row items-center justify-center"
                                                    onPress={() => handleAccept(req.id, req.pilgrimName)}
                                                >
                                                    <Check size={16} color="#22c55e" className="mr-2" />
                                                    <Text className="text-green-600 font-medium text-sm">Accepter</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </>
                    )}
                </ScrollView>
            </SafeAreaView>

            <SlideToConfirmModal
                visible={!!pendingAction}
                title={
                    pendingAction?.type === 'start'
                        ? 'Confirmation de debut'
                        : pendingAction?.type === 'end'
                            ? 'Confirmation de fin'
                            : 'Confirmation d’annulation'
                }
                message={
                    pendingAction?.type === 'start'
                        ? 'Est-ce que vous etes sur de vouloir commencer la visite maintenant ?'
                        : pendingAction?.type === 'end'
                            ? 'Est-ce que vous etes sur de vouloir terminer la visite maintenant ?'
                            : 'Est-ce que vous etes sur de vouloir annuler cette prestation ?'
                }
                sliderLabel={
                    pendingAction?.type === 'start'
                        ? 'Glissez pour confirmer le debut'
                        : pendingAction?.type === 'end'
                            ? 'Glissez pour confirmer la fin'
                            : 'Glissez pour confirmer l’annulation'
                }
                isProcessing={isActionSubmitting}
                onClose={closeActionConfirmation}
                onConfirm={confirmPendingAction}
            />
        </View>
    );
}
