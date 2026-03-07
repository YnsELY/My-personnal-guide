import { AdminGuard } from '@/components/admin/AdminGuard';
import { SlideToConfirmModal } from '@/components/SlideToConfirmModal';
import { getAdminFinance, markGuidePayoutAsPaid } from '@/lib/adminApi';
import { formatEUR } from '@/lib/pricing';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { ArrowLeft, CreditCard, RefreshCw, Wallet } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PERIOD_OPTIONS = [30, 90, 180];

export default function AdminFinanceScreen() {
    const router = useRouter();
    const [periodDays, setPeriodDays] = useState(30);
    const [isLoading, setIsLoading] = useState(true);
    const [isPayingGuideId, setIsPayingGuideId] = useState<string | null>(null);
    const [pendingPayoutGuide, setPendingPayoutGuide] = useState<any | null>(null);
    const [finance, setFinance] = useState<any>(null);

    const loadFinance = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getAdminFinance(periodDays);
            setFinance(data);
        } catch (error: any) {
            Alert.alert("Erreur", error?.message || "Impossible de charger la finance.");
        } finally {
            setIsLoading(false);
        }
    }, [periodDays]);

    useFocusEffect(
        useCallback(() => {
            loadFinance();
        }, [loadFinance])
    );

    React.useEffect(() => {
        loadFinance();
    }, [periodDays, loadFinance]);

    const handlePayGuide = (guide: any) => {
        setPendingPayoutGuide(guide);
    };

    const closePendingPayout = () => {
        if (isPayingGuideId) return;
        setPendingPayoutGuide(null);
    };

    const confirmPendingPayout = async () => {
        if (!pendingPayoutGuide || isPayingGuideId) return;

        setIsPayingGuideId(pendingPayoutGuide.guideId);
        try {
            await markGuidePayoutAsPaid(pendingPayoutGuide.guideId, `manual-${Date.now()}`);
            await loadFinance();
            setPendingPayoutGuide(null);
        } catch (error: any) {
            Alert.alert("Erreur", error?.message || "Paiement impossible.");
        } finally {
            setIsPayingGuideId(null);
        }
    };

    return (
        <AdminGuard>
            <View className="flex-1 bg-gray-50 dark:bg-zinc-900">
                <Stack.Screen options={{ headerShown: false }} />
                <StatusBar barStyle="light-content" />
                <SafeAreaView className="flex-1" edges={['top']}>
                    <View className="px-6 pt-2 pb-4 border-b border-gray-200 dark:border-white/10 flex-row items-center justify-between">
                        <View className="flex-row items-center">
                            <TouchableOpacity onPress={() => router.back()} className="mr-3 p-2 rounded-full bg-gray-200 dark:bg-zinc-700">
                                <ArrowLeft size={18} color="#fff" />
                            </TouchableOpacity>
                            <View>
                                <Text className="text-2xl font-bold text-gray-900 dark:text-white">Finance</Text>
                                <Text className="text-gray-500 dark:text-gray-400 text-xs">CA plateforme et paiements guides</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={loadFinance} className="p-2 rounded-full bg-gray-200 dark:bg-zinc-700">
                            <RefreshCw size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <View className="px-4 pt-4">
                        <View className="flex-row gap-2">
                            {PERIOD_OPTIONS.map((period) => (
                                <TouchableOpacity
                                    key={period}
                                    className={`px-3 py-1.5 rounded-full border ${periodDays === period
                                        ? 'bg-[#b39164] border-[#b39164]'
                                        : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-white/10'
                                        }`}
                                    onPress={() => setPeriodDays(period)}
                                >
                                    <Text className={periodDays === period ? 'text-white font-semibold' : 'text-gray-600 dark:text-gray-300'}>
                                        {period} jours
                                    </Text>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity
                                onPress={() => router.push('/admin/payouts' as any)}
                                className="ml-auto px-3 py-1.5 rounded-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10"
                            >
                                <Text className="text-gray-600 dark:text-gray-300">Paiements</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {isLoading && !finance ? (
                        <View className="flex-1 justify-center items-center">
                            <ActivityIndicator color="#b39164" />
                        </View>
                    ) : (
                        <FlatList
                            data={finance?.byGuide || []}
                            keyExtractor={(item) => item.guideId}
                            contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
                            ListHeaderComponent={() => (
                                <View className="mb-4">
                                    <View className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-white/10 rounded-2xl p-4 mb-3">
                                        <Text className="text-gray-500 text-xs">GMV ({periodDays} jours)</Text>
                                        <Text className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatEUR(finance?.gmv || 0)}</Text>
                                        <View className="flex-row justify-between mt-3">
                                            <View>
                                                <Text className="text-gray-400 text-xs">Revenu plateforme</Text>
                                                <Text className="text-green-500 font-semibold">{formatEUR(finance?.platformRevenue || 0)}</Text>
                                            </View>
                                            <View>
                                                <Text className="text-gray-400 text-xs text-right">Net guides</Text>
                                                <Text className="text-[#b39164] font-semibold text-right">{formatEUR(finance?.netToGuides || 0)}</Text>
                                            </View>
                                        </View>
                                    </View>

                                    <View className="flex-row gap-3">
                                        <SummaryCard
                                            label="Déjà payé"
                                            value={formatEUR(finance?.paidToGuides || 0)}
                                            icon={<CreditCard size={16} color="#22c55e" />}
                                        />
                                        <SummaryCard
                                            label="Reste à payer"
                                            value={formatEUR(finance?.dueToGuides || 0)}
                                            icon={<Wallet size={16} color="#f59e0b" />}
                                        />
                                    </View>

                                    <Text className="text-gray-500 text-xs mt-4 mb-2">Répartition par guide</Text>
                                </View>
                            )}
                            ListEmptyComponent={() => (
                                <View className="items-center py-12">
                                    <Text className="text-gray-500">Aucune donnée financière sur la période.</Text>
                                </View>
                            )}
                            renderItem={({ item }) => (
                                <View className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-white/10 rounded-2xl p-4 mb-3">
                                    <View className="flex-row justify-between items-start">
                                        <View className="flex-1 pr-3">
                                            <Text className="text-gray-900 dark:text-white font-semibold">{item.guideName}</Text>
                                            <Text className="text-gray-500 text-xs mt-0.5">{item.guideEmail || 'Email non renseigné'}</Text>
                                        </View>
                                        <Text className="text-gray-400 text-xs">{item.ordersCount} commandes</Text>
                                    </View>

                                    <View className="mt-3">
                                        <FinanceRow label="CA guide" value={formatEUR(item.grossAmount)} />
                                        <FinanceRow label="Commission plateforme" value={formatEUR(item.platformFeeAmount)} />
                                        <FinanceRow label="Net guide" value={formatEUR(item.netAmount || 0)} />
                                        <FinanceRow label="Déjà payé" value={formatEUR(item.paidAmount || 0)} />
                                        <FinanceRow label="Reste à payer" value={formatEUR(item.dueAmount || 0)} highlight />
                                    </View>

                                    {item.dueAmount > 0 ? (
                                        <TouchableOpacity
                                            className="mt-3 rounded-xl bg-[#b39164] py-2.5 items-center"
                                            onPress={() => handlePayGuide(item)}
                                            disabled={isPayingGuideId === item.guideId}
                                        >
                                            <Text className="text-white font-semibold text-sm">
                                                {isPayingGuideId === item.guideId ? 'Traitement...' : 'Marquer payé'}
                                            </Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <View className="mt-3 rounded-xl bg-green-500/10 border border-green-500/20 py-2.5 items-center">
                                            <Text className="text-green-500 font-semibold text-sm">Aucun reste à payer</Text>
                                        </View>
                                    )}
                                </View>
                            )}
                        />
                    )}
                </SafeAreaView>

                <SlideToConfirmModal
                    visible={!!pendingPayoutGuide}
                    title="Confirmer le paiement"
                    message={`Marquer ${pendingPayoutGuide?.guideName || 'ce guide'} comme payé (${formatEUR(pendingPayoutGuide?.dueAmount || 0)}) ?`}
                    sliderLabel="Glissez pour confirmer le paiement"
                    isProcessing={!!isPayingGuideId}
                    onClose={closePendingPayout}
                    onConfirm={confirmPendingPayout}
                />
            </View>
        </AdminGuard>
    );
}

function SummaryCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
    return (
        <View className="flex-1 bg-white dark:bg-zinc-800 border border-gray-100 dark:border-white/10 rounded-2xl p-4">
            <View className="mb-2">{icon}</View>
            <Text className="text-gray-900 dark:text-white font-semibold">{value}</Text>
            <Text className="text-gray-500 text-xs mt-1">{label}</Text>
        </View>
    );
}

function FinanceRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
    return (
        <View className="flex-row justify-between items-center mt-1.5">
            <Text className="text-gray-500 text-xs">{label}</Text>
            <Text className={highlight ? 'text-[#b39164] font-semibold text-sm' : 'text-gray-300 text-xs'}>{value}</Text>
        </View>
    );
}
