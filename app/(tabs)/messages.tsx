import { MESSAGES } from '@/constants/data';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Image, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MessagesScreen() {
    const router = useRouter();

    return (
        <View className="flex-1 bg-gray-50 dark:bg-zinc-900">
            <StatusBar barStyle="default" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-6 pb-4 border-b border-gray-200 dark:border-white/5">
                    <Text className="text-3xl font-bold text-gray-900 dark:text-white">Messages</Text>
                </View>

                <FlatList
                    data={MESSAGES}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 24 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            className="flex-row items-center mb-6 bg-white dark:bg-zinc-800/50 p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm"
                            onPress={() => router.push(`/chat/${item.id}`)}
                        >
                            <View className="relative">
                                <Image
                                    source={item.avatar}
                                    className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700"
                                />
                                {item.unread > 0 && (
                                    <View className="absolute top-0 right-0 w-4 h-4 bg-primary rounded-full border-2 border-white dark:border-zinc-900" />
                                )}
                            </View>

                            <View className="flex-1 ml-4">
                                <View className="flex-row justify-between mb-1">
                                    <Text className="font-bold text-gray-900 dark:text-white text-lg">{item.user}</Text>
                                    <Text className="text-gray-500 text-xs">{item.time}</Text>
                                </View>
                                <Text
                                    numberOfLines={1}
                                    className={`text-sm ${item.unread > 0 ? 'text-gray-900 dark:text-gray-200 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}
                                >
                                    {item.message}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            </SafeAreaView>
        </View>
    );
}
