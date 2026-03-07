import { deleteService, getCurrentUser, getGuideServices } from '@/lib/api';
import { formatSAR, toSar } from '@/lib/pricing';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { ArrowRight, MapPin, Pencil, Plus, Trash2 } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MyServicesScreen() {
    const router = useRouter();
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            loadServices();
        }, [])
    );

    const loadServices = async () => {
        setLoading(true);
        try {
            const user = await getCurrentUser();
            if (user) {
                const data = await getGuideServices(user.id);
                setServices(data || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (service: any) => {
        router.push({
            pathname: '/guide/create-service',
            params: { service: JSON.stringify(service) }
        });
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            "Supprimer le service",
            "Êtes-vous sûr de vouloir supprimer ce service ? Cette action est irréversible.",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteService(id);
                            loadServices(); // Refresh list
                        } catch {
                            Alert.alert("Erreur", "Impossible de supprimer le service.");
                        }
                    }
                }
            ]
        );
    };

    const renderServiceItem = ({ item }: { item: any }) => (
        <View className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5 mb-4">
            <View className="flex-row justify-between items-start mb-2">
                <Text className="text-gray-900 dark:text-white font-bold text-lg flex-1 mr-2">{item.title}</Text>
                <Text className="text-[#b39164] font-bold">{formatSAR(toSar(Number(item.price || 0)))}</Text>
            </View>

            <View className="flex-row items-center mb-1">
                <Text className="text-gray-500 dark:text-gray-400 text-sm">{item.category}</Text>
            </View>

            <View className="flex-row items-center mt-2">
                <MapPin size={14} color="#9CA3AF" />
                <Text className="text-gray-400 text-xs ml-1">Transport fixe: Haram / Hôtel (+40 SAR si hôtel {'>'} 2 km)</Text>
            </View>

            <View className="flex-row justify-end gap-3 mt-4 border-t border-gray-100 dark:border-white/5 pt-3">
                <TouchableOpacity
                    onPress={() => handleEdit(item)}
                    className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                >
                    <Pencil size={18} color="#3b82f6" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => handleDelete(item.id)}
                    className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg"
                >
                    <Trash2 size={18} color="#ef4444" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-gray-50 dark:bg-zinc-900">
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="dark-content" />

            <SafeAreaView className="flex-1 px-6">
                <View className="flex-row items-center justify-between mb-6 mt-4">
                    <View className="flex-row items-center">
                        <TouchableOpacity onPress={() => router.back()} className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full mr-4">
                            <ArrowRight className="rotate-180" size={20} color="#000" />
                        </TouchableOpacity>
                        <Text className="text-xl font-bold dark:text-white">Mes Services</Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => router.push('/guide/create-service')}
                        className="bg-[#b39164] p-2 rounded-full"
                    >
                        <Plus size={20} color="white" />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#b39164" />
                    </View>
                ) : (
                    <FlatList
                        data={services}
                        renderItem={renderServiceItem}
                        keyExtractor={item => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        ListEmptyComponent={() => (
                            <View className="items-center justify-center py-10">
                                <Text className="text-gray-400 text-center mb-4">Vous n&apos;avez pas encore créé de services.</Text>
                                <TouchableOpacity
                                    onPress={() => router.push('/guide/create-service')}
                                    className="bg-[#b39164] px-6 py-3 rounded-xl"
                                >
                                    <Text className="text-white font-bold">Créer un service</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    />
                )}
            </SafeAreaView>
        </View>
    );
}
