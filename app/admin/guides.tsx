import { AdminGuard } from '@/components/admin/AdminGuard';
import CalendarPicker from '@/components/CalendarPicker';
import { approveGuideApplication, getPendingGuideApplications, proposeGuideInterview, rejectGuideApplication } from '@/lib/adminApi';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { ArrowLeft, BadgeCheck, CalendarClock, MapPin, Phone, XCircle } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
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

export default function AdminGuidesScreen() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [guides, setGuides] = useState<any[]>([]);
    const [rejectingGuide, setRejectingGuide] = useState<any | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [approvingGuide, setApprovingGuide] = useState<any | null>(null);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showCalendarPicker, setShowCalendarPicker] = useState(false);
    const [calendarSource, setCalendarSource] = useState<'initial' | 'edit'>('initial');
    const [selectedInterviewDate, setSelectedInterviewDate] = useState<number | null>(null);
    const [interviewTime, setInterviewTime] = useState('14:00');
    const [whatsappContact, setWhatsappContact] = useState('');
    const [interviewNote, setInterviewNote] = useState('');

    const loadGuides = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getPendingGuideApplications();
            setGuides(data);
        } catch (error) {
            console.error(error);
            Alert.alert("Erreur", "Impossible de charger les demandes guides.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadGuides();
        }, [loadGuides])
    );

    const openInterviewFlow = (guide: any) => {
        setApprovingGuide(guide);
        setSelectedInterviewDate(null);
        setInterviewTime('14:00');
        setWhatsappContact('');
        setInterviewNote('');
        setShowApproveModal(false);
        setCalendarSource('initial');
        setShowCalendarPicker(true);
    };

    const closeApproveFlow = () => {
        setShowApproveModal(false);
        setShowCalendarPicker(false);
        setCalendarSource('initial');
        setApprovingGuide(null);
        setSelectedInterviewDate(null);
        setInterviewTime('14:00');
        setWhatsappContact('');
        setInterviewNote('');
    };

    const handleCalendarCancel = () => {
        setShowCalendarPicker(false);
        if (calendarSource === 'edit' && approvingGuide && selectedInterviewDate) {
            setShowApproveModal(true);
            return;
        }
        closeApproveFlow();
    };

    const buildInterviewDateTime = () => {
        if (!selectedInterviewDate) {
            throw new Error("Veuillez choisir une date d'entretien.");
        }

        const time = interviewTime.trim();
        const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
        if (!match) {
            throw new Error("Format d'heure invalide. Utilisez HH:mm (ex: 14:30).");
        }

        const interviewDate = new Date(selectedInterviewDate);
        interviewDate.setHours(Number(match[1]), Number(match[2]), 0, 0);
        return interviewDate.toISOString();
    };

    const handleProposeInterview = async () => {
        if (isSubmitting || !approvingGuide) return;
        if (!whatsappContact.trim()) {
            Alert.alert("WhatsApp requis", "Veuillez saisir un contact WhatsApp pour l'entretien.");
            return;
        }

        setIsSubmitting(true);
        try {
            const scheduledAt = buildInterviewDateTime();
            await proposeGuideInterview({
                guideId: approvingGuide.id,
                scheduledAt,
                whatsappContact: whatsappContact.trim(),
                adminNote: interviewNote.trim() || undefined,
            });
            Alert.alert("Proposition envoyée", "Le créneau d'entretien a été envoyé au guide.");
            closeApproveFlow();
        } catch (error: any) {
            Alert.alert("Erreur", error?.message || "Impossible d'envoyer cette proposition d'entretien.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const approveDirectly = async (guide: any) => {
        if (!guide || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await approveGuideApplication(guide.id);
            setGuides((prev) => prev.filter((row) => row.id !== guide.id));
            if (approvingGuide?.id === guide.id) {
                closeApproveFlow();
            }
            Alert.alert("Succès", "Le guide a été approuvé.");
        } catch (error: any) {
            Alert.alert("Erreur", error?.message || "Impossible d'approuver ce guide.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDirectApproval = (guide: any) => {
        Alert.alert(
            "Approuver ce guide",
            "Le compte guide sera validé immédiatement.",
            [
                { text: "Annuler", style: "cancel" },
                { text: "Approuver", onPress: () => approveDirectly(guide) },
            ]
        );
    };

    const handleReject = async () => {
        if (!rejectingGuide || isSubmitting) return;
        if (!rejectReason.trim()) {
            Alert.alert("Motif requis", "Veuillez saisir un motif de refus.");
            return;
        }

        setIsSubmitting(true);
        try {
            await rejectGuideApplication(rejectingGuide.id, rejectReason.trim());
            setGuides((prev) => prev.filter((guide) => guide.id !== rejectingGuide.id));
            setRejectingGuide(null);
            setRejectReason('');
            Alert.alert("Refus enregistré", "Le guide a été refusé.");
        } catch (error: any) {
            Alert.alert("Erreur", error?.message || "Impossible de refuser ce guide.");
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
                        <View className="flex-1">
                            <Text className="text-2xl font-bold text-gray-900 dark:text-white">Guides à valider</Text>
                            <Text className="text-gray-500 dark:text-gray-400 text-xs">Validation / refus des demandes</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => router.push('/admin/interviews' as any)}
                            className="px-3 py-2 rounded-full bg-[#6366f1]/15 border border-[#6366f1]/30"
                        >
                            <Text className="text-[#818cf8] text-xs font-semibold">Entretiens</Text>
                        </TouchableOpacity>
                    </View>

                    {isLoading ? (
                        <View className="flex-1 items-center justify-center">
                            <ActivityIndicator color="#b39164" />
                        </View>
                    ) : (
                        <FlatList
                            data={guides}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                            ListEmptyComponent={() => (
                                <View className="items-center justify-center py-16">
                                    <BadgeCheck size={34} color="#22c55e" />
                                    <Text className="text-gray-500 mt-4">Aucune demande en attente.</Text>
                                </View>
                            )}
                            renderItem={({ item }) => (
                                <View className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-white/10 rounded-2xl p-4 mb-3">
                                    <Text className="text-lg font-bold text-gray-900 dark:text-white">{item.fullName}</Text>
                                    <Text className="text-gray-500 text-xs mt-0.5">{item.email}</Text>
                                    <View className="flex-row items-center mt-1">
                                        <Phone size={14} color="#9CA3AF" />
                                        <Text className="text-gray-500 ml-1 text-xs">{item.phoneNumber || 'Téléphone non renseigné'}</Text>
                                    </View>
                                    <View className="flex-row items-center mt-3">
                                        <MapPin size={14} color="#9CA3AF" />
                                        <Text className="text-gray-500 ml-1 text-xs">{item.location}</Text>
                                    </View>
                                    <Text className="text-gray-500 text-xs mt-2">Spécialité: {item.specialty || 'Non renseignée'}</Text>
                                    <Text className="text-gray-500 text-xs mt-1">
                                        Langues: {item.languages?.length ? item.languages.join(', ') : 'Non renseignées'}
                                    </Text>

                                    <View className="flex-row gap-2 mt-4">
                                        <TouchableOpacity
                                            className="flex-1 py-3 rounded-xl bg-red-500/10 border border-red-500/20 items-center"
                                            onPress={() => {
                                                setRejectingGuide(item);
                                                setRejectReason('');
                                            }}
                                        >
                                            <Text className="text-red-500 font-semibold text-sm">Refuser</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            className="flex-1 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 items-center"
                                            onPress={() => openInterviewFlow(item)}
                                            disabled={isSubmitting}
                                        >
                                            <Text className="text-blue-500 font-semibold text-sm">Entretiens</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            className="flex-1 py-3 rounded-xl bg-green-500/10 border border-green-500/20 items-center"
                                            onPress={() => confirmDirectApproval(item)}
                                            disabled={isSubmitting}
                                        >
                                            <Text className="text-green-500 font-semibold text-sm">Approuver</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        />
                    )}
                </SafeAreaView>
            </View>

            <Modal visible={!!rejectingGuide} transparent animationType="fade" onRequestClose={() => setRejectingGuide(null)}>
                <View className="flex-1 bg-black/60 justify-center p-6">
                    <View className="bg-white dark:bg-zinc-800 rounded-2xl p-5">
                        <View className="flex-row items-center mb-3">
                            <XCircle size={18} color="#ef4444" />
                            <Text className="text-lg font-bold text-gray-900 dark:text-white ml-2">Motif du refus</Text>
                        </View>
                        <Text className="text-gray-500 text-sm mb-3">
                            Le guide recevra ce motif dans son dossier.
                        </Text>
                        <TextInput
                            value={rejectReason}
                            onChangeText={setRejectReason}
                            multiline
                            className="min-h-[110px] bg-gray-100 dark:bg-zinc-700 rounded-xl p-3 text-gray-900 dark:text-white"
                            placeholder="Ex: profil incomplet, documents manquants..."
                            placeholderTextColor="#9CA3AF"
                        />
                        <View className="flex-row gap-3 mt-4">
                            <TouchableOpacity
                                className="flex-1 py-3 rounded-xl bg-gray-200 dark:bg-zinc-700 items-center"
                                onPress={() => setRejectingGuide(null)}
                            >
                                <Text className="text-gray-700 dark:text-gray-200 font-semibold">Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="flex-1 py-3 rounded-xl bg-red-500 items-center"
                                onPress={handleReject}
                                disabled={isSubmitting}
                            >
                                <Text className="text-white font-semibold">Confirmer</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={showApproveModal} transparent animationType="fade" onRequestClose={closeApproveFlow}>
                <View className="flex-1 bg-black/60 justify-center p-6">
                    <View className="bg-white dark:bg-zinc-800 rounded-2xl p-5">
                        <View className="flex-row items-center mb-3">
                            <CalendarClock size={18} color="#22c55e" />
                            <Text className="text-lg font-bold text-gray-900 dark:text-white ml-2">Proposer un entretien</Text>
                        </View>
                        <Text className="text-gray-500 text-sm mb-3">
                            Guide: <Text className="font-semibold">{approvingGuide?.fullName || 'Guide'}</Text>
                        </Text>

                        <TouchableOpacity
                            className="bg-gray-100 dark:bg-zinc-700 rounded-xl p-3 mb-3"
                            onPress={() => {
                                setCalendarSource('edit');
                                setShowApproveModal(false);
                                setShowCalendarPicker(true);
                            }}
                        >
                            <Text className="text-gray-500 text-xs mb-1">Jour d&apos;entretien</Text>
                            <Text className="text-gray-900 dark:text-white font-semibold">
                                {selectedInterviewDate
                                    ? new Date(selectedInterviewDate).toLocaleDateString('fr-FR', {
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })
                                    : 'Choisir le jour'}
                            </Text>
                        </TouchableOpacity>

                        {selectedInterviewDate ? (
                            <View className="mb-3">
                                <Text className="text-gray-500 text-xs mb-1">Heure (HH:mm)</Text>
                                <TextInput
                                    value={interviewTime}
                                    onChangeText={setInterviewTime}
                                    className="bg-gray-100 dark:bg-zinc-700 rounded-xl p-3 text-gray-900 dark:text-white"
                                    placeholder="14:30"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                        ) : (
                            <View className="mb-3 bg-[#b39164]/10 border border-[#b39164]/20 rounded-xl p-3">
                                <Text className="text-[#8f6d43] dark:text-[#e7d2b1] text-xs">
                                    Choisissez d&apos;abord le jour dans le calendrier, puis l&apos;heure.
                                </Text>
                            </View>
                        )}

                        <View className="mb-3">
                            <Text className="text-gray-500 text-xs mb-1">Contact WhatsApp</Text>
                            <TextInput
                                value={whatsappContact}
                                onChangeText={setWhatsappContact}
                                className="bg-gray-100 dark:bg-zinc-700 rounded-xl p-3 text-gray-900 dark:text-white"
                                placeholder="+966xxxxxxxx ou lien wa.me"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        <View>
                            <Text className="text-gray-500 text-xs mb-1">Note (optionnelle)</Text>
                            <TextInput
                                value={interviewNote}
                                onChangeText={setInterviewNote}
                                multiline
                                className="min-h-[90px] bg-gray-100 dark:bg-zinc-700 rounded-xl p-3 text-gray-900 dark:text-white"
                                placeholder="Consignes pour l'entretien..."
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        <View className="flex-row gap-3 mt-4">
                            <TouchableOpacity
                                className="flex-1 py-3 rounded-xl bg-gray-200 dark:bg-zinc-700 items-center"
                                onPress={closeApproveFlow}
                            >
                                <Text className="text-gray-700 dark:text-gray-200 font-semibold">Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="flex-1 py-3 rounded-xl bg-green-500 items-center"
                                onPress={handleProposeInterview}
                                disabled={isSubmitting || !selectedInterviewDate}
                            >
                                <Text className="text-white font-semibold">{isSubmitting ? 'Envoi...' : 'Envoyer la proposition'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={showCalendarPicker} animationType="slide" onRequestClose={handleCalendarCancel}>
                <CalendarPicker
                    mode="single"
                    variant="service"
                    title="Choisir un jour"
                    initialStart={selectedInterviewDate}
                    onCancel={handleCalendarCancel}
                    onConfirm={(start) => {
                        setSelectedInterviewDate(start);
                        setShowCalendarPicker(false);
                        setShowApproveModal(true);
                    }}
                />
            </Modal>
        </AdminGuard>
    );
}
