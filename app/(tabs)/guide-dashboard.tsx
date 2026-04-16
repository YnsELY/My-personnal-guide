import { SlideToConfirmModal } from '@/components/SlideToConfirmModal';
import { useAuth } from '@/context/AuthContext';
import { useReservations } from '@/context/ReservationsContext';
import { formatSAR, toSar } from '@/lib/pricing';
import { Redirect, useRouter } from 'expo-router';
import { Check, Clock, MapPin, User, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

type DashboardView = 'requests' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

const GUIDE_DASHBOARD_VIEWS: DashboardView[] = ['requests', 'upcoming', 'ongoing', 'completed', 'cancelled'];

export default function GuideDashboardScreen() {
    const router = useRouter();
    const { profile, isLoading: authLoading } = useAuth();
    const {
        confirmVisitEndAsGuide,
        confirmVisitStartAsGuide,
        getReservationsByRole,
        updateReservationStatus,
        isLoading: dataLoading,
    } = useReservations();
    const { t } = useTranslation('guide');

    const [activeView, setActiveView] = useState<DashboardView>('requests');
    const [pendingAction, setPendingAction] = useState<{ type: 'start' | 'end' | 'cancel'; reservation: any } | null>(null);
    const [isActionSubmitting, setIsActionSubmitting] = useState(false);

    const filterLabels: Record<DashboardView, string> = {
        requests: t('filters.requests'),
        upcoming: t('filters.upcoming'),
        ongoing: t('filters.ongoing'),
        completed: t('filters.completed'),
        cancelled: t('filters.cancelled'),
    };

    const viewSubtitles: Record<DashboardView, string> = {
        requests: t('subtitles.requests'),
        upcoming: t('subtitles.upcoming'),
        ongoing: t('subtitles.ongoing'),
        completed: t('subtitles.completed'),
        cancelled: t('subtitles.cancelled'),
    };

    const guideReservations = getReservationsByRole('guide', profile?.id || '1');
    const requests = guideReservations.filter((r) => r.status === 'pending');
    const upcomingVisits = guideReservations.filter((r) => r.status === 'confirmed');
    const ongoingVisits = guideReservations.filter((r) => r.status === 'in_progress');
    const completedVisits = guideReservations.filter((r) => r.status === 'completed');
    const cancelledReservations = guideReservations.filter((r) => r.status === 'cancelled');

    if (authLoading || dataLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-zinc-900">
                <Text className="text-gray-500">{t('common:loading')}</Text>
            </View>
        );
    }

    if (profile?.role !== 'guide') {
        return <Redirect href="/" />;
    }

    const handleAccept = (id: string, name: string) => {
        Alert.alert(
            t('acceptRequest'),
            t('acceptRequestConfirm', { name }),
            [
                { text: t('common:cancel'), style: 'cancel' },
                {
                    text: t('accept'),
                    onPress: async () => {
                        try {
                            await updateReservationStatus(id, 'confirmed');
                            Alert.alert(t('common:success'), t('acceptSuccess', { name }));
                        } catch (error) {
                            console.error('Failed to accept reservation request:', error);
                            Alert.alert(t('common:error'), t('acceptError'));
                        }
                    },
                },
            ]
        );
    };

    const handleRefuse = (id: string, name: string) => {
        Alert.alert(
            t('refuseRequest'),
            t('refuseRequestConfirm', { name }),
            [
                { text: t('common:cancel'), style: 'cancel' },
                {
                    text: t('refuse'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await updateReservationStatus(id, 'cancelled');
                            Alert.alert(t('common:success'), t('refuseSuccess', { name }));
                        } catch (error) {
                            console.error('Failed to decline reservation request:', error);
                            Alert.alert(t('common:error'), t('refuseError'));
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
                    Alert.alert(t('visitStarted'), t('visitStartedBothConfirmed'));
                } else {
                    Alert.alert(t('confirmationSent'), t('pilgrimMustConfirmStart'));
                }
            } else if (pendingAction.type === 'end') {
                const result = await confirmVisitEndAsGuide(pendingAction.reservation.id);
                if (result?.status === 'completed') {
                    Alert.alert(t('visitEnded'), t('visitEndedBothConfirmed'));
                } else {
                    Alert.alert(t('confirmationSent'), t('pilgrimMustConfirmEnd'));
                }
            } else {
                await updateReservationStatus(pendingAction.reservation.id, 'cancelled');
                Alert.alert(t('serviceCancelled'), t('serviceCancelledSuccess'));
            }

            setPendingAction(null);
        } catch (error) {
            console.error('Failed to confirm visit action:', error);
            Alert.alert(t('common:error'), t('actionError'));
        } finally {
            setIsActionSubmitting(false);
        }
    };

    const transportSummary = (reservation: any) => {
        if (reservation.transportPickupType === 'haram') {
            return t('booking:transport.haram');
        }

        if (reservation.transportPickupType === 'hotel') {
            const hotelAddress = reservation.hotelAddress ? ` - ${reservation.hotelAddress}` : '';
            const distancePart = reservation.hotelOver2KmByCar === true
                ? ` (${reservation.hotelDistanceKm || '?'} km)`
                : reservation.hotelOver2KmByCar === false
                    ? ' (<= 2 km)'
                    : '';
            const feePart = Number(reservation.transportExtraFeeAmount || 0) > 0 ? ` +${formatSAR(toSar(Number(reservation.transportExtraFeeAmount || 0)))}` : '';
            return `${t('booking:transport.hotel')}${hotelAddress}${distancePart}${feePart}`;
        }

        return t('booking:transport.notSpecified');
    };

    const isBadalReservation = (reservation: any) => {
        return String(reservation?.serviceName || '').toLowerCase().includes('badal');
    };

    const isWaitingPilgrimStartConfirmation = (reservation: any) => {
        return !!reservation?.guideStartConfirmedAt && !reservation?.pilgrimStartConfirmedAt;
    };

    const isWaitingPilgrimEndConfirmation = (reservation: any) => {
        return !!reservation?.guideEndConfirmedAt && !reservation?.pilgrimEndConfirmedAt;
    };

    return (
        <View className="flex-1 bg-gray-50 dark:bg-zinc-900">
            <StatusBar barStyle="light-content" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-6 pt-4 pb-4 border-b border-gray-100 dark:border-white/5 flex-row justify-between items-start">
                    <View>
                        <Text className="text-2xl font-serif font-medium text-gray-900 dark:text-white">
                            {t('guideSpace')}
                        </Text>
                        <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            {viewSubtitles[activeView]}
                        </Text>
                    </View>
                </View>

                <View className="mx-6 mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5">
                    <Text className="text-amber-200 text-xs">
                        {t('complianceReminder')}
                    </Text>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="px-6 pt-3"
                    style={{ maxHeight: 48 }}
                    contentContainerStyle={{ gap: 8, paddingRight: 24, alignItems: 'center' }}
                >
                    {GUIDE_DASHBOARD_VIEWS.map((view) => {
                        const isActive = activeView === view;
                        return (
                            <TouchableOpacity
                                key={view}
                                onPress={() => setActiveView(view)}
                                className={`h-10 px-4 rounded-full border justify-center shrink-0 ${isActive
                                    ? 'bg-[#b39164] border-[#b39164]'
                                    : 'bg-transparent border-gray-300 dark:border-white/15'}`}
                            >
                                <Text
                                    numberOfLines={1}
                                    className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}
                                >
                                    {filterLabels[view]}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
                    {activeView === 'upcoming' && (
                        <>
                            <View className="gap-3 mb-8">
                                {upcomingVisits.length === 0 ? (
                                    <View className="items-center justify-center py-8 bg-white dark:bg-zinc-800 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700">
                                        <Text className="text-gray-400 text-sm">{t('noUpcomingVisits')}</Text>
                                    </View>
                                ) : (
                                    upcomingVisits.map((visit) => (
                                        <View key={visit.id} className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
                                            {(() => {
                                                const isWaitingStartConfirmation = isWaitingPilgrimStartConfirmation(visit);
                                                return (
                                                    <>
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
                                                            <Text className="text-gray-400 text-[10px] ml-1">{visit.location || t('common:locationTbd')}</Text>
                                                        </View>
                                                        <Text className="text-gray-400 text-[10px] mt-1" numberOfLines={2}>
                                                            {transportSummary(visit)}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <View className="items-end ml-3">
                                                    <Text className="text-gray-900 dark:text-white font-bold">{visit.time}</Text>
                                                    <View className={`px-2 py-0.5 rounded-full mt-1 ${isWaitingStartConfirmation ? 'bg-amber-500/20' : 'bg-green-500/20'}`}>
                                                        <Text className={`text-[10px] font-medium ${isWaitingStartConfirmation ? 'text-amber-600' : 'text-green-600'}`}>
                                                            {isWaitingStartConfirmation ? t('waitingStartConfirmation') : t('confirmedStatus')}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>

                                            <View className="mt-4 gap-2">
                                                {isWaitingStartConfirmation ? (
                                                    <View className="bg-amber-100 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 py-3 rounded-lg items-center">
                                                        <Text className="text-amber-700 dark:text-amber-300 font-semibold text-sm">
                                                            {t('waitingPilgrimStart')}
                                                        </Text>
                                                    </View>
                                                ) : (
                                                    <TouchableOpacity
                                                        className="bg-[#b39164] py-3 rounded-lg items-center"
                                                        onPress={() => openActionConfirmation('start', visit)}
                                                    >
                                                        <Text className="text-white font-semibold text-sm">{t('startVisit')}</Text>
                                                    </TouchableOpacity>
                                                )}

                                                <TouchableOpacity
                                                    className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 py-3 rounded-lg items-center"
                                                    onPress={() => openActionConfirmation('cancel', visit)}
                                                >
                                                    <Text className="text-red-500 font-semibold text-sm">{t('cancelService')}</Text>
                                                </TouchableOpacity>

                                                {isBadalReservation(visit) && (
                                                    <TouchableOpacity
                                                        className="bg-indigo-500/10 border border-indigo-500/20 py-3 rounded-lg items-center"
                                                        onPress={() => router.push(`/guide/proofs/${visit.id}` as any)}
                                                    >
                                                        <Text className="text-indigo-500 font-semibold text-sm">{t('submitBadalProofs')}</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                                    </>
                                                );
                                            })()}
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
                                        <Text className="text-gray-400 text-sm">{t('noOngoingVisits')}</Text>
                                    </View>
                                ) : (
                                    ongoingVisits.map((visit) => (
                                        <View key={visit.id} className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
                                            {(() => {
                                                const isWaitingEndConfirmation = isWaitingPilgrimEndConfirmation(visit);
                                                return (
                                                    <>
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
                                                            <Text className="text-gray-400 text-[10px] ml-1">{visit.location || t('common:locationTbd')}</Text>
                                                        </View>
                                                        <Text className="text-gray-400 text-[10px] mt-1" numberOfLines={2}>
                                                            {transportSummary(visit)}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <View className="items-end ml-3">
                                                    <Text className="text-gray-900 dark:text-white font-bold">{visit.time}</Text>
                                                    <View className={`px-2 py-0.5 rounded-full mt-1 ${isWaitingEndConfirmation ? 'bg-amber-500/20' : 'bg-blue-500/20'}`}>
                                                        <Text className={`text-[10px] font-medium ${isWaitingEndConfirmation ? 'text-amber-600' : 'text-blue-600'}`}>
                                                            {isWaitingEndConfirmation ? t('waitingEndConfirmation') : t('inProgressStatus')}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>

                                            {isWaitingEndConfirmation ? (
                                                <View className="mt-4 bg-amber-100 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 py-3 rounded-lg items-center">
                                                    <Text className="text-amber-700 dark:text-amber-300 font-semibold text-sm">
                                                        {t('waitingPilgrimEnd')}
                                                    </Text>
                                                </View>
                                            ) : (
                                                <TouchableOpacity
                                                    className="mt-4 bg-[#b39164] py-3 rounded-lg items-center"
                                                    onPress={() => openActionConfirmation('end', visit)}
                                                >
                                                    <Text className="text-white font-semibold text-sm">{t('endVisit')}</Text>
                                                </TouchableOpacity>
                                            )}

                                            {isBadalReservation(visit) && (
                                                <TouchableOpacity
                                                    className="mt-2 bg-indigo-500/10 border border-indigo-500/20 py-3 rounded-lg items-center"
                                                    onPress={() => router.push(`/guide/proofs/${visit.id}` as any)}
                                                >
                                                    <Text className="text-indigo-500 font-semibold text-sm">{t('submitBadalProofs')}</Text>
                                                </TouchableOpacity>
                                            )}
                                                    </>
                                                );
                                            })()}
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
                                    <Text className="text-gray-400 text-sm">{t('noRequests')}</Text>
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
                                                    <Text className="text-red-500 font-medium text-sm">{t('refuse')}</Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    className="flex-1 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 py-3 rounded-lg flex-row items-center justify-center"
                                                    onPress={() => handleAccept(req.id, req.pilgrimName)}
                                                >
                                                    <Check size={16} color="#22c55e" className="mr-2" />
                                                    <Text className="text-green-600 font-medium text-sm">{t('accept')}</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </>
                    )}

                    {activeView === 'completed' && (
                        <>
                            {completedVisits.length === 0 ? (
                                <View className="items-center justify-center py-8 bg-white dark:bg-zinc-800 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700">
                                    <Text className="text-gray-400 text-sm">{t('noCompletedVisits')}</Text>
                                </View>
                            ) : (
                                <View className="gap-3 mb-24">
                                    {completedVisits.map((reservation) => (
                                        <View key={reservation.id} className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
                                            <View className="flex-row items-center justify-between">
                                                <View className="flex-row items-center flex-1">
                                                    <View className="bg-blue-500/10 p-3 rounded-full mr-3">
                                                        <Check color="#3b82f6" size={20} />
                                                    </View>
                                                    <View className="flex-1">
                                                        <Text className="text-gray-900 dark:text-white font-medium">{reservation.pilgrimName}</Text>
                                                        <Text className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{reservation.serviceName}</Text>
                                                        <Text className="text-gray-500 dark:text-gray-400 text-xs">{reservation.date} a {reservation.time}</Text>
                                                        <View className="flex-row items-center mt-1">
                                                            <MapPin size={10} color="#9CA3AF" />
                                                            <Text className="text-gray-400 text-[10px] ml-1">{reservation.location || t('common:locationTbd')}</Text>
                                                        </View>
                                                        <Text className="text-gray-400 dark:text-gray-500 text-[10px] mt-1" numberOfLines={2}>
                                                            {transportSummary(reservation)}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <View className="bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-full ml-3">
                                                    <Text className="text-blue-500 text-xs font-semibold">{t('completedStatus')}</Text>
                                                </View>
                                            </View>
                                            {isBadalReservation(reservation) && (
                                                <TouchableOpacity
                                                    className="mt-3 bg-indigo-500/10 border border-indigo-500/20 py-2.5 rounded-lg items-center"
                                                    onPress={() => router.push(`/guide/proofs/${reservation.id}` as any)}
                                                >
                                                    <Text className="text-indigo-500 font-semibold text-xs">{t('viewUpdateBadalProofs')}</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    ))}
                                </View>
                            )}
                        </>
                    )}

                    {activeView === 'cancelled' && (
                        <>
                            {cancelledReservations.length === 0 ? (
                                <View className="items-center justify-center py-8 bg-white dark:bg-zinc-800 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700">
                                    <Text className="text-gray-400 text-sm">{t('noCancelledVisits')}</Text>
                                </View>
                            ) : (
                                <View className="gap-3 mb-24">
                                    {cancelledReservations.map((reservation) => (
                                        <View key={reservation.id} className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
                                            <View className="flex-row items-center justify-between">
                                                <View className="flex-row items-center flex-1">
                                                    <View className="bg-red-500/10 p-3 rounded-full mr-3">
                                                        <X color="#ef4444" size={20} />
                                                    </View>
                                                    <View className="flex-1">
                                                        <Text className="text-gray-900 dark:text-white font-medium">{reservation.pilgrimName}</Text>
                                                        <Text className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{reservation.serviceName}</Text>
                                                        <Text className="text-gray-500 dark:text-gray-400 text-xs">{reservation.date} a {reservation.time}</Text>
                                                        <View className="flex-row items-center mt-1">
                                                            <MapPin size={10} color="#9CA3AF" />
                                                            <Text className="text-gray-400 text-[10px] ml-1">{reservation.location || t('common:locationTbd')}</Text>
                                                        </View>
                                                        <Text className="text-gray-400 dark:text-gray-500 text-[10px] mt-1" numberOfLines={2}>
                                                            {transportSummary(reservation)}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <View className="bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-full ml-3">
                                                    <Text className="text-red-500 text-xs font-semibold">{t('cancelledStatus')}</Text>
                                                </View>
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
                        ? t('slideConfirmStart.title')
                        : pendingAction?.type === 'end'
                            ? t('slideConfirmEnd.title')
                            : t('slideConfirmCancel.title')
                }
                message={
                    pendingAction?.type === 'start'
                        ? t('slideConfirmStart.message')
                        : pendingAction?.type === 'end'
                            ? t('slideConfirmEnd.message')
                            : t('slideConfirmCancel.message')
                }
                sliderLabel={
                    pendingAction?.type === 'start'
                        ? t('slideConfirmStart.slider')
                        : pendingAction?.type === 'end'
                            ? t('slideConfirmEnd.slider')
                            : t('slideConfirmCancel.slider')
                }
                isProcessing={isActionSubmitting}
                onClose={closeActionConfirmation}
                onConfirm={confirmPendingAction}
            />
        </View>
    );
}
