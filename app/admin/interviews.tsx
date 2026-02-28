import { AdminGuard } from '@/components/admin/AdminGuard';
import CalendarPicker from '@/components/CalendarPicker';
import {
    acceptGuideInterviewProposalAsAdmin,
    counterProposeGuideInterviewAsAdmin,
    getAdminGuideInterviews,
} from '@/lib/adminApi';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { ArrowLeft, CalendarClock, CheckCircle2, MessageCircle, Search } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type InterviewFilter = 'all' | 'pending_guide' | 'pending_admin' | 'accepted';

const FILTERS: InterviewFilter[] = ['all', 'pending_guide', 'pending_admin', 'accepted'];

const statusLabel = (status: string) => {
    if (status === 'pending_guide') return 'En attente guide';
    if (status === 'pending_admin') return 'Contre-proposition guide';
    if (status === 'accepted') return 'Validé';
    if (status === 'cancelled') return 'Annulé';
    return status;
};

export default function AdminInterviewsScreen() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [rows, setRows] = useState<any[]>([]);
    const [searchInput, setSearchInput] = useState('');
    const [searchValue, setSearchValue] = useState('');
    const [filter, setFilter] = useState<InterviewFilter>('all');

    const [editingInterview, setEditingInterview] = useState<any | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCalendarPicker, setShowCalendarPicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState<number | null>(null);
    const [timeInput, setTimeInput] = useState('14:00');
    const [whatsappContact, setWhatsappContact] = useState('');
    const [adminNote, setAdminNote] = useState('');

    const loadRows = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getAdminGuideInterviews(filter);
            setRows(data);
        } catch (error: any) {
            Alert.alert("Erreur", error?.message || "Impossible de charger les entretiens.");
        } finally {
            setIsLoading(false);
        }
    }, [filter]);

    useFocusEffect(
        useCallback(() => {
            loadRows();
        }, [loadRows])
    );

    const filteredRows = useMemo(() => {
        if (!searchValue.trim()) return rows;
        const search = searchValue.trim().toLowerCase();
        return rows.filter((row) =>
            row.guideName.toLowerCase().includes(search) ||
            row.guideEmail.toLowerCase().includes(search) ||
            (row.whatsappContact || '').toLowerCase().includes(search)
        );
    }, [rows, searchValue]);

    const openCounterProposalModal = (row: any) => {
        const date = new Date(row.scheduledAt);
        setEditingInterview(row);
        setSelectedDate(date.getTime());
        setTimeInput(
            `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
        );
        setWhatsappContact(row.whatsappContact || '');
        setAdminNote(row.adminNote || '');
        setShowEditModal(true);
    };

    const closeCounterProposalModal = () => {
        setShowEditModal(false);
        setEditingInterview(null);
        setSelectedDate(null);
        setTimeInput('14:00');
        setWhatsappContact('');
        setAdminNote('');
    };

    const buildDateIso = () => {
        if (!selectedDate) throw new Error("Veuillez choisir une date.");
        const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(timeInput.trim());
        if (!match) throw new Error("Heure invalide. Utilisez HH:mm.");

        const date = new Date(selectedDate);
        date.setHours(Number(match[1]), Number(match[2]), 0, 0);
        return date.toISOString();
    };

    const handleAcceptCounter = async (interviewId: string) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await acceptGuideInterviewProposalAsAdmin(interviewId);
            await loadRows();
            Alert.alert("Succès", "Le créneau a été validé.");
        } catch (error: any) {
            Alert.alert("Erreur", error?.message || "Impossible de valider cette proposition.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCounterProposal = async () => {
        if (!editingInterview || isSubmitting) return;
        if (!whatsappContact.trim()) {
            Alert.alert("Contact requis", "Veuillez saisir un contact WhatsApp.");
            return;
        }

        setIsSubmitting(true);
        try {
            const scheduledAt = buildDateIso();
            await counterProposeGuideInterviewAsAdmin({
                interviewId: editingInterview.id,
                scheduledAt,
                whatsappContact: whatsappContact.trim(),
                adminNote: adminNote.trim() || undefined,
            });
            closeCounterProposalModal();
            await loadRows();
            Alert.alert("Envoyé", "Nouvelle proposition envoyée au guide.");
        } catch (error: any) {
            Alert.alert("Erreur", error?.message || "Impossible d'envoyer la contre-proposition.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AdminGuard>
            <View className="flex-1 bg-gray-50 dark:bg-zinc-900">
                <Stack.Screen options={{ headerShown: false }} />
                <StatusBar barStyle="light-content" />
                <SafeAreaView className="flex-1" edges={['top']}>
                    <View className="px-6 pt-2 pb-4 border-b border-gray-200 dark:border-white/10 flex-row items-center">
                        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-2 rounded-full bg-gray-200 dark:bg-zinc-700">
                            <ArrowLeft size={18} color="#fff" />
                        </TouchableOpacity>
                        <View>
                            <Text className="text-2xl font-bold text-gray-900 dark:text-white">Entretiens guides</Text>
                            <Text className="text-gray-500 dark:text-gray-400 text-xs">Propositions WhatsApp et validations</Text>
                        </View>
                    </View>

                    <View className="px-4 pt-4">
                        <View className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-white/10 rounded-xl px-3 py-2.5 flex-row items-center">
                            <Search size={16} color="#9CA3AF" />
                            <TextInput
                                value={searchInput}
                                onChangeText={setSearchInput}
                                onSubmitEditing={() => setSearchValue(searchInput)}
                                placeholder="Guide, email, WhatsApp"
                                placeholderTextColor="#9CA3AF"
                                className="flex-1 ml-2 text-gray-900 dark:text-white"
                            />
                            <TouchableOpacity onPress={() => setSearchValue(searchInput)}>
                                <Text className="text-[#b39164] font-semibold">OK</Text>
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row gap-2 mt-3">
                            {FILTERS.map((status) => (
                                <TouchableOpacity
                                    key={status}
                                    onPress={() => setFilter(status)}
                                    className={`px-3 py-1.5 rounded-full border ${filter === status
                                        ? 'bg-[#b39164] border-[#b39164]'
                                        : 'border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800'
                                        }`}
                                >
                                    <Text className={filter === status ? 'text-white font-semibold' : 'text-gray-600 dark:text-gray-300'}>
                                        {status === 'all' ? 'Tous' : statusLabel(status)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {isLoading ? (
                        <View className="flex-1 items-center justify-center">
                            <ActivityIndicator color="#b39164" />
                        </View>
                    ) : (
                        <FlatList
                            data={filteredRows}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
                            ListEmptyComponent={() => (
                                <View className="items-center py-16">
                                    <Text className="text-gray-500">Aucun entretien trouvé.</Text>
                                </View>
                            )}
                            renderItem={({ item }) => (
                                <View className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-white/10 rounded-2xl p-4 mb-3">
                                    <View className="flex-row justify-between items-start">
                                        <View className="flex-1 pr-2">
                                            <Text className="text-gray-900 dark:text-white font-semibold">{item.guideName}</Text>
                                            <Text className="text-gray-500 text-xs mt-0.5">{item.guideEmail}</Text>
                                        </View>
                                        <View className={`px-2.5 py-1 rounded-full ${item.status === 'accepted'
                                            ? 'bg-green-500/10'
                                            : item.status === 'pending_admin'
                                                ? 'bg-amber-500/10'
                                                : 'bg-blue-500/10'
                                            }`}>
                                            <Text className={`text-xs font-semibold ${item.status === 'accepted'
                                                ? 'text-green-500'
                                                : item.status === 'pending_admin'
                                                    ? 'text-amber-500'
                                                    : 'text-blue-500'
                                                }`}>
                                                {statusLabel(item.status)}
                                            </Text>
                                        </View>
                                    </View>

                                    <View className="mt-3">
                                        <View className="flex-row items-center">
                                            <CalendarClock size={14} color="#9CA3AF" />
                                            <Text className="text-gray-500 text-xs ml-2">
                                                {new Date(item.scheduledAt).toLocaleString('fr-FR', {
                                                    weekday: 'long',
                                                    day: '2-digit',
                                                    month: 'long',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </Text>
                                        </View>
                                        <View className="flex-row items-center mt-2">
                                            <MessageCircle size={14} color="#9CA3AF" />
                                            <Text className="text-gray-500 text-xs ml-2">{item.whatsappContact || 'WhatsApp non défini'}</Text>
                                        </View>
                                        {!!item.adminNote && (
                                            <Text className="text-gray-400 text-xs mt-2">Note admin: {item.adminNote}</Text>
                                        )}
                                        {!!item.guideNote && (
                                            <Text className="text-gray-400 text-xs mt-1">Contre-proposition guide: {item.guideNote}</Text>
                                        )}
                                    </View>

                                    {item.status === 'pending_admin' && (
                                        <View className="flex-row gap-2 mt-4">
                                            <TouchableOpacity
                                                className="flex-1 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 items-center flex-row justify-center"
                                                onPress={() => handleAcceptCounter(item.id)}
                                                disabled={isSubmitting}
                                            >
                                                <CheckCircle2 size={14} color="#22c55e" />
                                                <Text className="text-green-500 font-semibold text-sm ml-1">Accepter</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                className="flex-1 py-2.5 rounded-xl bg-[#b39164]/15 border border-[#b39164]/30 items-center"
                                                onPress={() => openCounterProposalModal(item)}
                                                disabled={isSubmitting}
                                            >
                                                <Text className="text-[#b39164] font-semibold text-sm">Reproposer</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            )}
                        />
                    )}
                </SafeAreaView>
            </View>

            <Modal visible={showEditModal} transparent animationType="fade" onRequestClose={closeCounterProposalModal}>
                <View className="flex-1 bg-black/60 justify-center p-6">
                    <View className="bg-white dark:bg-zinc-800 rounded-2xl p-5">
                        <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">Nouvelle proposition</Text>
                        <TouchableOpacity
                            className="bg-gray-100 dark:bg-zinc-700 rounded-xl p-3 mb-3"
                            onPress={() => setShowCalendarPicker(true)}
                        >
                            <Text className="text-gray-500 text-xs mb-1">Jour</Text>
                            <Text className="text-gray-900 dark:text-white font-semibold">
                                {selectedDate
                                    ? new Date(selectedDate).toLocaleDateString('fr-FR', {
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })
                                    : 'Choisir le jour'}
                            </Text>
                        </TouchableOpacity>

                        {selectedDate ? (
                            <TextInput
                                value={timeInput}
                                onChangeText={setTimeInput}
                                className="bg-gray-100 dark:bg-zinc-700 rounded-xl p-3 text-gray-900 dark:text-white mb-3"
                                placeholder="Heure HH:mm"
                                placeholderTextColor="#9CA3AF"
                            />
                        ) : (
                            <View className="mb-3 bg-[#b39164]/10 border border-[#b39164]/20 rounded-xl p-3">
                                <Text className="text-[#8f6d43] dark:text-[#e7d2b1] text-xs">
                                    Choisissez d&apos;abord le jour dans le calendrier, puis l&apos;heure.
                                </Text>
                            </View>
                        )}
                        <TextInput
                            value={whatsappContact}
                            onChangeText={setWhatsappContact}
                            className="bg-gray-100 dark:bg-zinc-700 rounded-xl p-3 text-gray-900 dark:text-white mb-3"
                            placeholder="Contact WhatsApp"
                            placeholderTextColor="#9CA3AF"
                        />
                        <TextInput
                            value={adminNote}
                            onChangeText={setAdminNote}
                            multiline
                            className="min-h-[90px] bg-gray-100 dark:bg-zinc-700 rounded-xl p-3 text-gray-900 dark:text-white"
                            placeholder="Note admin (optionnelle)"
                            placeholderTextColor="#9CA3AF"
                        />

                        <View className="flex-row gap-3 mt-4">
                            <TouchableOpacity
                                className="flex-1 py-3 rounded-xl bg-gray-200 dark:bg-zinc-700 items-center"
                                onPress={closeCounterProposalModal}
                                disabled={isSubmitting}
                            >
                                <Text className="text-gray-700 dark:text-gray-200 font-semibold">Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="flex-1 py-3 rounded-xl bg-[#b39164] items-center"
                                onPress={handleCounterProposal}
                                disabled={isSubmitting || !selectedDate}
                            >
                                <Text className="text-white font-semibold">{isSubmitting ? 'Envoi...' : 'Envoyer'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={showCalendarPicker} animationType="slide" onRequestClose={() => setShowCalendarPicker(false)}>
                <CalendarPicker
                    mode="single"
                    variant="service"
                    title="Choisir un jour"
                    initialStart={selectedDate}
                    onCancel={() => setShowCalendarPicker(false)}
                    onConfirm={(start) => {
                        setSelectedDate(start);
                        setShowCalendarPicker(false);
                    }}
                />
            </Modal>
        </AdminGuard>
    );
}
