import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const DAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const MONTHS = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];

interface CalendarPickerProps {
    onCancel: () => void;
    onConfirm: (start: number | null, end: number | null) => void;
    initialStart?: number | null;
    initialEnd?: number | null;
    mode?: 'single' | 'range';
    variant?: 'default' | 'service';
    title?: string;
    minDate?: number | null;
    maxDate?: number | null;
}

export default function CalendarPicker({
    onCancel,
    onConfirm,
    initialStart,
    initialEnd,
    mode = 'single',
    variant = 'default',
    title = 'Choisir une date',
    minDate,
    maxDate,
}: CalendarPickerProps) {
    const [startDate, setStartDate] = useState<number | null>(initialStart || null);
    const [endDate, setEndDate] = useState<number | null>(initialEnd || null);

    const initialMonthOffset = React.useMemo(() => {
        if (!minDate) return 0;
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const min = new Date(minDate);
        const offset = (min.getFullYear() - now.getFullYear()) * 12 + (min.getMonth() - now.getMonth());
        return Math.max(0, offset);
    }, [minDate]);

    const [currentMonthOffset, setCurrentMonthOffset] = useState(initialMonthOffset);

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
                timestamp: dateObj.getTime(),
            });
        }

        return {
            calendarData: days,
            monthLabel: `${MONTHS[displayMonth]} ${displayYear}`,
        };
    }, [currentMonthOffset]);

    const isDateDisabled = (timestamp: number) => {
        if (minDate && timestamp < minDate) return true;
        if (maxDate && timestamp > maxDate) return true;
        return false;
    };

    const handleDatePress = (timestamp: number) => {
        if (isDateDisabled(timestamp)) return;

        if (mode === 'single') {
            setStartDate(timestamp);
            setEndDate(null);
            return;
        }

        if (!startDate || (startDate && endDate)) {
            setStartDate(timestamp);
            setEndDate(null);
        } else if (timestamp > startDate) {
            setEndDate(timestamp);
        } else if (timestamp < startDate) {
            setStartDate(timestamp);
            setEndDate(null);
        } else {
            setStartDate(timestamp);
            setEndDate(timestamp);
        }
    };

    const isDateSelected = (timestamp: number) => startDate === timestamp || endDate === timestamp;
    const isDateInRange = (timestamp: number) => !!(startDate && endDate && timestamp > startDate && timestamp < endDate);
    const isValid = startDate !== null;

    const renderCalendarGrid = () => (
        <View className="mb-4">
            <View className="flex-row justify-between mb-4 px-2">
                {DAYS.map((day, index) => (
                    <Text key={index} className="text-zinc-400 font-medium w-[14.28%] text-center">{day}</Text>
                ))}
            </View>

            <View className="flex-row flex-wrap">
                {calendarData.map((item, index) => {
                    if (!item) {
                        return <View key={`empty-${index}`} className="w-[14.28%] h-14" />;
                    }

                    const { day, timestamp } = item;
                    const isSelected = isDateSelected(timestamp);
                    const inRange = isDateInRange(timestamp);
                    const disabled = isDateDisabled(timestamp);

                    return (
                        <TouchableOpacity
                            key={timestamp}
                            onPress={() => handleDatePress(timestamp)}
                            disabled={disabled}
                            className="w-[14.28%] h-14 items-center justify-start pt-1 relative"
                        >
                            {!disabled && inRange && (
                                <View className="absolute top-1 bottom-3 left-0 right-0 bg-[#b39164]/20" />
                            )}
                            {!disabled && startDate === timestamp && endDate && (
                                <View className="absolute top-1 bottom-3 left-[50%] right-0 bg-[#b39164]/20" />
                            )}
                            {!disabled && endDate === timestamp && startDate && (
                                <View className="absolute top-1 bottom-3 left-0 right-[50%] bg-[#b39164]/20" />
                            )}

                            <View className={`w-10 h-10 items-center justify-center rounded-full ${isSelected ? 'bg-[#b39164] border border-[#b39164]' : ''} z-10`}>
                                <Text className={`font-medium text-lg ${disabled ? 'text-zinc-600' : 'text-white'}`}>{day}</Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );

    if (variant === 'service') {
        return (
            <View className="flex-1 bg-zinc-900">
                <View className="flex-1 p-6">
                    <TouchableOpacity onPress={onCancel} className="mb-6">
                        <ChevronLeft color="white" size={28} />
                    </TouchableOpacity>

                    <Text className="text-4xl text-white font-serif mb-8">{title}</Text>

                    <View className="flex-row justify-between items-center mb-6">
                        <TouchableOpacity onPress={() => setCurrentMonthOffset(prev => prev - 1)} disabled={currentMonthOffset <= 0}>
                            <ChevronLeft color={currentMonthOffset <= 0 ? "#3f3f46" : "white"} size={20} />
                        </TouchableOpacity>
                        <Text className="text-white text-xl font-bold capitalize">{monthLabel}</Text>
                        <TouchableOpacity onPress={() => setCurrentMonthOffset(prev => prev + 1)}>
                            <ChevronRight color="white" size={20} />
                        </TouchableOpacity>
                    </View>

                    {renderCalendarGrid()}

                    <View className="mt-auto">
                        <TouchableOpacity
                            className={`w-full py-4 rounded-3xl items-center mb-4 border border-white/5 ${isValid ? 'bg-[#b39164]' : 'bg-[#1c1c1e]'}`}
                            onPress={() => isValid && onConfirm(startDate, endDate)}
                            disabled={!isValid}
                        >
                            <Text className={`text-lg ${isValid ? 'text-white font-bold' : 'text-zinc-600'}`}>Confirmer</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-zinc-900 rounded-t-3xl mt-10">
            <View className="p-6 flex-1">
                <View className="flex-row justify-between items-center mb-6">
                    <TouchableOpacity onPress={onCancel}>
                        <Text className="text-zinc-400 text-lg">Annuler</Text>
                    </TouchableOpacity>
                    <Text className="text-white font-bold text-lg">{title}</Text>
                    <TouchableOpacity onPress={() => isValid && onConfirm(startDate, endDate)} disabled={!isValid}>
                        <Text className={`font-bold text-lg ${isValid ? 'text-[#b39164]' : 'text-zinc-600'}`}>OK</Text>
                    </TouchableOpacity>
                </View>

                <View className="flex-row justify-between items-center mb-6">
                    <TouchableOpacity onPress={() => setCurrentMonthOffset(prev => prev - 1)} disabled={currentMonthOffset <= 0}>
                        <ChevronLeft color={currentMonthOffset <= 0 ? "#3f3f46" : "white"} size={20} />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-bold capitalize">{monthLabel}</Text>
                    <TouchableOpacity onPress={() => setCurrentMonthOffset(prev => prev + 1)}>
                        <ChevronRight color="white" size={20} />
                    </TouchableOpacity>
                </View>

                {renderCalendarGrid()}
            </View>
        </View>
    );
}
