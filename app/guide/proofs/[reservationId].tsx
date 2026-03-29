import { useAuth } from '@/context/AuthContext';
import { useReservations } from '@/context/ReservationsContext';
import { getReservationProofs, uploadReservationProof } from '@/lib/api';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, Upload } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Alert, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PROOF_TYPES = [
    { type: 'ihram_start_video' as const, label: 'Vidéo entrée en ihram' },
    { type: 'omra_completion_video' as const, label: 'Vidéo fin de mission' },
];

export default function GuideReservationProofsScreen() {
    const router = useRouter();
    const { reservationId } = useLocalSearchParams<{ reservationId: string }>();
    const { profile } = useAuth();
    const { getReservationsByRole } = useReservations();

    const [isLoading, setIsLoading] = React.useState(true);
    const [isUploadingType, setIsUploadingType] = React.useState<string | null>(null);
    const [proofsByType, setProofsByType] = React.useState<Record<string, any>>({});

    const reservations = React.useMemo(
        () => getReservationsByRole('guide', profile?.id || '1'),
        [getReservationsByRole, profile?.id]
    );

    const reservation = React.useMemo(
        () => reservations.find((item) => item.id === reservationId),
        [reservationId, reservations]
    );

    const isBadal = String(reservation?.serviceName || '').toLowerCase().includes('badal');

    const loadProofs = React.useCallback(async () => {
        if (!reservationId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const proofs = await getReservationProofs(reservationId);
            const map: Record<string, any> = {};
            for (const proof of proofs) {
                map[proof.proofType] = proof;
            }
            setProofsByType(map);
        } catch (error) {
            console.error('Failed to load reservation proofs:', error);
            setProofsByType({});
        } finally {
            setIsLoading(false);
        }
    }, [reservationId]);

    React.useEffect(() => {
        loadProofs().catch((error) => {
            console.error('Failed to initialize proofs screen:', error);
        });
    }, [loadProofs]);

    const pickAndUpload = async (proofType: 'ihram_start_video' | 'omra_completion_video') => {
        if (!reservationId || isUploadingType) return;

        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permission requise', 'Autorisez l’accès à votre bibliothèque pour envoyer la vidéo.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: false,
            quality: 0.8,
        });

        if (result.canceled || !result.assets?.length) return;

        setIsUploadingType(proofType);
        try {
            const asset = result.assets[0];
            await uploadReservationProof({
                reservationId,
                proofType,
                fileUri: asset.uri,
            });
            await loadProofs();
            Alert.alert('Succès', 'La preuve vidéo a été envoyée.');
        } catch (error: any) {
            console.error('Failed to upload reservation proof:', error);
            Alert.alert('Erreur', error?.message || 'Impossible d’envoyer la vidéo.');
        } finally {
            setIsUploadingType(null);
        }
    };

    const openProof = async (proofType: 'ihram_start_video' | 'omra_completion_video') => {
        const proof = proofsByType[proofType];
        if (!proof?.videoUrl) {
            Alert.alert('Indisponible', 'Le lien de lecture est indisponible pour le moment.');
            return;
        }
        try {
            await Linking.openURL(proof.videoUrl);
        } catch {
            Alert.alert('Erreur', 'Impossible d’ouvrir cette vidéo sur cet appareil.');
        }
    };

    return (
        <View className="flex-1 bg-gray-50 dark:bg-zinc-900">
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="light-content" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-6 pt-2 pb-4 border-b border-gray-200 dark:border-white/10 flex-row items-center">
                    <TouchableOpacity onPress={() => router.back()} className="mr-3 p-2 rounded-full bg-gray-200 dark:bg-zinc-700">
                        <ArrowLeft size={18} color="#fff" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-2xl font-bold text-gray-900 dark:text-white">Preuves Omra Badal</Text>
                        <Text className="text-gray-500 dark:text-gray-400 text-xs">Réservation {reservationId || '-'}</Text>
                    </View>
                </View>

                <ScrollView className="flex-1 px-6 pt-5" contentContainerStyle={{ paddingBottom: 28 }}>
                    {!reservation ? (
                        <View className="rounded-2xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 p-5">
                            <Text className="text-gray-500">Réservation introuvable.</Text>
                        </View>
                    ) : !isBadal ? (
                        <View className="rounded-2xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 p-5">
                            <Text className="text-gray-500">Cet onglet est réservé aux prestations Omra Badal.</Text>
                        </View>
                    ) : isLoading ? (
                        <View className="items-center py-12">
                            <ActivityIndicator color="#b39164" />
                        </View>
                    ) : (
                        <View className="gap-3">
                            {PROOF_TYPES.map((proofConfig) => {
                                const proof = proofsByType[proofConfig.type];
                                const isUploading = isUploadingType === proofConfig.type;
                                return (
                                    <View key={proofConfig.type} className="rounded-2xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 p-4">
                                        <View className="flex-row items-center justify-between">
                                            <View className="flex-1 pr-3">
                                                <Text className="text-gray-900 dark:text-white font-semibold">{proofConfig.label}</Text>
                                                <Text className="text-xs text-gray-500 mt-1">
                                                    {proof
                                                        ? `Envoyée le ${new Date(proof.uploadedAt).toLocaleString('fr-FR')}`
                                                        : 'Non envoyée'}
                                                </Text>
                                            </View>
                                            {proof ? (
                                                <View className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex-row items-center">
                                                    <CheckCircle2 size={12} color="#22c55e" />
                                                    <Text className="text-emerald-500 text-xs font-semibold ml-1">Envoyée</Text>
                                                </View>
                                            ) : (
                                                <View className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                                                    <Text className="text-amber-500 text-xs font-semibold">En attente</Text>
                                                </View>
                                            )}
                                        </View>

                                        <View className="flex-row gap-2 mt-4">
                                            <TouchableOpacity
                                                className="flex-1 rounded-xl bg-[#b39164] py-2.5 items-center flex-row justify-center"
                                                onPress={() => pickAndUpload(proofConfig.type)}
                                                disabled={isUploadingType !== null}
                                            >
                                                <Upload size={14} color="white" />
                                                <Text className="text-white font-semibold text-xs ml-1.5">
                                                    {isUploading ? 'Envoi...' : (proof ? 'Remplacer la vidéo' : 'Uploader une vidéo')}
                                                </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                className={`flex-1 rounded-xl py-2.5 items-center ${proof ? 'bg-zinc-700' : 'bg-zinc-700/40'}`}
                                                onPress={() => openProof(proofConfig.type)}
                                                disabled={!proof}
                                            >
                                                <Text className={`font-semibold text-xs ${proof ? 'text-white' : 'text-zinc-500'}`}>
                                                    Voir la vidéo
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
