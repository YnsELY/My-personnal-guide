import { AdminGuard } from '@/components/admin/AdminGuard';
import { getAdminFinance, markGuidePayoutAsPaid } from '@/lib/adminApi';
import { formatSAR, toSar } from '@/lib/pricing';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { ArrowLeft, BadgeCheck } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Animated, FlatList, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminPayoutsScreen() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isPayingGuideId, setIsPayingGuideId] = useState<string | null>(null);
    const [dueGuides, setDueGuides] = useState<any[]>([]);

    const loadDueGuides = useCallback(async () => {
        setIsLoading(true);
        try {
            const finance = await getAdminFinance(365);
            const due = (finance.byGuide || []).filter((guide: any) => guide.dueAmount > 0);
            setDueGuides(due);
        } catch (error: any) {
            Alert.alert("Erreur", error?.message || "Impossible de charger les paiements.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadDueGuides();
        }, [loadDueGuides])
    );

    const handlePayGuide = async (guide: any) => {
        setIsPayingGuideId(guide.guideId);
        try {
            await markGuidePayoutAsPaid(guide.guideId, `manual-${Date.now()}`);
            await loadDueGuides();
        } catch (error: any) {
            Alert.alert("Erreur", error?.message || "Paiement impossible.");
        } finally {
            setIsPayingGuideId(null);
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
                            <Text className="text-2xl font-bold text-gray-900 dark:text-white">Paiements guides</Text>
                            <Text className="text-gray-500 dark:text-gray-400 text-xs">Distribution manuelle</Text>
                        </View>
                    </View>

                    {isLoading ? (
                        <View className="flex-1 items-center justify-center">
                            <ActivityIndicator color="#b39164" />
                        </View>
                    ) : (
                        <FlatList
                            data={dueGuides}
                            keyExtractor={(item) => item.guideId}
                            contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
                            ListEmptyComponent={() => (
                                <View className="items-center py-16">
                                    <BadgeCheck size={32} color="#22c55e" />
                                    <Text className="text-gray-500 mt-3">Aucun paiement en attente.</Text>
                                </View>
                            )}
                            renderItem={({ item }) => (
                                <View className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-white/10 rounded-2xl p-4 mb-3">
                                    <Text className="text-gray-900 dark:text-white font-semibold">{item.guideName}</Text>
                                    <Text className="text-gray-500 text-xs mt-0.5">{item.guideEmail || 'Email non renseigné'}</Text>
                                    <Text className="text-gray-400 text-xs mt-2">{item.ordersCount} commandes terminées non payées</Text>

                                    <View className="mt-3">
                                        <View className="flex-row justify-between">
                                            <Text className="text-gray-500 text-xs">Net dû</Text>
                                            <Text className="text-[#b39164] font-semibold">{formatSAR(toSar(item.dueAmount || 0))}</Text>
                                        </View>
                                    </View>

                                    <PayoutButton
                                        label={isPayingGuideId === item.guideId ? 'Traitement...' : 'Confirmer le paiement'}
                                        onPress={() => handlePayGuide(item)}
                                        disabled={isPayingGuideId === item.guideId}
                                    />
                                </View>
                            )}
                        />
                    )}
                </SafeAreaView>
            </View>
        </AdminGuard>
    );
}

function PayoutButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
    const pulse = React.useRef(new Animated.Value(1)).current;

    React.useEffect(() => {
        if (disabled) {
            pulse.setValue(1);
            return;
        }

        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 0.55, duration: 650, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [disabled, pulse]);

    return (
        <Animated.View style={{ opacity: pulse }}>
            <TouchableOpacity
                className="mt-3 rounded-xl bg-[#b39164] border border-amber-300 py-2.5 items-center"
                onPress={onPress}
                disabled={disabled}
            >
                <Text className="text-white font-semibold text-sm">{label}</Text>
            </TouchableOpacity>
        </Animated.View>
    );
}
