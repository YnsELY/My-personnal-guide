import { AdminGuard } from '@/components/admin/AdminGuard';
import { adjustAdminWallet, getAdminWallets, type AdminWalletRoleFilter, type AdminWalletRow } from '@/lib/adminApi';
import { formatEUR } from '@/lib/pricing';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { ArrowLeft, Search, Wallet } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ROLE_FILTERS: AdminWalletRoleFilter[] = ['all', 'guide', 'pilgrim'];

const roleLabel = (role: AdminWalletRoleFilter) => {
    if (role === 'all') return 'Tous';
    if (role === 'guide') return 'Guides';
    return 'Pèlerins';
};

const userRoleBadgeLabel = (role: 'guide' | 'pilgrim') => {
    return role === 'guide' ? 'Guide' : 'Pèlerin';
};

export default function AdminWalletsScreen() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdatingUserId, setIsUpdatingUserId] = useState<string | null>(null);
    const [walletRows, setWalletRows] = useState<AdminWalletRow[]>([]);
    const [searchInput, setSearchInput] = useState('');
    const [searchValue, setSearchValue] = useState('');
    const [roleFilter, setRoleFilter] = useState<AdminWalletRoleFilter>('all');
    const [selectedWallet, setSelectedWallet] = useState<AdminWalletRow | null>(null);
    const [amountInput, setAmountInput] = useState('');
    const [reasonInput, setReasonInput] = useState('');
    const [adjustmentMode, setAdjustmentMode] = useState<'credit' | 'debit'>('credit');

    const loadWallets = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getAdminWallets({
                search: searchValue,
                role: roleFilter,
            });
            setWalletRows(data);
        } catch (error: any) {
            Alert.alert('Erreur', error?.message || 'Impossible de charger les cagnottes.');
        } finally {
            setIsLoading(false);
        }
    }, [searchValue, roleFilter]);

    useFocusEffect(
        useCallback(() => {
            loadWallets();
        }, [loadWallets])
    );

    const subtitleByRole = useMemo(
        () => ({
            all: 'Gestion de toutes les cagnottes',
            guide: 'Cagnottes guides',
            pilgrim: 'Cagnottes pèlerins',
        }),
        []
    );

    const closeAdjustModal = () => {
        if (isUpdatingUserId) return;
        setSelectedWallet(null);
        setAmountInput('');
        setReasonInput('');
        setAdjustmentMode('credit');
    };

    const openAdjustModal = (wallet: AdminWalletRow) => {
        setSelectedWallet(wallet);
        setAmountInput('');
        setReasonInput('');
        setAdjustmentMode('credit');
    };

    const parseAmount = (raw: string) => {
        const normalized = raw.replace(',', '.').trim();
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : NaN;
    };

    const handleAdjustWallet = async () => {
        if (!selectedWallet || isUpdatingUserId) return;

        const amountEur = parseAmount(amountInput);
        if (!Number.isFinite(amountEur) || amountEur <= 0) {
            Alert.alert('Montant invalide', 'Saisissez un montant strictement positif.');
            return;
        }

        const signedAmountEur = adjustmentMode === 'credit' ? amountEur : -amountEur;

        setIsUpdatingUserId(selectedWallet.userId);
        try {
            await adjustAdminWallet({
                userId: selectedWallet.userId,
                role: selectedWallet.role,
                amountEur: signedAmountEur,
                reason: reasonInput.trim() || undefined,
            });
            await loadWallets();
            closeAdjustModal();
            Alert.alert('Succès', 'La cagnotte a été mise à jour.');
        } catch (error: any) {
            Alert.alert('Erreur', error?.message || 'Ajustement impossible pour le moment.');
        } finally {
            setIsUpdatingUserId(null);
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
                            <Text className="text-2xl font-bold text-gray-900 dark:text-white">Cagnottes</Text>
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
                                        {roleLabel(filter)}
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
                            data={walletRows}
                            keyExtractor={(item) => `${item.role}-${item.userId}`}
                            contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
                            ListEmptyComponent={() => (
                                <View className="items-center py-16">
                                    <Text className="text-gray-500">Aucune cagnotte trouvée.</Text>
                                </View>
                            )}
                            renderItem={({ item }) => (
                                <View className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-white/10 rounded-2xl p-4 mb-3">
                                    <View className="flex-row justify-between items-start">
                                        <View className="flex-1 pr-2">
                                            <Text className="text-gray-900 dark:text-white font-semibold text-base">{item.fullName}</Text>
                                            <Text className="text-gray-500 text-xs mt-0.5">{item.email}</Text>
                                        </View>
                                        <View className={`px-2.5 py-1 rounded-full ${item.role === 'guide' ? 'bg-blue-500/10' : 'bg-emerald-500/10'}`}>
                                            <Text className={item.role === 'guide' ? 'text-blue-500 text-xs font-semibold' : 'text-emerald-500 text-xs font-semibold'}>
                                                {userRoleBadgeLabel(item.role)}
                                            </Text>
                                        </View>
                                    </View>

                                    <View className="mt-3 bg-gray-50 dark:bg-zinc-700/40 rounded-xl px-3 py-2">
                                        <Text className="text-gray-500 text-xs">Solde actuel</Text>
                                        <Text className="text-gray-900 dark:text-white text-xl font-bold mt-0.5">
                                            {formatEUR(item.availableBalance)}
                                        </Text>
                                    </View>

                                    {item.role === 'pilgrim' ? (
                                        <View className="mt-3">
                                            <WalletDetailRow label="Total crédité" value={formatEUR(item.pilgrimTotalCredited)} />
                                            <WalletDetailRow label="Total utilisé" value={formatEUR(item.pilgrimTotalDebited)} />
                                        </View>
                                    ) : (
                                        <View className="mt-3">
                                            <WalletDetailRow label="Total généré" value={formatEUR(item.guideTotalGenerated)} />
                                            <WalletDetailRow label="Déjà payé" value={formatEUR(item.guidePaidOut)} />
                                            <WalletDetailRow label="Ajustements admin" value={formatEUR(item.guideAdjustments)} />
                                            <WalletDetailRow label="Visites dues" value={`${item.guidePendingPayoutVisits}`} />
                                        </View>
                                    )}

                                    <TouchableOpacity
                                        className="mt-4 py-2.5 rounded-xl bg-[#b39164] flex-row items-center justify-center"
                                        onPress={() => openAdjustModal(item)}
                                    >
                                        <Wallet size={16} color="#fff" />
                                        <Text className="text-white font-semibold ml-2">Modifier la cagnotte</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        />
                    )}
                </SafeAreaView>

                <Modal
                    visible={!!selectedWallet}
                    transparent
                    animationType="slide"
                    onRequestClose={closeAdjustModal}
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        className="flex-1 justify-end bg-black/50"
                    >
                        <View className="bg-white dark:bg-zinc-900 rounded-t-3xl px-5 pt-5 pb-8 border-t border-gray-200 dark:border-white/10">
                            <Text className="text-gray-900 dark:text-white text-lg font-bold">Modifier la cagnotte</Text>
                            <Text className="text-gray-500 text-xs mt-1">
                                {selectedWallet?.fullName} ({selectedWallet ? userRoleBadgeLabel(selectedWallet.role) : ''})
                            </Text>

                            <View className="mt-4">
                                <Text className="text-gray-500 text-xs mb-1.5">Montant (EUR)</Text>
                                <View className="flex-row gap-2 mb-2">
                                    <TouchableOpacity
                                        className={`px-3 py-1.5 rounded-full border ${adjustmentMode === 'credit'
                                            ? 'bg-emerald-500/15 border-emerald-500/40'
                                            : 'bg-transparent border-gray-300 dark:border-white/10'
                                            }`}
                                        onPress={() => setAdjustmentMode('credit')}
                                    >
                                        <Text className={adjustmentMode === 'credit' ? 'text-emerald-500 font-semibold text-xs' : 'text-gray-500 text-xs'}>
                                            Créditer
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        className={`px-3 py-1.5 rounded-full border ${adjustmentMode === 'debit'
                                            ? 'bg-red-500/15 border-red-500/40'
                                            : 'bg-transparent border-gray-300 dark:border-white/10'
                                            }`}
                                        onPress={() => setAdjustmentMode('debit')}
                                    >
                                        <Text className={adjustmentMode === 'debit' ? 'text-red-500 font-semibold text-xs' : 'text-gray-500 text-xs'}>
                                            Débiter
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <TextInput
                                    value={amountInput}
                                    onChangeText={setAmountInput}
                                    placeholder="Ex: 25"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="decimal-pad"
                                    className="bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-3 text-gray-900 dark:text-white"
                                />
                                <Text className="text-gray-400 text-xs mt-1.5">
                                    {adjustmentMode === 'credit'
                                        ? 'Le montant sera ajouté à la cagnotte.'
                                        : 'Le montant sera retiré de la cagnotte.'}
                                </Text>
                            </View>

                            <View className="mt-4">
                                <Text className="text-gray-500 text-xs mb-1.5">Raison (optionnel)</Text>
                                <TextInput
                                    value={reasonInput}
                                    onChangeText={setReasonInput}
                                    placeholder="Ex: correction manuelle"
                                    placeholderTextColor="#9CA3AF"
                                    className="bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-3 text-gray-900 dark:text-white"
                                />
                            </View>

                            <View className="flex-row gap-3 mt-6">
                                <TouchableOpacity
                                    className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-white/10 items-center"
                                    onPress={closeAdjustModal}
                                    disabled={!!isUpdatingUserId}
                                >
                                    <Text className="text-gray-600 dark:text-gray-300 font-semibold">Annuler</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className="flex-1 py-3 rounded-xl bg-[#b39164] items-center"
                                    onPress={handleAdjustWallet}
                                    disabled={!!isUpdatingUserId}
                                >
                                    <Text className="text-white font-semibold">
                                        {isUpdatingUserId ? 'Mise à jour...' : 'Valider'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>
            </View>
        </AdminGuard>
    );
}

function WalletDetailRow({ label, value }: { label: string; value: string }) {
    return (
        <View className="flex-row items-center justify-between mt-1">
            <Text className="text-gray-500 text-xs">{label}</Text>
            <Text className="text-gray-300 text-xs font-semibold">{value}</Text>
        </View>
    );
}
