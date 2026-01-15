import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

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

interface CalendarPickerProps {
    onCancel: () => void;
    onConfirm: (start: number | null, end: number | null) => void;
    initialStart?: number | null;
    initialEnd?: number | null;
}

export default function CalendarPicker({ onCancel, onConfirm, initialStart, initialEnd }: CalendarPickerProps) {
    const [calendarType, setCalendarType] = useState<'gregorian' | 'hijri'>('gregorian');
    const [startDate, setStartDate] = useState<number | null>(initialStart || null);
    const [endDate, setEndDate] = useState<number | null>(initialEnd || null);

    const currentData = calendarType === 'gregorian' ? GREGORIAN_DATA : HIJRI_DATA;

    const handleDatePress = (date: number) => {
        if (!startDate || (startDate && endDate)) {
            // Start new range or reset
            setStartDate(date);
            setEndDate(null);
        } else if (date > startDate) {
            // Set end date
            setEndDate(date);
        } else if (date === startDate) {
            // Deselect if same date clicked? Or just keep it as single date?
            // User wants "possibility to choose only one single date".
            // If I click start again, maybe confirming it as single date?
            // Current logic: if I click same date, it does nothing or resets?
            // "date > startDate" fails.
            // else -> new start date.
            // So if I click 15, then 15 again -> it becomes new start date. 
            // So single date is effectively startDate=15, endDate=null.
            setStartDate(date);
            setEndDate(null);
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
        // Mock logic
        if (date % 7 === 2 || date % 7 === 3) return '#EF4444'; // Red
        if (date % 5 === 0) return '#EAB308'; // Yellow
        return '#22C55E'; // Green
    };

    const isValid = startDate !== null; // Single date is valid too per user request

    return (
        <View className="flex-1 bg-zinc-900 rounded-t-3xl mt-10">
            <View className="p-6 flex-1">
                {/* Header */}
                <View className="flex-row justify-between items-center mb-6">
                    <TouchableOpacity onPress={onCancel}>
                        <Text className="text-zinc-400 text-lg">Annuler</Text>
                    </TouchableOpacity>
                    <Text className="text-white font-bold text-lg">Choisir une date</Text>
                    <TouchableOpacity onPress={() => isValid && onConfirm(startDate, endDate)} disabled={!isValid}>
                        <Text className={`font-bold text-lg ${isValid ? 'text-[#b39164]' : 'text-zinc-600'}`}>OK</Text>
                    </TouchableOpacity>
                </View>

                {/* Toggle */}
                <View className="flex-row bg-zinc-800 rounded-full p-1 self-center mb-6 border border-white/10">
                    <TouchableOpacity
                        className={`px-6 py-2 rounded-full ${calendarType === 'gregorian' ? 'bg-zinc-700 border border-white/20' : ''}`}
                        onPress={() => setCalendarType('gregorian')}
                    >
                        <Text className={`text-sm ${calendarType === 'gregorian' ? 'text-white font-medium' : 'text-zinc-500'}`}>Grégorien</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className={`px-6 py-2 rounded-full ${calendarType === 'hijri' ? 'bg-zinc-700 border border-white/20' : ''}`}
                        onPress={() => setCalendarType('hijri')}
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
                <View className="mb-4">
                    {/* Days Header */}
                    <View className="flex-row justify-between mb-4 px-2">
                        {DAYS.map((day, index) => (
                            <Text key={index} className="text-zinc-400 font-medium w-8 text-center">{day}</Text>
                        ))}
                    </View>

                    {/* Dates */}
                    <View className="flex-row flex-wrap">
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
                                    {inRange && (
                                        <View className="absolute top-1 bottom-3 left-0 right-0 bg-[#b39164]/20" />
                                    )}
                                    {startDate === date && endDate && (
                                        <View className="absolute top-1 bottom-3 left-[50%] right-0 bg-[#b39164]/20" />
                                    )}
                                    {endDate === date && startDate && (
                                        <View className="absolute top-1 bottom-3 left-0 right-[50%] bg-[#b39164]/20" />
                                    )}

                                    <View className={`w-10 h-10 items-center justify-center rounded-full ${isSelected ? 'bg-[#b39164] border border-[#b39164]' : ''} z-10`}>
                                        <Text className={`font-medium text-lg ${isSelected ? 'text-white' : 'text-white'}`}>{date}</Text>
                                    </View>
                                    {!isSelected && !inRange && <View style={{ backgroundColor: crowdColor }} className="w-1.5 h-1.5 rounded-full mt-1" />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <View className="flex-row justify-center gap-6 mt-4">
                    <Text className="text-gray-400 text-xs">Vert: Peu d'affluence</Text>
                    <Text className="text-gray-400 text-xs">Jaune: Modéré</Text>
                    <Text className="text-gray-400 text-xs">Rouge: Élevé</Text>
                </View>
            </View>
        </View>
    );
}
