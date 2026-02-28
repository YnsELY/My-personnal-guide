import { useAuth } from '@/context/AuthContext';
import { getMyGuideInterviews } from '@/lib/api';
import { Redirect, Stack, useFocusEffect, useRouter } from 'expo-router';
import { CalendarClock, Clock3, LogOut } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GuidePendingApprovalScreen() {
    const router = useRouter();
    const { profile, user, signOut } = useAuth();
    const effectiveRole = profile?.role || user?.user_metadata?.role;
    const [interviewsCount, setInterviewsCount] = useState<number>(0);
    const [highlightInterview, setHighlightInterview] = useState<any | null>(null);

    const loadInterviews = useCallback(async () => {
        if (!user || effectiveRole !== 'guide') return;
        try {
            const rows = await getMyGuideInterviews();
            const pendingOrAccepted = rows
                .filter((row: any) =>
                    row.status === 'pending_guide' || row.status === 'pending_admin' || row.status === 'accepted'
                )
                .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

            setInterviewsCount(pendingOrAccepted.length);

            const pendingProposal = pendingOrAccepted.find(
                (row: any) => row.status === 'pending_guide' && row.proposedBy === 'admin'
            );
            setHighlightInterview(pendingProposal || pendingOrAccepted[0] || null);
        } catch (error) {
            console.error(error);
        }
    }, [user, effectiveRole]);

    useFocusEffect(
        useCallback(() => {
            loadInterviews();
        }, [loadInterviews])
    );

    const interviewIsProposal =
        highlightInterview &&
        highlightInterview.status === 'pending_guide' &&
        highlightInterview.proposedBy === 'admin';

    if (!user) {
        return <Redirect href="/(auth)/login" />;
    }

    if (effectiveRole !== 'guide') {
        return <Redirect href="/(tabs)" />;
    }

    return (
        <View className="flex-1 bg-zinc-900">
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="light-content" />
            <SafeAreaView className="flex-1 px-6" edges={['top']}>
                <View className="flex-1 justify-center">
                    <View className="bg-zinc-800 border border-white/10 rounded-3xl p-6">
                        <View className="w-14 h-14 rounded-2xl bg-[#b39164]/20 items-center justify-center mb-4">
                            <Clock3 size={24} color="#b39164" />
                        </View>

                        <Text className="text-2xl font-bold text-white mb-3">Compte en attente d&apos;approbation</Text>
                        <Text className="text-zinc-300 leading-6">
                            Votre compte guide est bien créé mais il est encore en cours de validation par notre équipe.
                            {interviewIsProposal
                                ? " Un créneau d'entretien vous a été proposé."
                                : " Vous recevrez une proposition d'entretien rapidement."}
                        </Text>

                        <View className="bg-[#b39164]/10 border border-[#b39164]/20 rounded-2xl p-4 mt-5">
                            <Text className="text-[#e7d2b1] text-sm">
                                Pendant cette étape, l&apos;accès aux fonctionnalités de l&apos;application est temporairement restreint.
                            </Text>
                        </View>

                        {!!highlightInterview && (
                            <View className={`rounded-2xl p-4 mt-4 border ${interviewIsProposal ? 'bg-blue-500/15 border-blue-500/30' : 'bg-zinc-700/40 border-white/10'}`}>
                                <Text className={`font-semibold ${interviewIsProposal ? 'text-blue-300' : 'text-zinc-200'}`}>
                                    {interviewIsProposal ? "Créneau proposé" : "Entretien en cours"}
                                </Text>
                                <Text className="text-white text-sm mt-1">
                                    {new Date(highlightInterview.scheduledAt).toLocaleString('fr-FR', {
                                        weekday: 'long',
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </Text>
                                {!!highlightInterview.whatsappContact && (
                                    <Text className="text-zinc-300 text-xs mt-1">
                                        WhatsApp: {highlightInterview.whatsappContact}
                                    </Text>
                                )}
                                {!!highlightInterview.adminNote && (
                                    <Text className="text-zinc-300 text-xs mt-1">
                                        Note admin: {highlightInterview.adminNote}
                                    </Text>
                                )}
                            </View>
                        )}

                        <TouchableOpacity
                            onPress={() => router.push('/guide/interviews')}
                            className="mt-6 bg-blue-500/15 border border-blue-500/30 rounded-2xl py-3.5 flex-row items-center justify-center"
                        >
                            <CalendarClock size={16} color="#60a5fa" />
                            <Text className="text-blue-300 font-semibold ml-2">
                                {interviewIsProposal ? "Répondre au créneau proposé" : `Voir mes entretiens (${interviewsCount})`}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={signOut}
                            className="mt-3 bg-red-500/15 border border-red-500/30 rounded-2xl py-3.5 flex-row items-center justify-center"
                        >
                            <LogOut size={16} color="#ef4444" />
                            <Text className="text-red-400 font-semibold ml-2">Se déconnecter</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}
