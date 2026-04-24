import { useLanguage } from '@/context/LanguageContext';
import { rowStyle, textStart } from '@/lib/rtl';
import { getPrayerTimes } from '@/lib/api';
import { CloudSun, MapPin, Moon, Sun, Sunrise, Sunset } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

const PRAYERS = [
    { key: 'Fajr', label: 'Fajr', icon: Sunrise },
    { key: 'Sunrise', label: 'Shuruq', icon: Sun },
    { key: 'Dhuhr', label: 'Dhuhr', icon: Sun },
    { key: 'Asr', label: 'Asr', icon: CloudSun },
    { key: 'Maghrib', label: 'Maghrib', icon: Sunset },
    { key: 'Isha', label: 'Isha', icon: Moon },
];

export const PrayerTimesWidget = ({ glass = false }: { glass?: boolean }) => {
    const { t } = useTranslation('content');
    const { isRTL } = useLanguage();
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
        }, 60000);
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
            nextP = PRAYERS[0];
        }
        if (nextP) setNextPrayer(nextP);
    };

    const toggleCity = () => {
        setCity(prev => prev === 'Mecca' ? 'Medina' : 'Mecca');
    };

    if (loading && !times) {
        return (
            <View style={glass ? {
                marginBottom: 16, height: 72, borderRadius: 16,
                backgroundColor: 'rgba(8,8,18,0.78)',
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
                justifyContent: 'center', alignItems: 'center',
            } : undefined}
                className={glass ? '' : "mb-6 h-32 rounded-2xl bg-white dark:bg-zinc-800 justify-center items-center shadow-sm border border-gray-100 dark:border-white/5"}
            >
                <ActivityIndicator color={glass ? 'rgba(255,255,255,0.8)' : '#b39164'} />
            </View>
        );
    }

    if (!times) return null;

    if (glass) {
        return (
            <View style={{
                marginBottom: 14,
                backgroundColor: 'rgba(8,8,18,0.78)',
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 20,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.2)',
            }}>
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', padding: 6, borderRadius: 100 }}>
                            <MapPin size={14} color="white" />
                        </View>
                        <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>
                            {city === 'Mecca' ? t('prayerTimes.mecca') : t('prayerTimes.medina')}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={toggleCity} style={{
                        backgroundColor: 'rgba(255,255,255,0.14)',
                        paddingHorizontal: 12, paddingVertical: 5,
                        borderRadius: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
                    }}>
                        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>{t('prayerTimes.change')}</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    {PRAYERS.map((prayer) => {
                        const isNext = nextPrayer?.key === prayer.key;
                        const timeVal = times[prayer.key];
                        const time = typeof timeVal === 'string' ? timeVal.split(' ')[0] : '--:--';
                        const Icon = prayer.icon;
                        return (
                            <View key={prayer.key} style={{
                                alignItems: 'center', paddingHorizontal: 4, paddingVertical: 10, borderRadius: 10,
                                backgroundColor: isNext ? 'rgba(179,145,100,0.35)' : 'transparent',
                            }}>
                                <Icon size={16} color={isNext ? '#f6dfbf' : 'rgba(255,255,255,0.45)'} style={{ marginBottom: 5 }} />
                                <Text style={{
                                    fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4,
                                    color: isNext ? '#f6dfbf' : 'rgba(255,255,255,0.55)',
                                    fontWeight: isNext ? '700' : '400',
                                }}>{prayer.label}</Text>
                                <Text style={{
                                    fontSize: 13, fontWeight: isNext ? '700' : '500',
                                    color: isNext ? '#f6dfbf' : 'rgba(255,255,255,0.9)',
                                }}>{time}</Text>
                            </View>
                        );
                    })}
                </View>
            </View>
        );
    }

    return (
        <View className="mb-6 bg-white dark:bg-zinc-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-white/5">
            <View className="flex-row items-center justify-between mb-4" style={rowStyle(isRTL)}>
                <View className="flex-row items-center gap-2" style={rowStyle(isRTL)}>
                    <View className="bg-[#b39164]/10 p-2 rounded-full">
                        <MapPin size={16} color="#b39164" />
                    </View>
                    <Text className="text-gray-900 dark:text-white font-bold text-lg" style={textStart(isRTL)}>
                        {city === 'Mecca' ? t('prayerTimes.mecca') : t('prayerTimes.medina')}
                    </Text>
                </View>
                <TouchableOpacity onPress={toggleCity} className="bg-gray-50 dark:bg-zinc-700 px-3 py-1 rounded-full border border-gray-100 dark:border-zinc-600">
                    <Text className="text-xs text-gray-500 dark:text-gray-300 font-medium" style={textStart(isRTL)}>{t('prayerTimes.change')}</Text>
                </TouchableOpacity>
            </View>

            <View className="flex-row justify-between items-center" style={rowStyle(isRTL)}>
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
