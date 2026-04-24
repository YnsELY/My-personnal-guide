import { deleteService, getCurrentUser, getGuideServices } from '@/lib/api';
import { resolveFixedGuideNetSarForService } from '@/lib/guideTariffs';
import i18n from '@/lib/i18n';
import { formatSAR } from '@/lib/pricing';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { ArrowRight, Calendar, Pencil, Plus, Trash2 } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, Image, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { resolveServiceImageSource } from '@/constants/serviceLocationImages';
import { SafeAreaView } from 'react-native-safe-area-context';

const getLocale = () => i18n.language === 'ar' ? 'ar-SA' : 'fr-FR';

export default function MyServicesScreen() {
    const { t } = useTranslation('guide');
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
            t('myServices.deleteService'),
            t('myServices.deleteConfirm'),
            [
                { text: t('common:cancel'), style: "cancel" },
                {
                    text: t('common:delete'),
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteService(id);
                            loadServices(); // Refresh list
                        } catch {
                            Alert.alert(t('common:error'), t('myServices.deleteError'));
                        }
                    }
                }
            ]
        );
    };

    const formatDateRange = (start: string | null, end: string | null) => {
        if (!start && !end) return null;
        const fmt = (d: string) => new Date(d).toLocaleDateString(getLocale(), { day: '2-digit', month: '2-digit', year: '2-digit' });
        if (start && end) return `${fmt(start)} → ${fmt(end)}`;
        if (start) return t('myServices.fromDate', { date: fmt(start) });
        return null;
    };

    const renderServiceItem = ({ item }: { item: any }) => {
        const imageSource = resolveServiceImageSource(item.imageUrl, item.location);
        const dateLabel = formatDateRange(item.availabilityStart, item.availabilityEnd);
        const guideNetSar = resolveFixedGuideNetSarForService({
            title: item.title,
            category: item.category,
            location: item.location,
            serviceBasePriceEur: Number(item.price || 0),
        });

        return (
            <View className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 mb-4 overflow-hidden">
                {/* Photo + pastille date */}
                <View className="h-36 relative">
                    <Image source={imageSource} className="w-full h-full" resizeMode="cover" />
                    <View className="absolute inset-0 bg-black/20" />
                    {dateLabel && (
                        <View className="absolute top-3 right-3 bg-black/60 rounded-full px-3 py-1 flex-row items-center gap-1">
                            <Calendar size={11} color="#b39164" />
                            <Text className="text-white text-xs font-medium">{dateLabel}</Text>
                        </View>
                    )}
                </View>

                {/* Contenu */}
                <View className="p-4">
                    <View className="flex-row justify-between items-start mb-1">
                        <Text className="text-gray-900 dark:text-white font-bold text-base flex-1 mr-2">{item.title}</Text>
                        <Text className="text-[#b39164] font-bold">
                            {guideNetSar !== null ? formatSAR(guideNetSar) : '--'}
                        </Text>
                    </View>

                    <Text className="text-gray-500 dark:text-gray-400 text-sm mb-3">{item.category}</Text>

                    <View className="flex-row justify-end gap-3 border-t border-gray-100 dark:border-white/5 pt-3">
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
            </View>
        );
    };

    return (
        <View className="flex-1 bg-gray-50 dark:bg-zinc-900">
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="light-content" />

            <SafeAreaView className="flex-1 px-6">
                <View className="flex-row items-center justify-between mb-6 mt-4">
                    <View className="flex-row items-center">
                        <TouchableOpacity onPress={() => router.back()} className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full mr-4">
                            <ArrowRight className="rotate-180" size={20} color="#000" />
                        </TouchableOpacity>
                        <Text className="text-xl font-bold dark:text-white">{t('myServices.title')}</Text>
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
                                <Text className="text-gray-400 text-center mb-4">{t('myServices.noServices')}</Text>
                                <TouchableOpacity
                                    onPress={() => router.push('/guide/create-service')}
                                    className="bg-[#b39164] px-6 py-3 rounded-xl"
                                >
                                    <Text className="text-white font-bold">{t('myServices.createService')}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    />
                )}
            </SafeAreaView>
        </View>
    );
}
