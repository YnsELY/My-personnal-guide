import { useLanguage } from '@/context/LanguageContext';
import { directionStyle, rowStyle, textStart } from '@/lib/rtl';
import { useRouter } from 'expo-router';
import { MapPin, User } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RoleSelect() {
    const router = useRouter();
    const { t } = useTranslation('auth');
    const { isRTL } = useLanguage();

    const handleRoleSelect = (role: 'pilgrim' | 'guide') => {
        console.log(`Selected role: ${role}`);
        router.replace('/(tabs)');
    };

    return (
        <View className="flex-1 bg-gray-50 dark:bg-zinc-900" style={directionStyle(isRTL)}>
            <StatusBar barStyle="default" />
            <SafeAreaView className="flex-1 items-center justify-center p-6">
                <View className="items-center mb-12">
                    <Text className="text-4xl font-serif font-bold text-primary mb-2" style={textStart(isRTL)}>{t('roleSelectTitle')}</Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-center text-lg" style={textStart(isRTL)}>
                        {t('roleSelectSubtitle')}
                    </Text>
                </View>

                <View className="w-full space-y-4 gap-4">
                    <TouchableOpacity
                        className="bg-white dark:bg-zinc-800 p-6 rounded-2xl border border-gray-200 dark:border-white/5 flex-row items-center shadow-sm"
                        style={rowStyle(isRTL)}
                        onPress={() => handleRoleSelect('pilgrim')}
                    >
                        <View className="bg-primary/10 p-4 rounded-full mr-4">
                            <User size={32} color="#b39164" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-xl font-semibold text-gray-900 dark:text-white" style={textStart(isRTL)}>{t('rolePilgrimTitle')}</Text>
                            <Text className="text-gray-500 dark:text-gray-400" style={textStart(isRTL)}>{t('rolePilgrimSubtitle')}</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="bg-white dark:bg-zinc-800 p-6 rounded-2xl border border-gray-200 dark:border-white/5 flex-row items-center shadow-sm"
                        style={rowStyle(isRTL)}
                        onPress={() => handleRoleSelect('guide')}
                    >
                        <View className="bg-primary/10 p-4 rounded-full mr-4">
                            <MapPin size={32} color="#b39164" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-xl font-semibold text-gray-900 dark:text-white" style={textStart(isRTL)}>{t('roleGuideTitle')}</Text>
                            <Text className="text-gray-500 dark:text-gray-400" style={textStart(isRTL)}>{t('roleGuideSubtitle')}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}
