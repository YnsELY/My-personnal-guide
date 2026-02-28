import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Redirect, Tabs, usePathname, useRouter } from 'expo-router';
import { Briefcase, Home, LayoutDashboard, MessageCircle, Search, User } from 'lucide-react-native';
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
      screenOptions={{
        tabBarActiveTintColor: '#b39164', // Darker Gold
        tabBarInactiveTintColor: isDark ? '#9CA3AF' : '#6B7280',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#121212' : '#ffffff',
          borderTopColor: isDark ? '#27272a' : '#f3f4f6', // zinc-800 vs gray-100
          borderTopWidth: 1,
          elevation: 0,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          href: profile?.role === 'admin' ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Explorer',
          tabBarIcon: ({ color }) => <Search size={24} color={color} />,
          href: profile?.role === 'guide' || profile?.role === 'admin' ? null : undefined,
        }}
        listeners={() => ({
          tabPress: (e) => {
            e.preventDefault();
            router.push('/date-select');
          },
        })}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => (
            <View className="relative">
              <MessageCircle size={24} color={color} />
              {unreadCount > 0 && (
                <View className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-500 border border-white dark:border-zinc-900 items-center justify-center">
                  <Text className="text-white text-[10px] font-bold">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
          href: profile?.role === 'admin' ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="guide-dashboard"
        options={{
          title: 'Gestion',
          tabBarIcon: ({ color }) => <Briefcase size={24} color={color} />,
          href: profile?.role === 'guide' ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="admin-dashboard"
        options={{
          title: 'Admin',
          tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} />,
          href: profile?.role === 'admin' ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
