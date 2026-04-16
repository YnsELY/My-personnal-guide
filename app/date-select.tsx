import { useLanguage } from '@/context/LanguageContext';
import { directionStyle, flipChevron, rowStyle, textStart } from '@/lib/rtl';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export default function DateSelectScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { t } = useTranslation('booking');
    const { isRTL } = useLanguage();

    // Calendar State
    const [selectedDate, setSelectedDate] = useState<Date | null>(params.startDate ? new Date(parseInt(params.startDate as string)) : null);
    const [currentMonthOffset, setCurrentMonthOffset] = useState(0); // 0 = current month view

    // Dynamic Date Generation
    const { calendarData, monthLabel } = useMemo(() => {
        const now = new Date();
        // Reset time to midnight for comparison
        now.setHours(0, 0, 0, 0);

        const year = now.getFullYear();
        const monthIndex = now.getMonth() + currentMonthOffset;

        // Target "display" month
        const targetDate = new Date(year, monthIndex, 1);
        const displayYear = targetDate.getFullYear();
        const displayMonth = targetDate.getMonth();

        // Get total days in month
        const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();

        // Determine start day
        // If currentMonthOffset is 0 (current month), we start from TODAY.
        // If future month, we start from 1st.
        let startDay = 1;
        let firstDayOfWeek = new Date(displayYear, displayMonth, 1).getDay();

        if (currentMonthOffset === 0) {
            startDay = now.getDate();
            firstDayOfWeek = now.getDay();
        }

        // Generate days
        const days = [];

        // Pre-pad with empty slots to align weekdays
        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push(null);
        }

        for (let i = startDay; i <= daysInMonth; i++) {
            const dateObj = new Date(displayYear, displayMonth, i);
            days.push({
                day: i,
                fullDate: dateObj,
                isPast: false // Since we start from today/future, no past days shown
            });
        }

        return {
            calendarData: days,
            monthLabel: `${MONTHS[displayMonth]} ${displayYear}`
        };
    }, [currentMonthOffset]);

    const handleDatePress = (dateObj: Date) => {
        setSelectedDate(dateObj);
    };

    const isDateSelected = (dateObj: Date) => {
        if (!selectedDate) return false;
        return dateObj.getDate() === selectedDate.getDate() &&
            dateObj.getMonth() === selectedDate.getMonth() &&
            dateObj.getFullYear() === selectedDate.getFullYear();
    };

    // Services Data
    const [services, setServices] = useState<any[]>([]);

    React.useEffect(() => {
        // Fetch services to calculate availability
        import('@/lib/api').then(({ getServices }) => {
            getServices().then(setServices).catch(console.error);
        });
    }, []);

    // Helper to count services for a specific date
    const getServiceCountForDate = (date: Date) => {
        if (!services.length) return 0;

        const targetTime = date.getTime();

        return services.filter(service => {
            const start = new Date(service.startDate).setHours(0, 0, 0, 0);
            const end = service.endDate ? new Date(service.endDate).setHours(0, 0, 0, 0) : start;
            const target = new Date(targetTime).setHours(0, 0, 0, 0);

            return target >= start && target <= end;
        }).length;
    };

    const getCrowdLevelColor = (dateObj: Date) => {
        const count = getServiceCountForDate(dateObj);

        if (count === 0) return '#EF4444';   // Red: 0 services
        if (count < 10) return '#EAB308';    // Yellow: 1-9 services
        return '#22C55E';                    // Green: >= 10 services
    };

    const handleConfirm = () => {
        if (selectedDate) {
            router.push({
                pathname: '/(tabs)/search',
                params: {
                    startDate: selectedDate.getTime().toString(),
                    endDate: selectedDate.getTime().toString()
                }
            });
        }
    };

    return (
        <View className="flex-1 bg-zinc-900" style={directionStyle(isRTL)}>
            <StatusBar barStyle="light-content" />
            <SafeAreaView className="flex-1 p-6">

                {/* Header */}
                <TouchableOpacity onPress={() => router.back()} className="mb-6">
                    <ChevronLeft color="white" size={28} style={flipChevron(isRTL)} />
                </TouchableOpacity>

                <Text className="text-4xl text-white font-serif mb-8" style={textStart(isRTL)}>{t('dateSelectTitle')}</Text>

                {/* Month Navigation */}
                <View className="flex-row justify-between items-center mb-6" style={rowStyle(isRTL)}>
                    <TouchableOpacity onPress={() => setCurrentMonthOffset(prev => prev - 1)} disabled={currentMonthOffset <= 0}>
                        <ChevronLeft color={currentMonthOffset <= 0 ? "#3f3f46" : "white"} size={20} style={flipChevron(isRTL)} />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-bold capitalize" style={textStart(isRTL)}>{monthLabel}</Text>
                    <TouchableOpacity onPress={() => setCurrentMonthOffset(prev => prev + 1)}>
                        <ChevronRight color="white" size={20} style={flipChevron(isRTL)} />
                    </TouchableOpacity>
                </View>

                {/* Calendar Grid */}
                <View className="mb-8">
                    {/* Days Header */}
                    <View className="flex-row justify-between mb-4 px-2">
                        {DAYS.map((day, index) => (
                            <Text key={index} className="text-zinc-400 font-medium w-[14.28%] text-center">{day}</Text>
                        ))}
                    </View>

                    {/* Dates */}
                    <View className="flex-row flex-wrap">
                        {calendarData.map((item, index) => {
                            if (!item) {
                                return <View key={`empty-${index}`} className="w-[14.28%] h-14" />;
                            }

                            const { day, fullDate, isPast } = item;
                            const isSelected = isDateSelected(fullDate);
                            const crowdColor = getCrowdLevelColor(fullDate);

                            return (
                                <TouchableOpacity
                                    key={`${day}-${index}`}
                                    onPress={() => !isPast && handleDatePress(fullDate)}
                                    disabled={isPast}
                                    className="w-[14.28%] h-14 items-center justify-start pt-1"
                                >
                                    <View className={`w-10 h-10 items-center justify-center rounded-full ${isSelected ? 'bg-[#b39164] border border-[#b39164]' : ''} ${isPast ? 'opacity-30' : ''}`}>
                                        <Text className={`font-medium text-lg ${isSelected ? 'text-white' : 'text-white'}`}>{day}</Text>
                                    </View>
                                    {/* Dot Indicator */}
                                    {!isSelected && !isPast && <View style={{ backgroundColor: crowdColor }} className="w-1.5 h-1.5 rounded-full mt-1" />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Legend */}
                <View className="flex-row justify-center gap-6 mb-auto" style={rowStyle(isRTL)}>
                    <View className="flex-row items-center" style={rowStyle(isRTL)}>
                        <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                        <Text className="text-zinc-400 text-sm" style={textStart(isRTL)}>{t('availabilityHigh')}</Text>
                    </View>
                    <View className="flex-row items-center" style={rowStyle(isRTL)}>
                        <View className="w-2 h-2 rounded-full bg-yellow-500 mr-2" />
                        <Text className="text-zinc-400 text-sm" style={textStart(isRTL)}>{t('availabilityMedium')}</Text>
                    </View>
                    <View className="flex-row items-center" style={rowStyle(isRTL)}>
                        <View className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                        <Text className="text-zinc-400 text-sm" style={textStart(isRTL)}>{t('availabilityFull')}</Text>
                    </View>
                </View>

                {/* Footer Button */}
                <TouchableOpacity
                    className={`w-full py-4 rounded-3xl items-center mb-4 border border-white/5 ${selectedDate ? 'bg-[#b39164]' : 'bg-[#1c1c1e]'}`}
                    onPress={handleConfirm}
                    disabled={!selectedDate}
                >
                    <Text className={`font-medium text-lg ${selectedDate ? 'text-white font-bold' : 'text-zinc-600'}`}>{t('common:confirm')}</Text>
                </TouchableOpacity>

            </SafeAreaView>
        </View>
    );
}
