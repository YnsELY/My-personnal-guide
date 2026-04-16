import { useLanguage } from '@/context/LanguageContext';
import { directionStyle, flipChevron, rowStyle, textStart } from '@/lib/rtl';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EulaScreen() {
    const router = useRouter();
    const { t } = useTranslation('legal');
    const { isRTL } = useLanguage();

    return (
        <View className="flex-1 bg-white dark:bg-zinc-900" style={directionStyle(isRTL)}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="light-content" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-white/5" style={rowStyle(isRTL)}>
                    <TouchableOpacity onPress={() => router.back()} className="mr-3">
                        <ArrowLeft size={24} className="text-gray-900 dark:text-white" style={flipChevron(isRTL)} />
                    </TouchableOpacity>
                    <Text className="text-gray-900 dark:text-white font-bold text-lg" style={textStart(isRTL)}>{t('eulaTitle')}</Text>
                </View>

                <ScrollView className="flex-1 px-6 py-5" contentContainerStyle={{ paddingBottom: 40 }}>
                    <Text className="text-gray-700 dark:text-gray-300 leading-7" style={textStart(isRTL)}>{t('eulaBody')}</Text>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
