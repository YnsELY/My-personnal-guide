import BookingModal from '@/components/BookingModal';
import { GUIDES } from '@/constants/data';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MessageCircle, ShieldCheck, Star } from 'lucide-react-native';
import React, { useState } from 'react';
import { Image, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GuideDetails() {
    const { id, startDate, endDate } = useLocalSearchParams();
    const router = useRouter();
    const guide = GUIDES.find(g => g.id === id) || GUIDES[0];
    const [isBookingModalVisible, setBookingModalVisible] = useState(false);

    return (
        <View className="flex-1 bg-white dark:bg-zinc-900">
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="default" />

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Header Image */}
                <View className="relative h-64">
                    <Image
                        source={guide.location.toLowerCase().includes('medina')
                            ? require('@/assets/images/medina.jpeg')
                            : require('@/assets/images/mecca.jpg')
                        }
                        className="w-full h-full object-cover"
                    />
                    <View className="absolute inset-0 bg-black/30" />
                    <View className="absolute inset-0 bg-gradient-to-t from-gray-50 dark:from-zinc-900 to-transparent" />

                    <View className="absolute top-0 left-0 right-0 p-6 pt-12 flex-row justify-between">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="bg-black/30 p-2 rounded-full backdrop-blur-md border border-white/20"
                        >
                            <ArrowLeft color="white" size={24} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Content */}
                <View className="-mt-16 px-6 pb-32">
                    {/* Circle Avatar */}
                    <View className="flex-row justify-between items-end mb-4">
                        <View className="relative">
                            <Image
                                source={guide.image}
                                className="w-32 h-32 rounded-full border-4 border-white dark:border-zinc-900"
                            />
                            {guide.verified && (
                                <View className="absolute bottom-0 right-0 bg-white dark:bg-zinc-900 p-1.5 rounded-full">
                                    <ShieldCheck size={20} color="#b39164" fill="#b39164" />
                                </View>
                            )}
                        </View>

                        <View className="mb-2">
                            <View className="flex-row items-center bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
                                <Star size={14} color="#b39164" fill="#b39164" />
                                <Text className="text-primary font-bold ml-1.5">{guide.rating} ({guide.reviews})</Text>
                            </View>
                        </View>
                    </View>

                    <View className="mb-6">
                        <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{guide.name}</Text>
                        <Text className="text-gray-500 dark:text-gray-400 text-lg">{guide.role} • {guide.location}</Text>
                    </View>

                    <View className="flex-row items-center mb-6">
                        <Text className="text-3xl font-bold text-primary">{guide.price}</Text>
                        <Text className="text-gray-500 dark:text-gray-400 text-sm ml-2 self-end mb-1">{guide.priceUnit}</Text>
                    </View>

                    {/* Stats Row */}
                    <View className="flex-row items-center justify-between py-6 border-y border-gray-100 dark:border-white/5 mb-6 bg-gray-50 dark:bg-zinc-800/30 rounded-2xl px-4">
                        <View className="items-center flex-1 border-r border-gray-200 dark:border-white/5">
                            <View className="flex-row items-center">
                                <Star size={20} color="#b39164" fill="#b39164" />
                                <Text className="text-xl font-bold text-gray-900 dark:text-white ml-2">{guide.rating}</Text>
                            </View>
                            <Text className="text-gray-500 text-xs mt-1">Note</Text>
                        </View>

                        <View className="items-center flex-1 border-r border-gray-200 dark:border-white/5">
                            <Text className="text-xl font-bold text-gray-900 dark:text-white">{guide.reviews}</Text>
                            <Text className="text-gray-500 text-xs mt-1">Avis</Text>
                        </View>

                        <View className="items-center flex-1">
                            <Text className="text-xl font-bold text-gray-900 dark:text-white">{guide.location}</Text>
                            <Text className="text-gray-500 text-xs mt-1">Lieu</Text>
                        </View>
                    </View>

                    <Text className="text-xl font-bold text-gray-900 dark:text-white mb-3">À propos</Text>
                    <Text className="text-gray-500 dark:text-gray-400 leading-7 mb-8 text-base">
                        {guide.bio}
                        En tant que guide expérimenté, je m'engage à vous fournir une expérience spirituelle inoubliable, en respectant la Sunnah et en vous accompagnant à chaque étape.
                    </Text>

                    <Text className="text-xl font-bold text-gray-900 dark:text-white mb-3">Langues</Text>
                    <View className="flex-row flex-wrap gap-2 mb-6">
                        {guide.languages.map((lang, idx) => (
                            <View key={idx} className="bg-white dark:bg-zinc-800 px-5 py-3 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm">
                                <Text className="text-gray-600 dark:text-gray-300 font-medium">{lang}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Action Bar */}
            <View className="absolute bottom-0 left-0 right-0 bg-white/90 dark:bg-zinc-900/90 p-6 border-t border-gray-100 dark:border-white/5 backdrop-blur-xl">
                <SafeAreaView edges={['bottom']} className="flex-row gap-4">
                    <TouchableOpacity className="bg-gray-100 dark:bg-zinc-800 p-4 rounded-2xl items-center justify-center border border-gray-200 dark:border-white/10">
                        <MessageCircle size={24} className="text-gray-700 dark:text-white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="bg-primary flex-1 p-4 rounded-2xl items-center justify-center shadow-lg shadow-primary/20"
                        onPress={() => setBookingModalVisible(true)}
                    >
                        <Text className="text-white dark:text-black font-bold text-lg">Réserver maintenant</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </View>

            {/* Booking Modal */}
            <BookingModal
                visible={isBookingModalVisible}
                onClose={() => setBookingModalVisible(false)}
                startDate={startDate ? Number(startDate) : undefined}
                endDate={endDate ? Number(endDate) : undefined}
                guideName={guide.name}
            />
        </View>
    );
}
