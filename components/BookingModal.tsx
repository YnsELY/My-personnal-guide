import CalendarPicker from '@/components/CalendarPicker';
import { CHARTER_TEXT } from '@/constants/charter';
import { CATEGORIES } from '@/constants/data';
import { useAuth } from '@/context/AuthContext';
import { useReservations } from '@/context/ReservationsContext';
import { cancelStripeCheckoutReservation, createReservation, getPilgrimWalletSummary, getReservedGuideTimeSlots, PILGRIM_CHARTER_VERSION, startStripeCheckoutForReservation } from '@/lib/api';
import { computePilgrimTotalFromGuideNet, formatEUR, roundMoney } from '@/lib/pricing';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Calendar, MapPin, Plus, Trash2, User, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
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
    basePrice?: number;
    service: any; // Passed service object
}

const formatCurrency = (value: number) => formatEUR(value || 0);

export default function BookingModal({ visible, onClose, startDate, endDate, guideName, guideId, basePrice = 200, service }: BookingModalProps) {
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

    const [pilgrims, setPilgrims] = useState<{ name: string, age: string }[]>([{ name: 'Moi-même', age: '' }]); // Default to self
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

    // Price logic (EUR): base service + transport
    const normalizedHotelDistanceInput = hotelDistanceKm.replace(',', '.');
    const parsedHotelDistanceKm = Number(normalizedHotelDistanceInput);
    const hotelDistanceIsValid = Number.isFinite(parsedHotelDistanceKm) && parsedHotelDistanceKm > 2;
    const transportExtraFeeAmount = transportPickupType === 'hotel' && hotelOver2KmByCar === true ? 10 : 0;
    const explicitGuideNetBasePrice = Number(activeService?.guideNetBasePriceEur ?? activeService?.price_override);
    const fallbackDisplayedPrice = Number(activeService?.price ?? basePrice ?? 200);
    const serviceGuideNetPrice = Number.isFinite(explicitGuideNetBasePrice) && explicitGuideNetBasePrice > 0
        ? explicitGuideNetBasePrice
        : Number.isFinite(fallbackDisplayedPrice) && fallbackDisplayedPrice > 0
            ? roundMoney(fallbackDisplayedPrice)
            : 200;
    const pricingPreview = computePilgrimTotalFromGuideNet({
        serviceNetAmountEur: serviceGuideNetPrice,
        transportExtraFeeEur: transportExtraFeeAmount,
    });
    const commissionableNetAmount = pricingPreview.commissionableNetAmountEur;
    const totalPrice = pricingPreview.totalPriceEur;
    const availableWalletBalance = Number(walletSummary?.availableBalance || 0);
    const walletAmountUsed = useWalletBalance ? Math.min(availableWalletBalance, totalPrice) : 0;
    const cardAmountPaid = Math.max(totalPrice - walletAmountUsed, 0);
    const isFemalePilgrim = profile?.role === 'pilgrim' && profile?.gender === 'female';
    const hasMinPilgrimsForFemale = !isFemalePilgrim || pilgrims.length >= 2;
    const shouldShowPilgrimsSection = selectedService !== 'Omra seule' || isFemalePilgrim;
    const isHotelFlowValid = transportPickupType !== 'hotel'
        || (
            hotelAddress.trim().length > 0
            && hotelOver2KmByCar !== null
            && (
                (hotelOver2KmByCar === true && hotelDistanceIsValid)
                || (hotelOver2KmByCar === false && transportWarningAcknowledged)
            )
        );
    const canOpenConfirmation = !!transportPickupType && !!visitDate && !!visitTime && hasMinPilgrimsForFemale && isHotelFlowValid && pilgrimCharterAccepted;

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
        if (!transportPickupType) {
            Alert.alert("Transport manquant", "Veuillez sélectionner un mode de prise en charge.");
            return;
        }
        if (transportPickupType === 'hotel' && !hotelAddress.trim()) {
            Alert.alert("Adresse requise", "Veuillez renseigner l'adresse de l'hôtel.");
            return;
        }
        if (transportPickupType === 'hotel' && hotelOver2KmByCar === null) {
            Alert.alert("Distance requise", "Veuillez préciser si l'hôtel est à plus de 2 km du haram.");
            return;
        }
        if (transportPickupType === 'hotel' && hotelOver2KmByCar === true && !hotelDistanceIsValid) {
            Alert.alert("Distance invalide", "Veuillez saisir une distance strictement supérieure à 2 km.");
            return;
        }
        if (transportPickupType === 'hotel' && hotelOver2KmByCar === false && !transportWarningAcknowledged) {
            Alert.alert("Confirmation requise", "Veuillez confirmer l'avertissement concernant le supplément possible à l'arrivée.");
            return;
        }
        if (!visitDate) {
            Alert.alert("Date manquante", "Veuillez sélectionner une date de visite.");
            return;
        }
        if (!pilgrimCharterAccepted) {
            Alert.alert("Charte requise", "Vous devez cocher \"J'ai lu et j'accepte la Charte du Pèlerin\" avant de réserver.");
            return;
        }
        if (!visitTime) {
            Alert.alert("Heure manquante", "Veuillez sélectionner une heure de visite.");
            return;
        }
        if (reservedTimeSlots.includes(visitTime)) {
            Alert.alert("Créneau indisponible", "Ce créneau est déjà réservé. Veuillez choisir une autre heure.");
            return;
        }
        if (!hasMinPilgrimsForFemale) {
            Alert.alert("Nombre de pèlerins insuffisant", "Pour un compte femme, ajoutez au moins un deuxième pèlerin.");
            return;
        }

        setLoading(true);
        try {
            const latestReservedSlots = await getReservedGuideTimeSlots(guideId, visitDate);
            setReservedTimeSlots(latestReservedSlots);
            if (visitTime && latestReservedSlots.includes(visitTime)) {
                setVisitTime(null);
                Alert.alert("Créneau indisponible", "Ce créneau vient d'être réservé. Veuillez choisir une autre heure.");
                return;
            }

            // Format pilgrims as string for now: "Name (Age ans)" or just Name if no age
            const formattedPilgrims = pilgrims.map(p => p.age ? `${p.name} (${p.age} ans)` : p.name);
            const normalizedHotelDistanceKm = transportPickupType === 'hotel' && hotelOver2KmByCar === true
                ? parsedHotelDistanceKm
                : null;
            const normalizedHotelAddress = transportPickupType === 'hotel' ? hotelAddress.trim() : null;
            const resolvedLocation = transportPickupType === 'hotel'
                ? `Rendez-vous à l'hôtel - ${normalizedHotelAddress}`
                : 'Rendez-vous au haram';

            if (cardAmountPaid > 0) {
                const paymentStatusUrl = Linking.createURL('/payment-status');
                const checkout = await startStripeCheckoutForReservation({
                    serviceId: String(activeService?.id || ''),
                    guideId,
                    serviceName: selectedService,
                    startDate: visitDate,
                    endDate: visitDate,
                    totalPrice,
                    location: resolvedLocation,
                    visitTime: visitTime,
                    pilgrims: formattedPilgrims,
                    transportPickupType,
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
                    throw new Error("Impossible d'ouvrir la page de paiement Stripe.");
                }

                onClose();
                await Linking.openURL(checkout.checkoutUrl);
                return;
            }

            const createdReservation = await createReservation({
                guideId,
                serviceName: selectedService,
                date: visitDate,
                startDate: visitDate,
                endDate: visitDate,
                price: totalPrice,
                location: resolvedLocation,
                visitTime: visitTime,
                pilgrims: formattedPilgrims,
                transportPickupType,
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
                    serviceName: selectedService,
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
            const normalizedMessage = String(error?.message || '').toLowerCase();
            if (
                normalizedMessage.includes('deuxième pèlerin')
                || normalizedMessage.includes('deuxieme pelerin')
                || normalizedMessage.includes('minimum 2')
            ) {
                Alert.alert("Nombre de pèlerins insuffisant", "Pour un compte femme, ajoutez au moins un deuxième pèlerin.");
            } else if (normalizedMessage.includes('charte du pèlerin') || normalizedMessage.includes('charte du pelerin')) {
                Alert.alert("Charte requise", "Vous devez accepter la Charte du Pèlerin avant de réserver.");
            } else if (normalizedMessage.includes('blocage')) {
                Alert.alert("Action impossible", "Réservation impossible: un blocage existe entre vous et ce guide.");
            } else {
                Alert.alert("Erreur", error.message || "Une erreur est survenue lors de la réservation.");
            }
        } finally {
            setLoading(false);
        }
    };

    // Helper for display
    const formattedVisitDate = visitDate
        ? new Date(visitDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
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
                            <Text className="text-2xl font-serif font-bold text-white">Réservation</Text>
                            <TouchableOpacity onPress={onClose} className="bg-zinc-800 p-2 rounded-full">
                                <X size={20} color="white" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

                            {/* Date Selection */}
                            <Text className="text-white font-bold text-lg mb-4">Date de la visite</Text>
                            <TouchableOpacity
                                onPress={() => setShowCalendar(true)}
                                className={`flex-row items-center bg-zinc-800 border ${visitDate ? 'border-[#b39164]' : 'border-white/5'} rounded-xl p-4 mb-8`}
                            >
                                <Calendar color={visitDate ? "#b39164" : "#A1A1AA"} size={20} className="mr-3" />
                                <Text className={`font-medium text-base ${visitDate ? 'text-[#b39164]' : 'text-zinc-400'}`}>
                                    {formattedVisitDate ? `Le ${formattedVisitDate}` : 'Sélectionner une date précise'}
                                </Text>
                            </TouchableOpacity>

                            {/* Time Selection */}
                            <Text className="text-white font-bold text-lg mb-4">Heure de la visite</Text>
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
                                {reservedSlotsLoading ? 'Vérification des créneaux...' : 'Les créneaux déjà réservés sont automatiquement indisponibles.'}
                            </Text>


                            {shouldShowPilgrimsSection && (
                                <>
                                    <Text className="text-white font-bold text-lg mb-4">Pèlerins ({pilgrims.length})</Text>
                                    <View className="bg-zinc-800 rounded-2xl p-4 mb-2 border border-white/5">
                                        <View className="flex-row items-center mb-4 gap-3">
                                            <View className="flex-1 flex-row gap-2">
                                                <View className="flex-1 bg-zinc-900 rounded-xl px-4 py-3 flex-row items-center border border-white/5">
                                                    <User size={18} color="#71717A" />
                                                    <TextInput
                                                        placeholder="Nom"
                                                        placeholderTextColor="#52525B"
                                                        className="flex-1 ml-3 text-white text-base"
                                                        value={newPilgrimName}
                                                        onChangeText={setNewPilgrimName}
                                                    />
                                                </View>
                                                <View className="w-24 bg-zinc-900 rounded-xl px-4 py-3 border border-white/5 justify-center">
                                                    <TextInput
                                                        placeholder="Age"
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
                                                            {pilgrim.name} {pilgrim.age ? `(${pilgrim.age} ans)` : ''}
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
                                    {isFemalePilgrim && !hasMinPilgrimsForFemale && (
                                        <View className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                                            <Text className="text-amber-200 text-xs">
                                                Pour réserver avec un compte femme, vous devez être au minimum 2 pèlerins.
                                            </Text>
                                        </View>
                                    )}
                                    <View className="mb-8" />
                                </>
                            )}

                            {/* Transport Section */}
                            <Text className="text-white font-bold text-lg mb-4">Prise en charge</Text>
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
                                        Rendez-vous au haram
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setTransportPickupType('hotel')}
                                    className={`px-4 py-3 rounded-xl border flex-row items-center ${transportPickupType === 'hotel' ? 'bg-primary/20 border-primary' : 'bg-zinc-800 border-white/5'}`}
                                >
                                    <MapPin size={16} color={transportPickupType === 'hotel' ? '#b39164' : '#A1A1AA'} />
                                    <Text className={`ml-2 font-medium ${transportPickupType === 'hotel' ? 'text-primary' : 'text-zinc-400'}`}>
                                        Rendez-vous à l&apos;hôtel
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {transportPickupType === 'hotel' && (
                                <View className="bg-zinc-800 border border-white/5 rounded-2xl p-4 mb-8">
                                    <Text className="text-white font-semibold mb-2">Adresse de l&apos;hôtel</Text>
                                    <TextInput
                                        value={hotelAddress}
                                        onChangeText={setHotelAddress}
                                        placeholder="Adresse complète de l'hôtel"
                                        placeholderTextColor="#71717A"
                                        className="bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-white mb-4"
                                    />

                                    <Text className="text-white font-semibold mb-2">Cet hôtel est-il à plus de 2 km en voiture du haram ?</Text>
                                    <View className="flex-row gap-2 mb-3">
                                        <TouchableOpacity
                                            onPress={() => {
                                                setHotelOver2KmByCar(false);
                                                setHotelDistanceKm('');
                                            }}
                                            className={`flex-1 py-2.5 rounded-xl border items-center ${hotelOver2KmByCar === false ? 'bg-primary/20 border-primary' : 'bg-zinc-900 border-white/5'}`}
                                        >
                                            <Text className={`${hotelOver2KmByCar === false ? 'text-primary' : 'text-zinc-300'} font-medium`}>Non</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setHotelOver2KmByCar(true);
                                                setTransportWarningAcknowledged(false);
                                            }}
                                            className={`flex-1 py-2.5 rounded-xl border items-center ${hotelOver2KmByCar === true ? 'bg-primary/20 border-primary' : 'bg-zinc-900 border-white/5'}`}
                                        >
                                            <Text className={`${hotelOver2KmByCar === true ? 'text-primary' : 'text-zinc-300'} font-medium`}>Oui</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {hotelOver2KmByCar === false && (
                                        <View className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                                            <Text className="text-amber-200 text-xs leading-5">
                                                Si l&apos;adresse envoyée au guide est en réalité à plus de 2 km, un supplément sera facturé à l&apos;arrivée du guide.
                                            </Text>
                                            <TouchableOpacity
                                                onPress={() => setTransportWarningAcknowledged((prev) => !prev)}
                                                className="mt-3 flex-row items-center"
                                            >
                                                <View className={`w-5 h-5 rounded-md border mr-2 items-center justify-center ${transportWarningAcknowledged ? 'bg-[#b39164] border-[#b39164]' : 'border-white/20 bg-zinc-900'}`}>
                                                    {transportWarningAcknowledged ? <Text className="text-white text-[10px]">✓</Text> : null}
                                                </View>
                                                <Text className="text-zinc-200 text-xs">J&apos;ai compris cet avertissement</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                    {hotelOver2KmByCar === true && (
                                        <View>
                                            <Text className="text-white font-semibold mb-2">Distance (km)</Text>
                                            <TextInput
                                                value={hotelDistanceKm}
                                                onChangeText={setHotelDistanceKm}
                                                placeholder="Ex: 3.5"
                                                placeholderTextColor="#71717A"
                                                keyboardType="decimal-pad"
                                                className="bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-white mb-2"
                                            />
                                            <Text className="text-emerald-300 text-xs">Supplément transport fixe appliqué: +10 €</Text>
                                        </View>
                                    )}
                                </View>
                            )}

                        </ScrollView>

                        {/* Footer */}
                        <View className="pt-4 border-t border-white/5 mt-auto">
                            <View className="flex-row justify-between items-end mb-4 px-2">
                                <View>
                                    <Text className="text-zinc-400 text-lg">Total estimé</Text>
                                    <Text className="text-zinc-500 text-xs">Détail en EUR</Text>
                                </View>
                                <View className="items-end">
                                    <Text className="text-white font-bold text-3xl">{formatCurrency(totalPrice)}</Text>
                                </View>
                            </View>
                            {transportExtraFeeAmount > 0 && (
                                <View className="mb-4 rounded-xl border border-white/10 bg-zinc-800/70 px-4 py-3">
                                {transportExtraFeeAmount > 0 && (
                                    <View className="flex-row justify-between items-center mt-1.5">
                                        <Text className="text-zinc-400 text-xs">Transport</Text>
                                        <Text className="text-zinc-200 text-xs font-medium">{formatCurrency(transportExtraFeeAmount)}</Text>
                                    </View>
                                )}
                                </View>
                            )}
                            <View className="mb-4 rounded-xl border border-white/10 bg-zinc-800/70 px-4 py-3">
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-1 pr-4">
                                        <Text className="text-white font-semibold">Utiliser ma cagnotte</Text>
                                        <Text className="text-zinc-400 text-xs mt-1">
                                            Solde disponible: {walletLoading ? 'Chargement...' : formatCurrency(availableWalletBalance)}
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
                                        <Text className="text-zinc-400 text-xs">Cagnotte utilisée</Text>
                                        <Text className="text-zinc-200 text-xs font-medium">{formatCurrency(walletAmountUsed)}</Text>
                                    </View>
                                    <View className="flex-row justify-between items-center mt-1.5">
                                        <Text className="text-zinc-400 text-xs">Reste à payer (carte)</Text>
                                        <Text className="text-zinc-200 text-xs font-medium">{formatCurrency(cardAmountPaid)}</Text>
                                    </View>
                                </View>
                            </View>
                            <TouchableOpacity
                                className={`py-4 rounded-2xl items-center shadow-lg ${canOpenConfirmation && !loading ? 'bg-[#b39164] shadow-[#b39164]/20' : 'bg-zinc-700'}`}
                                onPress={() => {
                                    if (loading) return;
                                    if (!transportPickupType) return;
                                    if (!hasMinPilgrimsForFemale) {
                                        Alert.alert("Nombre de pèlerins insuffisant", "Pour un compte femme, ajoutez au moins un deuxième pèlerin.");
                                        return;
                                    }
                                    if (!visitDate || !visitTime) { Alert.alert("Incomplet", "Veuillez sélectionner date et heure."); return; }
                                    if (!isHotelFlowValid) { Alert.alert("Transport incomplet", "Veuillez compléter les informations de prise en charge."); return; }
                                    if (!pilgrimCharterAccepted) {
                                        Alert.alert("Charte requise", "Vous devez cocher \"J'ai lu et j'accepte la Charte du Pèlerin\" avant de réserver.");
                                        return;
                                    }
                                    handleValidate();
                                }}
                                disabled={!canOpenConfirmation || loading}
                            >
                                {loading ? (
                                    <View className="flex-row items-center gap-3">
                                        <ActivityIndicator color="#ffffff" size="small" />
                                        <Text className="text-white font-bold text-lg">Redirection vers le paiement...</Text>
                                    </View>
                                ) : (
                                    <Text className={`font-bold text-lg ${canOpenConfirmation ? 'text-white' : 'text-zinc-500'}`}>
                                        Réserver
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
                                        J&apos;ai lu et j&apos;accepte la Charte du Pèlerin
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setShowCharterModal(true)} className="mt-2 self-start">
                                    <Text className="text-[#b39164] text-xs font-semibold">Lire la charte</Text>
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
                            <Text className="text-xl font-bold text-white">Charte du Pèlerin</Text>
                            <TouchableOpacity onPress={() => setShowCharterModal(false)} className="p-2">
                                <Text className="text-zinc-400 font-bold">Annuler</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView className="flex-1 p-6" contentContainerStyle={{ paddingBottom: 40 }}>
                            <Text className="text-zinc-300 leading-6 text-base">{CHARTER_TEXT}</Text>
                        </ScrollView>
                        <View className="p-4 border-t border-white/10 bg-zinc-800">
                            <Text className="text-zinc-400 text-xs mb-4 text-center">Veuillez confirmer la lecture de la charte pour poursuivre la réservation.</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setPilgrimCharterAccepted(true);
                                    setShowCharterModal(false);
                                }}
                                disabled={loading}
                                className="bg-[#b39164] py-4 rounded-xl items-center shadow-sm"
                            >
                                <Text className="text-white font-bold text-lg">{loading ? 'Finalisation...' : "J'ai lu la charte"}</Text>
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
