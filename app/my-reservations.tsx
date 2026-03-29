import { SlideToConfirmModal } from '@/components/SlideToConfirmModal';
import { useAuth } from '@/context/AuthContext';
import { useReservations } from '@/context/ReservationsContext';
import { resolveProfileAvatarSource } from '@/lib/avatar';
import { createReviewForCompletedReservation, getMyReviewedReservationIds, getReservationProofs } from '@/lib/api';
import * as Linking from 'expo-linking';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, MapPin, MessageCircle, Star } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(value || 0);

type ReservationStatusFilter = 'all' | 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

const RESERVATION_STATUS_FILTERS: { value: ReservationStatusFilter; label: string }[] = [
    { value: 'all', label: 'Tous' },
    { value: 'pending', label: 'En attente' },
    { value: 'confirmed', label: 'Confirmé' },
    { value: 'in_progress', label: 'En cours' },
    { value: 'completed', label: 'Terminé' },
    { value: 'cancelled', label: 'Annulé' },
];

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
    const [reviewedReservationIds, setReviewedReservationIds] = React.useState<Set<string>>(new Set());
    const [pendingReviewReservation, setPendingReviewReservation] = React.useState<any | null>(null);
    const [selectedRating, setSelectedRating] = React.useState(0);
    const [reviewComment, setReviewComment] = React.useState('');
    const [isSubmittingReview, setIsSubmittingReview] = React.useState(false);
    const [statusFilter, setStatusFilter] = React.useState<ReservationStatusFilter>('all');
    const [proofsModalReservation, setProofsModalReservation] = React.useState<any | null>(null);
    const [proofsByType, setProofsByType] = React.useState<Record<string, any>>({});
    const [proofsLoading, setProofsLoading] = React.useState(false);

    const reservations = getReservationsByRole('pilgrim', user?.id || 'p1');
    const filteredReservations = React.useMemo(() => {
        if (statusFilter === 'all') return reservations;
        return reservations.filter((reservation) => reservation.status === statusFilter);
    }, [reservations, statusFilter]);

    const refreshReviewedReservationIds = React.useCallback(async () => {
        if (!user?.id) {
            setReviewedReservationIds(new Set());
            return;
        }
        try {
            const ids = await getMyReviewedReservationIds();
            setReviewedReservationIds(new Set(ids));
        } catch (error) {
            console.error('Failed to load reviewed reservation ids:', error);
        }
    }, [user?.id]);

    React.useEffect(() => {
        refreshReviewedReservationIds().catch((error) => {
            console.error('Failed to refresh reviewed reservations:', error);
        });
    }, [refreshReviewedReservationIds]);

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

    const isBadalReservation = (reservation: any) => {
        return String(reservation?.serviceName || '').toLowerCase().includes('badal');
    };

    const openProofsModal = async (reservation: any) => {
        setProofsModalReservation(reservation);
        setProofsLoading(true);
        setProofsByType({});
        try {
            const proofs = await getReservationProofs(reservation.id);
            const map: Record<string, any> = {};
            for (const proof of proofs) {
                map[proof.proofType] = proof;
            }
            setProofsByType(map);
        } catch (error: any) {
            console.error('Failed to load reservation proofs on pilgrim side:', error);
            Alert.alert('Erreur', error?.message || 'Impossible de charger les preuves pour le moment.');
            setProofsModalReservation(null);
        } finally {
            setProofsLoading(false);
        }
    };

    const openProofVideo = async (proofType: 'ihram_start_video' | 'omra_completion_video') => {
        const proof = proofsByType[proofType];
        if (!proof?.videoUrl) {
            Alert.alert('Indisponible', 'Cette preuve n’est pas encore disponible.');
            return;
        }
        try {
            await Linking.openURL(proof.videoUrl);
        } catch {
            Alert.alert('Erreur', 'Impossible d’ouvrir cette vidéo sur cet appareil.');
        }
    };

    const closePendingAction = () => {
        if (isSubmittingAction) return;
        setPendingAction(null);
    };

    const closeReviewModal = () => {
        if (isSubmittingReview) return;
        setPendingReviewReservation(null);
        setSelectedRating(0);
        setReviewComment('');
    };

    const submitReview = async () => {
        if (!pendingReviewReservation || isSubmittingReview) return;
        if (selectedRating < 1 || selectedRating > 5) {
            Alert.alert('Note requise', 'Veuillez sélectionner une note entre 1 et 5 étoiles.');
            return;
        }

        setIsSubmittingReview(true);
        try {
            await createReviewForCompletedReservation({
                reservationId: pendingReviewReservation.id,
                rating: selectedRating,
                comment: reviewComment.trim() || undefined,
            });

            await refreshReviewedReservationIds();
            Alert.alert('Merci pour votre avis', 'Votre avis a bien été envoyé.');
            closeReviewModal();
        } catch (error: any) {
            const message = String(error?.message || '').toLowerCase();
            if (message.includes('déjà') || message.includes('deja') || message.includes('already')) {
                Alert.alert('Avis déjà envoyé', 'Vous avez déjà laissé un avis pour cette réservation.');
                await refreshReviewedReservationIds();
                closeReviewModal();
            } else if (message.includes('completed') || message.includes('fin')) {
                Alert.alert('Action impossible', 'Vous pouvez laisser un avis uniquement après la fin de la visite.');
            } else {
                Alert.alert('Erreur', "Impossible d'envoyer votre avis pour le moment.");
            }
        } finally {
            setIsSubmittingReview(false);
        }
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
                const retainedAmount = Number(result?.retainedAmount || 0);
                const adminCommissionAmount = Number(result?.adminCommissionAmount || 0);
                const guideCompensationAmount = Number(result?.guideCompensationAmount || 0);
                const policyApplied = String(result?.policyApplied || '');

                if (policyApplied === 'full_credit_over_48h') {
                    Alert.alert(
                        'Réservation annulée',
                        `Votre réservation a été annulée. ${formatCurrency(creditedAmount)} ont été crédités dans votre cagnotte.`
                    );
                } else if (policyApplied === 'partial_credit_under_48h') {
                    Alert.alert(
                        'Réservation annulée',
                        `Votre réservation a été annulée. ${formatCurrency(creditedAmount)} (75%) ont été crédités dans votre cagnotte.\n\n${formatCurrency(retainedAmount)} (25%) sont retenus, dont ${formatCurrency(adminCommissionAmount)} pour la plateforme et ${formatCurrency(guideCompensationAmount)} pour le guide.`
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
            : 'Si vous annulez au moins 48h avant le début, vous recevez 100% en cagnotte. À moins de 48h, vous recevez 75% en cagnotte (25% retenus: 60% plateforme, 40% guide). Confirmer l’annulation ?';

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

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="px-6 mb-3"
                    style={{ maxHeight: 48 }}
                    contentContainerStyle={{ gap: 8, paddingRight: 24, alignItems: 'center' }}
                >
                    {RESERVATION_STATUS_FILTERS.map((filter) => {
                        const isActive = statusFilter === filter.value;
                        return (
                            <TouchableOpacity
                                key={filter.value}
                                onPress={() => setStatusFilter(filter.value)}
                                className={`h-10 px-4 rounded-full border justify-center shrink-0 ${isActive
                                    ? 'bg-[#b39164] border-[#b39164]'
                                    : 'bg-transparent border-gray-300 dark:border-white/15'}`}
                            >
                                <Text
                                    numberOfLines={1}
                                    className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}
                                >
                                    {filter.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {isLoading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#b39164" />
                    </View>
                ) : (
                    <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
                        {filteredReservations.length === 0 ? (
                            <View className="items-center justify-center py-20">
                                <Text className="text-gray-500 text-center">
                                    {statusFilter === 'all'
                                        ? "Vous n'avez aucune réservation pour le moment."
                                        : `Aucune réservation avec le statut "${RESERVATION_STATUS_FILTERS.find((f) => f.value === statusFilter)?.label || statusFilter}".`}
                                </Text>
                            </View>
                        ) : (
                            <View className="gap-4 pb-20">
                                {filteredReservations.map((item) => {
                                    const hasReview = reviewedReservationIds.has(item.id);
                                    return (
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

                                        {item.status === 'completed' && !hasReview && (
                                            <TouchableOpacity
                                                className="mb-4 bg-[#b39164] rounded-xl py-3 items-center"
                                                onPress={() => {
                                                    setPendingReviewReservation(item);
                                                    setSelectedRating(0);
                                                    setReviewComment('');
                                                }}
                                            >
                                                <Text className="text-white font-semibold text-sm">Laisser un avis</Text>
                                            </TouchableOpacity>
                                        )}

                                        {item.status === 'completed' && hasReview && (
                                            <View className="mb-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl py-3 items-center">
                                                <Text className="text-emerald-500 font-semibold text-sm">Avis envoyé</Text>
                                            </View>
                                        )}

                                        {isBadalReservation(item) && (
                                            <TouchableOpacity
                                                className="mb-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl py-3 items-center"
                                                onPress={() => openProofsModal(item)}
                                            >
                                                <Text className="text-indigo-500 font-semibold text-sm">Preuves Omra Badal</Text>
                                            </TouchableOpacity>
                                        )}

                                        <View className="pt-3 border-t border-gray-200 dark:border-white/5 flex-row justify-between items-center">
                                            <Text className="text-gray-500 text-xs">Total payé</Text>
                                            <Text className="font-bold text-primary text-lg">{formatCurrency(Number(item.price || 0))}</Text>
                                        </View>
                                    </View>
                                    );
                                })}
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

            <Modal
                visible={!!pendingReviewReservation}
                transparent
                animationType="fade"
                onRequestClose={closeReviewModal}
            >
                <View className="flex-1 bg-black/70">
                    <KeyboardAvoidingView
                        className="flex-1 justify-end"
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 18 : 0}
                    >
                        <ScrollView
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
                        >
                            <View className="px-6 pb-6 pt-10">
                                <View className="bg-zinc-900 border border-white/10 rounded-3xl p-5 shadow-2xl">
                                    <Text className="text-white text-xl font-bold">Donnez votre avis</Text>
                                    <Text className="text-zinc-300 text-sm leading-6 mt-3">
                                        Service: <Text className="text-white font-semibold">{pendingReviewReservation?.serviceName}</Text>
                                        {'\n'}
                                        Guide: <Text className="text-white font-semibold">{pendingReviewReservation?.guideName}</Text>
                                    </Text>

                                    <View className="flex-row justify-center gap-2 mt-5">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <TouchableOpacity
                                                key={star}
                                                onPress={() => setSelectedRating(star)}
                                                className="p-1"
                                            >
                                                <Star
                                                    size={30}
                                                    color={star <= selectedRating ? '#f5c07a' : '#52525b'}
                                                    fill={star <= selectedRating ? '#f5c07a' : 'transparent'}
                                                />
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <TextInput
                                        value={reviewComment}
                                        onChangeText={setReviewComment}
                                        placeholder="Commentaire (optionnel)"
                                        placeholderTextColor="#71717a"
                                        multiline
                                        textAlignVertical="top"
                                        className="mt-5 min-h-[92px] rounded-2xl border border-white/10 bg-zinc-800 px-4 py-3 text-white"
                                    />

                                    <View className="flex-row gap-3 mt-5">
                                        <TouchableOpacity
                                            onPress={closeReviewModal}
                                            disabled={isSubmittingReview}
                                            className="flex-1 bg-zinc-700 py-3 rounded-xl items-center"
                                        >
                                            <Text className="text-white font-semibold">Annuler</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={submitReview}
                                            disabled={isSubmittingReview || selectedRating < 1}
                                            className={`flex-1 py-3 rounded-xl items-center ${(isSubmittingReview || selectedRating < 1) ? 'bg-[#b39164]/50' : 'bg-[#b39164]'}`}
                                        >
                                            <Text className="text-white font-semibold">{isSubmittingReview ? 'Envoi...' : 'Publier l’avis'}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

            <Modal
                visible={!!proofsModalReservation}
                transparent
                animationType="fade"
                onRequestClose={() => setProofsModalReservation(null)}
            >
                <View className="flex-1 bg-black/70 justify-center px-6">
                    <View className="bg-zinc-900 border border-white/10 rounded-3xl p-5 shadow-2xl">
                        <Text className="text-white text-xl font-bold">Preuves Omra Badal</Text>
                        <Text className="text-zinc-300 text-sm mt-2">
                            {proofsModalReservation?.serviceName} {'\n'}
                            Guide: <Text className="text-white font-semibold">{proofsModalReservation?.guideName}</Text>
                        </Text>

                        {proofsLoading ? (
                            <View className="py-8 items-center">
                                <ActivityIndicator color="#b39164" />
                            </View>
                        ) : (
                            <View className="mt-4 gap-3">
                                {[
                                    { type: 'ihram_start_video', label: 'Vidéo entrée en ihram' },
                                    { type: 'omra_completion_video', label: 'Vidéo fin de mission' },
                                ].map((proofConfig) => {
                                    const proof = proofsByType[proofConfig.type];
                                    return (
                                        <View key={proofConfig.type} className="rounded-xl border border-white/10 bg-zinc-800 p-3">
                                            <Text className="text-white font-semibold text-sm">{proofConfig.label}</Text>
                                            <Text className="text-zinc-400 text-xs mt-1">
                                                {proof ? `Envoyée le ${new Date(proof.uploadedAt).toLocaleString('fr-FR')}` : 'Non envoyée'}
                                            </Text>
                                            <TouchableOpacity
                                                className={`mt-3 py-2.5 rounded-lg items-center ${proof ? 'bg-[#b39164]' : 'bg-zinc-700'}`}
                                                onPress={() => openProofVideo(proofConfig.type as 'ihram_start_video' | 'omra_completion_video')}
                                                disabled={!proof}
                                            >
                                                <Text className={`font-semibold text-xs ${proof ? 'text-white' : 'text-zinc-400'}`}>
                                                    {proof ? 'Voir la vidéo' : 'Indisponible'}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })}
                            </View>
                        )}

                        <TouchableOpacity
                            onPress={() => setProofsModalReservation(null)}
                            className="mt-5 bg-zinc-700 py-3 rounded-xl items-center"
                        >
                            <Text className="text-white font-semibold">Fermer</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
