import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Ban, BookOpen, FileText, Mail, Shield } from 'lucide-react-native';
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { directionStyle, endSpacing, flipChevron, rowStyle, textStart } from '@/lib/rtl';
import { useTranslation } from 'react-i18next';
import { StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';

const SUPPORT_EMAIL = 'support@nefsy.app';

export default function LegalIndexScreen() {
    const { t } = useTranslation('content');
    const { isRTL } = useLanguage();
    const router = useRouter();

    const openSupportMail = async () => {
        const url = `mailto:${SUPPORT_EMAIL}`;
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
            await Linking.openURL(url);
        }
    };

    return (
        <View className="flex-1 bg-white dark:bg-zinc-900" style={directionStyle(isRTL)}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="light-content" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-white/5" style={rowStyle(isRTL)}>
                    <TouchableOpacity onPress={() => router.back()} className="mr-3">
                        <ArrowLeft size={24} className="text-gray-900 dark:text-white" style={flipChevron(isRTL)} />
                    </TouchableOpacity>
                    <Text className="text-gray-900 dark:text-white font-bold text-lg" style={[textStart(isRTL), endSpacing(12, isRTL)]}>{t('legal.title')}</Text>
                </View>

                <View className="px-6 pt-6 gap-3">
                    <TouchableOpacity
                        onPress={() => router.push('/legal/eula' as any)}
                        className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-2xl p-4 flex-row items-center"
                        style={rowStyle(isRTL)}
                    >
                        <FileText size={18} color="#b39164" />
                        <View className="flex-1" style={endSpacing(12, isRTL)}>
                            <Text className="text-gray-900 dark:text-white font-semibold" style={textStart(isRTL)}>{t('legal.cgvu')}</Text>
                            <Text className="text-gray-500 text-xs mt-1" style={textStart(isRTL)}>{t('legal.cgvuSubtitle')}</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push('/legal/cancellation' as any)}
                        className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-2xl p-4 flex-row items-center"
                        style={rowStyle(isRTL)}
                    >
                        <Ban size={18} color="#b39164" />
                        <View className="flex-1" style={endSpacing(12, isRTL)}>
                            <Text className="text-gray-900 dark:text-white font-semibold" style={textStart(isRTL)}>{t('legal.cancellation')}</Text>
                            <Text className="text-gray-500 text-xs mt-1" style={textStart(isRTL)}>{t('legal.cancellationSubtitle')}</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push('/legal/privacy' as any)}
                        className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-2xl p-4 flex-row items-center"
                        style={rowStyle(isRTL)}
                    >
                        <Shield size={18} color="#b39164" />
                        <View className="flex-1" style={endSpacing(12, isRTL)}>
                            <Text className="text-gray-900 dark:text-white font-semibold" style={textStart(isRTL)}>{t('legal.privacy')}</Text>
                            <Text className="text-gray-500 text-xs mt-1" style={textStart(isRTL)}>{t('legal.privacySubtitle')}</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push('/legal/charter' as any)}
                        className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-2xl p-4 flex-row items-center"
                        style={rowStyle(isRTL)}
                    >
                        <BookOpen size={18} color="#b39164" />
                        <View className="flex-1" style={endSpacing(12, isRTL)}>
                            <Text className="text-gray-900 dark:text-white font-semibold" style={textStart(isRTL)}>{t('legal.charter')}</Text>
                            <Text className="text-gray-500 text-xs mt-1" style={textStart(isRTL)}>{t('legal.charterSubtitle')}</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={openSupportMail}
                        className="bg-[#b39164] rounded-2xl p-4 flex-row items-center justify-center mt-2"
                        style={rowStyle(isRTL)}
                    >
                        <Mail size={18} color="white" />
                        <Text className="text-white font-semibold ml-2" style={textStart(isRTL)}>{t('legal.contactSupport', { email: SUPPORT_EMAIL })}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}
