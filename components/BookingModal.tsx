import { CATEGORIES } from '@/constants/data';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Calendar, MapPin, Plus, Trash2, User, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface BookingModalProps {
    visible: boolean;
    onClose: () => void;
    startDate?: number | null;
    endDate?: number | null;
    guideName: string;
    basePrice?: number;
}

const PICKUP_LOCATIONS = [
    'Hôtel (Makkah)',
    'Gare de La Mecque (Haramain)',
    'Masjid Al Haram (Gate 1)',
    'Jabal Omar'
];

export default function BookingModal({ visible, onClose, startDate, endDate, guideName, basePrice = 200 }: BookingModalProps) {
    const router = useRouter();
    const [selectedService, setSelectedService] = useState(CATEGORIES[1].name);
    const [pilgrims, setPilgrims] = useState<string[]>(['Moi-même']); // Default to self
    const [newPilgrimName, setNewPilgrimName] = useState('');
    const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

    // Price Logic: Base + 50 SAR per extra pilgrim
    const extraPilgrims = Math.max(0, pilgrims.length - 1);
    const totalPrice = basePrice + (extraPilgrims * 50);

    const handleAddPilgrim = () => {
        if (newPilgrimName.trim().length > 0) {
            setPilgrims([...pilgrims, newPilgrimName.trim()]);
            setNewPilgrimName('');
        }
    };

    const handleRemovePilgrim = (index: number) => {
        const newPilgrims = [...pilgrims];
        newPilgrims.splice(index, 1);
        setPilgrims(newPilgrims);
    };

    const handleValidate = () => {
        if (!selectedLocation) {
            Alert.alert("Lieu manquant", "Veuillez sélectionner un lieu de prise en charge.");
            return;
        }

        onClose(); // Close modal first

        // Navigate to Summary
        router.push({
            pathname: '/booking-summary',
            params: {
                guideName,
                startDate,
                endDate,
                service: selectedService,
                location: selectedLocation,
                pilgrims: JSON.stringify(pilgrims),
                totalPrice,
            }
        } as any);
    };

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

                            {/* Date Pill */}
                            {startDate && endDate && (
                                <View className="flex-row items-center justify-center bg-[#b39164]/20 py-3 px-4 rounded-xl mb-8 border border-[#b39164]/30">
                                    <Calendar color="#b39164" size={20} className="mr-3" />
                                    <Text className="text-[#b39164] font-bold text-base">
                                        Du {startDate} au {endDate} Janvier 2026
                                    </Text>
                                </View>
                            )}

                            {/* Service Type */}
                            <Text className="text-white font-bold text-lg mb-4">Type de service</Text>
                            <View className="flex-row flex-wrap gap-2 mb-8">
                                {CATEGORIES.filter(c => c.name !== 'Tout').map((cat, idx) => (
                                    <TouchableOpacity
                                        key={idx}
                                        onPress={() => setSelectedService(cat.name)}
                                        className={`px-4 py-3 rounded-xl border ${selectedService === cat.name ? 'bg-[#b39164] border-[#b39164]' : 'bg-zinc-800 border-white/5'}`}
                                    >
                                        <Text className={`font-medium ${selectedService === cat.name ? 'text-white' : 'text-zinc-400'}`}>{cat.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Pilgrims Section */}
                            <Text className="text-white font-bold text-lg mb-4">Pèlerins ({pilgrims.length})</Text>
                            <View className="bg-zinc-800 rounded-2xl p-4 mb-2 border border-white/5">
                                {/* Add Pilgrim Input */}
                                <View className="flex-row items-center mb-4 gap-3">
                                    <View className="flex-1 bg-zinc-900 rounded-xl px-4 py-3 flex-row items-center border border-white/5">
                                        <User size={18} color="#71717A" />
                                        <TextInput
                                            placeholder="Nom du pèlerin"
                                            placeholderTextColor="#52525B"
                                            className="flex-1 ml-3 text-white text-base"
                                            value={newPilgrimName}
                                            onChangeText={setNewPilgrimName}
                                        />
                                    </View>
                                    <TouchableOpacity
                                        onPress={handleAddPilgrim}
                                        className="bg-[#b39164] w-12 h-12 rounded-xl items-center justify-center"
                                    >
                                        <Plus size={24} color="white" />
                                    </TouchableOpacity>
                                </View>

                                {/* List */}
                                <View className="gap-3">
                                    {pilgrims.map((name, index) => (
                                        <View key={index} className="flex-row items-center justify-between bg-zinc-900/50 p-3 rounded-xl">
                                            <View className="flex-row items-center">
                                                <User size={16} color="#A1A1AA" />
                                                <Text className="text-zinc-300 ml-3 font-medium">{name}</Text>
                                            </View>
                                            {index > 0 && ( // Prevent deleting the first user (Moi-même) usually, or allow it. I'll allow but keeping logic simple.
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

                            {/* Location Section */}
                            <Text className="text-white font-bold text-lg mb-4">Lieu de prise en charge</Text>
                            <View className="flex-row flex-wrap gap-3 mb-8">
                                {PICKUP_LOCATIONS.map((loc, idx) => (
                                    <TouchableOpacity
                                        key={idx}
                                        onPress={() => setSelectedLocation(loc)}
                                        className={`px-4 py-3 rounded-xl border flex-row items-center ${selectedLocation === loc ? 'bg-primary/20 border-primary' : 'bg-zinc-800 border-white/5'}`}
                                    >
                                        <MapPin size={16} color={selectedLocation === loc ? '#b39164' : '#A1A1AA'} />
                                        <Text className={`ml-2 font-medium ${selectedLocation === loc ? 'text-primary' : 'text-zinc-400'}`}>{loc}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                        </ScrollView>

                        {/* Footer */}
                        <View className="pt-4 border-t border-white/5 mt-auto">
                            <View className="flex-row justify-between items-end mb-4 px-2">
                                <Text className="text-zinc-400 text-lg">Total estimé</Text>
                                <View className="items-end">
                                    <Text className="text-white font-bold text-3xl">{totalPrice} <Text className="text-primary text-xl">SAR</Text></Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                className={`py-4 rounded-2xl items-center shadow-lg ${selectedLocation ? 'bg-[#b39164] shadow-[#b39164]/20' : 'bg-zinc-700'}`}
                                onPress={handleValidate}
                                disabled={!selectedLocation}
                            >
                                <Text className={`font-bold text-lg ${selectedLocation ? 'text-white' : 'text-zinc-500'}`}>
                                    Valider la réservation
                                </Text>
                            </TouchableOpacity>
                        </View>

                    </SafeAreaView>
                </BlurView>
            </View>
        </Modal>
    );
}
