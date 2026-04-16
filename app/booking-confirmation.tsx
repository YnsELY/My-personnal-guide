import { formatEUR } from '@/lib/pricing';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import i18n from '@/lib/i18n';
import { Calendar, Check, MapPin, User } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const getLocale = () => i18n.language === 'ar' ? 'ar-SA' : 'fr-FR';

const formatBookingDate = (value: unknown, fallback: string) => {
    if (!value) return fallback;

    const tryFormat = (d: Date) =>
        Number.isNaN(d.getTime()) ? null : d.toLocaleDateString(getLocale(), { day: '2-digit', month: '2-digit', year: 'numeric' });

    if (typeof value === 'number') return tryFormat(new Date(value)) ?? String(value);

    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return fallback;
        if (/^\d+$/.test(trimmed)) return tryFormat(new Date(Number(trimmed))) ?? trimmed;
        return tryFormat(new Date(trimmed)) ?? trimmed;
    }

    return String(value);
};

export default function BookingConfirmationScreen() {
    const { t } = useTranslation('booking');
    const router = useRouter();
    const params = useLocalSearchParams();

    // Parse params if needed or use directly
    const { serviceName, date, time, price, location, guideName, walletAmountUsed, cardAmountPaid, transportPickupType, hotelAddress, hotelOver2KmByCar, hotelDistanceKm, transportExtraFeeAmount } = params;
    const totalPrice = Number(price || 0);
    const walletPaid = Number(walletAmountUsed || 0);
    const cardPaid = Number(cardAmountPaid || Math.max(totalPrice - walletPaid, 0));
    const formattedDate = formatBookingDate(date, t('confirmation.dateNotSpecified'));
    const normalizedPickupType = transportPickupType === 'hotel' ? 'hotel' : transportPickupType === 'haram' ? 'haram' : null;
    const over2Km = hotelOver2KmByCar === 'true' ? true : hotelOver2KmByCar === 'false' ? false : null;
    const distanceKm = hotelDistanceKm ? Number(hotelDistanceKm) : null;
    const transportExtra = Number(transportExtraFeeAmount || 0);

    return (
        <View className="flex-1 bg-white dark:bg-zinc-900">
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="light-content" />
            <SafeAreaView className="flex-1">
                <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, paddingBottom: 100 }}>
                    {/* Success Header */}
                    <View className="items-center mb-8 mt-10">
                        <View className="w-20 h-20 bg-green-500 rounded-full items-center justify-center mb-6 shadow-lg shadow-green-500/30">
                            <Check size={40} color="white" strokeWidth={3} />
                        </View>
                        <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                            {t('confirmation.title')}
                        </Text>
                        <Text className="text-gray-500 text-center text-base">
                            {t('confirmation.subtitle')}
                        </Text>
                    </View>

                    {/* Recap Card */}
                    <View className="bg-gray-50 dark:bg-zinc-800 rounded-2xl p-6 border border-gray-100 dark:border-white/5 mb-8">
                        <Text className="text-lg font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-white/10 pb-4">
                            {t('confirmation.recap')}
                        </Text>

                        <View className="space-y-4">
                            {/* Service */}
                            <View className="flex-row items-start mb-4">
                                <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-3 mt-1">
                                    <User size={16} color="#b39164" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-500 text-xs mb-1">{t('confirmation.serviceAndGuide')}</Text>
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
                                    <Text className="text-gray-500 text-xs mb-1">{t('confirmation.dateAndTime')}</Text>
                                    <Text className="text-gray-900 dark:text-white font-semibold text-base">{t('confirmation.dateAtTime', { date: formattedDate, time })}</Text>
                                </View>
                            </View>

                            {/* Location */}
                            <View className="flex-row items-start mb-4">
                                <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-3 mt-1">
                                    <MapPin size={16} color="#b39164" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-500 text-xs mb-1">{t('confirmation.meetingPoint')}</Text>
                                    <Text className="text-gray-900 dark:text-white font-semibold text-base">{location}</Text>
                                </View>
                            </View>

                            {/* Transport */}
                            <View className="flex-row items-start mb-4">
                                <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-3 mt-1">
                                    <MapPin size={16} color="#b39164" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-500 text-xs mb-1">{t('confirmation.transport')}</Text>
                                    <Text className="text-gray-900 dark:text-white font-semibold text-base">
                                        {normalizedPickupType === 'haram'
                                            ? t('confirmation.meetAtHaram')
                                            : normalizedPickupType === 'hotel'
                                                ? t('confirmation.meetAtHotel')
                                                : t('confirmation.transportNotSpecified')}
                                    </Text>
                                    {normalizedPickupType === 'hotel' && !!hotelAddress && (
                                        <Text className="text-gray-500 text-sm mt-0.5">{hotelAddress}</Text>
                                    )}
                                    {normalizedPickupType === 'hotel' && over2Km !== null && (
                                        <Text className="text-gray-500 text-sm mt-0.5">
                                            {over2Km
                                                ? t('confirmation.distanceOver2km', { km: Number.isFinite(distanceKm || NaN) ? distanceKm : '?' })
                                                : t('confirmation.distanceUnder2km')}
                                        </Text>
                                    )}
                                    {transportExtra > 0 && (
                                        <Text className="text-emerald-600 dark:text-emerald-300 text-sm mt-0.5">
                                            {t('confirmation.transportSupplement', { amount: formatEUR(transportExtra) })}
                                        </Text>
                                    )}
                                </View>
                            </View>

                            {/* Price */}
                            <View className="pt-4 border-t border-gray-200 dark:border-white/10 mt-2">
                                <View className="flex-row items-center justify-between">
                                    <Text className="text-gray-500 font-medium">{t('confirmation.totalPrice')}</Text>
                                    <Text className="text-xl font-bold text-primary">{formatEUR(totalPrice)}</Text>
                                </View>
                                <View className="flex-row items-center justify-between mt-2">
                                    <Text className="text-gray-500 text-sm">{t('confirmation.paidByWallet')}</Text>
                                    <Text className="text-gray-900 dark:text-white text-sm font-semibold">{formatEUR(walletPaid)}</Text>
                                </View>
                                <View className="flex-row items-center justify-between mt-1">
                                    <Text className="text-gray-500 text-sm">{t('confirmation.paidByCard')}</Text>
                                    <Text className="text-gray-900 dark:text-white text-sm font-semibold">{formatEUR(cardPaid)}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Actions */}
                    <View className="gap-4">
                        <TouchableOpacity
                            onPress={() => router.push('/my-reservations')}
                            className="bg-[#b39164] py-4 rounded-xl items-center shadow-lg shadow-primary/30"
                        >
                            <Text className="text-white font-bold text-lg">{t('confirmation.viewReservations')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.dismissAll()}
                            className="bg-transparent py-4 rounded-xl items-center border border-gray-200 dark:border-white/10"
                        >
                            <Text className="text-gray-900 dark:text-white font-semibold text-base">{t('confirmation.backToHome')}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
