import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

export function AdminGuard({ children }: { children: React.ReactNode }) {
    const { profile, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-zinc-900">
                <ActivityIndicator color="#b39164" />
                <Text className="text-gray-500 mt-3">Chargement...</Text>
            </View>
        );
    }

    if (profile?.role !== 'admin') {
        return <Redirect href="/(tabs)" />;
    }

    return <>{children}</>;
}

