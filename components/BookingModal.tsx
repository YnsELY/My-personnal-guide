import CalendarPicker from '@/components/CalendarPicker';
import { CHARTER_TEXT } from '@/constants/charter';
import { CATEGORIES } from '@/constants/data';
import { useAuth } from '@/context/AuthContext';
import { useReservations } from '@/context/ReservationsContext';
import { cancelStripeCheckoutReservation, createReservation, getPilgrimWalletSummary, getReservedGuideTimeSlots, PILGRIM_CHARTER_VERSION, startStripeCheckoutForReservation } from '@/lib/api';
import i18n from '@/lib/i18n';
import { formatEUR, roundMoney } from '@/lib/pricing';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Calendar, MapPin, Plus, Trash2, User, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Linking from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';

interface BookingModalProps {
    visible: boolean;
    onClose: () => void;
    startDate?: number | null;
    endDate?: number | null;
    guideName: string;
    guideId: string;
    guideGender: 'male' | 'female';
    basePrice?: number;
    service: any; // Passed service object
}

const formatCurrency = (value: number) => formatEUR(value || 0);
const getLocale = () => i18n.language === 'ar' ? 'ar-SA' : 'fr-FR';

export default function BookingModal({ visible, onClose, startDate, endDate, guideName, guideId, guideGender, basePrice = 200, service }: BookingModalProps) {
    const { t } = useTranslation('booking');
    const router = useRouter();
    const { profile } = useAuth();
    const { refreshReservations } = useReservations();
    // Default to service category or title. 
    // User says "Service que propose le guide" so we stick to that.
    const [selectedService, setSelectedService] = useState(service?.category || CATEGORIES[1].name);

    // Re-sync if service changes
    useEffect(() => {
        if (service) {
            setSelectedService(service.category);
        }
    }, [service]);

    const [pilgrims, setPilgrims] = useState<{ name: string, age: string }[]>([{ name: t('myself'), age: '' }]); // Default to self
    const [newPilgrimName, setNewPilgrimName] = useState('');
    const [newPilgrimAge, setNewPilgrimAge] = useState('');
    const [transportPickupType, setTransportPickupType] = useState<'haram' | 'hotel' | null>(null);
    const [hotelAddress, setHotelAddress] = useState('');
    const [hotelOver2KmByCar, setHotelOver2KmByCar] = useState<boolean | null>(null);
    const [hotelDistanceKm, setHotelDistanceKm] = useState('');
    const [transportWarningAcknowledged, setTransportWarningAcknowledged] = useState(false);
    const [visitDate, setVisitDate] = useState<number | null>(startDate || null);
    const [visitTime, setVisitTime] = useState<string | null>(null);
    const [showCalendar, setShowCalendar] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showCharterModal, setShowCharterModal] = useState(false);
    const [pilgrimCharterAccepted, setPilgrimCharterAccepted] = useState(false);
    const [useWalletBalance, setUseWalletBalance] = useState(false);
    const [walletSummary, setWalletSummary] = useState<Awaited<ReturnType<typeof getPilgrimWalletSummary>> | null>(null);
    const [walletLoading, setWalletLoading] = useState(false);
    const [reservedTimeSlots, setReservedTimeSlots] = useState<string[]>([]);
    const [reservedSlotsLoading, setReservedSlotsLoading] = useState(false);

    // Sync state with props when modal opens/changes
    useEffect(() => {
        if (startDate) {
            setVisitDate(startDate);
        }
    }, [startDate]);

    useEffect(() => {
        if (!visible) return;

        let isMounted = true;
        setTransportPickupType(null);
        setHotelAddress('');
        setHotelOver2KmByCar(null);
        setHotelDistanceKm('');
        setTransportWarningAcknowledged(false);
        setUseWalletBalance(false);
        setPilgrimCharterAccepted(false);
        setWalletLoading(true);
        getPilgrimWalletSummary()
            .then((summary) => {
                if (!isMounted) return;
                setWalletSummary(summary);
            })
            .catch((error) => {
                console.error('Failed to load pilgrim wallet summary:', error);
                if (!isMounted) return;
                setWalletSummary(null);
                setUseWalletBalance(false);
            })
            .finally(() => {
                if (!isMounted) return;
                setWalletLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [visible]);

    useEffect(() => {
        if (!visible || !guideId || !visitDate) {
            setReservedTimeSlots([]);
            return;
        }

        let isMounted = true;
        setReservedSlotsLoading(true);
        getReservedGuideTimeSlots(guideId, visitDate)
            .then((slots) => {
                if (!isMounted) return;
                setReservedTimeSlots(slots);
                setVisitTime((current) => (current && slots.includes(current) ? null : current));
            })
            .catch((error) => {
                console.error('Failed to load reserved time slots:', error);
                if (!isMounted) return;
                setReservedTimeSlots([]);
            })
            .finally(() => {
                if (!isMounted) return;
                setReservedSlotsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [visible, guideId, visitDate]);

    // Use passed service directly
    const activeService = service;

    // Omra Badal : prestation à distance, pas de lieu de prise en charge
    const isBadal = (selectedService || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('badal');

    // Price logic (EUR): base service + transport
    const normalizedHotelDistanceInput = hotelDistanceKm.replace(',', '.');
    const parsedHotelDistanceKm = Number(normalizedHotelDistanceInput);
    const hotelDistanceIsValid = Number.isFinite(parsedHotelDistanceKm) && parsedHotelDistanceKm > 2;
    const transportExtraFeeAmount = transportPickupType === 'hotel' && hotelOver2KmByCar === true ? 10 : 0;
    const resolvedServiceName = String(activeService?.title || selectedService || 'Service');
    const fallbackDisplayedPrice = Number(activeService?.price ?? activeService?.price_override ?? basePrice ?? 200);
    const serviceBasePrice = Number.isFinite(fallbackDisplayedPrice) && fallbackDisplayedPrice > 0
        ? roundMoney(fallbackDisplayedPrice)
        : 200;
    const commissionableNetAmount = serviceBasePrice;
    const totalPrice = roundMoney(serviceBasePrice + transportExtraFeeAmount);
    const availableWalletBalance = Number(walletSummary?.availableBalance || 0);
    const walletAmountUsed = useWalletBalance ? Math.min(availableWalletBalance, totalPrice) : 0;
    const cardAmountPaid = Math.max(totalPrice - walletAmountUsed, 0);
    const isFemalePilgrim = profile?.role === 'pilgrim' && profile?.gender === 'female';
    const isMaleGuide = guideGender === 'male';
    const requiresFemaleCompanionForMaleGuide = isFemalePilgrim && isMaleGuide;
    const isFemaleSoloWithMaleGuideBlocked = requiresFemaleCompanionForMaleGuide && pilgrims.length < 2;
    const shouldShowPilgrimsSection = selectedService !== 'Omra seule' || requiresFemaleCompanionForMaleGuide || pilgrims.length > 1;
    const isHotelFlowValid = transportPickupType !== 'hotel'
        || (
            hotelAddress.trim().length > 0
            && hotelOver2KmByCar !== null
            && (
                (hotelOver2KmByCar === true && hotelDistanceIsValid)
                || (hotelOver2KmByCar === false && transportWarningAcknowledged)
            )
        );
    const canOpenConfirmation = (isBadal || !!transportPickupType) && !!visitDate && !!visitTime && !isFemaleSoloWithMaleGuideBlocked && (isBadal || isHotelFlowValid) && pilgrimCharterAccepted;

    const handleAddPilgrim = () => {
        if (newPilgrimName.trim().length > 0) {
            setPilgrims([...pilgrims, { name: newPilgrimName.trim(), age: newPilgrimAge.trim() }]);
            setNewPilgrimName('');
            setNewPilgrimAge('');
        }
    };

    const handleRemovePilgrim = (index: number) => {
        const newPilgrims = [...pilgrims];
        newPilgrims.splice(index, 1);
        setPilgrims(newPilgrims);
    };

    const handleValidate = async () => {
        if (!isBadal) {
            if (!transportPickupType) {
                Alert.alert(t('modal.alertTransportMissing'), t('modal.alertTransportMissingMsg'));
                return;
            }
            if (transportPickupType === 'hotel' && !hotelAddress.trim()) {
                Alert.alert(t('modal.alertAddressRequired'), t('modal.alertAddressRequiredMsg'));
                return;
            }
            if (transportPickupType === 'hotel' && hotelOver2KmByCar === null) {
                Alert.alert(t('modal.alertDistanceRequired'), t('modal.alertDistanceRequiredMsg'));
                return;
            }
            if (transportPickupType === 'hotel' && hotelOver2KmByCar === true && !hotelDistanceIsValid) {
                Alert.alert(t('modal.alertDistanceInvalid'), t('modal.alertDistanceInvalidMsg'));
                return;
            }
            if (transportPickupType === 'hotel' && hotelOver2KmByCar === false && !transportWarningAcknowledged) {
                Alert.alert(t('modal.alertConfirmRequired'), t('modal.alertConfirmRequiredMsg'));
                return;
            }
        }
        if (!visitDate) {
            Alert.alert(t('modal.alertDateMissing'), t('modal.alertDateMissingMsg'));
            return;
        }
        if (!pilgrimCharterAccepted) {
            Alert.alert(t('modal.alertCharterRequired'), t('modal.alertCharterRequiredMsg'));
            return;
        }
        if (!visitTime) {
            Alert.alert(t('modal.alertTimeMissing'), t('modal.alertTimeMissingMsg'));
            return;
        }
        if (reservedTimeSlots.includes(visitTime)) {
            Alert.alert(t('modal.alertSlotTaken'), t('modal.alertSlotTakenMsg'));
            return;
        }
        if (isFemaleSoloWithMaleGuideBlocked) {
            Alert.alert(t('modal.alertBookingBlocked'), t('femaleSoloWithMaleGuide'));
            return;
        }

        setLoading(true);
        try {
            const latestReservedSlots = await getReservedGuideTimeSlots(guideId, visitDate);
            setReservedTimeSlots(latestReservedSlots);
            if (visitTime && latestReservedSlots.includes(visitTime)) {
                setVisitTime(null);
                Alert.alert(t('modal.alertSlotTaken'), t('modal.alertSlotJustTakenMsg'));
                return;
            }

            // Format pilgrims as string for now: "Name (Age ans)" or just Name if no age
            const formattedPilgrims = pilgrims.map(p => p.age ? `${p.name} (${p.age} ans)` : p.name);
            const normalizedHotelDistanceKm = transportPickupType === 'hotel' && hotelOver2KmByCar === true
                ? parsedHotelDistanceKm
                : null;
            const normalizedHotelAddress = transportPickupType === 'hotel' ? hotelAddress.trim() : null;
            const resolvedLocation = isBadal
                ? t('modal.locationBadal')
                : transportPickupType === 'hotel'
                    ? t('modal.locationHotel', { address: normalizedHotelAddress })
                    : t('modal.locationHaram');

            if (cardAmountPaid > 0) {
                const paymentStatusUrl = Linking.createURL('/payment-status');
                const checkout = await startStripeCheckoutForReservation({
                    serviceId: String(activeService?.id || ''),
                    guideId,
                    serviceName: resolvedServiceName,
                    startDate: visitDate,
                    endDate: visitDate,
                    totalPrice,
                    location: resolvedLocation,
                    visitTime: visitTime,
                    pilgrims: formattedPilgrims,
                    transportPickupType: (transportPickupType ?? 'haram') as 'haram' | 'hotel',
                    hotelAddress: normalizedHotelAddress,
                    hotelOver2KmByCar: transportPickupType === 'hotel' ? hotelOver2KmByCar : null,
                    hotelDistanceKm: normalizedHotelDistanceKm,
                    transportExtraFeeAmount,
                    transportWarningAcknowledged: transportPickupType === 'hotel' ? transportWarningAcknowledged : true,
                    useWallet: useWalletBalance,
                    pilgrimCharterAccepted: true,
                    pilgrimCharterVersion: PILGRIM_CHARTER_VERSION,
                    successUrl: paymentStatusUrl,
                    cancelUrl: paymentStatusUrl,
                });

                const canOpenCheckout = await Linking.canOpenURL(checkout.checkoutUrl);
                if (!canOpenCheckout) {
                    await cancelStripeCheckoutReservation({
                        pendingCheckoutId: checkout.pendingCheckoutId,
                        reason: 'unable_to_open_checkout_url',
                    });
                    throw new Error(t('modal.alertPaymentError'));
                }

                onClose();
                await Linking.openURL(checkout.checkoutUrl);
                return;
            }

            const createdReservation = await createReservation({
                guideId,
                serviceName: resolvedServiceName,
                date: visitDate,
                startDate: visitDate,
                endDate: visitDate,
                price: totalPrice,
                location: resolvedLocation,
                visitTime: visitTime,
                pilgrims: formattedPilgrims,
                transportPickupType: (transportPickupType ?? 'haram') as 'haram' | 'hotel',
                hotelAddress: normalizedHotelAddress,
                hotelOver2KmByCar: transportPickupType === 'hotel' ? hotelOver2KmByCar : null,
                hotelDistanceKm: normalizedHotelDistanceKm,
                transportExtraFeeAmount,
                commissionableNetAmount,
                transportWarningAcknowledged: transportPickupType === 'hotel' ? transportWarningAcknowledged : true,
                pilgrimCharterAccepted: true,
                pilgrimCharterVersion: PILGRIM_CHARTER_VERSION,
            }, { useWallet: useWalletBalance });
            await refreshReservations();

            const walletUsed = Number(createdReservation?.wallet_amount_used || 0);
            const cardPaid = Number(createdReservation?.card_amount_paid || Math.max(totalPrice - walletUsed, 0));

            onClose();
            router.push({
                pathname: '/booking-confirmation',
                params: {
                    reservationId: createdReservation?.id,
                    serviceName: resolvedServiceName,
                    date: visitDate,
                    time: visitTime,
                    price: totalPrice,
                    walletAmountUsed: walletUsed,
                    cardAmountPaid: cardPaid,
                    location: resolvedLocation,
                    guideName: guideName,
                    transportPickupType,
                    hotelAddress: normalizedHotelAddress || '',
                    hotelOver2KmByCar: transportPickupType === 'hotel' ? String(hotelOver2KmByCar) : '',
                    hotelDistanceKm: normalizedHotelDistanceKm !== null ? String(normalizedHotelDistanceKm) : '',
                    transportExtraFeeAmount: String(transportExtraFeeAmount),
                }
            });
        } catch (error: any) {
            console.error(error);
            const normalizedMessage = String(error?.message || '')
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');
            if (
                normalizedMessage.includes('une femme ne peut pas reserver seule avec un guide homme')
                || normalizedMessage.includes('deuxième pèlerin')
                || normalizedMessage.includes('deuxieme pelerin')
                || normalizedMessage.includes('minimum 2')
            ) {
                Alert.alert(t('modal.alertBookingBlocked'), t('femaleSoloWithMaleGuide'));
            } else if (normalizedMessage.includes('charte du pèlerin') || normalizedMessage.includes('charte du pelerin')) {
                Alert.alert(t('modal.alertCharterRequired'), t('modal.alertCharterAcceptRequired'));
            } else if (normalizedMessage.includes('blocage')) {
                Alert.alert(t('modal.alertBookingBlocked'), t('modal.alertBlockedMsg'));
            } else {
                Alert.alert(t('common:error'), error.message || t('modal.alertGenericError'));
            }
        } finally {
            setLoading(false);
        }
    };

    // Helper for display
    const formattedVisitDate = visitDate
        ? new Date(visitDate).toLocaleDateString(getLocale(), { day: 'numeric', month: 'long', year: 'numeric' })
        : null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end">
                <TouchableOpacity
                    className="absolute inset-0 bg-black/60"
                    activeOpacity={1}
                    onPress={onClose}
                />

                <BlurView intensity={Platform.OS === 'ios' ? 40 : 100} tint="dark" className="bg-zinc-900 rounded-t-3xl overflow-hidden border-t border-white/10 h-[85%]">
                    <SafeAreaView edges={['bottom']} className="flex-1 p-6">

                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-2xl font-serif font-bold text-white">{t('modal.title')}</Text>
                            <TouchableOpacity onPress={onClose} className="bg-zinc-800 p-2 rounded-full">
                                <X size={20} color="white" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

                            {/* Date Selection */}
                            <Text className="text-white font-bold text-lg mb-4">{t('modal.visitDate')}</Text>
                            <TouchableOpacity
                                onPress={() => setShowCalendar(true)}
                                className={`flex-row items-center bg-zinc-800 border ${visitDate ? 'border-[#b39164]' : 'border-white/5'} rounded-xl p-4 mb-8`}
                            >
                                <Calendar color={visitDate ? "#b39164" : "#A1A1AA"} size={20} className="mr-3" />
                                <Text className={`font-medium text-base ${visitDate ? 'text-[#b39164]' : 'text-zinc-400'}`}>
                                    {formattedVisitDate ? t('modal.dateOn', { date: formattedVisitDate }) : t('modal.selectDate')}
                                </Text>
                            </TouchableOpacity>

                            {/* Time Selection */}
                            <Text className="text-white font-bold text-lg mb-4">{t('modal.visitTime')}</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8" contentContainerStyle={{ paddingRight: 20 }}>
                                {Array.from({ length: 15 }, (_, i) => i + 8).map((hour) => {
                                    const time = `${hour < 10 ? '0' + hour : hour}:00`;
                                    const isTaken = reservedTimeSlots.includes(time);
                                    const isSelected = visitTime === time;
                                    return (
                                        <TouchableOpacity
                                            key={time}
                                            onPress={() => {
                                                if (isTaken) return;
                                                setVisitTime(time);
                                            }}
                                            disabled={isTaken}
                                            className={`mr-3 px-5 py-3 rounded-xl border ${isTaken
                                                ? 'bg-zinc-900 border-red-500/30 opacity-60'
                                                : isSelected
                                                    ? 'bg-[#b39164] border-[#b39164]'
                                                    : 'bg-zinc-800 border-white/5'
                                                }`}
                                        >
                                            <Text className={`font-medium ${isTaken ? 'text-red-300' : isSelected ? 'text-white' : 'text-zinc-400'}`}>
                                                {time}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                            <Text className="text-zinc-500 text-xs mb-8 -mt-6">
                                {reservedSlotsLoading ? t('modal.checkingSlots') : t('modal.slotsUnavailableHint')}
                            </Text>


                            {shouldShowPilgrimsSection && (
                                <>
                                    <Text className="text-white font-bold text-lg mb-4">{t('modal.pilgrims', { count: pilgrims.length })}</Text>
                                    <View className="bg-zinc-800 rounded-2xl p-4 mb-2 border border-white/5">
                                        <View className="flex-row items-center mb-4 gap-3">
                                            <View className="flex-1 flex-row gap-2">
                                                <View className="flex-1 bg-zinc-900 rounded-xl px-4 py-3 flex-row items-center border border-white/5">
                                                    <User size={18} color="#71717A" />
                                                    <TextInput
                                                        placeholder={t('modal.pilgrimName')}
                                                        placeholderTextColor="#52525B"
                                                        className="flex-1 ml-3 text-white text-base"
                                                        value={newPilgrimName}
                                                        onChangeText={setNewPilgrimName}
                                                    />
                                                </View>
                                                <View className="w-24 bg-zinc-900 rounded-xl px-4 py-3 border border-white/5 justify-center">
                                                    <TextInput
                                                        placeholder={t('modal.pilgrimAge')}
                                                        placeholderTextColor="#52525B"
                                                        className="text-white text-base text-center"
                                                        value={newPilgrimAge}
                                                        onChangeText={setNewPilgrimAge}
                                                        keyboardType="numeric"
                                                    />
                                                </View>
                                            </View>
                                            <TouchableOpacity
                                                onPress={handleAddPilgrim}
                                                className="bg-[#b39164] w-12 h-12 rounded-xl items-center justify-center"
                                            >
                                                <Plus size={24} color="white" />
                                            </TouchableOpacity>
                                        </View>

                                        <View className="gap-3">
                                            {pilgrims.map((pilgrim, index) => (
                                                <View key={index} className="flex-row items-center justify-between bg-zinc-900/50 p-3 rounded-xl">
                                                    <View className="flex-row items-center">
                                                        <User size={16} color="#A1A1AA" />
                                                        <Text className="text-zinc-300 ml-3 font-medium">
                                                            {pilgrim.name} {pilgrim.age ? `(${t('modal.pilgrimAgeYears', { age: pilgrim.age })})` : ''}
                                                        </Text>
                                                    </View>
                                                    {index > 0 && (
                                                        <TouchableOpacity onPress={() => handleRemovePilgrim(index)}>
                                                            <Trash2 size={18} color="#EF4444" />
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                    {isFemaleSoloWithMaleGuideBlocked && (
                                        <View className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                                            <Text className="text-amber-200 text-xs">
                                                {t('femaleSoloWithMaleGuide')}
                                            </Text>
                                        </View>
                                    )}
                                    <View className="mb-8" />
                                </>
                            )}

                            {/* Transport Section — masqué pour Omra Badal (prestation à distance) */}
                            {!isBadal && <Text className="text-white font-bold text-lg mb-4">{t('modal.pickup')}</Text>}
                            {!isBadal && (
                                <>
                                    <View className="flex-row flex-wrap gap-3 mb-4">
                                        <TouchableOpacity
                                            onPress={() => {
                                                setTransportPickupType('haram');
                                                setHotelAddress('');
                                                setHotelOver2KmByCar(null);
                                                setHotelDistanceKm('');
                                                setTransportWarningAcknowledged(false);
                                            }}
                                            className={`px-4 py-3 rounded-xl border flex-row items-center ${transportPickupType === 'haram' ? 'bg-primary/20 border-primary' : 'bg-zinc-800 border-white/5'}`}
                                        >
                                            <MapPin size={16} color={transportPickupType === 'haram' ? '#b39164' : '#A1A1AA'} />
                                            <Text className={`ml-2 font-medium ${transportPickupType === 'haram' ? 'text-primary' : 'text-zinc-400'}`}>
                                                {t('modal.meetAtHaram')}
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={() => setTransportPickupType('hotel')}
                                            className={`px-4 py-3 rounded-xl border flex-row items-center ${transportPickupType === 'hotel' ? 'bg-primary/20 border-primary' : 'bg-zinc-800 border-white/5'}`}
                                        >
                                            <MapPin size={16} color={transportPickupType === 'hotel' ? '#b39164' : '#A1A1AA'} />
                                            <Text className={`ml-2 font-medium ${transportPickupType === 'hotel' ? 'text-primary' : 'text-zinc-400'}`}>
                                                {t('modal.meetAtHotel')}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    {transportPickupType === 'hotel' && (
                                        <View className="bg-zinc-800 border border-white/5 rounded-2xl p-4 mb-8">
                                            <Text className="text-white font-semibold mb-2">{t('modal.hotelAddress')}</Text>
                                            <TextInput
                                                value={hotelAddress}
                                                onChangeText={setHotelAddress}
                                                placeholder={t('modal.hotelAddressPlaceholder')}
                                                placeholderTextColor="#71717A"
                                                className="bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-white mb-4"
                                            />

                                            <Text className="text-white font-semibold mb-2">{t('modal.hotelOver2km')}</Text>
                                            <View className="flex-row gap-2 mb-3">
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        setHotelOver2KmByCar(false);
                                                        setHotelDistanceKm('');
                                                    }}
                                                    className={`flex-1 py-2.5 rounded-xl border items-center ${hotelOver2KmByCar === false ? 'bg-primary/20 border-primary' : 'bg-zinc-900 border-white/5'}`}
                                                >
                                                    <Text className={`${hotelOver2KmByCar === false ? 'text-primary' : 'text-zinc-300'} font-medium`}>{t('common:no')}</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        setHotelOver2KmByCar(true);
                                                        setTransportWarningAcknowledged(false);
                                                    }}
                                                    className={`flex-1 py-2.5 rounded-xl border items-center ${hotelOver2KmByCar === true ? 'bg-primary/20 border-primary' : 'bg-zinc-900 border-white/5'}`}
                                                >
                                                    <Text className={`${hotelOver2KmByCar === true ? 'text-primary' : 'text-zinc-300'} font-medium`}>{t('common:yes')}</Text>
                                                </TouchableOpacity>
                                            </View>

                                            {hotelOver2KmByCar === false && (
                                                <View className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                                                    <Text className="text-amber-200 text-xs leading-5">
                                                        {t('modal.hotelWarning')}
                                                    </Text>
                                                    <TouchableOpacity
                                                        onPress={() => setTransportWarningAcknowledged((prev) => !prev)}
                                                        className="mt-3 flex-row items-center"
                                                    >
                                                        <View className={`w-5 h-5 rounded-md border mr-2 items-center justify-center ${transportWarningAcknowledged ? 'bg-[#b39164] border-[#b39164]' : 'border-white/20 bg-zinc-900'}`}>
                                                            {transportWarningAcknowledged ? <Text className="text-white text-[10px]">✓</Text> : null}
                                                        </View>
                                                        <Text className="text-zinc-200 text-xs">{t('modal.hotelWarningAck')}</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )}

                                            {hotelOver2KmByCar === true && (
                                                <View>
                                                    <Text className="text-white font-semibold mb-2">{t('modal.distanceKm')}</Text>
                                                    <TextInput
                                                        value={hotelDistanceKm}
                                                        onChangeText={setHotelDistanceKm}
                                                        placeholder="Ex: 3.5"
                                                        placeholderTextColor="#71717A"
                                                        keyboardType="decimal-pad"
                                                        className="bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-white mb-2"
                                                    />
                                                    <Text className="text-emerald-300 text-xs">{t('modal.transportSupplement')}</Text>
                                                </View>
                                            )}
                                        </View>
                                    )}
                                </>
                            )}

                        </ScrollView>

                        {/* Footer */}
                        <View className="pt-4 border-t border-white/5 mt-auto">
                            <View className="flex-row justify-between items-end mb-4 px-2">
                                <View>
                                    <Text className="text-zinc-400 text-lg">{t('modal.estimatedTotal')}</Text>
                                    <Text className="text-zinc-500 text-xs">{t('modal.detailEur')}</Text>
                                </View>
                                <View className="items-end">
                                    <Text className="text-white font-bold text-3xl">{formatCurrency(totalPrice)}</Text>
                                </View>
                            </View>
                            {transportExtraFeeAmount > 0 && (
                                <View className="mb-4 rounded-xl border border-white/10 bg-zinc-800/70 px-4 py-3">
                                {transportExtraFeeAmount > 0 && (
                                    <View className="flex-row justify-between items-center mt-1.5">
                                        <Text className="text-zinc-400 text-xs">{t('modal.transport')}</Text>
                                        <Text className="text-zinc-200 text-xs font-medium">{formatCurrency(transportExtraFeeAmount)}</Text>
                                    </View>
                                )}
                                </View>
                            )}
                            <View className="mb-4 rounded-xl border border-white/10 bg-zinc-800/70 px-4 py-3">
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-1 pr-4">
                                        <Text className="text-white font-semibold">{t('modal.useWallet')}</Text>
                                        <Text className="text-zinc-400 text-xs mt-1">
                                            {t('modal.walletBalance', { balance: walletLoading ? t('common:loading') : formatCurrency(availableWalletBalance) })}
                                        </Text>
                                    </View>
                                    <Switch
                                        trackColor={{ false: '#3f3f46', true: '#b39164' }}
                                        thumbColor={useWalletBalance ? '#ffffff' : '#e4e4e7'}
                                        onValueChange={setUseWalletBalance}
                                        value={useWalletBalance}
                                        disabled={walletLoading || availableWalletBalance <= 0 || loading}
                                    />
                                </View>

                                <View className="mt-3 border-t border-white/10 pt-3">
                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-zinc-400 text-xs">{t('modal.walletUsed')}</Text>
                                        <Text className="text-zinc-200 text-xs font-medium">{formatCurrency(walletAmountUsed)}</Text>
                                    </View>
                                    <View className="flex-row justify-between items-center mt-1.5">
                                        <Text className="text-zinc-400 text-xs">{t('modal.remainingCard')}</Text>
                                        <Text className="text-zinc-200 text-xs font-medium">{formatCurrency(cardAmountPaid)}</Text>
                                    </View>
                                </View>
                            </View>
                            <TouchableOpacity
                                className={`py-4 rounded-2xl items-center shadow-lg ${canOpenConfirmation && !loading ? 'bg-[#b39164] shadow-[#b39164]/20' : 'bg-zinc-700'}`}
                                onPress={() => {
                                    if (loading) return;
                                    if (!isBadal && !transportPickupType) return;
                                    if (isFemaleSoloWithMaleGuideBlocked) {
                                        Alert.alert(t('modal.alertBookingBlocked'), t('femaleSoloWithMaleGuide'));
                                        return;
                                    }
                                    if (!visitDate || !visitTime) { Alert.alert(t('modal.alertIncomplete'), t('modal.alertIncompleteMsg')); return; }
                                    if (!isHotelFlowValid) { Alert.alert(t('modal.alertTransportIncomplete'), t('modal.alertTransportIncompleteMsg')); return; }
                                    if (!pilgrimCharterAccepted) {
                                        Alert.alert(t('modal.alertCharterRequired'), t('modal.alertCharterRequiredMsg'));
                                        return;
                                    }
                                    handleValidate();
                                }}
                                disabled={!canOpenConfirmation || loading}
                            >
                                {loading ? (
                                    <View className="flex-row items-center gap-3">
                                        <ActivityIndicator color="#ffffff" size="small" />
                                        <Text className="text-white font-bold text-lg">{t('modal.redirectingPayment')}</Text>
                                    </View>
                                ) : (
                                    <Text className={`font-bold text-lg ${canOpenConfirmation ? 'text-white' : 'text-zinc-500'}`}>
                                        {t('modal.book')}
                                    </Text>
                                )}
                            </TouchableOpacity>
                            <View className="mt-4 rounded-xl border border-white/10 bg-zinc-800/70 px-4 py-3">
                                <TouchableOpacity
                                    onPress={() => setPilgrimCharterAccepted((prev) => !prev)}
                                    className="flex-row items-center"
                                >
                                    <View className={`w-5 h-5 rounded-md border mr-2 items-center justify-center ${pilgrimCharterAccepted ? 'bg-[#b39164] border-[#b39164]' : 'border-white/30 bg-zinc-900'}`}>
                                        {pilgrimCharterAccepted ? <Text className="text-white text-[10px]">✓</Text> : null}
                                    </View>
                                    <Text className="text-zinc-200 text-xs flex-1">
                                        {t('modal.charterAccept')}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setShowCharterModal(true)} className="mt-2 self-start">
                                    <Text className="text-[#b39164] text-xs font-semibold">{t('modal.readCharter')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </SafeAreaView>
                </BlurView>
            </View>

            {/* Charter Confirmation Modal */}
            <Modal visible={showCharterModal} animationType="slide" presentationStyle="pageSheet">
                <View className="flex-1 bg-zinc-900">
                    <SafeAreaView className="flex-1">
                        <View className="flex-row justify-between items-center p-4 border-b border-white/10">
                            <Text className="text-xl font-bold text-white">{t('modal.charterTitle')}</Text>
                            <TouchableOpacity onPress={() => setShowCharterModal(false)} className="p-2">
                                <Text className="text-zinc-400 font-bold">{t('common:cancel')}</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView className="flex-1 p-6" contentContainerStyle={{ paddingBottom: 40 }}>
                            <Text className="text-zinc-300 leading-6 text-base">{CHARTER_TEXT}</Text>
                        </ScrollView>
                        <View className="p-4 border-t border-white/10 bg-zinc-800">
                            <Text className="text-zinc-400 text-xs mb-4 text-center">{t('modal.charterConfirmHint')}</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setPilgrimCharterAccepted(true);
                                    setShowCharterModal(false);
                                }}
                                disabled={loading}
                                className="bg-[#b39164] py-4 rounded-xl items-center shadow-sm"
                            >
                                <Text className="text-white font-bold text-lg">{loading ? t('modal.finalizing') : t('modal.charterRead')}</Text>
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </View>
            </Modal>

            {/* Nested Calendar Modal */}
            <Modal visible={showCalendar} animationType="slide" transparent>
                <View className="flex-1 bg-black/80 justify-end">
                    <View className="h-[85%] bg-zinc-900 rounded-t-3xl overflow-hidden">
                        <CalendarPicker
                            onCancel={() => setShowCalendar(false)}
                            onConfirm={(start, end) => {
                                setVisitDate(start);
                                setShowCalendar(false);
                            }}
                            initialStart={visitDate}
                        />
                    </View>
                </View>
            </Modal>
        </Modal>
    );
};
