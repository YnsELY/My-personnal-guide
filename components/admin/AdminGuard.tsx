import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { textStart } from '@/lib/rtl';
import { Redirect } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, View } from 'react-native';

export function AdminGuard({ children }: { children: React.ReactNode }) {
    const { t } = useTranslation();
    const { isRTL } = useLanguage();
    const { profile, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-zinc-900">
                <ActivityIndicator color="#b39164" />
                <Text className="text-gray-500 mt-3" style={textStart(isRTL)}>{t('loading')}</Text>
            </View>
        );
    }

    if (profile?.role !== 'admin') {
        return <Redirect href="/(tabs)" />;
    }

    return <>{children}</>;
}
