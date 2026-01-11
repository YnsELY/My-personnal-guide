import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Headphones, Send } from 'lucide-react-native';
import React, { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SupportScreen() {
    const router = useRouter();

    const [messages, setMessages] = useState([
        { id: '1', text: 'Bonjour ! Comment pouvons-nous vous aider aujourd\'hui ?', sender: 'support' },
    ]);
    const [inputText, setInputText] = useState('');

    const sendMessage = () => {
        if (inputText.trim()) {
            setMessages(prev => [...prev, { id: Date.now().toString(), text: inputText, sender: 'user' }]);
            setInputText('');
            // Simulate reply
            setTimeout(() => {
                setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: "Un agent va prendre en charge votre demande dans quelques instants.", sender: 'support' }]);
            }, 1500);
        }
    };

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
                    <View className="w-10 h-10 rounded-full bg-primary items-center justify-center mr-3">
                        <Headphones color="white" size={20} />
                    </View>
                    <View>
                        <Text className="text-gray-900 dark:text-white font-bold text-base">Service Client</Text>
                        <Text className="text-green-500 text-xs">En ligne 24/7</Text>
                    </View>
                </View>

                {/* Messages List */}
                <FlatList
                    data={[...messages].reverse()} // Reverse for Chat UI
                    inverted
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: 16 }}
                    renderItem={({ item }) => (
                        <View className={`mb-4 max-w-[80%] ${item.sender === 'user' ? 'self-end' : 'self-start'}`}>
                            <View className={`p-4 rounded-2xl ${item.sender === 'user'
                                    ? 'bg-[#b39164] rounded-br-none'
                                    : 'bg-gray-100 dark:bg-zinc-800 rounded-bl-none'
                                }`}>
                                <Text className={`text-base ${item.sender === 'user' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                    {item.text}
                                </Text>
                            </View>
                        </View>
                    )}
                />

                {/* Input Area */}
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={10}>
                    <View className="px-4 py-3 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-zinc-900 flex-row items-end">
                        <TextInput
                            className="flex-1 bg-gray-100 dark:bg-zinc-800 rounded-2xl px-4 py-3 text-gray-900 dark:text-white min-h-[50px] max-h-[100px]"
                            placeholder="Écrivez votre message..."
                            placeholderTextColor="#9CA3AF"
                            multiline
                            value={inputText}
                            onChangeText={setInputText}
                        />
                        <TouchableOpacity
                            onPress={sendMessage}
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
