import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import AdminCancellationGlobalPopup from '@/components/AdminCancellationGlobalPopup';
import GuideCancellationGlobalPopup from '@/components/GuideCancellationGlobalPopup';
import GuideReplacementGlobalPopup from '@/components/GuideReplacementGlobalPopup';
import PilgrimCancellationGlobalPopup from '@/components/PilgrimCancellationGlobalPopup';
import PilgrimReplacementGlobalPopup from '@/components/PilgrimReplacementGlobalPopup';
import PilgrimReviewPromptGlobalPopup from '@/components/PilgrimReviewPromptGlobalPopup';
import { ReservationsProvider } from '@/context/ReservationsContext';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Redirect, Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import 'react-native-reanimated';
import '../global.css';
import '@/lib/i18n';
import { directionStyle, textStart } from '@/lib/rtl';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const { colorScheme, setColorScheme } = useColorScheme();

  React.useLayoutEffect(() => {
    try {
      if (colorScheme !== 'dark') {
        setColorScheme('dark');
      }
    } catch (error) {
      console.warn('Unable to force dark mode:', error);
    }

    void SystemUI.setBackgroundColorAsync('#09090b').catch(() => undefined);
  }, [colorScheme, setColorScheme]);

  const isThemeReady = colorScheme === 'dark';

  return (
    <LanguageProvider>
      <AppShell isThemeReady={isThemeReady} />
    </LanguageProvider>
  );
}

function AppShell({ isThemeReady }: { isThemeReady: boolean }) {
  const { isRTL } = useLanguage();

  return (
    <View style={[styles.shell, directionStyle(isRTL)]}>
      <AuthProvider>
        <ReservationsProvider>
          <ThemeProvider value={DarkTheme}>
            {isThemeReady ? <AppStack /> : <ThemeBootstrapScreen />}
            <GuideCancellationGlobalPopup />
            <GuideReplacementGlobalPopup />
            <PilgrimCancellationGlobalPopup />
            <PilgrimReplacementGlobalPopup />
            <PilgrimReviewPromptGlobalPopup />
            <AdminCancellationGlobalPopup />
            <StatusBar style="light" />
          </ThemeProvider>
        </ReservationsProvider>
      </AuthProvider>
    </View>
  );
}

function ThemeBootstrapScreen() {
  const { isRTL, t } = useLanguage();

  return (
    <View className="flex-1 items-center justify-center bg-zinc-950">
      <ActivityIndicator color="#b39164" />
      <Text className="mt-3 text-zinc-400" style={textStart(isRTL)}>{t('loading')}</Text>
    </View>
  );
}

function AppStack() {
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

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="admin" options={{ headerShown: false }} />
      <Stack.Screen name="guide" options={{ headerShown: false }} />
      <Stack.Screen name="guide/create-service" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="guide/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="date-select" options={{ headerShown: false }} />
      <Stack.Screen name="booking-summary" options={{ headerShown: false }} />
      <Stack.Screen name="payment-status" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
});
