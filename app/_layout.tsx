import { AuthProvider } from '@/context/AuthContext';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import React from 'react';
import 'react-native-reanimated';
import '../global.css';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const { colorScheme, setColorScheme } = useColorScheme();

  // Seeding can still happen once, but maybe better inside AuthContext or just let it be.
  // For now I'll leave seeding call but remove ensureUser since AuthContext does it.
  React.useEffect(() => {
    // Force dark mode
    setColorScheme('dark');

    import('@/lib/api').then(({ seedGuides }) => seedGuides().catch(console.error));
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider value={DarkTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="guide/create-service" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="guide/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="date-select" options={{ headerShown: false }} />
          <Stack.Screen name="booking-summary" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </AuthProvider>
  );
}
