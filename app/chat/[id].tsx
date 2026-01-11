import { MESSAGES } from '@/constants/data';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Paperclip, Phone, Send, Video } from 'lucide-react-native';
import React, { useState } from 'react';
import { FlatList, Image, KeyboardAvoidingView, Platform, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const conversation = MESSAGES.find(m => m.id === id) || MESSAGES[0];

    const [messages, setMessages] = useState([
        { id: '1', text: conversation.message, sender: 'them', time: conversation.time },
        { id: '2', text: "Bienvenue ! Comment puis-je vous aider pour votre Omra ?", sender: 'me', time: '10:35 AM' },
    ]);
    const [inputText, setInputText] = useState('');

    const sendMessage = () => {
        if (inputText.trim()) {
            setMessages([...messages, { id: Date.now().toString(), text: inputText, sender: 'me', time: 'Now' }]);
            setInputText('');
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-zinc-900" edges={['top']}>
            <StatusBar barStyle="default" />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Chat Header */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-white/5 bg-white dark:bg-zinc-900">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => router.back()} className="mr-3">
                        <ArrowLeft size={24} className="text-gray-900 dark:text-white" />
                    </TouchableOpacity>
                    <Image source={conversation.avatar} className="w-10 h-10 rounded-full bg-gray-200" />
                    <View className="ml-3">
                        <Text className="font-bold text-gray-900 dark:text-white">{conversation.user}</Text>
                        <Text className="text-xs text-green-500">En ligne</Text>
                    </View>
                </View>
                <View className="flex-row gap-4">
                    <TouchableOpacity>
                        <Phone size={24} className="text-gray-900 dark:text-white" />
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Video size={24} className="text-gray-900 dark:text-white" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Messages List */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <FlatList
                    data={messages}
                    keyExtractor={item => item.id}
                    className="flex-1 px-4 py-4"
                    contentContainerStyle={{ gap: 16, paddingBottom: 20 }}
                    renderItem={({ item }) => (
                        <View className={`max-w-[80%] rounded-2xl p-4 ${item.sender === 'me'
                            ? 'bg-primary self-end rounded-tr-none'
                            : 'bg-white dark:bg-zinc-800 self-start rounded-tl-none border border-gray-100 dark:border-white/5'
                            }`}>
                            <Text className={`${item.sender === 'me' ? 'text-white' : 'text-gray-900 dark:text-white'
                                }`}>
                                {item.text}
                            </Text>
                            <Text className={`text-[10px] mt-1 text-right ${item.sender === 'me' ? 'text-white/70' : 'text-gray-400'
                                }`}>
                                {item.time}
                            </Text>
                        </View>
                    )}
                />

                {/* Input Area */}
                <View className="p-4 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-white/5">
                    <View className="flex-row items-end gap-2">
                        <View className="flex-1 flex-row items-center bg-gray-100 dark:bg-zinc-800 rounded-2xl px-3 py-2 border border-transparent focus:border-primary/50">
                            <TouchableOpacity className="p-2 mr-1">
                                <Paperclip size={18} className="text-gray-500 dark:text-gray-400" />
                            </TouchableOpacity>

                            <TextInput
                                className="flex-1 text-gray-900 dark:text-white min-h-[40px] max-h-[100px] pt-[10px] pb-[10px]"
                                placeholder="Écrivez votre message..."
                                placeholderTextColor="#9CA3AF"
                                value={inputText}
                                onChangeText={setInputText}
                                multiline
                                textAlignVertical="center"
                            />
                        </View>

                        <TouchableOpacity
                            onPress={sendMessage}
                            className="bg-primary p-3 rounded-full shadow-md shadow-primary/30 mb-0.5"
                        >
                            <Send size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
