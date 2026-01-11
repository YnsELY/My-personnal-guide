import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useState } from 'react';
import { StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mock Data
const GREGORIAN_DATA = {
    month: 'janvier 2026',
    days: Array.from({ length: 31 }, (_, i) => i + 1),
    offset: 4 // Thursday start
};

const HIJRI_DATA = {
    month: 'Rajab 1447',
    days: Array.from({ length: 30 }, (_, i) => i + 1),
    offset: 1 // Monday start (Mock)
};

const DAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

export default function DateSelectScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [calendarType, setCalendarType] = useState<'gregorian' | 'hijri'>('gregorian');

    // Range State - Initialize from params if available
    const [startDate, setStartDate] = useState<number | null>(params.startDate ? Number(params.startDate) : null);
    const [endDate, setEndDate] = useState<number | null>(params.endDate ? Number(params.endDate) : null);

    const currentData = calendarType === 'gregorian' ? GREGORIAN_DATA : HIJRI_DATA;

    const handleDatePress = (date: number) => {
        if (!startDate || (startDate && endDate)) {
            // Start new range or reset
            setStartDate(date);
            setEndDate(null);
        } else if (date > startDate) {
            // Set end date
            setEndDate(date);
        } else {
            // New start date (if clicking before current start)
            setStartDate(date);
            setEndDate(null);
        }
    };

    const isDateSelected = (date: number) => {
        if (startDate === date || endDate === date) return true;
        return false;
    };

    const isDateInRange = (date: number) => {
        if (startDate && endDate && date > startDate && date < endDate) return true;
        return false;
    };

    const getCrowdLevelColor = (date: number) => {
        // Mock logic: Weekends (Fri/Sat in Saudi) = High, others varying
        if (date % 7 === 2 || date % 7 === 3) return '#EF4444'; // Red (High)
        if (date % 5 === 0) return '#EAB308'; // Yellow (Moderate)
        return '#22C55E'; // Green (Low)
    };

    const isValid = startDate !== null && endDate !== null;

    return (
        <View className="flex-1 bg-zinc-900">
            <StatusBar barStyle="light-content" />
            <SafeAreaView className="flex-1 p-6">

                {/* Header */}
                <TouchableOpacity onPress={() => router.back()} className="mb-6">
                    <ChevronLeft color="white" size={28} />
                </TouchableOpacity>

                <Text className="text-4xl text-white font-serif mb-8">Faire une réservation</Text>

                {/* Toggle */}
                <View className="flex-row bg-zinc-800 rounded-full p-1 self-start mb-8 border border-white/10">
                    <TouchableOpacity
                        className={`px-6 py-2 rounded-full ${calendarType === 'gregorian' ? 'bg-zinc-700 border border-white/20' : ''}`}
                        onPress={() => {
                            setCalendarType('gregorian');
                            // Reset Selection on toggle for safety
                            setStartDate(null);
                            setEndDate(null);
                        }}
                    >
                        <Text className={`text-sm ${calendarType === 'gregorian' ? 'text-white font-medium' : 'text-zinc-500'}`}>Grégorien</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className={`px-6 py-2 rounded-full ${calendarType === 'hijri' ? 'bg-zinc-700 border border-white/20' : ''}`}
                        onPress={() => {
                            setCalendarType('hijri');
                            setStartDate(null);
                            setEndDate(null);
                        }}
                    >
                        <Text className={`text-sm ${calendarType === 'hijri' ? 'text-white font-medium' : 'text-zinc-500'}`}>Hégirien</Text>
                    </TouchableOpacity>
                </View>

                {/* Month Navigation */}
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-white text-xl font-bold">{currentData.month}</Text>
                    <View className="flex-row gap-4">
                        <ChevronLeft color="#71717A" size={20} />
                        <ChevronRight color="white" size={20} />
                    </View>
                </View>

                {/* Calendar Grid */}
                <View className="mb-8">
                    {/* Days Header */}
                    <View className="flex-row justify-between mb-4 px-2">
                        {DAYS.map((day, index) => (
                            <Text key={index} className="text-zinc-400 font-medium w-8 text-center">{day}</Text>
                        ))}
                    </View>

                    {/* Dates */}
                    <View className="flex-row flex-wrap">
                        {/* Empty slots for offset */}
                        {Array.from({ length: currentData.offset }).map((_, i) => (
                            <View key={`empty-${i}`} className="w-[14.28%] h-12" />
                        ))}

                        {currentData.days.map((date) => {
                            const isSelected = isDateSelected(date);
                            const inRange = isDateInRange(date);
                            const crowdColor = getCrowdLevelColor(date);

                            return (
                                <TouchableOpacity
                                    key={date}
                                    onPress={() => handleDatePress(date)}
                                    className="w-[14.28%] h-14 items-center justify-start pt-1 relative"
                                >
                                    {/* Range Background */}
                                    {inRange && (
                                        <View className="absolute top-1 bottom-3 left-0 right-0 bg-[#b39164]/20" />
                                    )}
                                    {/* Start/End connectors for nicely rounded ends */}
                                    {startDate === date && endDate && (
                                        <View className="absolute top-1 bottom-3 left-[50%] right-0 bg-[#b39164]/20" />
                                    )}
                                    {endDate === date && startDate && (
                                        <View className="absolute top-1 bottom-3 left-0 right-[50%] bg-[#b39164]/20" />
                                    )}

                                    <View className={`w-10 h-10 items-center justify-center rounded-full ${isSelected ? 'bg-[#b39164] border border-[#b39164]' : ''} z-10`}>
                                        <Text className={`font-medium text-lg ${isSelected ? 'text-white' : 'text-white'}`}>{date}</Text>
                                    </View>
                                    {/* Dot Indicator */}
                                    {!isSelected && !inRange && <View style={{ backgroundColor: crowdColor }} className="w-1.5 h-1.5 rounded-full mt-1" />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Legend */}
                <View className="flex-row justify-center gap-6 mb-auto">
                    <View className="flex-row items-center">
                        <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                        <Text className="text-zinc-400 text-sm">Faible</Text>
                    </View>
                    <View className="flex-row items-center">
                        <View className="w-2 h-2 rounded-full bg-yellow-500 mr-2" />
                        <Text className="text-zinc-400 text-sm">Modéré</Text>
                    </View>
                    <View className="flex-row items-center">
                        <View className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                        <Text className="text-zinc-400 text-sm">Élevé</Text>
                    </View>
                </View>

                {/* Footer Button */}
                <TouchableOpacity
                    className={`w-full py-4 rounded-3xl items-center mb-4 border border-white/5 ${isValid ? 'bg-[#b39164]' : 'bg-[#1c1c1e]'}`}
                    onPress={() => isValid && router.push({ pathname: '/(tabs)/search', params: { startDate, endDate } })}
                    disabled={!isValid}
                >
                    <Text className={`font-medium text-lg ${isValid ? 'text-white font-bold' : 'text-zinc-600'}`}>Confirmer</Text>
                </TouchableOpacity>

            </SafeAreaView>
        </View>
    );
}
