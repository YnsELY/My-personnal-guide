import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Headphones, Mail } from 'lucide-react-native';
import React from 'react';
import { Alert, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';

const SUPPORT_EMAIL = 'support@nefsy.app';

export default function SupportScreen() {
    const router = useRouter();

    const openSupportMail = async () => {
        const url = `mailto:${SUPPORT_EMAIL}`;
        const canOpen = await Linking.canOpenURL(url);
        if (!canOpen) {
            Alert.alert('Support', `Contactez-nous à ${SUPPORT_EMAIL}`);
            return;
        }
        await Linking.openURL(url);
    };

    return (
        <View className="flex-1 bg-white dark:bg-zinc-900">
            <StatusBar barStyle="light-content" />
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView className="flex-1" edges={['top']}>

                <View className="flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-zinc-900 z-10">
                    <TouchableOpacity onPress={() => router.back()} className="mr-3">
                        <ArrowLeft size={24} className="text-gray-900 dark:text-white" />
                    </TouchableOpacity>
                    <View className="w-10 h-10 rounded-full bg-primary items-center justify-center mr-3">
                        <Headphones color="white" size={20} />
                    </View>
                    <View>
                        <Text className="text-gray-900 dark:text-white font-bold text-base">Support</Text>
                        <Text className="text-gray-500 text-xs">Assistance client</Text>
                    </View>
                </View>

                <View className="flex-1 px-6 pt-8">
                    <View className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-2xl p-5">
                        <Text className="text-gray-900 dark:text-white text-lg font-bold">Contacter le support</Text>
                        <Text className="text-gray-500 dark:text-gray-300 text-sm mt-2 leading-6">
                            Pour toute demande liée à votre compte, vos réservations ou votre sécurité, contactez-nous directement par email.
                        </Text>

                        <View className="mt-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-700 px-4 py-3">
                            <Text className="text-gray-500 text-xs uppercase tracking-wider">Email SAV</Text>
                            <Text className="text-gray-900 dark:text-white font-semibold mt-1">{SUPPORT_EMAIL}</Text>
                        </View>

                        <TouchableOpacity
                            onPress={openSupportMail}
                            className="mt-5 bg-[#b39164] rounded-xl py-3.5 flex-row items-center justify-center"
                        >
                            <Mail size={18} color="white" />
                            <Text className="text-white font-semibold ml-2">Ouvrir votre messagerie</Text>
                        </TouchableOpacity>
                    </View>
                </View>

            </SafeAreaView>
        </View>
    );
}
