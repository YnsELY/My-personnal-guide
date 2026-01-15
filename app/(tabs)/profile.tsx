import {
    Bell,
    Calendar,
    Camera,
    ChevronRight,
    CircleHelp, LogOut,
    Settings,
    Shield,
    User
} from 'lucide-react-native';
import React from 'react';
import { Image, ScrollView, StatusBar, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
    const { user, profile, signOut, isLoading } = useAuth();
    const router = useRouter();
    const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

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
                            <TouchableOpacity className="bg-white/10 px-5 py-2 rounded-full border border-white/20">
                                <Text className="text-white text-xs font-semibold">Modifier le profil</Text>
                            </TouchableOpacity>
                            {profile?.role === 'guide' && (
                                <TouchableOpacity
                                    onPress={() => router.push('/guide/create-service')}
                                    className="bg-[#b39164] px-5 py-2 rounded-full border border-[#b39164]"
                                >
                                    <Text className="text-white text-xs font-bold">+ Créer un service</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Menu Sections */}
                    <View className="px-5 pb-10">

                        {/* Section: Account */}
                        <Text className="text-gray-500 dark:text-gray-400 font-bold mb-3 mt-4 ml-1">COMPTE</Text>
                        <View className="bg-white dark:bg-zinc-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5">
                            <MenuItem icon={User} label="Informations personnelles" />
                            <Separator />
                            <MenuItem icon={Calendar} label="Mes Réservations" onPress={() => router.push('/my-reservations')} />
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
