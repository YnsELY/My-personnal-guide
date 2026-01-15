import { getReservations } from '@/lib/api';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, MapPin, MessageCircle } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ReservationsScreen() {
    const router = useRouter();
    const [reservations, setReservations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getReservations();
            setReservations(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'completed': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            case 'cancelled': return 'text-red-500 bg-red-500/10 border-red-500/20';
            default: return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'confirmed': return 'Confirmé';
            case 'completed': return 'Terminé';
            case 'cancelled': return 'Annulé';
            default: return 'En attente';
        }
    };

    return (
        <View className="flex-1 bg-white dark:bg-zinc-900">
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="default" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="flex-row items-center px-6 py-4 mb-2">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 -ml-2 bg-black/10 dark:bg-zinc-800 rounded-full">
                        <ArrowLeft size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-gray-900 dark:text-white">Mes Réservations</Text>
                </View>

                {loading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#b39164" />
                    </View>
                ) : (
                    <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
                        {reservations.length === 0 ? (
                            <View className="items-center justify-center py-20">
                                <Text className="text-gray-500 text-center">Vous n'avez aucune réservation pour le moment.</Text>
                            </View>
                        ) : (
                            <View className="gap-4 pb-20">
                                {reservations.map((item) => (
                                    <View key={item.id} className="bg-gray-50 dark:bg-zinc-800 rounded-2xl p-4 border border-gray-200 dark:border-white/5">
                                        <View className="flex-row justify-between items-start mb-4">
                                            <View className="flex-row items-center flex-1 mr-2">
                                                <Image
                                                    source={item.guideAvatar ? { uri: item.guideAvatar } : require('@/assets/images/profil.jpeg')}
                                                    className="w-10 h-10 rounded-full bg-gray-200"
                                                />
                                                <View className="ml-3 flex-1">
                                                    <Text className="font-bold text-gray-900 dark:text-white" numberOfLines={1}>{item.serviceName}</Text>
                                                    <Text className="text-gray-500 text-xs">{item.guideName}</Text>
                                                </View>
                                            </View>
                                            <View className="flex-row items-center gap-2">
                                                <TouchableOpacity
                                                    onPress={() => router.push(`/chat/${item.guideId || '1'}`)}
                                                    className="bg-black/10 dark:bg-zinc-700 p-2 rounded-full"
                                                >
                                                    <MessageCircle size={20} color="white" />
                                                </TouchableOpacity>
                                                <View className={`px-3 py-1 rounded-full border ${getStatusColor(item.status).split(' ')[2]} ${getStatusColor(item.status).split(' ')[1]}`}>
                                                    <Text className={`text-xs font-bold ${getStatusColor(item.status).split(' ')[0]}`}>{getStatusLabel(item.status)}</Text>
                                                </View>
                                            </View>
                                        </View>

                                        <View className="flex-row items-center mb-2">
                                            <Calendar size={14} color="#9CA3AF" />
                                            <Text className="text-gray-600 dark:text-gray-300 ml-2 text-sm">{item.date}{item.time ? ` à ${item.time}` : ''}</Text>
                                        </View>

                                        <View className="flex-row items-center mb-4">
                                            <MapPin size={14} color="#9CA3AF" />
                                            <Text className="text-gray-600 dark:text-gray-300 ml-2 text-sm" numberOfLines={1}>{item.location}</Text>
                                        </View>

                                        <View className="pt-3 border-t border-gray-200 dark:border-white/5 flex-row justify-between items-center">
                                            <Text className="text-gray-500 text-xs">Total payé</Text>
                                            <Text className="font-bold text-primary text-lg">{item.price} SAR</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </ScrollView>
                )}
            </SafeAreaView>
        </View>
    );
}
