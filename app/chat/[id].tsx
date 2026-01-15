import { getCurrentUser, getGuideById, getMessages, sendMessage } from '@/lib/api';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Send } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Platform, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [messages, setMessages] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);

    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        loadData();
        // Simple polling for new messages every 5 seconds
        const interval = setInterval(loadMessages, 5000);
        return () => clearInterval(interval);
    }, [id]);

    const loadData = async () => {
        try {
            const currentUser = await getCurrentUser();
            setCurrentUserId(currentUser?.id || null);

            if (typeof id === 'string') {
                const u = await getGuideById(id);
                setUser(u);
                await loadMessages();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async () => {
        if (typeof id === 'string') {
            const msgs = await getMessages(id);
            // API returns messages ordered by date ASC
            // UI expects newest at bottom. FlatList is NOT inverted in my new code unless I specify.
            // Previous code used inverted list with reversed data.
            // Let's use standard list with data as is (Order ASC -> Oldest at Top, Newest at Bottom).
            // But usually chat scrolls to bottom.
            // I will use `inverted` FlatList and reverse the array if API is ASC.
            // API is ASC. So `[Old, New]`.
            // Reverse: `[New, Old]`. Inverted renders `New` at bottom.
            // Wait, Inverted renders index 0 at bottom.
            // So `[New, Old]` -> `New` at bottom. Correct. 
            setMessages([...msgs].reverse());
        }
    };

    const handleSendMessage = async () => {
        if (inputText.trim() && typeof id === 'string') {
            try {
                const text = inputText.trim();
                setInputText(''); // Optimistic clear
                await sendMessage(id, text);
                await loadMessages();
            } catch (error) {
                console.error("Failed to send", error);
                // Ideally restore text
            }
        }
    };

    if (loading || !user) {
        return (
            <View className="flex-1 bg-white dark:bg-zinc-900 justify-center items-center">
                <ActivityIndicator size="large" color="#b39164" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white dark:bg-zinc-900">
            <StatusBar barStyle="light-content" />
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView className="flex-1" edges={['top']}>

                {/* Header */}
                <View className="flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-zinc-900 z-10">
                    <TouchableOpacity onPress={() => router.back()} className="mr-3">
                        <ArrowLeft size={24} className="text-gray-900 dark:text-white" />
                    </TouchableOpacity>
                    <Image source={user.image} className="w-10 h-10 rounded-full mr-3 bg-gray-200" />
                    <View>
                        <Text className="text-gray-900 dark:text-white font-bold text-base">{user.name}</Text>
                        <Text className="text-green-500 text-xs">En ligne</Text>
                    </View>
                </View>

                {/* Messages List */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    inverted
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: 16 }}
                    renderItem={({ item }) => {
                        const isMe = item.sender_id === currentUserId;
                        return (
                            <View className={`mb-4 max-w-[80%] ${isMe ? 'self-end' : 'self-start'}`}>
                                <View className={`p-4 rounded-2xl ${isMe
                                    ? 'bg-[#b39164] rounded-br-none'
                                    : 'bg-gray-100 dark:bg-zinc-800 rounded-bl-none'
                                    }`}>
                                    <Text className={`text-base ${isMe ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                        {item.content}
                                    </Text>
                                    <Text className={`text-[10px] mt-1 ${isMe ? 'text-white/70' : 'text-gray-500'}`}>
                                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                            </View>
                        );
                    }}
                />

                {/* Input Area */}
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={10}>
                    <View className="px-4 py-3 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-zinc-900 flex-row items-end">
                        <TextInput
                            className="flex-1 bg-gray-100 dark:bg-zinc-800 rounded-2xl px-4 py-3 text-gray-900 dark:text-white min-h-[50px] max-h-[100px]"
                            placeholder="Votre message..."
                            placeholderTextColor="#9CA3AF"
                            multiline
                            value={inputText}
                            onChangeText={setInputText}
                        />
                        <TouchableOpacity
                            onPress={handleSendMessage}
                            className={`ml-3 w-12 h-12 rounded-full items-center justify-center ${inputText.trim() ? 'bg-[#b39164]' : 'bg-gray-200 dark:bg-zinc-700'}`}
                            disabled={!inputText.trim()}
                        >
                            <Send size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>

            </SafeAreaView>
        </View>
    );
}
