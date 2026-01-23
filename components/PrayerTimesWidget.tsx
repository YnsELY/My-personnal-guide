import { getPrayerTimes } from '@/lib/api';
import { CloudSun, MapPin, Moon, Sun, Sunrise, Sunset } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

const PRAYERS = [
    { key: 'Fajr', label: 'Fajr', icon: Sunrise },
    { key: 'Sunrise', label: 'Shuruq', icon: Sun },
    { key: 'Dhuhr', label: 'Dhuhr', icon: Sun },
    { key: 'Asr', label: 'Asr', icon: CloudSun },
    { key: 'Maghrib', label: 'Maghrib', icon: Sunset },
    { key: 'Isha', label: 'Isha', icon: Moon },
];

export const PrayerTimesWidget = () => {
    const [city, setCity] = useState<'Mecca' | 'Medina'>('Mecca');
    const [times, setTimes] = useState<any>(null);
    const [nextPrayer, setNextPrayer] = useState<{ key: string, label: string } | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchTimes = async (targetCity: string) => {
        setLoading(true);
        try {
            const data = await getPrayerTimes(targetCity, 'Saudi Arabia');
            if (data) {
                setTimes(data);
                updateNextPrayer(data);
            } else {
                console.warn('API returned null for prayer times');
                // Use fallback/mock if API fails silently
            }
        } catch (error) {
            console.error('Failed to fetch prayer times:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTimes(city);
    }, [city]);

    useEffect(() => {
        if (!times) return;
        const interval = setInterval(() => {
            updateNextPrayer(times);
        }, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [times]);

    const updateNextPrayer = (currentTimes: any) => {
        if (!currentTimes) return;
        const now = new Date();
        let minDiff = Infinity;
        let nextP = null;

        for (const p of PRAYERS) {
            if (p.key === 'Sunrise') continue;

            const timeVal = currentTimes[p.key];
            if (typeof timeVal !== 'string') continue;

            const timeStr = timeVal.split(' ')[0];
            if (!timeStr || !timeStr.includes(':')) continue;

            const [h, m] = timeStr.split(':').map(Number);
            const pDate = new Date();
            pDate.setHours(h, m, 0, 0);

            if (pDate.getTime() > now.getTime()) {
                const diff = pDate.getTime() - now.getTime();
                if (diff < minDiff) {
                    minDiff = diff;
                    nextP = p;
                }
            }
        }

        if (!nextP && currentTimes['Fajr']) {
            // Tomorrow logic omitted for brevity in summary, but implied next is Fajr
            nextP = PRAYERS[0];
        }

        if (nextP) {
            setNextPrayer(nextP);
        }
    };

    const toggleCity = () => {
        setCity(prev => prev === 'Mecca' ? 'Medina' : 'Mecca');
    };

    if (loading && !times) {
        return (
            <View className="mb-6 h-32 rounded-2xl bg-white dark:bg-zinc-800 justify-center items-center shadow-sm border border-gray-100 dark:border-white/5">
                <ActivityIndicator color="#b39164" />
            </View>
        );
    }

    if (!times) return null;

    return (
        <View className="mb-6 bg-white dark:bg-zinc-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-white/5">
            {/* Minimal Header */}
            <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-2">
                    <View className="bg-[#b39164]/10 p-2 rounded-full">
                        <MapPin size={16} color="#b39164" />
                    </View>
                    <Text className="text-gray-900 dark:text-white font-bold text-lg">
                        {city === 'Mecca' ? 'La Mecque' : 'Médine'}
                    </Text>
                </View>
                <TouchableOpacity onPress={toggleCity} className="bg-gray-50 dark:bg-zinc-700 px-3 py-1 rounded-full border border-gray-100 dark:border-zinc-600">
                    <Text className="text-xs text-gray-500 dark:text-gray-300 font-medium">Changer</Text>
                </TouchableOpacity>
            </View>

            {/* Classic Grid/Row */}
            <View className="flex-row justify-between items-center">
                {PRAYERS.map((prayer) => {
                    const isNext = nextPrayer?.key === prayer.key;
                    const timeVal = times[prayer.key];
                    const time = typeof timeVal === 'string' ? timeVal.split(' ')[0] : '--:--';

                    return (
                        <View key={prayer.key} className={`items-center px-1 py-2 rounded-lg ${isNext ? 'bg-[#b39164]/10' : ''}`}>
                            <Text className={`text-[10px] uppercase tracking-wide mb-1 ${isNext ? 'text-[#b39164] font-bold' : 'text-gray-400 dark:text-gray-500'}`}>
                                {prayer.label}
                            </Text>
                            <Text className={`text-sm font-medium ${isNext ? 'text-[#b39164] font-bold' : 'text-gray-900 dark:text-gray-200'}`}>
                                {time}
                            </Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
};
