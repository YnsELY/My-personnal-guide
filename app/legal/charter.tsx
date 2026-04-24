import { CHARTER_TEXTS, GUIDE_CODE_OF_CONDUCT_TEXTS, GUIDE_RELIGIOUS_REGULATION_TEXTS } from '@/constants/charter';
import { useLanguage } from '@/context/LanguageContext';
import { directionStyle, flipChevron, rowStyle, textStart } from '@/lib/rtl';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type CharterType = 'pilgrim' | 'code-of-conduct' | 'religious-regulation';

export default function CharterScreen() {
    const router = useRouter();
    const { t } = useTranslation('legal');
    const { language, isRTL } = useLanguage();
    const { type } = useLocalSearchParams<{ type?: CharterType }>();

    const charterType: CharterType =
        type === 'code-of-conduct' || type === 'religious-regulation' ? type : 'pilgrim';

    const charterLanguage = language === 'ar' ? 'ar' : 'fr';

    const { title, body } = (() => {
        if (charterType === 'code-of-conduct') {
            return {
                title: t('guideCodeOfConductTitle'),
                body: GUIDE_CODE_OF_CONDUCT_TEXTS[charterLanguage],
            };
        }
        if (charterType === 'religious-regulation') {
            return {
                title: t('guideRegulationTitle'),
                body: GUIDE_RELIGIOUS_REGULATION_TEXTS[charterLanguage],
            };
        }
        return {
            title: t('charterTitle'),
            body: CHARTER_TEXTS[charterLanguage],
        };
    })();

    return (
        <View className="flex-1 bg-white dark:bg-zinc-900" style={directionStyle(isRTL)}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="light-content" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-white/5" style={rowStyle(isRTL)}>
                    <TouchableOpacity onPress={() => router.back()} className="mr-3">
                        <ArrowLeft size={24} className="text-gray-900 dark:text-white" style={flipChevron(isRTL)} />
                    </TouchableOpacity>
                    <Text className="text-gray-900 dark:text-white font-bold text-lg" style={textStart(isRTL)}>{title}</Text>
                </View>

                <ScrollView className="flex-1 px-6 py-5" contentContainerStyle={{ paddingBottom: 40 }}>
                    <Text className="text-gray-700 dark:text-gray-300 leading-7" style={textStart(isRTL)}>{body}</Text>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
