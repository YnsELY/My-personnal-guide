import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle, MapPin, User, Wallet } from 'lucide-react-native';
import React from 'react';
import { Alert, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BookingSummaryScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Parse params
    const guideName = params.guideName as string;
    const startDate = params.startDate;
    const endDate = params.endDate;
    const service = params.service as string;
    const location = params.location as string;
    const totalPrice = params.totalPrice;
    const pilgrims = params.pilgrims ? JSON.parse(params.pilgrims as string) : [];

    const handlePayment = () => {
        Alert.alert(
            "Paiement",
            "Redirection vers la passerelle de paiement sécurisée...",
            [
                { text: "OK", onPress: () => router.push('/') }
            ]
        );
    };

    return (
        <View className="flex-1 bg-white dark:bg-zinc-900">
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="light-content" />
            <SafeAreaView className="flex-1">

                {/* Header */}
                <View className="flex-row items-center px-6 py-4 border-b border-gray-100 dark:border-white/5">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="bg-gray-100 dark:bg-zinc-800 p-2 rounded-full mr-4"
                    >
                        <ArrowLeft size={24} className="text-gray-900 dark:text-white" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-gray-900 dark:text-white">Récapitulatif</Text>
                </View>

                <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>

                    {/* Success Header */}
                    <View className="items-center mb-8">
                        <View className="bg-green-100 dark:bg-green-500/10 p-4 rounded-full mb-4">
                            <CheckCircle size={48} className="text-green-600 dark:text-green-500" />
                        </View>
                        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Presque terminé !</Text>
                        <Text className="text-gray-500 dark:text-gray-400 text-center">Veuillez vérifier les détails de votre réservation avant de procéder au paiement.</Text>
                    </View>

                    {/* Card Recap */}
                    <View className="bg-gray-50 dark:bg-zinc-800 p-6 rounded-3xl border border-gray-200 dark:border-white/5 mb-8">

                        <View className="border-b border-gray-200 dark:border-white/10 pb-4 mb-4">
                            <Text className="text-gray-500 dark:text-gray-400 text-sm mb-1 uppercase tracking-wider">Guide</Text>
                            <Text className="text-xl font-bold text-gray-900 dark:text-white">{guideName}</Text>
                        </View>

                        <View className="flex-row justify-between mb-4">
                            <View>
                                <Text className="text-gray-500 dark:text-gray-400 text-sm mb-1">Dates</Text>
                                <Text className="text-base font-medium text-gray-900 dark:text-white">Du {startDate} au {endDate} Jan</Text>
                            </View>
                            <View className="items-end">
                                <Text className="text-gray-500 dark:text-gray-400 text-sm mb-1">Service</Text>
                                <Text className="text-base font-medium text-gray-900 dark:text-white">{service}</Text>
                            </View>
                        </View>

                        <View className="flex-row justify-between mb-4">
                            <View>
                                <Text className="text-gray-500 dark:text-gray-400 text-sm mb-1">Prise en charge</Text>
                                <View className="flex-row items-center">
                                    <MapPin size={14} className="text-[#b39164] mr-1" />
                                    <Text className="text-base font-medium text-gray-900 dark:text-white">{location}</Text>
                                </View>
                            </View>
                        </View>

                        <View className="border-t border-gray-200 dark:border-white/10 pt-4 mt-2">
                            <Text className="text-gray-500 dark:text-gray-400 text-sm mb-2">Pèlerins ({pilgrims.length})</Text>
                            <View className="flex-row flex-wrap gap-2">
                                {pilgrims.map((p: string, i: number) => (
                                    <View key={i} className="bg-white dark:bg-zinc-700 px-3 py-1 rounded-lg flex-row items-center border border-gray-100 dark:border-white/5">
                                        <User size={12} className="text-gray-400 mr-1.5" />
                                        <Text className="text-gray-700 dark:text-gray-200 text-sm">{p}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                    </View>

                    {/* Price Breakdown */}
                    <View className="mb-8">
                        <View className="flex-row justify-between items-center mb-2">
                            <Text className="text-gray-500 dark:text-gray-400">Sous-total</Text>
                            <Text className="text-gray-900 dark:text-white font-medium">{totalPrice} SAR</Text>
                        </View>
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-gray-500 dark:text-gray-400">Frais de service (5%)</Text>
                            <Text className="text-gray-900 dark:text-white font-medium">{(Number(totalPrice) * 0.05).toFixed(0)} SAR</Text>
                        </View>
                        <View className="border-t border-gray-200 dark:border-white/10 pt-4 flex-row justify-between items-center">
                            <Text className="text-xl font-bold text-gray-900 dark:text-white">Total à payer</Text>
                            <Text className="text-3xl font-bold text-primary">{(Number(totalPrice) * 1.05).toFixed(0)} SAR</Text>
                        </View>
                    </View>

                </ScrollView>

                {/* Bottom Action */}
                <View className="p-6 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-zinc-900">
                    <TouchableOpacity
                        className="bg-[#b39164] w-full py-4 rounded-2xl flex-row items-center justify-center shadow-lg shadow-[#b39164]/20"
                        onPress={handlePayment}
                    >
                        <Wallet size={20} color="white" className="mr-3" />
                        <Text className="text-white font-bold text-lg">Passer au paiement</Text>
                    </TouchableOpacity>
                </View>

            </SafeAreaView>
        </View>
    );
}
