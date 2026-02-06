import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const DAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

interface CalendarPickerProps {
    onCancel: () => void;
    onConfirm: (start: number | null, end: number | null) => void;
    initialStart?: number | null;
    initialEnd?: number | null;
    mode?: 'single' | 'range';
}

export default function CalendarPicker({ onCancel, onConfirm, initialStart, initialEnd, mode = 'single' }: CalendarPickerProps) {
    const [startDate, setStartDate] = useState<number | null>(initialStart || null);
    const [endDate, setEndDate] = useState<number | null>(initialEnd || null);
    const [currentMonthOffset, setCurrentMonthOffset] = useState(0);

    // Dynamic Date Generation (Shared logic with DateSelect)
    const { calendarData, monthLabel } = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const year = now.getFullYear();
        const monthIndex = now.getMonth() + currentMonthOffset;

        const targetDate = new Date(year, monthIndex, 1);
        const displayYear = targetDate.getFullYear();
        const displayMonth = targetDate.getMonth();

        const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();

        let startDay = 1;
        let firstDayOfWeek = new Date(displayYear, displayMonth, 1).getDay();

        if (currentMonthOffset === 0) {
            startDay = now.getDate();
            firstDayOfWeek = now.getDay();
        }

        const days = [];
        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push(null);
        }

        for (let i = startDay; i <= daysInMonth; i++) {
            const dateObj = new Date(displayYear, displayMonth, i);
            days.push({
                day: i,
                fullDate: dateObj,
                timestamp: dateObj.getTime()
            });
        }

        return {
            calendarData: days,
            monthLabel: `${MONTHS[displayMonth]} ${displayYear}`
        };
    }, [currentMonthOffset]);

    const handleDatePress = (timestamp: number) => {
        if (mode === 'single') {
            setStartDate(timestamp);
            setEndDate(null);
            return;
        }

        // Range Mode Logic
        if (!startDate || (startDate && endDate)) {
            setStartDate(timestamp);
            setEndDate(null);
        } else if (timestamp > startDate) {
            setEndDate(timestamp);
        } else if (timestamp < startDate) {
            setStartDate(timestamp);
            setEndDate(null);
        } else {
            // Same day clicked
            setStartDate(timestamp);
            setEndDate(timestamp); // Allow single day range
        }
    };

    const isDateSelected = (timestamp: number) => {
        if (startDate === timestamp || endDate === timestamp) return true;
        return false;
    };

    const isDateInRange = (timestamp: number) => {
        if (startDate && endDate && timestamp > startDate && timestamp < endDate) return true;
        return false;
    };

    const isValid = startDate !== null;

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

                {/* Month Navigation */}
                <View className="flex-row justify-between items-center mb-6">
                    <TouchableOpacity onPress={() => setCurrentMonthOffset(prev => prev - 1)} disabled={currentMonthOffset <= 0}>
                        <ChevronLeft color={currentMonthOffset <= 0 ? "#3f3f46" : "white"} size={20} />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-bold capitalize">{monthLabel}</Text>
                    <TouchableOpacity onPress={() => setCurrentMonthOffset(prev => prev + 1)}>
                        <ChevronRight color="white" size={20} />
                    </TouchableOpacity>
                </View>

                {/* Calendar Grid */}
                <View className="mb-4">
                    <View className="flex-row justify-between mb-4 px-2">
                        {DAYS.map((day, index) => (
                            <Text key={index} className="text-zinc-400 font-medium w-[14.28%] text-center">{day}</Text>
                        ))}
                    </View>

                    <View className="flex-row flex-wrap">
                        {calendarData.map((item, index) => {
                            if (!item) {
                                return <View key={`empty-${index}`} className="w-[14.28%] h-12" />;
                            }

                            const { day, timestamp } = item;
                            const isSelected = isDateSelected(timestamp);
                            const inRange = isDateInRange(timestamp);

                            return (
                                <TouchableOpacity
                                    key={timestamp}
                                    onPress={() => handleDatePress(timestamp)}
                                    className="w-[14.28%] h-14 items-center justify-start pt-1 relative"
                                >
                                    {inRange && (
                                        <View className="absolute top-1 bottom-3 left-0 right-0 bg-[#b39164]/20" />
                                    )}
                                    {startDate === timestamp && endDate && (
                                        <View className="absolute top-1 bottom-3 left-[50%] right-0 bg-[#b39164]/20" />
                                    )}
                                    {endDate === timestamp && startDate && (
                                        <View className="absolute top-1 bottom-3 left-0 right-[50%] bg-[#b39164]/20" />
                                    )}

                                    <View className={`w-10 h-10 items-center justify-center rounded-full ${isSelected ? 'bg-[#b39164] border border-[#b39164]' : ''} z-10`}>
                                        <Text className={`font-medium text-lg ${isSelected ? 'text-white' : 'text-white'}`}>{day}</Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </View>
        </View>
    );
}
