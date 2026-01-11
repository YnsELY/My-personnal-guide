import { CATEGORIES } from '@/constants/data';
import { BlurView } from 'expo-blur';
import { Calendar, MapPin, User, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface BookingModalProps {
    visible: boolean;
    onClose: () => void;
    startDate?: number | null;
    endDate?: number | null;
    guideName: string;
}

export default function BookingModal({ visible, onClose, startDate, endDate, guideName }: BookingModalProps) {
    const [selectedService, setSelectedService] = useState(CATEGORIES[1].name); // Default to first service
    const [peopleCount, setPeopleCount] = useState(1);
    const [location, setLocation] = useState('');

    const handleIncrement = () => setPeopleCount(prev => prev + 1);
    const handleDecrement = () => setPeopleCount(prev => (prev > 1 ? prev - 1 : 1));

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end">
                {/* Backdrop */}
                <TouchableOpacity
                    className="absolute inset-0 bg-black/60"
                    activeOpacity={1}
                    onPress={onClose}
                />

                {/* Modal Content */}
                <BlurView intensity={Platform.OS === 'ios' ? 40 : 100} tint="dark" className="bg-zinc-900 rounded-t-3xl overflow-hidden border-t border-white/10">
                    <SafeAreaView edges={['bottom']} className="p-6">

                        {/* Header */}
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-2xl font-serif font-bold text-white">Finaliser la réservation</Text>
                            <TouchableOpacity onPress={onClose} className="bg-zinc-800 p-2 rounded-full">
                                <X size={20} color="white" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="max-h-[70%]" showsVerticalScrollIndicator={false}>

                            {/* Date Summary */}
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

                            {/* People Count */}
                            <Text className="text-white font-bold text-lg mb-4">Nombre de personnes</Text>
                            <View className="bg-zinc-800 rounded-2xl p-4 flex-row items-center justify-between mb-8 border border-white/5">
                                <View className="flex-row items-center">
                                    <User size={20} color="#A1A1AA" />
                                    <Text className="text-zinc-400 ml-3 text-base">Pèlerins</Text>
                                </View>
                                <View className="flex-row items-center gap-4">
                                    <TouchableOpacity
                                        onPress={handleDecrement}
                                        className="w-10 h-10 rounded-full bg-zinc-700 items-center justify-center"
                                    >
                                        <Text className="text-white text-xl font-medium">-</Text>
                                    </TouchableOpacity>
                                    <Text className="text-white text-xl font-bold w-6 text-center">{peopleCount}</Text>
                                    <TouchableOpacity
                                        onPress={handleIncrement}
                                        className="w-10 h-10 rounded-full bg-[#b39164] items-center justify-center"
                                    >
                                        <Text className="text-white text-xl font-medium">+</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Pickup Location */}
                            <Text className="text-white font-bold text-lg mb-4">Lieu de prise en charge</Text>
                            <View className="bg-zinc-800 rounded-2xl px-4 py-4 flex-row items-center mb-8 border border-white/5">
                                <MapPin size={20} color="#A1A1AA" />
                                <TextInput
                                    placeholder="Hôtel, adresse..."
                                    placeholderTextColor="#52525B"
                                    className="flex-1 ml-3 text-white text-base"
                                    value={location}
                                    onChangeText={setLocation}
                                />
                            </View>

                        </ScrollView>

                        {/* Footer Action */}
                        <TouchableOpacity
                            className="bg-[#b39164] py-4 rounded-2xl items-center shadow-lg shadow-[#b39164]/20 mt-4"
                            onPress={onClose} // For mock purposes
                        >
                            <Text className="text-white font-bold text-lg">Valider le créneau</Text>
                        </TouchableOpacity>

                    </SafeAreaView>
                </BlurView>
            </View>
        </Modal>
    );
}
