import { AdminGuard } from '@/components/admin/AdminGuard';
import { getAdminOverview } from '@/lib/adminApi';
import { useFocusEffect, useRouter } from 'expo-router';
import {
    BadgeCheck,
    BriefcaseBusiness,
    CalendarClock,
    CreditCard,
    FileClock,
    ListOrdered,
    UserRound,
    Wallet,
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PERIOD_OPTIONS = [7, 30, 90];

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(value || 0);

export default function AdminDashboardScreen() {
    const router = useRouter();
    const [periodDays, setPeriodDays] = useState<number>(30);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [overview, setOverview] = useState<any>(null);

    const loadOverview = useCallback(async (refresh = false) => {
        if (refresh) setIsRefreshing(true);
        else setIsLoading(true);

        try {
            const data = await getAdminOverview(periodDays);
            setOverview(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [periodDays]);

    useFocusEffect(
        useCallback(() => {
            loadOverview();
        }, [loadOverview])
    );

    React.useEffect(() => {
        loadOverview();
    }, [periodDays, loadOverview]);

    return (
        <AdminGuard>
            <View className="flex-1 bg-gray-50 dark:bg-zinc-900">
                <StatusBar barStyle="light-content" />
                <SafeAreaView className="flex-1" edges={['top']}>
                    <View className="px-6 pt-2 pb-4 border-b border-gray-200 dark:border-white/10">
                        <Text className="text-3xl font-bold text-gray-900 dark:text-white">Admin</Text>
                        <Text className="text-gray-500 dark:text-gray-400 mt-1">Pilotage global de l’application</Text>
                    </View>

                    <ScrollView
                        className="flex-1 px-6 pt-5"
                        refreshControl={<RefreshControl tintColor="#b39164" refreshing={isRefreshing} onRefresh={() => loadOverview(true)} />}
                        contentContainerStyle={{ paddingBottom: 28 }}
                    >
                        <View className="flex-row gap-2 mb-5">
                            {PERIOD_OPTIONS.map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    onPress={() => setPeriodDays(option)}
                                    className={`px-4 py-2 rounded-full border ${periodDays === option
                                        ? 'bg-[#b39164] border-[#b39164]'
                                        : 'border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800'
                                        }`}
                                >
                                    <Text className={periodDays === option ? 'text-white font-semibold' : 'text-gray-600 dark:text-gray-300'}>
                                        {option} jours
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {isLoading && !overview ? (
                            <View className="items-center justify-center py-16">
                                <ActivityIndicator color="#b39164" />
                            </View>
                        ) : (
                            <>
                                <View className="flex-row gap-3 mb-3">
                                    <MetricCard
                                        label="Guides en attente"
                                        value={overview?.pendingGuides || 0}
                                        icon={<FileClock size={18} color="#f59e0b" />}
                                    />
                                    <MetricCard
                                        label="Comptes total"
                                        value={overview?.totalAccounts || 0}
                                        icon={<UserRound size={18} color="#3b82f6" />}
                                    />
                                </View>

                                <View className="flex-row gap-3 mb-3">
                                    <MetricCard
                                        label="Services"
                                        value={overview?.totalServices || 0}
                                        icon={<BriefcaseBusiness size={18} color="#22c55e" />}
                                    />
                                    <MetricCard
                                        label="Commandes"
                                        value={overview?.totalReservations || 0}
                                        icon={<ListOrdered size={18} color="#a855f7" />}
                                    />
                                </View>

                                <View className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-white/10 rounded-2xl p-4 mb-3">
                                    <Text className="text-gray-500 dark:text-gray-400 text-xs mb-1">GMV période ({periodDays}j)</Text>
                                    <Text className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(overview?.gmv || 0)}</Text>
                                    <View className="flex-row justify-between mt-3">
                                        <View>
                                            <Text className="text-gray-400 text-xs">Revenu plateforme</Text>
                                            <Text className="text-green-500 font-semibold">{formatCurrency(overview?.platformRevenue || 0)}</Text>
                                        </View>
                                        <View>
                                            <Text className="text-gray-400 text-xs text-right">Montant à distribuer</Text>
                                            <Text className="text-[#b39164] font-semibold text-right">{formatCurrency(overview?.guidesToDistribute || 0)}</Text>
                                        </View>
                                    </View>
                                </View>

                                <View className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-white/10 rounded-2xl p-4 mb-5">
                                    <Text className="text-gray-500 dark:text-gray-400 text-xs mb-3">Réservations par statut</Text>
                                    <View className="flex-row justify-between">
                                        <StatusPill label="En attente" value={overview?.reservationsByStatus?.pending || 0} tone="amber" />
                                        <StatusPill label="Confirmées" value={overview?.reservationsByStatus?.confirmed || 0} tone="green" />
                                        <StatusPill label="Terminées" value={overview?.reservationsByStatus?.completed || 0} tone="blue" />
                                        <StatusPill label="Annulées" value={overview?.reservationsByStatus?.cancelled || 0} tone="red" />
                                    </View>
                                </View>

                                <View className="gap-3">
                                    <ActionCard
                                        title="Guides à valider"
                                        subtitle={`${overview?.pendingGuides || 0} demandes à traiter`}
                                        icon={<BadgeCheck size={18} color="#b39164" />}
                                        onPress={() => router.push('/admin/guides' as any)}
                                    />
                                    <ActionCard
                                        title="Comptes"
                                        subtitle="Consulter, suspendre ou réactiver"
                                        icon={<UserRound size={18} color="#3b82f6" />}
                                        onPress={() => router.push('/admin/accounts' as any)}
                                    />
                                    <ActionCard
                                        title="Services"
                                        subtitle="Modérer les services publiés"
                                        icon={<BriefcaseBusiness size={18} color="#22c55e" />}
                                        onPress={() => router.push('/admin/services' as any)}
                                    />
                                    <ActionCard
                                        title="Commandes"
                                        subtitle="Suivre les statuts des réservations"
                                        icon={<ListOrdered size={18} color="#a855f7" />}
                                        onPress={() => router.push('/admin/reservations' as any)}
                                    />
                                    <ActionCard
                                        title="Entretiens guides"
                                        subtitle="Créneaux WhatsApp, réponses et validations"
                                        icon={<CalendarClock size={18} color="#6366f1" />}
                                        onPress={() => router.push('/admin/interviews' as any)}
                                    />
                                    <ActionCard
                                        title="Finance & Paiements"
                                        subtitle={`${overview?.guidesToPay || 0} guides à payer`}
                                        icon={<Wallet size={18} color="#f59e0b" />}
                                        onPress={() => router.push('/admin/finance' as any)}
                                        trailingIcon={<CreditCard size={16} color="#9CA3AF" />}
                                    />
                                </View>
                            </>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </View>
        </AdminGuard>
    );
}

function MetricCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
    return (
        <View className="flex-1 bg-white dark:bg-zinc-800 border border-gray-100 dark:border-white/10 rounded-2xl p-4">
            <View className="mb-2">{icon}</View>
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">{value}</Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</Text>
        </View>
    );
}

function StatusPill({ label, value, tone }: { label: string; value: number; tone: 'amber' | 'green' | 'blue' | 'red' }) {
    const styleByTone = {
        amber: 'text-amber-500 bg-amber-500/10',
        green: 'text-green-500 bg-green-500/10',
        blue: 'text-blue-500 bg-blue-500/10',
        red: 'text-red-500 bg-red-500/10',
    };
    const classes = styleByTone[tone];

    return (
        <View className="items-center flex-1">
            <View className={`px-2.5 py-1 rounded-full ${classes}`}>
                <Text className={`font-semibold text-xs ${classes.split(' ')[0]}`}>{value}</Text>
            </View>
            <Text className="text-[10px] text-gray-500 mt-1 text-center">{label}</Text>
        </View>
    );
}

function ActionCard({
    title,
    subtitle,
    icon,
    onPress,
    trailingIcon,
}: {
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    onPress: () => void;
    trailingIcon?: React.ReactNode;
}) {
    return (
        <TouchableOpacity
            onPress={onPress}
            className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-white/10 rounded-2xl p-4 flex-row items-center justify-between"
        >
            <View className="flex-row items-center flex-1 mr-3">
                <View className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-zinc-700 items-center justify-center mr-3">
                    {icon}
                </View>
                <View className="flex-1">
                    <Text className="text-gray-900 dark:text-white font-semibold">{title}</Text>
                    <Text className="text-gray-500 text-xs mt-0.5">{subtitle}</Text>
                </View>
            </View>
            {trailingIcon || <Text className="text-gray-400">{'>'}</Text>}
        </TouchableOpacity>
    );
}
