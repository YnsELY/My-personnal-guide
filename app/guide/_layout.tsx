import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { textStart } from '@/lib/rtl';
import { Redirect, Stack, usePathname } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, View } from 'react-native';

export default function GuideLayout() {
    const pathname = usePathname();
    const { t } = useTranslation();
    const { isRTL } = useLanguage();
    const { user, profile, isLoading, isGuideApproved } = useAuth();
    const effectiveRole = profile?.role || user?.user_metadata?.role;

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-zinc-900">
                <ActivityIndicator color="#b39164" />
                <Text className="text-zinc-400 mt-3" style={textStart(isRTL)}>{t('loading')}</Text>
            </View>
        );
    }

    if (effectiveRole === 'guide' && !isGuideApproved) {
        const canAccessRoute =
            pathname === '/guide/pending-approval' ||
            pathname === '/guide/complete-profile' ||
            pathname === '/guide/interviews';
        if (!canAccessRoute) {
            return <Redirect href="/guide/pending-approval" />;
        }
    }

    return <Stack screenOptions={{ headerShown: false }} />;
}
