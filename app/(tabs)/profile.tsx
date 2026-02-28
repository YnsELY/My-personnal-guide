import {
    Bell,
    Calendar,
    Camera,
    ChevronRight,
    CircleHelp, LogOut,
    LayoutDashboard,
    Settings,
    Shield,
    User
} from 'lucide-react-native';
import React from 'react';
import { Alert, Image, ScrollView, StatusBar, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { getGuideWalletSummary, getPilgrimWalletSummary } from '@/lib/api';
import { useFocusEffect, useRouter } from 'expo-router';

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(value || 0);

export default function ProfileScreen() {
    const { user, profile, signOut, isLoading } = useAuth();
    const router = useRouter();
    const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
    const [walletSummary, setWalletSummary] = React.useState<Awaited<ReturnType<typeof getGuideWalletSummary>> | null>(null);
    const [walletLoading, setWalletLoading] = React.useState(false);
    const [walletError, setWalletError] = React.useState<string | null>(null);
    const [pilgrimWalletSummary, setPilgrimWalletSummary] = React.useState<Awaited<ReturnType<typeof getPilgrimWalletSummary>> | null>(null);
    const [pilgrimWalletLoading, setPilgrimWalletLoading] = React.useState(false);
    const [pilgrimWalletError, setPilgrimWalletError] = React.useState<string | null>(null);

    const loadGuideWalletSummary = React.useCallback(async () => {
        if (profile?.role !== 'guide') {
            setWalletSummary(null);
            setWalletError(null);
            return;
        }

        setWalletLoading(true);
        setWalletError(null);
        try {
            const summary = await getGuideWalletSummary();
            setWalletSummary(summary);
        } catch (error: any) {
            setWalletError(error?.message || "Impossible de charger la cagnotte.");
        } finally {
            setWalletLoading(false);
        }
    }, [profile?.role]);

    const loadPilgrimWalletSummary = React.useCallback(async () => {
        if (profile?.role !== 'pilgrim') {
            setPilgrimWalletSummary(null);
            setPilgrimWalletError(null);
            return;
        }

        setPilgrimWalletLoading(true);
        setPilgrimWalletError(null);
        try {
            const summary = await getPilgrimWalletSummary();
            setPilgrimWalletSummary(summary);
        } catch (error: any) {
            setPilgrimWalletError(error?.message || "Impossible de charger votre cagnotte.");
        } finally {
            setPilgrimWalletLoading(false);
        }
    }, [profile?.role]);

    useFocusEffect(
        React.useCallback(() => {
            loadGuideWalletSummary();
            loadPilgrimWalletSummary();
        }, [loadGuideWalletSummary, loadPilgrimWalletSummary])
    );

    if (isLoading) {
        return <View className="flex-1 bg-gray-50 dark:bg-zinc-900 justify-center items-center"><Text className="text-gray-500">Chargement...</Text></View>;
    }

    if (!user) {
        return (
            <View className="flex-1 bg-gray-50 dark:bg-zinc-900">
                <StatusBar barStyle="light-content" />
                <View className="h-48 bg-zinc-900 relative justify-center items-center">
                    <Text className="text-white text-3xl font-bold font-serif">Guide Omra</Text>
                </View>
                <View className="flex-1 px-6 pt-10 items-center">
                    <Text className="text-xl font-bold text-gray-900 dark:text-white mb-2">Connectez-vous</Text>
                    <Text className="text-gray-500 text-center mb-8">Accédez à votre compte pour gérer vos réservations ou proposer vos services.</Text>

                    <TouchableOpacity onPress={() => router.push('/(auth)/login')} className="bg-[#b39164] w-full py-4 rounded-xl items-center mb-4 shadow-lg shadow-[#b39164]/20">
                        <Text className="text-white font-bold text-lg">Se connecter</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.push('/(auth)/register')} className="bg-white dark:bg-zinc-800 w-full py-4 rounded-xl items-center border border-gray-200 dark:border-white/10">
                        <Text className="text-gray-900 dark:text-white font-bold text-lg">Créer un compte</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50 dark:bg-zinc-900">
            <StatusBar barStyle="light-content" />

            {/* Header Background */}
            <View className="h-48 bg-zinc-900 relative" />

            <SafeAreaView className="flex-1 -mt-48">
                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                    {/* Profile Header */}
                    <View className="items-center mt-4 mb-6">
                        <View className="relative">
                            <Image
                                source={require('@/assets/images/profil.jpeg')}
                                className="w-28 h-28 rounded-full border-4 border-white dark:border-zinc-900"
                            />
                            <TouchableOpacity className="absolute bottom-1 right-1 bg-primary p-2 rounded-full border border-white dark:border-zinc-900">
                                <Camera size={14} color="white" />
                            </TouchableOpacity>
                        </View>
                        <Text className="text-2xl font-bold text-white mt-3 mb-1">{profile?.full_name || 'Utilisateur'}</Text>
                        <Text className="text-gray-300 text-sm">{user.email}</Text>
                        <View className="flex-row gap-2 mt-4">

                            {profile?.role === 'guide' && (
                                <TouchableOpacity
                                    onPress={() => router.push('/guide/create-service')}
                                    className="bg-[#b39164] px-5 py-2 rounded-full border border-[#b39164]"
                                >
                                    <Text className="text-white text-xs font-bold">+ Créer un service</Text>
                                </TouchableOpacity>
                            )}
                            {profile?.role === 'admin' && (
                                <TouchableOpacity
                                    onPress={() => router.push('/(tabs)/admin-dashboard' as any)}
                                    className="bg-blue-500 px-5 py-2 rounded-full border border-blue-500"
                                >
                                    <Text className="text-white text-xs font-bold">Espace Admin</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Menu Sections */}
                    <View className="px-5 pb-10">
                        {profile?.role === 'guide' && (
                            <View className="mb-4 bg-white dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-white/10 p-4">
                                <Text className="text-gray-500 text-xs uppercase tracking-wider">Cagnotte guide</Text>
                                <Text className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                    {formatCurrency(walletSummary?.availableBalance || 0)}
                                </Text>
                                <Text className="text-gray-500 text-xs mt-2">
                                    La cagnotte se crédite à la fin validée de la visite.
                                </Text>

                                {walletLoading && !walletSummary ? (
                                    <View className="mt-4 gap-2">
                                        <View className="h-3 rounded-full bg-gray-200 dark:bg-zinc-700" />
                                        <View className="h-3 rounded-full bg-gray-200 dark:bg-zinc-700 w-4/5" />
                                        <View className="h-3 rounded-full bg-gray-200 dark:bg-zinc-700 w-3/5" />
                                    </View>
                                ) : walletError ? (
                                    <View className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
                                        <Text className="text-red-400 text-xs">{walletError}</Text>
                                        <TouchableOpacity onPress={loadGuideWalletSummary} className="mt-2 self-start">
                                            <Text className="text-red-300 text-xs font-semibold">Réessayer</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View className="mt-4 gap-2">
                                        <WalletRow label="Total généré" value={formatCurrency(walletSummary?.totalGenerated || 0)} />
                                        <WalletRow label="Déjà payé" value={formatCurrency(walletSummary?.paidOut || 0)} />
                                        <WalletRow label="Visites terminées" value={`${walletSummary?.completedVisits || 0}`} />
                                    </View>
                                )}
                            </View>
                        )}
                        {profile?.role === 'pilgrim' && (
                            <View className="mb-4 bg-white dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-white/10 p-4">
                                <Text className="text-gray-500 text-xs uppercase tracking-wider">Cagnotte pèlerin</Text>
                                <Text className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                    {formatCurrency(pilgrimWalletSummary?.availableBalance || 0)}
                                </Text>
                                <Text className="text-gray-500 text-xs mt-2">
                                    Solde d&apos;avoir disponible pour vos prochaines réservations.
                                </Text>

                                {pilgrimWalletLoading && !pilgrimWalletSummary ? (
                                    <View className="mt-4 gap-2">
                                        <View className="h-3 rounded-full bg-gray-200 dark:bg-zinc-700" />
                                        <View className="h-3 rounded-full bg-gray-200 dark:bg-zinc-700 w-4/5" />
                                        <View className="h-3 rounded-full bg-gray-200 dark:bg-zinc-700 w-3/5" />
                                    </View>
                                ) : pilgrimWalletError ? (
                                    <View className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
                                        <Text className="text-red-400 text-xs">{pilgrimWalletError}</Text>
                                        <TouchableOpacity onPress={loadPilgrimWalletSummary} className="mt-2 self-start">
                                            <Text className="text-red-300 text-xs font-semibold">Réessayer</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View className="mt-4 gap-2">
                                        <WalletRow label="Crédits d'annulation" value={`${pilgrimWalletSummary?.cancellationCreditsCount || 0}`} />
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Section: Account */}
                        <Text className="text-gray-500 dark:text-gray-400 font-bold mb-3 mt-4 ml-1">COMPTE</Text>
                        <View className="bg-white dark:bg-zinc-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5">
                            <MenuItem
                                icon={User}
                                label="Modifier mes informations"
                                onPress={() => {
                                    if (profile?.role === 'guide') {
                                        router.push('/guide/complete-profile');
                                    } else {
                                        Alert.alert("Info", "L'édition du profil pèlerin arrive bientôt.");
                                    }
                                }}
                            />
                            <Separator />
                            {profile?.role === 'guide' ? (
                                <MenuItem
                                    icon={Calendar}
                                    label="Mes Services"
                                    onPress={() => router.push('/guide/my-services')}
                                />
                            ) : (
                                <MenuItem
                                    icon={Calendar}
                                    label="Mes Réservations"
                                    onPress={() => router.push('/my-reservations')}
                                />
                            )}
                            <Separator />
                            <MenuItem icon={Bell} label="Notifications"
                                rightElement={
                                    <Switch
                                        trackColor={{ false: "#767577", true: "#b39164" }}
                                        thumbColor={notificationsEnabled ? "#fff" : "#f4f3f4"}
                                        onValueChange={setNotificationsEnabled}
                                        value={notificationsEnabled}
                                    />
                                }
                            />
                            <Separator />
                            <MenuItem icon={Shield} label="Sécurité et confidentialité" />
                            {profile?.role === 'admin' && (
                                <>
                                    <Separator />
                                    <MenuItem
                                        icon={LayoutDashboard}
                                        label="Pilotage Admin"
                                        onPress={() => router.push('/(tabs)/admin-dashboard' as any)}
                                    />
                                </>
                            )}
                        </View>

                        {/* Section: App */}
                        <Text className="text-gray-500 dark:text-gray-400 font-bold mb-3 mt-8 ml-1">APPLICATION</Text>
                        <View className="bg-white dark:bg-zinc-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5">
                            <MenuItem icon={Settings} label="Préférences" />
                            <Separator />
                            <MenuItem icon={CircleHelp} label="Aide et support" />
                        </View>

                        {/* Section: Logout */}
                        <TouchableOpacity
                            onPress={signOut}
                            className="flex-row items-center justify-center bg-red-500/10 dark:bg-red-500/10 mt-8 p-4 rounded-2xl border border-red-500/20"
                        >
                            <LogOut size={20} color="#ef4444" />
                            <Text className="text-red-500 font-bold ml-2">Se déconnecter</Text>
                        </TouchableOpacity>

                        <Text className="text-gray-400 text-xs text-center mt-6">Version 1.0.0</Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

// Components purely for this screen to keep it clean
function MenuItem({ icon: Icon, label, rightElement, onPress }: any) {
    return (
        <TouchableOpacity onPress={onPress} className="flex-row items-center justify-between p-4 active:bg-gray-50 dark:active:bg-zinc-700/50">
            <View className="flex-row items-center">
                <View className="bg-gray-100 dark:bg-zinc-700 p-2 rounded-full mr-3">
                    <Icon size={18} color="white" />
                </View>
                <Text className="text-gray-900 dark:text-white font-medium text-base">{label}</Text>
            </View>
            {rightElement ? rightElement : <ChevronRight size={18} color="white" />}
        </TouchableOpacity>
    );
}

function Separator() {
    return <View className="h-[1px] bg-gray-100 dark:bg-zinc-700/50 mx-4" />;
}

function WalletRow({ label, value }: { label: string; value: string }) {
    return (
        <View className="flex-row items-center justify-between">
            <Text className="text-gray-500 text-xs">{label}</Text>
            <Text className="text-gray-900 dark:text-white text-sm font-semibold">{value}</Text>
        </View>
    );
}
