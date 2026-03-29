import { useAuth } from '@/context/AuthContext';
import { CustomTabBar } from '@/components/CustomTabBar';
import { supabase } from '@/lib/supabase';
import { Redirect, Tabs, usePathname, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Text, View, useColorScheme } from 'react-native';

export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();
  // Use React Native's hook to detect theme
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user, profile, isLoading, isGuideApproved } = useAuth();
  const effectiveRole = profile?.role || user?.user_metadata?.role;
  const [unreadCount, setUnreadCount] = React.useState(0);

  const loadUnreadCount = React.useCallback(async () => {
    if (!user?.id || profile?.role === 'admin') {
      setUnreadCount(0);
      return;
    }

    const { count, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .or('is_read.eq.false,is_read.is.null');

    if (error) {
      console.error('Failed to load unread messages count:', error);
      return;
    }

    setUnreadCount(count || 0);
  }, [user?.id, profile?.role]);

  React.useEffect(() => {
    loadUnreadCount();
  }, [loadUnreadCount]);

  React.useEffect(() => {
    if (!user?.id || profile?.role === 'admin') return;
    loadUnreadCount();
  }, [pathname, user?.id, profile?.role, loadUnreadCount]);

  React.useEffect(() => {
    if (!user?.id || profile?.role === 'admin') return;

    const channel = supabase
      .channel(`messages-unread-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          loadUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, profile?.role, loadUnreadCount]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-900">
        <ActivityIndicator color="#b39164" />
        <Text className="text-zinc-400 mt-3">Chargement...</Text>
      </View>
    );
  }

  if (effectiveRole === 'guide' && !isGuideApproved) {
    return <Redirect href="/guide/pending-approval" />;
  }

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} unreadCount={unreadCount} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen name="index" options={{ title: 'Accueil' }} />
      <Tabs.Screen
        name="search"
        options={{ title: 'Explorer' }}
        listeners={() => ({
          tabPress: (e) => {
            e.preventDefault();
            router.push('/date-select');
          },
        })}
      />
      <Tabs.Screen name="messages" options={{ title: 'Messages' }} />
      <Tabs.Screen name="guide-dashboard" options={{ title: 'Gestion' }} />
      <Tabs.Screen name="admin-dashboard" options={{ title: 'Admin' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
    </Tabs>
  );
}
