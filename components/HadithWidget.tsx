import { HADITHS } from '@/constants/data';
import { Quote } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Animated, Text, View } from 'react-native';

export const HadithWidget = () => {
    const [index, setIndex] = useState(0);
    const [fadeAnim] = useState(new Animated.Value(1));

    useEffect(() => {
        const interval = setInterval(() => {
            // Fade out
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }).start(() => {
                // Change index
                setIndex((prevIndex) => (prevIndex + 1) % HADITHS.length);
                // Fade in
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }).start();
            });
        }, 8000); // 8 seconds

        return () => clearInterval(interval);
    }, []);

    const hadith = HADITHS[index];

    return (
        <View className="mx-6 mb-6">
            <View className="bg-white dark:bg-zinc-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-white/5 relative overflow-hidden">
                {/* Decorative Quote Icon Background */}
                <View className="absolute -top-4 -right-4 opacity-5">
                    <Quote size={100} color="#b39164" fill="#b39164" />
                </View>

                {/* Header with small icon */}
                <View className="flex-row items-center mb-3">
                    <Quote size={16} color="#b39164" fill="#b39164" className="mr-2" style={{ transform: [{ rotate: '180deg' }] }} />
                    <Text className="text-[#b39164] font-bold text-xs uppercase tracking-wider">Hadith du jour</Text>
                </View>

                {/* Animated Text */}
                <Animated.View style={{ opacity: fadeAnim }}>
                    <Text className="text-gray-800 dark:text-gray-100 font-serif text-base italic leading-6 mb-3">
                        "{hadith.text}"
                    </Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-xs text-right font-medium">
                        — {hadith.source}
                    </Text>
                </Animated.View>
            </View>
        </View>
    );
};
