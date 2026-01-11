import { RESERVATIONS } from '@/constants/data';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Clock, MapPin, MessageCircle } from 'lucide-react-native';
import React from 'react';
import { FlatList, Image, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ReservationsScreen() {
    const router = useRouter();

    const renderItem = ({ item }: { item: typeof RESERVATIONS[0] }) => (
        <View className="bg-white dark:bg-zinc-800 p-4 rounded-2xl mb-4 border border-gray-100 dark:border-white/5 shadow-sm">

            {/* Header: Status & Price */}
            <View className="flex-row justify-between items-center mb-4">
                <View className={`px-3 py-1 rounded-full ${item.status === 'upcoming' ? 'bg-blue-100 dark:bg-blue-500/20' :
                    item.status === 'completed' ? 'bg-green-100 dark:bg-green-500/20' : 'bg-red-100 dark:bg-red-500/20'
                    }`}>
                    <Text className={`text-xs font-bold capitalize ${item.status === 'upcoming' ? 'text-blue-600 dark:text-blue-400' :
                        item.status === 'completed' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                        {item.status === 'upcoming' ? 'À venir' : item.status === 'completed' ? 'Terminé' : 'Annulé'}
                    </Text>
                </View>
                <Text className="text-gray-900 dark:text-white font-bold">{item.price}</Text>
            </View>

            {/* Guide Info */}
            <View className="flex-row items-center mb-4">
                <Image source={item.image} className="w-12 h-12 rounded-full mr-3" />
                <View>
                    <Text className="text-gray-900 dark:text-white font-bold text-lg">{item.guideName}</Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-sm">{item.serviceName}</Text>
                </View>
            </View>

            {/* Details Grid */}
            <View className="bg-gray-50 dark:bg-zinc-900 p-3 rounded-xl mb-4">
                <View className="flex-row items-center mb-2">
                    <Calendar size={14} className="text-gray-400 mr-2" />
                    <Text className="text-gray-700 dark:text-gray-300 text-sm mr-4">{item.date}</Text>
                    <Clock size={14} className="text-gray-400 mr-2" />
                    <Text className="text-gray-700 dark:text-gray-300 text-sm">{item.time}</Text>
                </View>
                <View className="flex-row items-center">
                    <MapPin size={14} className="text-gray-400 mr-2" />
                    <Text className="text-gray-700 dark:text-gray-300 text-sm">{item.location}</Text>
                </View>
            </View>

            {/* Actions */}
            <View className="flex-row gap-3">
                <TouchableOpacity
                    className="flex-1 bg-primary/10 py-3 rounded-xl flex-row items-center justify-center border border-primary/20"
                    onPress={() => router.push(`/chat/${item.guideId}`)}
                >
                    <MessageCircle size={18} className="text-primary mr-2" />
                    <Text className="text-primary font-bold">Message</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 bg-gray-100 dark:bg-zinc-700 py-3 rounded-xl items-center justify-center">
                    <Text className="text-gray-700 dark:text-gray-300 font-bold">Détails</Text>
                </TouchableOpacity>
            </View>

        </View>
    );

    return (
        <View className="flex-1 bg-white dark:bg-zinc-900">
            <StatusBar barStyle="light-content" />
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView className="flex-1 px-6 pt-4">

                {/* Header */}
                <View className="flex-row items-center mb-6">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="bg-gray-100 dark:bg-zinc-800 p-2 rounded-full mr-4"
                    >
                        <ArrowLeft size={24} className="text-white" />
                    </TouchableOpacity>
                    <Text className="text-2xl font-bold text-gray-900 dark:text-white">Vos Réservations</Text>
                </View>

                {/* List */}
                <FlatList
                    data={RESERVATIONS}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40 }}
                    ListEmptyComponent={
                        <View className="items-center justify-center py-20">
                            <Text className="text-gray-400">Aucune réservation pour le moment.</Text>
                        </View>
                    }
                />

            </SafeAreaView>
        </View>
    );
}
