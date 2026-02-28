import { AdminGuard } from '@/components/admin/AdminGuard';
import { getAdminServices, updateAdminServiceStatus } from '@/lib/adminApi';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { ArrowLeft, Eye, EyeOff, Search } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ServiceFilter = 'all' | 'active' | 'hidden' | 'archived';
const STATUS_FILTERS: ServiceFilter[] = ['all', 'active', 'hidden', 'archived'];

const statusLabel = (status: string) => {
    if (status === 'active') return 'Actif';
    if (status === 'hidden') return 'Masqué';
    if (status === 'archived') return 'Archivé';
    return status;
};

const formatPrice = (price: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(price || 0);

export default function AdminServicesScreen() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
    const [services, setServices] = useState<any[]>([]);
    const [searchInput, setSearchInput] = useState('');
    const [searchValue, setSearchValue] = useState('');
    const [statusFilter, setStatusFilter] = useState<ServiceFilter>('all');

    const loadServices = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getAdminServices({ search: searchValue, status: statusFilter });
            setServices(data);
        } catch (error) {
            console.error(error);
            Alert.alert("Erreur", "Impossible de charger les services.");
        } finally {
            setIsLoading(false);
        }
    }, [searchValue, statusFilter]);

    useFocusEffect(
        useCallback(() => {
            loadServices();
        }, [loadServices])
    );

    const handleStatusChange = async (service: any, nextStatus: 'active' | 'hidden' | 'archived') => {
        setIsUpdatingId(service.id);
        try {
            await updateAdminServiceStatus(service.id, nextStatus);
            setServices((prev) => prev.map((row) => (row.id === service.id ? { ...row, status: nextStatus } : row)));
        } catch (error: any) {
            Alert.alert("Erreur", error?.message || "Mise à jour impossible.");
        } finally {
            setIsUpdatingId(null);
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
                            <Text className="text-2xl font-bold text-gray-900 dark:text-white">Services</Text>
                            <Text className="text-gray-500 dark:text-gray-400 text-xs">Catalogue et modération</Text>
                        </View>
                    </View>

                    <View className="px-4 pt-4">
                        <View className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-white/10 rounded-xl px-3 py-2.5 flex-row items-center">
                            <Search size={16} color="#9CA3AF" />
                            <TextInput
                                value={searchInput}
                                onChangeText={setSearchInput}
                                placeholder="Titre, catégorie, ville"
                                placeholderTextColor="#9CA3AF"
                                className="flex-1 ml-2 text-gray-900 dark:text-white"
                                onSubmitEditing={() => setSearchValue(searchInput.trim())}
                            />
                            <TouchableOpacity onPress={() => setSearchValue(searchInput.trim())}>
                                <Text className="text-[#b39164] font-semibold">OK</Text>
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row gap-2 mt-3">
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
                            data={services}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
                            ListEmptyComponent={() => (
                                <View className="items-center py-16">
                                    <Text className="text-gray-500">Aucun service trouvé.</Text>
                                </View>
                            )}
                            renderItem={({ item }) => (
                                <View className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-white/10 rounded-2xl p-4 mb-3">
                                    <View className="flex-row justify-between items-start">
                                        <View className="flex-1 pr-2">
                                            <Text className="text-gray-900 dark:text-white font-semibold">{item.title}</Text>
                                            <Text className="text-gray-500 text-xs mt-1">{item.category} • {item.location}</Text>
                                            <Text className="text-gray-400 text-xs mt-1">Guide: {item.guideName}</Text>
                                        </View>
                                        <View className={`px-2.5 py-1 rounded-full ${item.status === 'active'
                                            ? 'bg-green-500/10'
                                            : item.status === 'hidden'
                                                ? 'bg-amber-500/10'
                                                : 'bg-gray-500/15'
                                            }`}>
                                            <Text className={`text-xs font-semibold ${item.status === 'active'
                                                ? 'text-green-500'
                                                : item.status === 'hidden'
                                                    ? 'text-amber-500'
                                                    : 'text-gray-500'
                                                }`}>
                                                {statusLabel(item.status)}
                                            </Text>
                                        </View>
                                    </View>

                                    <View className="flex-row justify-between items-center mt-3">
                                        <Text className="text-[#b39164] font-semibold">{formatPrice(item.price)}</Text>
                                        <Text className="text-gray-400 text-xs">
                                            Guide {item.guideOnboardingStatus || 'pending_review'}
                                        </Text>
                                    </View>

                                    <View className="flex-row gap-2 mt-4">
                                        {item.status !== 'active' && (
                                            <TouchableOpacity
                                                className="flex-1 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 items-center"
                                                onPress={() => handleStatusChange(item, 'active')}
                                                disabled={isUpdatingId === item.id}
                                            >
                                                <Text className="text-green-500 font-semibold text-sm">Activer</Text>
                                            </TouchableOpacity>
                                        )}
                                        {item.status !== 'hidden' && (
                                            <TouchableOpacity
                                                className="flex-1 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 items-center flex-row justify-center"
                                                onPress={() => handleStatusChange(item, 'hidden')}
                                                disabled={isUpdatingId === item.id}
                                            >
                                                <EyeOff size={14} color="#f59e0b" />
                                                <Text className="text-amber-500 font-semibold text-sm ml-1">Masquer</Text>
                                            </TouchableOpacity>
                                        )}
                                        {item.status !== 'archived' && (
                                            <TouchableOpacity
                                                className="flex-1 py-2.5 rounded-xl bg-gray-500/10 border border-gray-500/20 items-center"
                                                onPress={() => handleStatusChange(item, 'archived')}
                                                disabled={isUpdatingId === item.id}
                                            >
                                                <Text className="text-gray-500 font-semibold text-sm">Archiver</Text>
                                            </TouchableOpacity>
                                        )}
                                        {item.status === 'active' && (
                                            <View className="flex-1 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 items-center flex-row justify-center">
                                                <Eye size={14} color="#22c55e" />
                                                <Text className="text-green-500 font-semibold text-sm ml-1">Visible</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            )}
                        />
                    )}
                </SafeAreaView>
            </View>
        </AdminGuard>
    );
}

