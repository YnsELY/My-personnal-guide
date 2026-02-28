import { AdminGuard } from '@/components/admin/AdminGuard';
import { getAdminAccounts, updateAdminAccountStatus } from '@/lib/adminApi';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { ArrowLeft, Search, ShieldAlert, ShieldCheck } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ROLE_FILTERS: ('all' | 'guide' | 'pilgrim' | 'admin')[] = ['all', 'guide', 'pilgrim', 'admin'];

const roleLabel = (role: string) => {
    if (role === 'guide') return 'Guide';
    if (role === 'pilgrim') return 'Pèlerin';
    if (role === 'admin') return 'Admin';
    return role;
};

export default function AdminAccountsScreen() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [searchInput, setSearchInput] = useState('');
    const [searchValue, setSearchValue] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'guide' | 'pilgrim' | 'admin'>('all');

    const loadAccounts = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getAdminAccounts({ search: searchValue, role: roleFilter });
            setAccounts(data);
        } catch (error) {
            console.error(error);
            Alert.alert("Erreur", "Impossible de charger les comptes.");
        } finally {
            setIsLoading(false);
        }
    }, [searchValue, roleFilter]);

    useFocusEffect(
        useCallback(() => {
            loadAccounts();
        }, [loadAccounts])
    );

    const handleToggleStatus = async (account: any) => {
        const nextStatus = account.accountStatus === 'suspended' ? 'active' : 'suspended';
        const actionLabel = nextStatus === 'suspended' ? 'suspendre' : 'réactiver';
        if (account.role === 'admin' && nextStatus === 'suspended') {
            Alert.alert("Action refusée", "La suspension d'un admin est bloquée depuis cette interface.");
            return;
        }

        Alert.alert(
            "Confirmation",
            `Voulez-vous ${actionLabel} ce compte ?`,
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Confirmer",
                    style: nextStatus === 'suspended' ? "destructive" : "default",
                    onPress: async () => {
                        setIsUpdatingId(account.id);
                        try {
                            await updateAdminAccountStatus(account.id, nextStatus);
                            setAccounts((prev) => prev.map((row) => (row.id === account.id ? { ...row, accountStatus: nextStatus } : row)));
                        } catch (error: any) {
                            Alert.alert("Erreur", error?.message || "Mise à jour impossible.");
                        } finally {
                            setIsUpdatingId(null);
                        }
                    },
                },
            ]
        );
    };

    const subtitleByRole = useMemo(
        () => ({
            all: 'Tous les comptes',
            guide: 'Comptes guides',
            pilgrim: 'Comptes pèlerins',
            admin: 'Comptes administrateurs',
        }),
        []
    );

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
                            <Text className="text-2xl font-bold text-gray-900 dark:text-white">Comptes</Text>
                            <Text className="text-gray-500 dark:text-gray-400 text-xs">{subtitleByRole[roleFilter]}</Text>
                        </View>
                    </View>

                    <View className="px-4 pt-4">
                        <View className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-white/10 rounded-xl px-3 py-2.5 flex-row items-center">
                            <Search size={16} color="#9CA3AF" />
                            <TextInput
                                value={searchInput}
                                onChangeText={setSearchInput}
                                placeholder="Nom ou email"
                                placeholderTextColor="#9CA3AF"
                                className="flex-1 ml-2 text-gray-900 dark:text-white"
                                onSubmitEditing={() => setSearchValue(searchInput.trim())}
                            />
                            <TouchableOpacity onPress={() => setSearchValue(searchInput.trim())}>
                                <Text className="text-[#b39164] font-semibold">Rechercher</Text>
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row gap-2 mt-3">
                            {ROLE_FILTERS.map((filter) => (
                                <TouchableOpacity
                                    key={filter}
                                    onPress={() => setRoleFilter(filter)}
                                    className={`px-3 py-1.5 rounded-full border ${roleFilter === filter
                                        ? 'bg-[#b39164] border-[#b39164]'
                                        : 'border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800'
                                        }`}
                                >
                                    <Text className={roleFilter === filter ? 'text-white font-semibold' : 'text-gray-600 dark:text-gray-300'}>
                                        {filter === 'all' ? 'Tous' : roleLabel(filter)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {isLoading ? (
                        <View className="flex-1 justify-center items-center">
                            <ActivityIndicator color="#b39164" />
                        </View>
                    ) : (
                        <FlatList
                            data={accounts}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
                            ListEmptyComponent={() => (
                                <View className="items-center py-16">
                                    <Text className="text-gray-500">Aucun compte trouvé.</Text>
                                </View>
                            )}
                            renderItem={({ item }) => (
                                <View className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-white/10 rounded-2xl p-4 mb-3">
                                    <View className="flex-row justify-between items-start">
                                        <View className="flex-1 pr-2">
                                            <Text className="text-gray-900 dark:text-white font-semibold text-base">{item.fullName}</Text>
                                            <Text className="text-gray-500 text-xs mt-0.5">{item.email}</Text>
                                            <Text className="text-gray-400 text-xs mt-2">
                                                {roleLabel(item.role)}{item.role === 'guide' && item.guideStatus ? ` • ${item.guideStatus}` : ''}
                                            </Text>
                                        </View>
                                        <View className={`px-2.5 py-1 rounded-full ${item.accountStatus === 'suspended' ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                                            <Text className={item.accountStatus === 'suspended' ? 'text-red-500 text-xs font-semibold' : 'text-green-500 text-xs font-semibold'}>
                                                {item.accountStatus === 'suspended' ? 'Suspendu' : 'Actif'}
                                            </Text>
                                        </View>
                                    </View>

                                    {item.role === 'guide' && (
                                        <View className="mt-2">
                                            <Text className="text-gray-500 text-xs">Spécialité: {item.specialty || 'N/A'}</Text>
                                            <Text className="text-gray-500 text-xs mt-0.5">Ville: {item.location || 'N/A'}</Text>
                                        </View>
                                    )}

                                    <TouchableOpacity
                                        className={`mt-4 py-2.5 rounded-xl flex-row items-center justify-center ${item.accountStatus === 'suspended'
                                            ? 'bg-green-500/10 border border-green-500/20'
                                            : 'bg-red-500/10 border border-red-500/20'
                                            }`}
                                        onPress={() => handleToggleStatus(item)}
                                        disabled={isUpdatingId === item.id}
                                    >
                                        {item.accountStatus === 'suspended' ? (
                                            <ShieldCheck size={16} color="#22c55e" />
                                        ) : (
                                            <ShieldAlert size={16} color="#ef4444" />
                                        )}
                                        <Text className={`ml-2 font-semibold ${item.accountStatus === 'suspended' ? 'text-green-500' : 'text-red-500'}`}>
                                            {isUpdatingId === item.id
                                                ? 'Mise à jour...'
                                                : item.accountStatus === 'suspended'
                                                    ? 'Réactiver'
                                                    : 'Suspendre'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        />
                    )}
                </SafeAreaView>
            </View>
        </AdminGuard>
    );
}
