import {
    blockUser,
    getBlockState,
    getCurrentUser,
    getGuideById,
    getMessages,
    markConversationAsRead,
    reportUser,
    sendMessage,
    unblockUser,
    type ReportCategory,
} from '@/lib/api';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Flag, Send, ShieldBan, ShieldCheck, User as UserIcon } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const REPORT_CATEGORIES: { value: ReportCategory; label: string }[] = [
    { value: 'harassment', label: 'Harcèlement' },
    { value: 'fraud', label: 'Fraude' },
    { value: 'inappropriate_content', label: 'Contenu inapproprié' },
    { value: 'safety', label: 'Sécurité' },
    { value: 'other', label: 'Autre' },
];

export default function ChatScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [messages, setMessages] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [blockState, setBlockState] = useState({ isBlockedByMe: false, hasBlockedMe: false });
    const [isUpdatingBlock, setIsUpdatingBlock] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportCategory, setReportCategory] = useState<ReportCategory>('other');
    const [reportDescription, setReportDescription] = useState('');
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);

    const flatListRef = useRef<FlatList>(null);

    const isConversationBlocked = blockState.isBlockedByMe || blockState.hasBlockedMe;

    const refreshBlockState = React.useCallback(async () => {
        if (typeof id !== 'string') return;
        try {
            const state = await getBlockState(id);
            setBlockState(state);
        } catch (error) {
            console.error('Failed to refresh block state:', error);
        }
    }, [id]);

    const loadMessages = React.useCallback(async () => {
        if (typeof id === 'string') {
            try {
                await markConversationAsRead(id);
            } catch (error) {
                console.error('Failed to mark conversation as read:', error);
            }

            const msgs = await getMessages(id);
            setMessages([...msgs].reverse());
        }
    }, [id]);

    const loadData = React.useCallback(async () => {
        try {
            const currentUser = await getCurrentUser();
            setCurrentUserId(currentUser?.id || null);

            if (typeof id === 'string') {
                const [u] = await Promise.all([
                    getGuideById(id),
                    refreshBlockState(),
                    loadMessages(),
                ]);
                setUser(u);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [id, loadMessages, refreshBlockState]);

    useEffect(() => {
        loadData();
        const interval = setInterval(() => {
            loadMessages().catch((error) => {
                console.error('Failed to refresh messages:', error);
            });
            refreshBlockState().catch((error) => {
                console.error('Failed to refresh block state:', error);
            });
        }, 5000);
        return () => clearInterval(interval);
    }, [loadData, loadMessages, refreshBlockState]);

    const handleSendMessage = async () => {
        if (!inputText.trim() || typeof id !== 'string') return;
        if (isConversationBlocked) {
            Alert.alert('Conversation bloquée', 'Vous ne pouvez pas envoyer de message tant que le blocage est actif.');
            return;
        }

        try {
            const text = inputText.trim();
            setInputText('');
            await sendMessage(id, text);
            await loadMessages();
        } catch (error: any) {
            console.error('Failed to send', error);
            Alert.alert('Erreur', error?.message || 'Impossible d’envoyer le message.');
        }
    };

    const handleToggleBlock = async () => {
        if (typeof id !== 'string' || isUpdatingBlock) return;

        const shouldBlock = !blockState.isBlockedByMe;
        const title = shouldBlock ? 'Bloquer cet utilisateur' : 'Débloquer cet utilisateur';
        const message = shouldBlock
            ? 'Le blocage coupe la messagerie et empêche les nouvelles réservations entre vous.'
            : 'Le déblocage réactive la messagerie et les nouvelles réservations.';

        Alert.alert(title, message, [
            { text: 'Annuler', style: 'cancel' },
            {
                text: shouldBlock ? 'Bloquer' : 'Débloquer',
                style: shouldBlock ? 'destructive' : 'default',
                onPress: async () => {
                    setIsUpdatingBlock(true);
                    try {
                        if (shouldBlock) {
                            await blockUser(id);
                        } else {
                            await unblockUser(id);
                        }
                        await refreshBlockState();
                    } catch (error: any) {
                        console.error('Failed to toggle block:', error);
                        Alert.alert('Erreur', error?.message || 'Impossible de mettre à jour le blocage.');
                    } finally {
                        setIsUpdatingBlock(false);
                    }
                }
            }
        ]);
    };

    const submitReport = async () => {
        if (typeof id !== 'string' || isSubmittingReport) return;

        setIsSubmittingReport(true);
        try {
            await reportUser({
                targetUserId: id,
                context: 'chat',
                category: reportCategory,
                description: reportDescription.trim() || undefined,
                conversationUserId: id,
            });
            setShowReportModal(false);
            setReportDescription('');
            setReportCategory('other');
            Alert.alert('Signalement envoyé', 'Merci, votre signalement a bien été pris en compte.');
        } catch (error: any) {
            console.error('Failed to report user:', error);
            Alert.alert('Erreur', error?.message || 'Impossible d’envoyer le signalement.');
        } finally {
            setIsSubmittingReport(false);
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

                <View className="flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-zinc-900 z-10">
                    <TouchableOpacity onPress={() => router.back()} className="mr-3">
                        <ArrowLeft size={24} className="text-gray-900 dark:text-white" />
                    </TouchableOpacity>
                    {user.userRole === 'pilgrim' ? (
                        <View className="w-10 h-10 rounded-full mr-3 bg-zinc-700 items-center justify-center">
                            <UserIcon size={20} color="#d4d4d8" />
                        </View>
                    ) : (
                        <Image source={user.image} className="w-10 h-10 rounded-full mr-3 bg-gray-200" />
                    )}
                    <View className="flex-1">
                        <Text className="text-gray-900 dark:text-white font-bold text-base">{user.name}</Text>
                        <Text className="text-green-500 text-xs">En ligne</Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => setShowReportModal(true)}
                        className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 items-center justify-center mr-2"
                    >
                        <Flag size={18} color="#f59e0b" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleToggleBlock}
                        disabled={isUpdatingBlock}
                        className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 items-center justify-center"
                    >
                        {blockState.isBlockedByMe
                            ? <ShieldCheck size={18} color="#22c55e" />
                            : <ShieldBan size={18} color="#ef4444" />}
                    </TouchableOpacity>
                </View>

                {isConversationBlocked && (
                    <View className="mx-4 mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                        <Text className="text-amber-300 text-xs">
                            {blockState.isBlockedByMe
                                ? 'Vous avez bloqué cet utilisateur. Débloquez-le pour reprendre la messagerie.'
                                : 'Cet utilisateur vous a bloqué. Vous ne pouvez pas envoyer de message.'}
                        </Text>
                    </View>
                )}

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
                                        {isMe ? ` - ${item.is_read ? 'Lu' : 'Envoye'}` : ''}
                                    </Text>
                                </View>
                            </View>
                        );
                    }}
                />

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={10}>
                    <View className="px-4 py-3 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-zinc-900 flex-row items-end">
                        <TextInput
                            className="flex-1 bg-gray-100 dark:bg-zinc-800 rounded-2xl px-4 py-3 text-gray-900 dark:text-white min-h-[50px] max-h-[100px]"
                            placeholder={isConversationBlocked ? 'Conversation bloquée' : 'Votre message...'}
                            placeholderTextColor="#9CA3AF"
                            multiline
                            value={inputText}
                            onChangeText={setInputText}
                            editable={!isConversationBlocked}
                        />
                        <TouchableOpacity
                            onPress={handleSendMessage}
                            className={`ml-3 w-12 h-12 rounded-full items-center justify-center ${inputText.trim() && !isConversationBlocked ? 'bg-[#b39164]' : 'bg-gray-200 dark:bg-zinc-700'}`}
                            disabled={!inputText.trim() || isConversationBlocked}
                        >
                            <Send size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>

                <Modal
                    visible={showReportModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowReportModal(false)}
                >
                    <View className="flex-1 bg-black/70 justify-center p-6">
                        <View className="bg-white dark:bg-zinc-800 rounded-2xl p-5">
                            <Text className="text-lg font-bold text-gray-900 dark:text-white">Signaler cet utilisateur</Text>
                            <Text className="text-gray-500 text-xs mt-1 mb-3">Choisissez une catégorie et ajoutez des détails si nécessaire.</Text>

                            <View className="flex-row flex-wrap gap-2 mb-3">
                                {REPORT_CATEGORIES.map((category) => {
                                    const active = reportCategory === category.value;
                                    return (
                                        <TouchableOpacity
                                            key={category.value}
                                            onPress={() => setReportCategory(category.value)}
                                            className={`px-3 py-1.5 rounded-full border ${active
                                                ? 'bg-[#b39164] border-[#b39164]'
                                                : 'bg-gray-100 dark:bg-zinc-700 border-gray-200 dark:border-zinc-600'
                                                }`}
                                        >
                                            <Text className={active ? 'text-white text-xs font-semibold' : 'text-gray-700 dark:text-gray-200 text-xs'}>
                                                {category.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <TextInput
                                value={reportDescription}
                                onChangeText={setReportDescription}
                                multiline
                                placeholder="Détails (optionnel)"
                                placeholderTextColor="#9CA3AF"
                                className="min-h-[90px] rounded-xl bg-gray-100 dark:bg-zinc-700 p-3 text-gray-900 dark:text-white"
                            />

                            <View className="flex-row gap-3 mt-4">
                                <TouchableOpacity
                                    className="flex-1 py-3 rounded-xl bg-gray-200 dark:bg-zinc-700 items-center"
                                    onPress={() => setShowReportModal(false)}
                                    disabled={isSubmittingReport}
                                >
                                    <Text className="text-gray-700 dark:text-gray-100 font-semibold">Annuler</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className="flex-1 py-3 rounded-xl bg-[#b39164] items-center"
                                    onPress={submitReport}
                                    disabled={isSubmittingReport}
                                >
                                    <Text className="text-white font-semibold">{isSubmittingReport ? 'Envoi...' : 'Envoyer'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

            </SafeAreaView>
        </View>
    );
}
