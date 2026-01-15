import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, Check, MapPin, User } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BookingConfirmationScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Parse params if needed or use directly
    const { serviceName, date, time, price, location, guideName } = params;

    return (
        <View className="flex-1 bg-white dark:bg-zinc-900">
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="dark-content" />
            <SafeAreaView className="flex-1">
                <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, paddingBottom: 100 }}>
                    {/* Success Header */}
                    <View className="items-center mb-8 mt-10">
                        <View className="w-20 h-20 bg-green-500 rounded-full items-center justify-center mb-6 shadow-lg shadow-green-500/30">
                            <Check size={40} color="white" strokeWidth={3} />
                        </View>
                        <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                            Réservation Confirmée !
                        </Text>
                        <Text className="text-gray-500 text-center text-base">
                            Votre réservation a été enregistrée avec succès.
                        </Text>
                    </View>

                    {/* Recap Card */}
                    <View className="bg-gray-50 dark:bg-zinc-800 rounded-2xl p-6 border border-gray-100 dark:border-white/5 mb-8">
                        <Text className="text-lg font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-white/10 pb-4">
                            Récapitulatif
                        </Text>

                        <View className="space-y-4">
                            {/* Service */}
                            <View className="flex-row items-start mb-4">
                                <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-3 mt-1">
                                    <User size={16} color="#b39164" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-500 text-xs mb-1">Service & Guide</Text>
                                    <Text className="text-gray-900 dark:text-white font-semibold text-base">{serviceName}</Text>
                                    <Text className="text-gray-500 text-sm">{guideName}</Text>
                                </View>
                            </View>

                            {/* Date & Time */}
                            <View className="flex-row items-start mb-4">
                                <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-3 mt-1">
                                    <Calendar size={16} color="#b39164" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-500 text-xs mb-1">Date et Heure</Text>
                                    <Text className="text-gray-900 dark:text-white font-semibold text-base"> Le {date} à {time}</Text>
                                </View>
                            </View>

                            {/* Location */}
                            <View className="flex-row items-start mb-4">
                                <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-3 mt-1">
                                    <MapPin size={16} color="#b39164" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-500 text-xs mb-1">Lieu de rendez-vous</Text>
                                    <Text className="text-gray-900 dark:text-white font-semibold text-base">{location}</Text>
                                </View>
                            </View>

                            {/* Price */}
                            <View className="flex-row items-center justify-between pt-4 border-t border-gray-200 dark:border-white/10 mt-2">
                                <Text className="text-gray-500 font-medium">Prix Total</Text>
                                <Text className="text-xl font-bold text-primary">{price} SAR</Text>
                            </View>
                        </View>
                    </View>

                    {/* Actions */}
                    <View className="gap-4">
                        <TouchableOpacity
                            onPress={() => router.push('/my-reservations')}
                            className="bg-[#b39164] py-4 rounded-xl items-center shadow-lg shadow-primary/30"
                        >
                            <Text className="text-white font-bold text-lg">Voir mes réservations</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.dismissAll()}
                            className="bg-transparent py-4 rounded-xl items-center border border-gray-200 dark:border-white/10"
                        >
                            <Text className="text-gray-900 dark:text-white font-semibold text-base">Retour à l'accueil</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
