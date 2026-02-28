import { AuthProvider, useAuth } from '@/context/AuthContext';
import GuideCancellationGlobalPopup from '@/components/GuideCancellationGlobalPopup';
import { ReservationsProvider } from '@/context/ReservationsContext';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Redirect, Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import 'react-native-reanimated';
import '../global.css';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const { setColorScheme } = useColorScheme();

  // Seeding can still happen once, but maybe better inside AuthContext or just let it be.
  // For now I'll leave seeding call but remove ensureUser since AuthContext does it.
  React.useEffect(() => {
    // Force dark mode
    setColorScheme('dark');

    // import('@/lib/api').then(({ seedGuides }) => seedGuides().catch(console.error));
  }, [setColorScheme]);

  return (
    <AuthProvider>
      <ReservationsProvider>
        <ThemeProvider value={DarkTheme}>
          <AppStack />
          <GuideCancellationGlobalPopup />
          <StatusBar style="light" />
        </ThemeProvider>
      </ReservationsProvider>
    </AuthProvider>
  );
}

function AppStack() {
  const pathname = usePathname();
  const { user, profile, isLoading, isGuideApproved } = useAuth();
  const effectiveRole = profile?.role || user?.user_metadata?.role;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-900">
        <ActivityIndicator color="#b39164" />
        <Text className="text-zinc-400 mt-3">Chargement...</Text>
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
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}
