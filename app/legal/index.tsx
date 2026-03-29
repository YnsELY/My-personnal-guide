import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Ban, BookOpen, FileText, Mail, Shield } from 'lucide-react-native';
import React from 'react';
import { StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';

const SUPPORT_EMAIL = 'support@nefsy.app';

export default function LegalIndexScreen() {
    const router = useRouter();

    const openSupportMail = async () => {
        const url = `mailto:${SUPPORT_EMAIL}`;
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
            await Linking.openURL(url);
        }
    };

    return (
        <View className="flex-1 bg-white dark:bg-zinc-900">
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="light-content" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-white/5">
                    <TouchableOpacity onPress={() => router.back()} className="mr-3">
                        <ArrowLeft size={24} className="text-gray-900 dark:text-white" />
                    </TouchableOpacity>
                    <Text className="text-gray-900 dark:text-white font-bold text-lg">Mentions legales</Text>
                </View>

                <View className="px-6 pt-6 gap-3">
                    <TouchableOpacity
                        onPress={() => router.push('/legal/eula' as any)}
                        className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-2xl p-4 flex-row items-center"
                    >
                        <FileText size={18} color="#b39164" />
                        <View className="ml-3 flex-1">
                            <Text className="text-gray-900 dark:text-white font-semibold">CGVU</Text>
                            <Text className="text-gray-500 text-xs mt-1">Conditions generales de vente et d'utilisation</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push('/legal/cancellation' as any)}
                        className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-2xl p-4 flex-row items-center"
                    >
                        <Ban size={18} color="#b39164" />
                        <View className="ml-3 flex-1">
                            <Text className="text-gray-900 dark:text-white font-semibold">Politique d'annulation</Text>
                            <Text className="text-gray-500 text-xs mt-1">Delais, frais et modalites de remboursement</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push('/legal/privacy' as any)}
                        className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-2xl p-4 flex-row items-center"
                    >
                        <Shield size={18} color="#b39164" />
                        <View className="ml-3 flex-1">
                            <Text className="text-gray-900 dark:text-white font-semibold">Politique de confidentialite</Text>
                            <Text className="text-gray-500 text-xs mt-1">Protection des donnees et droits RGPD</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push('/legal/charter' as any)}
                        className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-2xl p-4 flex-row items-center"
                    >
                        <BookOpen size={18} color="#b39164" />
                        <View className="ml-3 flex-1">
                            <Text className="text-gray-900 dark:text-white font-semibold">Charte du pèlerin</Text>
                            <Text className="text-gray-500 text-xs mt-1">Règles, engagements et droits du pèlerin</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={openSupportMail}
                        className="bg-[#b39164] rounded-2xl p-4 flex-row items-center justify-center mt-2"
                    >
                        <Mail size={18} color="white" />
                        <Text className="text-white font-semibold ml-2">Contacter le support : {SUPPORT_EMAIL}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}
