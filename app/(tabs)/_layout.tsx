import { useAuth } from '@/context/AuthContext';
import { Tabs, useRouter } from 'expo-router';
import { Briefcase, Home, MessageCircle, Search, User } from 'lucide-react-native';
import React from 'react';
import { useColorScheme } from 'react-native';

export default function TabLayout() {
  const router = useRouter();
  // Use React Native's hook to detect theme
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { profile } = useAuth();

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
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Explorer',
          tabBarIcon: ({ color }) => <Search size={24} color={color} />,
          href: profile?.role === 'guide' ? null : undefined,
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
          tabBarIcon: ({ color }) => <MessageCircle size={24} color={color} />,
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
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
