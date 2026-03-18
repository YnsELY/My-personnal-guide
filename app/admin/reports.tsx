import { AdminGuard } from '@/components/admin/AdminGuard';
import {
    getAdminReports,
    updateAdminReportStatus,
    type AdminReport,
    type AdminReportCategory,
    type AdminReportStatus,
} from '@/lib/adminApi';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { ArrowLeft, Search } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
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

const STATUS_FILTERS: (AdminReportStatus | 'all')[] = ['all', 'open', 'in_review', 'resolved', 'rejected'];
const CATEGORY_FILTERS: (AdminReportCategory | 'all')[] = ['all', 'harassment', 'fraud', 'inappropriate_content', 'safety', 'other'];

const statusLabel = (status: AdminReportStatus | 'all') => {
    if (status === 'all') return 'Tous';
    if (status === 'open') return 'Ouvert';
    if (status === 'in_review') return 'En revue';
    if (status === 'resolved') return 'Résolu';
    return 'Rejeté';
};

const categoryLabel = (category: AdminReportCategory | 'all') => {
    if (category === 'all') return 'Toutes';
    if (category === 'harassment') return 'Harcèlement';
    if (category === 'fraud') return 'Fraude';
    if (category === 'inappropriate_content') return 'Contenu';
    if (category === 'safety') return 'Sécurité';
    return 'Autre';
};

export default function AdminReportsScreen() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [rows, setRows] = useState<AdminReport[]>([]);
    const [searchInput, setSearchInput] = useState('');
    const [searchValue, setSearchValue] = useState('');
    const [statusFilter, setStatusFilter] = useState<AdminReportStatus | 'all'>('all');
    const [categoryFilter, setCategoryFilter] = useState<AdminReportCategory | 'all'>('all');
    const [updateModal, setUpdateModal] = useState<{ report: AdminReport; status: AdminReportStatus } | null>(null);
    const [adminNote, setAdminNote] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getAdminReports({
                search: searchValue,
                status: statusFilter,
                category: categoryFilter,
                periodDays: 180,
            });
            setRows(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [categoryFilter, searchValue, statusFilter]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const sortedRows = useMemo(() => rows, [rows]);

    const openUpdateModal = (report: AdminReport, status: AdminReportStatus) => {
        setAdminNote('');
        setUpdateModal({ report, status });
    };

    const submitUpdateStatus = async () => {
        if (!updateModal || isUpdating) return;
        setIsUpdating(true);
        try {
            await updateAdminReportStatus({
                reportId: updateModal.report.id,
                status: updateModal.status,
                note: adminNote,
            });
            setUpdateModal(null);
            setAdminNote('');
            await loadData();
        } catch (error) {
            console.error(error);
        } finally {
            setIsUpdating(false);
        }
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
                            <Text className="text-2xl font-bold text-gray-900 dark:text-white">Signalements</Text>
                            <Text className="text-gray-500 dark:text-gray-400 text-xs">Modération UGC</Text>
                        </View>
                    </View>

                    <View className="px-4 pt-4">
                        <View className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-white/10 rounded-xl px-3 py-2.5 flex-row items-center">
                            <Search size={16} color="#9CA3AF" />
                            <TextInput
                                value={searchInput}
                                onChangeText={setSearchInput}
                                placeholder="Reporter, cible, email, description"
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
                                    <Text className={statusFilter === status ? 'text-white font-semibold text-xs' : 'text-gray-600 dark:text-gray-300 text-xs'}>
                                        {statusLabel(status)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View className="flex-row gap-2 mt-2 flex-wrap">
                            {CATEGORY_FILTERS.map((category) => (
                                <TouchableOpacity
                                    key={category}
                                    onPress={() => setCategoryFilter(category)}
                                    className={`px-3 py-1.5 rounded-full border ${categoryFilter === category
                                        ? 'bg-[#b39164] border-[#b39164]'
                                        : 'border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800'
                                        }`}
                                >
                                    <Text className={categoryFilter === category ? 'text-white font-semibold text-xs' : 'text-gray-600 dark:text-gray-300 text-xs'}>
                                        {categoryLabel(category)}
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
                            data={sortedRows}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
                            ListEmptyComponent={() => (
                                <View className="items-center py-16">
                                    <Text className="text-gray-500">Aucun signalement trouvé.</Text>
                                </View>
                            )}
                            renderItem={({ item }) => (
                                <View className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-white/10 rounded-2xl p-4 mb-3">
                                    <View className="flex-row justify-between items-start">
                                        <View className="flex-1 pr-3">
                                            <Text className="text-gray-900 dark:text-white font-semibold">
                                                {item.reporterName} {'->'} {item.targetUserName}
                                            </Text>
                                            <Text className="text-gray-500 text-xs mt-1">
                                                {item.reporterEmail} {'->'} {item.targetUserEmail}
                                            </Text>
                                            <Text className="text-gray-400 text-xs mt-1">
                                                Contexte: {item.context === 'chat' ? 'Chat' : 'Profil guide'} | Catégorie: {categoryLabel(item.category)}
                                            </Text>
                                            {item.description ? (
                                                <Text className="text-gray-600 dark:text-gray-300 text-xs mt-2 leading-5">{item.description}</Text>
                                            ) : (
                                                <Text className="text-gray-400 text-xs mt-2 italic">Aucun détail ajouté.</Text>
                                            )}
                                        </View>
                                        <View className="items-end">
                                            <View className="px-2.5 py-1 rounded-full bg-[#b39164]/15 border border-[#b39164]/30">
                                                <Text className="text-[#b39164] text-xs font-semibold">{statusLabel(item.status)}</Text>
                                            </View>
                                            <Text className="text-gray-400 text-[11px] mt-2">{new Date(item.createdAt).toLocaleDateString('fr-FR')}</Text>
                                        </View>
                                    </View>

                                    <View className="flex-row flex-wrap gap-2 mt-3">
                                        <TouchableOpacity
                                            className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20"
                                            onPress={() => openUpdateModal(item, 'in_review')}
                                        >
                                            <Text className="text-amber-500 text-xs font-semibold">Passer en revue</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20"
                                            onPress={() => openUpdateModal(item, 'resolved')}
                                        >
                                            <Text className="text-green-500 text-xs font-semibold">Résoudre</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20"
                                            onPress={() => openUpdateModal(item, 'rejected')}
                                        >
                                            <Text className="text-red-500 text-xs font-semibold">Rejeter</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20"
                                            onPress={() => openUpdateModal(item, 'open')}
                                        >
                                            <Text className="text-blue-500 text-xs font-semibold">Rouvrir</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        />
                    )}
                </SafeAreaView>
            </View>

            <Modal visible={!!updateModal} transparent animationType="fade" onRequestClose={() => setUpdateModal(null)}>
                <View className="flex-1 bg-black/60 justify-center p-6">
                    <View className="bg-white dark:bg-zinc-800 rounded-2xl p-5">
                        <Text className="text-lg font-bold text-gray-900 dark:text-white">Mettre à jour le signalement</Text>
                        <Text className="text-gray-500 text-sm mt-2">
                            Nouveau statut: <Text className="font-semibold">{statusLabel(updateModal?.status || 'open')}</Text>
                        </Text>

                        <TextInput
                            value={adminNote}
                            onChangeText={setAdminNote}
                            multiline
                            className="min-h-[100px] bg-gray-100 dark:bg-zinc-700 rounded-xl p-3 text-gray-900 dark:text-white mt-3"
                            placeholder="Note admin (optionnelle)"
                            placeholderTextColor="#9CA3AF"
                        />

                        <View className="flex-row gap-3 mt-4">
                            <TouchableOpacity
                                className="flex-1 py-3 rounded-xl bg-gray-200 dark:bg-zinc-700 items-center"
                                onPress={() => setUpdateModal(null)}
                                disabled={isUpdating}
                            >
                                <Text className="text-gray-700 dark:text-gray-200 font-semibold">Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="flex-1 py-3 rounded-xl bg-[#b39164] items-center"
                                onPress={submitUpdateStatus}
                                disabled={isUpdating}
                            >
                                <Text className="text-white font-semibold">{isUpdating ? 'Traitement...' : 'Confirmer'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </AdminGuard>
    );
}
