import { useLanguage } from '@/context/LanguageContext';
import { textEnd, textStart } from '@/lib/rtl';
import { Quote } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Text, View } from 'react-native';

type HadithEntry = {
    title?: string;
    arabic: string;
    translation?: string;
    source: string;
};

export const HadithWidget = () => {
    const { t } = useTranslation('content');
    const { isRTL } = useLanguage();
    const [index, setIndex] = useState(0);
    const [fadeAnim] = useState(new Animated.Value(1));
    const hadiths = t('hadiths', { returnObjects: true }) as HadithEntry[];

    useEffect(() => {
        if (!hadiths?.length) return;
        const interval = setInterval(() => {
            // Fade out
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }).start(() => {
                // Change index
                setIndex((prevIndex) => (prevIndex + 1) % hadiths.length);
                // Fade in
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }).start();
            });
        }, 8000); // 8 seconds

        return () => clearInterval(interval);
    }, [fadeAnim, hadiths.length]);

    const hadith = hadiths[index] || hadiths[0];
    if (!hadith) return null;

    return (
        <View className="mb-6">
            <View className="bg-white dark:bg-zinc-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-white/5 relative overflow-hidden">
                {/* Decorative Quote Icon Background */}
                <View className="absolute -top-4 -right-4 opacity-5">
                    <Quote size={100} color="#b39164" fill="#b39164" />
                </View>

                {/* Header with small icon */}
                <View className="flex-row items-center mb-3">
                    <Quote size={16} color="#b39164" fill="#b39164" style={{ transform: [{ rotate: '180deg' }], marginRight: 10 }} />
                    <Text className="text-[#b39164] font-bold text-xs uppercase tracking-wider" style={textStart(isRTL)}>{t('hadithToday')}</Text>
                </View>

                {/* Animated Text */}
                <Animated.View style={{ opacity: fadeAnim }}>
                    {hadith.title ? (
                        <Text className="text-gray-900 dark:text-white font-bold text-base leading-6 mb-3" style={textStart(isRTL)}>
                            {hadith.title}
                        </Text>
                    ) : null}
                    <Text className="text-gray-800 dark:text-gray-100 font-serif text-base italic leading-6 mb-3" style={textStart(isRTL)}>
                        {hadith.arabic}
                    </Text>
                    {hadith.translation ? (
                        <Text className="text-gray-700 dark:text-gray-200 text-sm leading-6 mb-3" style={textStart(isRTL)}>
                            {hadith.translation}
                        </Text>
                    ) : null}
                    <Text className="text-gray-500 dark:text-gray-400 text-xs leading-5 mb-2" style={textStart(isRTL)}>
                        {t('authenticSource', { defaultValue: 'Source authentique' })}
                    </Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-xs text-right font-medium" style={textEnd(isRTL)}>
                        {hadith.source}
                    </Text>
                </Animated.View>
            </View>
        </View>
    );
};
