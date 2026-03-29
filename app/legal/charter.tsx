import { CHARTER_TEXT } from '@/constants/charter';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CharterScreen() {
    const router = useRouter();

    return (
        <View className="flex-1 bg-white dark:bg-zinc-900">
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="light-content" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-white/5">
                    <TouchableOpacity onPress={() => router.back()} className="mr-3">
                        <ArrowLeft size={24} className="text-gray-900 dark:text-white" />
                    </TouchableOpacity>
                    <Text className="text-gray-900 dark:text-white font-bold text-lg">Charte du pèlerin</Text>
                </View>

                <ScrollView className="flex-1 px-6 py-5" contentContainerStyle={{ paddingBottom: 40 }}>
                    <Text className="text-gray-700 dark:text-gray-300 leading-7">{CHARTER_TEXT}</Text>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
