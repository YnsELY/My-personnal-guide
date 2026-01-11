import { X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export type FilterState = {
    languages: string[];
    city: string | null;
    priceRange: 'budget' | 'standard' | 'premium' | null;
    people: number;
};

interface FilterModalProps {
    visible: boolean;
    onClose: () => void;
    onApply: (filters: FilterState) => void;
    initialFilters: FilterState;
}

const LANGUAGES = ['Français', 'Anglais', 'Arabe', 'Urdu', 'Indonésien'];
const CITIES = ['La Mecque', 'Médine'];

export function FilterModal({ visible, onClose, onApply, initialFilters }: FilterModalProps) {
    const [filters, setFilters] = useState<FilterState>(initialFilters);

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
            <View className="flex-1 bg-black/50 justify-end">
                <View className="bg-white dark:bg-zinc-900 rounded-t-3xl h-[80%] p-6">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-xl font-bold text-gray-900 dark:text-white">Filtres</Text>
                        <TouchableOpacity onPress={onClose} className="bg-gray-100 dark:bg-zinc-800 p-2 rounded-full">
                            <X size={20} className="text-gray-900 dark:text-white" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                        {/* City Section */}
                        <View className="mb-6">
                            <Text className="text-gray-900 dark:text-white font-bold mb-3">Ville</Text>
                            <View className="flex-row gap-3 flex-wrap">
                                {CITIES.map(city => (
                                    <TouchableOpacity
                                        key={city}
                                        onPress={() => setFilters(prev => ({ ...prev, city: prev.city === city ? null : city }))}
                                        className={`px-4 py-2 rounded-xl border ${filters.city === city ? 'bg-primary border-primary' : 'bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-white/10'}`}
                                    >
                                        <Text className={filters.city === city ? 'text-white' : 'text-gray-700 dark:text-gray-300'}>{city}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Language Section */}
                        <View className="mb-6">
                            <Text className="text-gray-900 dark:text-white font-bold mb-3">Langue parlée</Text>
                            <View className="flex-row gap-3 flex-wrap">
                                {LANGUAGES.map(lang => (
                                    <TouchableOpacity
                                        key={lang}
                                        onPress={() => toggleLanguage(lang)}
                                        className={`px-4 py-2 rounded-xl border ${filters.languages.includes(lang) ? 'bg-primary border-primary' : 'bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-white/10'}`}
                                    >
                                        <Text className={filters.languages.includes(lang) ? 'text-white' : 'text-gray-700 dark:text-gray-300'}>{lang}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* People Section */}
                        <View className="mb-6">
                            <Text className="text-gray-900 dark:text-white font-bold mb-3">Nombre de personnes</Text>
                            <View className="flex-row gap-4 items-center bg-gray-50 dark:bg-zinc-800 p-4 rounded-xl border border-gray-200 dark:border-white/10">
                                <TouchableOpacity
                                    onPress={() => setFilters(prev => ({ ...prev, people: Math.max(1, prev.people - 1) }))}
                                    className="bg-white dark:bg-zinc-700 w-10 h-10 rounded-full items-center justify-center shadow-sm"
                                >
                                    <Text className="text-xl font-bold text-gray-900 dark:text-white">-</Text>
                                </TouchableOpacity>
                                <Text className="text-xl font-bold flex-1 text-center text-gray-900 dark:text-white">{filters.people} pers.</Text>
                                <TouchableOpacity
                                    onPress={() => setFilters(prev => ({ ...prev, people: prev.people + 1 }))}
                                    className="bg-white dark:bg-zinc-700 w-10 h-10 rounded-full items-center justify-center shadow-sm"
                                >
                                    <Text className="text-xl font-bold text-gray-900 dark:text-white">+</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Price Section */}
                        <View className="mb-8">
                            <Text className="text-gray-900 dark:text-white font-bold mb-3">Budget</Text>
                            <View className="flex-row gap-3">
                                {[
                                    { id: 'budget', label: 'Éco' },
                                    { id: 'standard', label: 'Standard' },
                                    { id: 'premium', label: 'Premium' },
                                ].map((option) => (
                                    <TouchableOpacity
                                        key={option.id}
                                        onPress={() => setFilters(prev => ({ ...prev, priceRange: prev.priceRange === option.id ? null : option.id as any }))}
                                        className={`flex-1 items-center justify-center px-4 py-3 rounded-xl border ${filters.priceRange === option.id ? 'bg-primary border-primary' : 'bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-white/10'}`}
                                    >
                                        <Text className={filters.priceRange === option.id ? 'text-white font-bold' : 'text-gray-700 dark:text-gray-300 font-medium'}>{option.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </ScrollView>

                    {/* Footer Actions */}
                    <View className="pt-4 border-t border-gray-100 dark:border-white/5">
                        <TouchableOpacity
                            onPress={handleApply}
                            className="bg-primary p-4 rounded-2xl items-center shadow-lg"
                        >
                            <Text className="text-white font-bold text-lg">Appliquer les filtres</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setFilters({ languages: [], city: null, priceRange: null, people: 1 })}
                            className="items-center mt-4"
                        >
                            <Text className="text-gray-500 font-medium">Réinitialiser</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
