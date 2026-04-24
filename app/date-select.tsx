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

function sameDay(a: Date, b: Date) {
    return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

export default function DateSelectScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { t } = useTranslation('booking');
    const { isRTL } = useLanguage();

    const initStart = params.startDate ? new Date(parseInt(params.startDate as string)) : null;
    const initEnd = params.endDate ? new Date(parseInt(params.endDate as string)) : null;

    const [rangeStart, setRangeStart] = useState<Date | null>(initStart);
    const [rangeEnd, setRangeEnd] = useState<Date | null>(initEnd && initStart && !sameDay(new Date(parseInt(params.endDate as string)), new Date(parseInt(params.startDate as string))) ? initEnd : null);
    const [currentMonthOffset, setCurrentMonthOffset] = useState(0);

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
            days.push({ day: i, fullDate: dateObj });
        }

        return {
            calendarData: days,
            monthLabel: `${MONTHS[displayMonth]} ${displayYear}`
        };
    }, [currentMonthOffset]);

    const handleDatePress = (dateObj: Date) => {
        if (!rangeStart || (rangeStart && rangeEnd)) {
            // Start fresh
            setRangeStart(dateObj);
            setRangeEnd(null);
        } else {
            // Have start, no end
            if (dateObj < rangeStart) {
                // Clicked before start: reset with this as new start
                setRangeStart(dateObj);
                setRangeEnd(null);
            } else {
                // Clicked on or after start: set end (single date if same day)
                setRangeEnd(dateObj);
            }
        }
    };

    const isStartDate = (dateObj: Date) => !!rangeStart && sameDay(dateObj, rangeStart);
    const isEndDate = (dateObj: Date) => !!rangeEnd && sameDay(dateObj, rangeEnd);
    const isInRange = (dateObj: Date) => {
        if (!rangeStart || !rangeEnd) return false;
        const d = dateObj.getTime();
        return d > rangeStart.getTime() && d < rangeEnd.getTime();
    };
    const isSelected = (dateObj: Date) => isStartDate(dateObj) || isEndDate(dateObj);

    const [services, setServices] = useState<any[]>([]);

    React.useEffect(() => {
        import('@/lib/api').then(({ getServices }) => {
            getServices().then(setServices).catch(console.error);
        });
    }, []);

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
        if (count === 0) return '#EF4444';
        if (count < 10) return '#EAB308';
        return '#22C55E';
    };

    const getSelectionLabel = () => {
        if (!rangeStart) return null;
        const locale = 'fr-FR';
        const startStr = rangeStart.toLocaleDateString(locale, { day: 'numeric', month: 'long' });
        if (!rangeEnd || sameDay(rangeStart, rangeEnd)) {
            return `Le ${startStr}`;
        }
        const endStr = rangeEnd.toLocaleDateString(locale, { day: 'numeric', month: 'long' });
        return `Du ${startStr} au ${endStr}`;
    };

    const handleConfirm = () => {
        if (rangeStart) {
            const end = rangeEnd || rangeStart;
            router.push({
                pathname: '/(tabs)/search',
                params: {
                    startDate: rangeStart.getTime().toString(),
                    endDate: end.getTime().toString()
                }
            });
        }
    };

    const selectionLabel = getSelectionLabel();

    return (
        <View className="flex-1 bg-zinc-900" style={directionStyle(isRTL)}>
            <StatusBar barStyle="light-content" />
            <SafeAreaView className="flex-1 p-6">

                {/* Header */}
                <TouchableOpacity onPress={() => router.back()} className="mb-6">
                    <ChevronLeft color="white" size={28} style={flipChevron(isRTL)} />
                </TouchableOpacity>

                <Text className="text-4xl text-white font-serif mb-2" style={textStart(isRTL)}>{t('dateSelectTitle')}</Text>
                <Text className="text-zinc-400 text-sm mb-8" style={textStart(isRTL)}>
                    {!rangeStart ? 'Appuyez sur une date pour commencer' : !rangeEnd ? 'Appuyez sur une 2ème date pour créer une plage' : selectionLabel}
                </Text>

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

                            const { day, fullDate } = item;
                            const selected = isSelected(fullDate);
                            const inRange = isInRange(fullDate);
                            const crowdColor = getCrowdLevelColor(fullDate);

                            return (
                                <TouchableOpacity
                                    key={`${day}-${index}`}
                                    onPress={() => handleDatePress(fullDate)}
                                    className="w-[14.28%] h-14 items-center justify-start pt-1"
                                >
                                    <View className={`w-10 h-10 items-center justify-center rounded-full ${selected ? 'bg-[#b39164]' : inRange ? 'bg-[#b39164]/25' : ''}`}>
                                        <Text className={`font-medium text-lg ${selected ? 'text-white' : inRange ? 'text-[#b39164]' : 'text-white'}`}>{day}</Text>
                                    </View>
                                    {!selected && !inRange && <View style={{ backgroundColor: crowdColor }} className="w-1.5 h-1.5 rounded-full mt-1" />}
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
                    className={`w-full py-4 rounded-3xl items-center mb-4 border border-white/5 ${rangeStart ? 'bg-[#b39164]' : 'bg-[#1c1c1e]'}`}
                    onPress={handleConfirm}
                    disabled={!rangeStart}
                >
                    <Text className={`font-medium text-lg ${rangeStart ? 'text-white font-bold' : 'text-zinc-600'}`}>
                        {selectionLabel ? `Confirmer — ${selectionLabel}` : t('common:confirm')}
                    </Text>
                </TouchableOpacity>

            </SafeAreaView>
        </View>
    );
}
