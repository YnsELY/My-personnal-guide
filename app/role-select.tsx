import { useRouter } from 'expo-router';
import { MapPin, User } from 'lucide-react-native';
import React from 'react';
import { StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RoleSelect() {
    const router = useRouter();

    const handleRoleSelect = (role: 'pilgrim' | 'guide') => {
        console.log(`Selected role: ${role}`);
        router.replace('/(tabs)');
    };

    return (
        <View className="flex-1 bg-gray-50 dark:bg-zinc-900">
            <StatusBar barStyle="default" />
            <SafeAreaView className="flex-1 items-center justify-center p-6">
                <View className="items-center mb-12">
                    <Text className="text-4xl font-serif font-bold text-primary mb-2">Guide Omra</Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-center text-lg">
                        Votre compagnon spirituel pour la Omra
                    </Text>
                </View>

                <View className="w-full space-y-4 gap-4">
                    <TouchableOpacity
                        className="bg-white dark:bg-zinc-800 p-6 rounded-2xl border border-gray-200 dark:border-white/5 flex-row items-center shadow-sm"
                        onPress={() => handleRoleSelect('pilgrim')}
                    >
                        <View className="bg-primary/10 p-4 rounded-full mr-4">
                            <User size={32} color="#b39164" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-xl font-semibold text-gray-900 dark:text-white">Je suis un Pèlerin</Text>
                            <Text className="text-gray-500 dark:text-gray-400">Je cherche un guide</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="bg-white dark:bg-zinc-800 p-6 rounded-2xl border border-gray-200 dark:border-white/5 flex-row items-center shadow-sm"
                        onPress={() => handleRoleSelect('guide')}
                    >
                        <View className="bg-primary/10 p-4 rounded-full mr-4">
                            <MapPin size={32} color="#b39164" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-xl font-semibold text-gray-900 dark:text-white">Je suis un Guide</Text>
                            <Text className="text-gray-500 dark:text-gray-400">Je propose mes services</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}
