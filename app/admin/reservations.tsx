import { AdminGuard } from '@/components/admin/AdminGuard';
import {
    assignReplacementGuide,
    getAdminReplacementGuideCandidates,
    getAdminReservations,
    type GuideCandidate,
    updateAdminReservationStatus
} from '@/lib/adminApi';
import { formatEUR } from '@/lib/pricing';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, Search, XCircle } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    ActivityIndicator,
    FlatList,
    Modal,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
const STATUS_FILTERS: StatusFilter[] = ['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

const statusLabel = (status: string) => {
    if (status === 'pending') return 'En attente';
    if (status === 'confirmed') return 'Confirmée';
    if (status === 'in_progress') return 'En cours';
    if (status === 'completed') return 'Terminée';
    if (status === 'cancelled') return 'Annulée';
    return status;
};

const payoutLabel = (status: string) => {
    if (status === 'paid') return 'Payé';
    if (status === 'to_pay') return 'À payer';
    if (status === 'processing') return 'En cours';
    if (status === 'failed') return 'Échec';
    return 'Non dû';
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

export default function AdminReservationsScreen() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [rows, setRows] = useState<any[]>([]);
    const [searchInput, setSearchInput] = useState('');
    const [searchValue, setSearchValue] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [actionModal, setActionModal] = useState<{ id: string; nextStatus: 'confirmed' | 'completed' | 'cancelled' } | null>(null);
    const [reason, setReason] = useState('');
    const [replacementModalReservation, setReplacementModalReservation] = useState<any | null>(null);
    const [replacementSearchInput, setReplacementSearchInput] = useState('');
    const [replacementCandidates, setReplacementCandidates] = useState<GuideCandidate[]>([]);
    const [replacementSelectedGuideId, setReplacementSelectedGuideId] = useState<string | null>(null);
    const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
    const [isAssigningReplacement, setIsAssigningReplacement] = useState(false);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getAdminReservations({
                search: searchValue,
                status: statusFilter,
                periodDays: 180,
            });
            setRows(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [searchValue, statusFilter]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const openActionModal = (id: string, nextStatus: 'confirmed' | 'completed' | 'cancelled') => {
        setReason('');
        setActionModal({ id, nextStatus });
    };

    const confirmStatusAction = async () => {
        if (!actionModal || isUpdating) return;
        setIsUpdating(true);
        try {
            await updateAdminReservationStatus(actionModal.id, actionModal.nextStatus, reason.trim());
            setRows((prev) => prev.map((row) => (
                row.id === actionModal.id ? { ...row, status: actionModal.nextStatus } : row
            )));
            setActionModal(null);
            setReason('');
        } catch (error) {
            console.error(error);
        } finally {
            setIsUpdating(false);
        }
    };

    const openReplacementModal = async (row: any) => {
        if (isLoadingCandidates || isAssigningReplacement) return;
        setReplacementModalReservation(row);
        setReplacementSearchInput('');
        setReplacementSelectedGuideId(null);
        setReplacementCandidates([]);
        setIsLoadingCandidates(true);

        try {
            const candidates = await getAdminReplacementGuideCandidates(row.id);
            setReplacementCandidates(candidates);
        } catch (error: any) {
            console.error(error);
            setReplacementModalReservation(null);
            Alert.alert("Erreur", error?.message || "Impossible de charger les guides de remplacement.");
        } finally {
            setIsLoadingCandidates(false);
        }
    };

    const closeReplacementModal = () => {
        if (isAssigningReplacement) return;
        setReplacementModalReservation(null);
        setReplacementCandidates([]);
        setReplacementSearchInput('');
        setReplacementSelectedGuideId(null);
    };

    const confirmReplacementGuide = async () => {
        if (!replacementModalReservation || !replacementSelectedGuideId || isAssigningReplacement) return;
        setIsAssigningReplacement(true);
        try {
            await assignReplacementGuide({
                reservationId: replacementModalReservation.id,
                newGuideId: replacementSelectedGuideId,
                reason: replacementModalReservation.replacementReason || undefined,
            });
            await loadData();
            closeReplacementModal();
            Alert.alert("Succès", "Le guide de remplacement a été assigné.");
        } catch (error) {
            console.error(error);
            Alert.alert("Erreur", "Impossible d'assigner ce guide de remplacement.");
        } finally {
            setIsAssigningReplacement(false);
        }
    };

    const filteredReplacementCandidates = replacementCandidates.filter((candidate) => {
        const search = replacementSearchInput.trim().toLowerCase();
        if (!search) return true;
        return (
            candidate.fullName.toLowerCase().includes(search)
            || candidate.email.toLowerCase().includes(search)
            || (candidate.location || '').toLowerCase().includes(search)
        );
    });

    const renderActions = (row: any) => {
        if (row.status === 'pending') {
            return (
                <View className="flex-row gap-2 mt-3">
                    <TouchableOpacity
                        className="flex-1 bg-green-500/10 border border-green-500/20 rounded-xl py-2.5 items-center"
                        onPress={() => openActionModal(row.id, 'confirmed')}
                    >
                        <Text className="text-green-500 font-semibold text-xs">Confirmer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="flex-1 bg-red-500/10 border border-red-500/20 rounded-xl py-2.5 items-center"
                        onPress={() => openActionModal(row.id, 'cancelled')}
                    >
                        <Text className="text-red-500 font-semibold text-xs">Annuler</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (row.status === 'confirmed' || row.status === 'in_progress') {
            return (
                <View className="flex-row gap-2 mt-3">
                    <TouchableOpacity
                        className="flex-1 bg-blue-500/10 border border-blue-500/20 rounded-xl py-2.5 items-center"
                        onPress={() => openActionModal(row.id, 'completed')}
                    >
                        <Text className="text-blue-500 font-semibold text-xs">Marquer terminée</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="flex-1 bg-red-500/10 border border-red-500/20 rounded-xl py-2.5 items-center"
                        onPress={() => openActionModal(row.id, 'cancelled')}
                    >
                        <Text className="text-red-500 font-semibold text-xs">Annuler</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return null;
    };

    return (
        <AdminGuard>
            <View className="flex-1 bg-gray-50 dark:bg-zinc-900">
                <Stack.Screen options={{ headerShown: false }} />
                <StatusBar barStyle="light-content" />
                <SafeAreaView className="flex-1" edges={['top']}>
                    <View className="px-6 pt-2 pb-4 border-b border-gray-200 dark:border-white/10 flex-row items-center">
                        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-2 rounded-full bg-gray-200 dark:bg-zinc-700">
                            <ArrowLeft size={18} color="#fff" />
                        </TouchableOpacity>
                        <View>
                            <Text className="text-2xl font-bold text-gray-900 dark:text-white">Commandes</Text>
                            <Text className="text-gray-500 dark:text-gray-400 text-xs">Suivi des réservations</Text>
                        </View>
                    </View>

                    <View className="px-4 pt-4">
                        <View className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-white/10 rounded-xl px-3 py-2.5 flex-row items-center">
                            <Search size={16} color="#9CA3AF" />
                            <TextInput
                                value={searchInput}
                                onChangeText={setSearchInput}
                                placeholder="Service, guide, pèlerin, lieu"
                                placeholderTextColor="#9CA3AF"
                                className="flex-1 ml-2 text-gray-900 dark:text-white"
                                onSubmitEditing={() => setSearchValue(searchInput.trim())}
                            />
                            <TouchableOpacity onPress={() => setSearchValue(searchInput.trim())}>
                                <Text className="text-[#b39164] font-semibold">OK</Text>
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row gap-2 mt-3 flex-wrap">
                            {STATUS_FILTERS.map((status) => (
                                <TouchableOpacity
                                    key={status}
                                    onPress={() => setStatusFilter(status)}
                                    className={`px-3 py-1.5 rounded-full border ${statusFilter === status
                                        ? 'bg-[#b39164] border-[#b39164]'
                                        : 'border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800'
                                        }`}
                                >
                                    <Text className={statusFilter === status ? 'text-white font-semibold' : 'text-gray-600 dark:text-gray-300'}>
                                        {status === 'all' ? 'Tous' : statusLabel(status)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {isLoading ? (
                        <View className="flex-1 items-center justify-center">
                            <ActivityIndicator color="#b39164" />
                        </View>
                    ) : (
                        <FlatList
                            data={rows}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
                            ListEmptyComponent={() => (
                                <View className="items-center py-16">
                                    <Text className="text-gray-500">Aucune commande trouvée.</Text>
                                </View>
                            )}
                            renderItem={({ item }) => (
                                <View className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-white/10 rounded-2xl p-4 mb-3">
                                    <View className="flex-row justify-between items-start">
                                        <View className="flex-1 pr-2">
                                            <Text className="text-gray-900 dark:text-white font-semibold">{item.serviceName || 'Service non renseigné'}</Text>
                                            <Text className="text-gray-500 text-xs mt-1">{item.pilgrimName} {'->'} {item.guideName}</Text>
                                            <Text className="text-gray-400 text-xs mt-1">{item.location || 'Lieu non renseigné'}</Text>
                                            <Text className="text-gray-400 text-xs mt-1" numberOfLines={2}>{transportSummary(item)}</Text>
                                        </View>
                                        <View className="items-end">
                                            <View className={`px-2.5 py-1 rounded-full ${item.status === 'completed'
                                                ? 'bg-blue-500/10'
                                                : item.status === 'in_progress'
                                                    ? 'bg-indigo-500/10'
                                                : item.status === 'confirmed'
                                                    ? 'bg-green-500/10'
                                                    : item.status === 'cancelled'
                                                        ? 'bg-red-500/10'
                                                        : 'bg-amber-500/10'
                                                }`}>
                                                <Text className={`text-xs font-semibold ${item.status === 'completed'
                                                    ? 'text-blue-500'
                                                    : item.status === 'in_progress'
                                                        ? 'text-indigo-500'
                                                    : item.status === 'confirmed'
                                                        ? 'text-green-500'
                                                        : item.status === 'cancelled'
                                                            ? 'text-red-500'
                                                            : 'text-amber-500'
                                                    }`}>
                                                    {statusLabel(item.status)}
                                                </Text>
                                            </View>
                                            <Text className="text-[#b39164] font-semibold mt-2">{formatEUR(item.totalPrice)}</Text>
                                            <Text className="text-gray-400 text-[11px] mt-1">
                                                Net guide: {formatEUR(Number(item.guideNetAmount || 0))}
                                            </Text>
                                        </View>
                                    </View>

                                    <View className="flex-row justify-between items-center mt-2">
                                        <Text className="text-gray-400 text-xs">Paiement guide: {payoutLabel(item.payoutStatus)}</Text>
                                        <Text className="text-gray-400 text-xs">{item.startDate}</Text>
                                    </View>
                                    <View className="flex-row justify-between items-center mt-1">
                                        <Text className="text-gray-400 text-xs">Enregistrée il y a {item.hoursSinceReservation ?? 0}h</Text>
                                        {item.isPendingTooLong ? (
                                            <View className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30">
                                                <Text className="text-amber-400 text-[10px] font-semibold">En attente &gt; 12h</Text>
                                            </View>
                                        ) : null}
                                    </View>

                                    {renderActions(item)}

                                    {item.canAssignReplacement ? (
                                        <TouchableOpacity
                                            className="mt-3 rounded-xl bg-[#b39164] py-2.5 items-center"
                                            onPress={() => openReplacementModal(item)}
                                        >
                                            <Text className="text-white font-semibold text-xs">Assigner un guide de remplacement</Text>
                                        </TouchableOpacity>
                                    ) : null}
                                </View>
                            )}
                        />
                    )}
                </SafeAreaView>
            </View>

            <Modal visible={!!actionModal} transparent animationType="fade" onRequestClose={() => setActionModal(null)}>
                <View className="flex-1 bg-black/60 justify-center p-6">
                    <View className="bg-white dark:bg-zinc-800 rounded-2xl p-5">
                        <View className="flex-row items-center">
                            {actionModal?.nextStatus === 'cancelled' ? (
                                <XCircle size={18} color="#ef4444" />
                            ) : (
                                <CheckCircle2 size={18} color="#22c55e" />
                            )}
                            <Text className="text-lg font-bold text-gray-900 dark:text-white ml-2">
                                Changer le statut
                            </Text>
                        </View>

                        <Text className="text-gray-500 text-sm mt-3 mb-2">
                            Nouveau statut: <Text className="font-semibold">{statusLabel(actionModal?.nextStatus || '')}</Text>
                        </Text>
                        <TextInput
                            value={reason}
                            onChangeText={setReason}
                            multiline
                            className="min-h-[100px] bg-gray-100 dark:bg-zinc-700 rounded-xl p-3 text-gray-900 dark:text-white"
                            placeholder="Justification (optionnelle)"
                            placeholderTextColor="#9CA3AF"
                        />

                        <View className="flex-row gap-3 mt-4">
                            <TouchableOpacity
                                className="flex-1 py-3 rounded-xl bg-gray-200 dark:bg-zinc-700 items-center"
                                onPress={() => setActionModal(null)}
                                disabled={isUpdating}
                            >
                                <Text className="text-gray-700 dark:text-gray-200 font-semibold">Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="flex-1 py-3 rounded-xl bg-[#b39164] items-center"
                                onPress={confirmStatusAction}
                                disabled={isUpdating}
                            >
                                <Text className="text-white font-semibold">{isUpdating ? 'Traitement...' : 'Confirmer'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={!!replacementModalReservation}
                transparent
                animationType="fade"
                onRequestClose={closeReplacementModal}
            >
                <View className="flex-1 bg-black/60 justify-center p-6">
                    <View className="bg-white dark:bg-zinc-800 rounded-2xl p-5 max-h-[80%]">
                        <Text className="text-lg font-bold text-gray-900 dark:text-white">
                            Guide de remplacement
                        </Text>
                        <Text className="text-gray-500 text-xs mt-1">
                            Sélectionnez un guide approuvé
                        </Text>

                        <View className="bg-gray-100 dark:bg-zinc-700 rounded-xl px-3 py-2.5 flex-row items-center mt-4">
                            <Search size={16} color="#9CA3AF" />
                            <TextInput
                                value={replacementSearchInput}
                                onChangeText={setReplacementSearchInput}
                                placeholder="Rechercher un guide"
                                placeholderTextColor="#9CA3AF"
                                className="flex-1 ml-2 text-gray-900 dark:text-white"
                            />
                        </View>

                        {replacementCandidates.some((candidate) => candidate.fallbackAllZones) && (
                            <View className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                                <Text className="text-amber-300 text-xs">
                                    Aucun guide approuvé trouvé dans la même zone. Affichage de tous les guides approuvés.
                                </Text>
                            </View>
                        )}

                        {isLoadingCandidates ? (
                            <View className="py-8 items-center">
                                <ActivityIndicator color="#b39164" />
                            </View>
                        ) : (
                            <FlatList
                                data={filteredReplacementCandidates}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={{ paddingTop: 12, paddingBottom: 8 }}
                                ListEmptyComponent={() => (
                                    <View className="py-8 items-center">
                                        <Text className="text-gray-500 text-sm">Aucun guide disponible.</Text>
                                    </View>
                                )}
                                renderItem={({ item }) => {
                                    const isSelected = replacementSelectedGuideId === item.id;
                                    return (
                                        <TouchableOpacity
                                            onPress={() => setReplacementSelectedGuideId(item.id)}
                                            className={`mb-2 rounded-xl border px-3 py-3 ${isSelected
                                                ? 'bg-[#b39164]/15 border-[#b39164]/40'
                                                : 'bg-gray-50 dark:bg-zinc-700 border-gray-200 dark:border-white/10'
                                                }`}
                                        >
                                            <Text className={`font-semibold ${isSelected ? 'text-[#b39164]' : 'text-gray-900 dark:text-white'}`}>
                                                {item.fullName}
                                            </Text>
                                            <Text className="text-gray-500 text-xs mt-1">{item.email || 'Email non renseigné'}</Text>
                                            <Text className="text-gray-500 text-xs mt-0.5">
                                                {item.location || 'Zone non renseignée'} • Note {item.rating.toFixed(1)} ({item.reviewsCount})
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                }}
                            />
                        )}

                        <View className="flex-row gap-3 mt-3">
                            <TouchableOpacity
                                className="flex-1 py-3 rounded-xl bg-gray-200 dark:bg-zinc-700 items-center"
                                onPress={closeReplacementModal}
                                disabled={isAssigningReplacement}
                            >
                                <Text className="text-gray-700 dark:text-gray-200 font-semibold">Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className={`flex-1 py-3 rounded-xl items-center ${(replacementSelectedGuideId && !isAssigningReplacement)
                                    ? 'bg-[#b39164]'
                                    : 'bg-gray-300 dark:bg-zinc-600'
                                    }`}
                                onPress={confirmReplacementGuide}
                                disabled={!replacementSelectedGuideId || isAssigningReplacement}
                            >
                                <Text className="text-white font-semibold">
                                    {isAssigningReplacement ? 'Traitement...' : 'Confirmer'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </AdminGuard>
    );
}
