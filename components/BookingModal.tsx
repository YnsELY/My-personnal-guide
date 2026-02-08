import CalendarPicker from '@/components/CalendarPicker';
import { CHARTER_TEXT } from '@/constants/charter';
import { CATEGORIES } from '@/constants/data';
import { createReservation } from '@/lib/api';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Calendar, MapPin, Plus, Trash2, User, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
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

const PICKUP_LOCATIONS = [
    'Hôtel (Makkah)',
    'Gare de La Mecque (Haramain)',
    'Masjid Al Haram (Gate 1)',
    'Jabal Omar'
];

export default function BookingModal({ visible, onClose, startDate, endDate, guideName, guideId, basePrice = 200, service }: BookingModalProps) {
    const router = useRouter();
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
    const [selectedLocation, setSelectedLocation] = useState<{ name: string, supplement: number } | null>(null);
    const [visitDate, setVisitDate] = useState<number | null>(startDate || null);
    const [visitTime, setVisitTime] = useState<string | null>(null);
    const [showCalendar, setShowCalendar] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showCharterModal, setShowCharterModal] = useState(false);

    // Sync state with props when modal opens/changes
    useEffect(() => {
        if (startDate) {
            setVisitDate(startDate);
        }
    }, [startDate]);

    // Use passed service directly
    const activeService = service;

    // Use guide's specific locations if available
    // Handle both snake_case (DB) and camelCase (API transformed) if possible, or just standard
    const meetingPoints = activeService?.meetingPoints || activeService?.meeting_points || [];
    const availableLocations = meetingPoints.length > 0 ? meetingPoints : [];

    // Price Logic: Base + 50 SAR per extra pilgrim + Supplement
    const extraPilgrims = Math.max(0, pilgrims.length - 1);
    const LOCATION_SUPPLEMENT = selectedLocation?.supplement || 0;
    // Prefer service price, then base param, then default
    const itemPrice = activeService?.price || activeService?.price_override || basePrice || 200;
    const totalPrice = itemPrice + (extraPilgrims * 50) + LOCATION_SUPPLEMENT;

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
        if (!selectedLocation) {
            Alert.alert("Lieu manquant", "Veuillez sélectionner un lieu de prise en charge.");
            return;
        }
        if (!visitDate) {
            Alert.alert("Date manquante", "Veuillez sélectionner une date de visite.");
            return;
        }
        if (!visitTime) {
            Alert.alert("Heure manquante", "Veuillez sélectionner une heure de visite.");
            return;
        }

        setLoading(true);
        try {
            // Format pilgrims as string for now: "Name (Age ans)" or just Name if no age
            const formattedPilgrims = pilgrims.map(p => p.age ? `${p.name} (${p.age} ans)` : p.name);

            await createReservation({
                guideId,
                serviceName: selectedService,
                date: visitDate,
                startDate: visitDate,
                endDate: visitDate,
                price: totalPrice,
                location: selectedLocation.name,
                visitTime: visitTime,
                pilgrims: formattedPilgrims
            });
            onClose();
            router.push({
                pathname: '/booking-confirmation',
                params: {
                    serviceName: selectedService,
                    date: visitDate,
                    time: visitTime,
                    price: totalPrice,
                    location: selectedLocation.name || 'Makkah',
                    guideName: guideName
                }
            });
        } catch (error: any) {
            console.error(error);
            Alert.alert("Erreur", error.message || "Une erreur est survenue lors de la réservation.");
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
                                    const isSelected = visitTime === time;
                                    return (
                                        <TouchableOpacity
                                            key={time}
                                            onPress={() => setVisitTime(time)}
                                            className={`mr-3 px-5 py-3 rounded-xl border ${isSelected ? 'bg-[#b39164] border-[#b39164]' : 'bg-zinc-800 border-white/5'}`}
                                        >
                                            <Text className={`font-medium ${isSelected ? 'text-white' : 'text-zinc-400'}`}>{time}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>


                            {selectedService !== 'Omra seule' && (
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
                                        {extraPilgrims > 0 && (
                                            <Text className="text-zinc-500 text-xs mt-3 italic text-right">
                                                +50 SAR par pèlerin supp.
                                            </Text>
                                        )}
                                    </View>
                                    <View className="mb-8" />
                                </>
                            )}

                            {/* Location Section */}
                            <Text className="text-white font-bold text-lg mb-4">Lieu de prise en charge {activeService && activeService.meetingPoints.length > 0 ? '(Défini par le guide)' : ''}</Text>
                            <View className="flex-row flex-wrap gap-3 mb-8">
                                {availableLocations.map((loc, idx) => {
                                    const isSelected = selectedLocation?.name === loc.name;
                                    return (
                                        <TouchableOpacity
                                            key={idx}
                                            onPress={() => setSelectedLocation(loc)}
                                            className={`px-4 py-3 rounded-xl border flex-row items-center ${isSelected ? 'bg-primary/20 border-primary' : 'bg-zinc-800 border-white/5'}`}
                                        >
                                            <MapPin size={16} color={isSelected ? '#b39164' : '#A1A1AA'} />
                                            <Text className={`ml-2 font-medium ${isSelected ? 'text-primary' : 'text-zinc-400'}`}>{loc.name}</Text>
                                            {loc.supplement > 0 && (
                                                <Text className="ml-1 text-xs text-zinc-500 italic">+{loc.supplement} SAR</Text>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                        </ScrollView>

                        {/* Footer */}
                        <View className="pt-4 border-t border-white/5 mt-auto">
                            <View className="flex-row justify-between items-end mb-4 px-2">
                                <View>
                                    <Text className="text-zinc-400 text-lg">Total estimé</Text>
                                    {LOCATION_SUPPLEMENT > 0 && (
                                        <Text className="text-zinc-500 text-xs">+ {LOCATION_SUPPLEMENT} SAR (Lieu)</Text>
                                    )}
                                </View>
                                <View className="items-end">
                                    <Text className="text-white font-bold text-3xl">{totalPrice} <Text className="text-primary text-xl">SAR</Text></Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                className={`py-4 rounded-2xl items-center shadow-lg ${selectedLocation ? 'bg-[#b39164] shadow-[#b39164]/20' : 'bg-zinc-700'}`}
                                onPress={() => {
                                    if (!selectedLocation) return;
                                    if (!visitDate || !visitTime) { Alert.alert("Incomplet", "Veuillez sélectionner date et heure."); return; }
                                    setShowCharterModal(true);
                                }}
                                disabled={!selectedLocation}
                            >
                                <Text className={`font-bold text-lg ${selectedLocation ? 'text-white' : 'text-zinc-500'}`}>
                                    Réserver
                                </Text>
                            </TouchableOpacity>
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
                            <Text className="text-zinc-400 text-xs mb-4 text-center">En cliquant ci-dessous, vous acceptez à nouveau la charte et confirmez votre réservation.</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowCharterModal(false);
                                    handleValidate();
                                }}
                                disabled={loading}
                                className="bg-[#b39164] py-4 rounded-xl items-center shadow-sm"
                            >
                                <Text className="text-white font-bold text-lg">{loading ? 'Finalisation...' : 'Accepter et Confirmer'}</Text>
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
