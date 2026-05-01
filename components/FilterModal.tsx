import { BlurView } from 'expo-blur';
import { X } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export type FilterState = {
    languages: string[];
    city: string | null;
    people: number;
};

interface FilterModalProps {
    visible: boolean;
    onClose: () => void;
    onApply: (filters: FilterState) => void;
    initialFilters: FilterState;
}

const LANGUAGE_KEYS = ['french', 'english', 'arabic'] as const;
const CITY_KEYS = ['laMecque', 'medine'] as const;

export function FilterModal({ visible, onClose, onApply, initialFilters }: FilterModalProps) {
    const { t } = useTranslation('booking');
    const [filters, setFilters] = useState<FilterState>(initialFilters);

    const languages = LANGUAGE_KEYS.map(k => t(`filterLanguages.${k}`));
    const cities = CITY_KEYS.map(k => t(k));

    const toggleLanguage = (lang: string) => {
        setFilters(prev => ({
            ...prev,
            languages: prev.languages.includes(lang)
                ? prev.languages.filter(l => l !== lang)
                : [...prev.languages, lang]
        }));
    };

    const handleApply = () => {
        onApply(filters);
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end">
                <TouchableOpacity
                    className="absolute inset-0 bg-black/60"
                    activeOpacity={1}
                    onPress={onClose}
                />

                <BlurView intensity={Platform.OS === 'ios' ? 40 : 100} tint="dark" className="bg-zinc-900 rounded-t-3xl overflow-hidden border-t border-white/10 h-[85%]">
                    <SafeAreaView edges={['bottom']} className="flex-1 p-6">

                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-2xl font-serif font-bold text-white">{t('filters')}</Text>
                            <TouchableOpacity onPress={onClose} className="bg-zinc-800 p-2 rounded-full">
                                <X size={20} color="white" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                            {/* City Section */}
                            <View className="mb-8">
                                <Text className="text-white font-bold text-lg mb-4">{t('city')}</Text>
                                <View className="flex-row gap-3 flex-wrap">
                                    {cities.map(city => (
                                        <TouchableOpacity
                                            key={city}
                                            onPress={() => setFilters(prev => ({ ...prev, city: prev.city === city ? null : city }))}
                                            className={`px-4 py-3 rounded-xl border ${filters.city === city ? 'bg-[#b39164] border-[#b39164]' : 'bg-zinc-800 border-white/5'}`}
                                        >
                                            <Text className={`font-medium ${filters.city === city ? 'text-white' : 'text-zinc-400'}`}>{city}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Language Section */}
                            <View className="mb-8">
                                <Text className="text-white font-bold text-lg mb-4">{t('languages')}</Text>
                                <View className="flex-row gap-3 flex-wrap">
                                    {languages.map(lang => (
                                        <TouchableOpacity
                                            key={lang}
                                            onPress={() => toggleLanguage(lang)}
                                            className={`px-4 py-3 rounded-xl border ${filters.languages.includes(lang) ? 'bg-[#b39164] border-[#b39164]' : 'bg-zinc-800 border-white/5'}`}
                                        >
                                            <Text className={`font-medium ${filters.languages.includes(lang) ? 'text-white' : 'text-zinc-400'}`}>{lang}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* People Section */}
                            <View className="mb-8">
                                <Text className="text-white font-bold text-lg mb-4">{t('numberOfPeople')}</Text>
                                <View className="flex-row gap-4 items-center bg-zinc-800 p-4 rounded-xl border border-white/5">
                                    <TouchableOpacity
                                        onPress={() => setFilters(prev => ({ ...prev, people: Math.max(1, prev.people - 1) }))}
                                        className="bg-zinc-700 w-10 h-10 rounded-full items-center justify-center shadow-sm"
                                    >
                                        <Text className="text-xl font-bold text-white">-</Text>
                                    </TouchableOpacity>
                                    <Text className="text-xl font-bold flex-1 text-center text-white">{filters.people} {filters.people > 1 ? t('persons') : t('person')}</Text>
                                    <TouchableOpacity
                                        onPress={() => setFilters(prev => ({ ...prev, people: prev.people + 1 }))}
                                        className="bg-zinc-700 w-10 h-10 rounded-full items-center justify-center shadow-sm"
                                    >
                                        <Text className="text-xl font-bold text-white">+</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                        </ScrollView>

                        {/* Footer Actions */}
                        <View className="pt-4 border-t border-white/5">
                            <TouchableOpacity
                                onPress={handleApply}
                                className="bg-[#b39164] p-4 rounded-2xl items-center shadow-lg shadow-[#b39164]/20"
                            >
                                <Text className="text-white font-bold text-lg">{t('applyFilters')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setFilters({ languages: [], city: null, people: 1 })}
                                className="items-center mt-4"
                            >
                                <Text className="text-zinc-500 font-medium">{t('resetFilters')}</Text>
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </BlurView>
            </View>
        </Modal>
    );
}
