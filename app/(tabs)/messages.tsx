import { getConversations, markConversationAsRead } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import { directionStyle, endSpacing, forceLTRText, rowStyle, startSpacing, textStart } from '@/lib/rtl';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Image, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { User } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MessagesScreen() {
    const router = useRouter();
    const { t } = useTranslation('messages');
    const { isRTL } = useLanguage();
    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        React.useCallback(() => {
            loadConversations();
        }, [])
    );

    const loadConversations = async () => {
        // Silent loading if we have data, otherwise full load
        // But for simplicity use simple load
        const data = await getConversations();
        setConversations(data);
        setLoading(false);
    };

    return (
        <View className="flex-1 bg-gray-50 dark:bg-zinc-900" style={directionStyle(isRTL)}>
            <StatusBar barStyle="default" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-6 pb-4 border-b border-gray-200 dark:border-white/5">
                    <Text className="text-3xl font-bold text-gray-900 dark:text-white" style={textStart(isRTL)}>{t('title')}</Text>
                </View>

                {loading && conversations.length === 0 ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator color="#b39164" />
                    </View>
                ) : (
                    <FlatList
                        data={conversations}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ padding: 24 }}
                        ListEmptyComponent={() => (
                            <View className="flex-1 justify-center items-center mt-20">
                                <Text className="text-gray-500 text-center" style={textStart(isRTL)}>{t('empty')}</Text>
                            </View>
                        )}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                className="flex-row items-center mb-6 bg-white dark:bg-zinc-800/50 p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm"
                                style={rowStyle(isRTL)}
                                onPress={async () => {
                                    setConversations((prev) =>
                                        prev.map((conversation) =>
                                            conversation.id === item.id
                                                ? { ...conversation, unread: 0 }
                                                : conversation
                                        )
                                    );

                                    try {
                                        await markConversationAsRead(item.id);
                                    } catch (error) {
                                        console.error('Failed to mark conversation as read:', error);
                                    }

                                    router.push(`/chat/${item.id}`);
                                }}
                            >
                                <View className="relative">
                                    {item.role === 'pilgrim' ? (
                                        <View className="w-14 h-14 rounded-full bg-zinc-700 items-center justify-center">
                                            <User size={26} color="#d4d4d8" />
                                        </View>
                                    ) : (
                                        <Image
                                            source={item.avatar}
                                            className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700"
                                        />
                                    )}
                                    {item.unread > 0 && (
                                        <View className="absolute -top-1 min-w-[18px] h-[18px] px-1 bg-primary rounded-full border border-white dark:border-zinc-900 items-center justify-center" style={isRTL ? { left: -1 } : { right: -1 }}>
                                            <Text className="text-white text-[10px] font-bold">
                                                {item.unread > 99 ? '99+' : item.unread}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                <View className="flex-1" style={{ ...startSpacing(16, isRTL), ...endSpacing(8, isRTL) }}>
                                    <View className="flex-row justify-between mb-1" style={rowStyle(isRTL)}>
                                        <Text className="font-bold text-gray-900 dark:text-white text-lg" style={textStart(isRTL)}>{item.user}</Text>
                                        <Text className="text-gray-500 text-xs" style={forceLTRText()}>{item.time}</Text>
                                    </View>
                                    <Text
                                        numberOfLines={1}
                                        className={`text-sm ${item.unread > 0 ? 'text-gray-900 dark:text-gray-200 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}
                                        style={textStart(isRTL)}
                                    >
                                        {item.isBlocked
                                            ? (item.isBlockedByMe ? t('blockedByMe') : t('blockedForMe'))
                                            : item.message}
                                    </Text>
                                    {item.isBlocked && (
                                        <Text className="text-[11px] text-amber-500 mt-1" style={textStart(isRTL)}>
                                            {item.isBlockedByMe ? t('blockedInfoByMe') : t('blockedInfoForMe')}
                                        </Text>
                                    )}
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                )}
            </SafeAreaView>
        </View>
    );
}
