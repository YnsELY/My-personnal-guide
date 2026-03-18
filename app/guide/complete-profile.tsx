import { createGuideProfile, getCurrentGuideProfile } from '@/lib/api';
import { Stack, useRouter } from 'expo-router';
import { ArrowRight, BadgeCheck, Check, ChevronDown, Globe, MapPin, Phone, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const LANGUAGES_LIST = [
    "Français", "Arabe", "Anglais", "Urdu", "Indonésien", "Turc", "Haoussa", "Bengali"
];

const CITIES = ["La Mecque", "Médine", "Les deux"];

export default function CompleteProfileScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [bio, setBio] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    // City Selector State
    const [location, setLocation] = useState('');
    const [showCityModal, setShowCityModal] = useState(false);

    // Language Selector State
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
    const [showLangModal, setShowLangModal] = useState(false);

    // Experience Date State (Month/Year)
    const [experienceDate, setExperienceDate] = useState(new Date());
    const [showDateModal, setShowDateModal] = useState(false);

    const toggleLanguage = (lang: string) => {
        if (selectedLanguages.includes(lang)) {
            setSelectedLanguages(selectedLanguages.filter(l => l !== lang));
        } else {
            setSelectedLanguages([...selectedLanguages, lang]);
        }
    };

    const handleDateChange = (year: number, month: number) => {
        const newDate = new Date(year, month, 1);
        setExperienceDate(newDate);
        setShowDateModal(false);
    }

    // Load existing profile on mount
    React.useEffect(() => {
        const loadProfile = async () => {
            const guideProfile = await getCurrentGuideProfile();
            if (guideProfile) {
                if (guideProfile.bio) setBio(guideProfile.bio);
                if (guideProfile.location) setLocation(guideProfile.location);
                if (guideProfile.phone_number) setPhoneNumber(guideProfile.phone_number);
                if (guideProfile.languages) setSelectedLanguages(guideProfile.languages);
                if (guideProfile.experience_since) setExperienceDate(new Date(guideProfile.experience_since));
            }
        };
        loadProfile();
    }, []);



    const handleSubmit = async () => {
        if (!bio || !location || selectedLanguages.length === 0 || !phoneNumber.trim()) {
            Alert.alert("Erreur", "Veuillez remplir tous les champs");
            return;
        }

        setLoading(true);
        try {
            await createGuideProfile({
                bio,
                location,
                languages: selectedLanguages,
                phone_number: phoneNumber.trim(),
                experience_since: experienceDate.toISOString()
            });
            Alert.alert("Succès", "Profil mis à jour !", [
                { text: "Retour", onPress: () => router.replace('/(tabs)/profile') }
            ]);
        } catch (e: any) {
            // ... error handling
            console.error(e);
            Alert.alert("Erreur", "Impossible de sauvegarder votre profil. " + e.message);
        } finally {
            setLoading(false);
        }
    };

    // Simple Month/Year Picker Component
    const renderDatePicker = () => {
        const years = Array.from({ length: 55 }, (_, i) => new Date().getFullYear() - i);
        const months = [
            "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
            "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
        ];

        return (
            <Modal visible={showDateModal} transparent animationType="fade">
                <View className="flex-1 bg-black/50 justify-center items-center">
                    <View className="bg-white dark:bg-zinc-800 w-[90%] rounded-2xl p-6 max-h-[80%]">
                        <Text className="text-xl font-bold mb-4 dark:text-white">Depuis quand êtes-vous guide ?</Text>
                        <ScrollView className="max-h-96">
                            {years.map(year => (
                                <View key={year} className="mb-4">
                                    <Text className="font-bold text-lg text-[#b39164] mb-2">{year}</Text>
                                    <View className="flex-row flex-wrap gap-2">
                                        {months.map((month, index) => (
                                            <TouchableOpacity
                                                key={`${year}-${index}`}
                                                onPress={() => handleDateChange(year, index)}
                                                className={`px-3 py-2 rounded-lg border ${experienceDate.getFullYear() === year && experienceDate.getMonth() === index
                                                    ? 'bg-[#b39164] border-[#b39164]'
                                                    : 'border-gray-200 dark:border-zinc-700'
                                                    }`}
                                            >
                                                <Text className={`${experienceDate.getFullYear() === year && experienceDate.getMonth() === index
                                                    ? 'text-white'
                                                    : 'text-gray-700 dark:text-gray-300'
                                                    }`}>{month}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                        <TouchableOpacity onPress={() => setShowDateModal(false)} className="mt-4 p-3 bg-gray-200 dark:bg-zinc-700 rounded-xl items-center">
                            <Text className="dark:text-white font-bold">Annuler</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    };

    return (
        <View className="flex-1 bg-white dark:bg-zinc-900">
            <StatusBar barStyle="dark-content" />
            <SafeAreaView className="flex-1 px-6">

                <Stack.Screen options={{ headerShown: false }} />

                <View className="flex-row items-center mb-6 mt-4">
                    <TouchableOpacity onPress={() => router.replace('/(tabs)/profile')} className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full mr-4">
                        <ArrowRight className="rotate-180" size={20} color="#000" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold dark:text-white">Profil Guide</Text>
                </View>

                <View className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                    <Text className="text-amber-200 text-xs">
                        Compte strictement personnel: le prêt, le partage et la délégation du compte guide sont interdits.
                    </Text>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    <View className="gap-5">

                        {/* Phone */}
                        <View>
                            <Text className="text-gray-500 mb-2 font-medium">Numéro de téléphone</Text>
                            <View className="flex-row items-center bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3">
                                <Phone size={20} color="#9CA3AF" />
                                <TextInput
                                    className="flex-1 ml-3 text-gray-900 dark:text-white"
                                    placeholder="+33 6 12 34 56 78"
                                    placeholderTextColor="#9CA3AF"
                                    value={phoneNumber}
                                    onChangeText={setPhoneNumber}
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </View>

                        {/* City Selector */}
                        <View>
                            <Text className="text-gray-500 mb-2 font-medium">Ville</Text>
                            <TouchableOpacity
                                onPress={() => setShowCityModal(true)}
                                className="flex-row items-center bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3"
                            >
                                <MapPin size={20} color="#9CA3AF" />
                                <Text className={`flex-1 ml-3 ${location ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                                    {location || "Sélectionner une ville"}
                                </Text>
                                <ChevronDown size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        {/* Language Selector */}
                        <View>
                            <Text className="text-gray-500 mb-2 font-medium">Langues parlées</Text>
                            <TouchableOpacity
                                onPress={() => setShowLangModal(true)}
                                className="flex-row items-center bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 min-h-[50px]"
                            >
                                <Globe size={20} color="#9CA3AF" />
                                <View className="flex-1 ml-3 flex-row flex-wrap gap-2">
                                    {selectedLanguages.length > 0 ? (
                                        selectedLanguages.map(lang => (
                                            <View key={lang} className="bg-[#b39164]/20 px-2 py-1 rounded-md">
                                                <Text className="text-[#b39164] text-xs font-bold">{lang}</Text>
                                            </View>
                                        ))
                                    ) : (
                                        <Text className="text-gray-400">Sélectionner les langues</Text>
                                    )}
                                </View>
                                <ChevronDown size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        {/* Experience Date Selector */}
                        <View>
                            <Text className="text-gray-500 mb-2 font-medium">Guide depuis</Text>
                            <TouchableOpacity
                                onPress={() => setShowDateModal(true)}
                                className="flex-row items-center bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3"
                            >
                                <BadgeCheck size={20} color="#9CA3AF" />
                                <Text className="flex-1 ml-3 text-gray-900 dark:text-white">
                                    {experienceDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                                </Text>
                                <ChevronDown size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>


                        {/* Bio */}
                        <View>
                            <Text className="text-gray-500 mb-2 font-medium">Biographie</Text>
                            <View className="flex-row items-start bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 h-32">
                                <TextInput
                                    className="flex-1 text-gray-900 dark:text-white text-base"
                                    placeholder="Décrivez votre expérience..."
                                    placeholderTextColor="#9CA3AF"
                                    value={bio}
                                    onChangeText={setBio}
                                    multiline
                                    textAlignVertical="top"
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={loading}
                            className="bg-[#b39164] py-4 rounded-xl items-center shadow-lg shadow-[#b39164]/20 mt-4 active:bg-[#a08055] flex-row justify-center gap-2"
                        >
                            <Text className="text-white font-bold text-lg">{loading ? 'Enregistrement...' : 'Terminer'}</Text>
                            {!loading && <ArrowRight size={20} color="white" />}
                        </TouchableOpacity>

                    </View>
                </ScrollView>
            </SafeAreaView>


            {/* City Modal */}
            <Modal visible={showCityModal} transparent animationType="fade">
                <View className="flex-1 bg-black/50 justify-center items-center p-6">
                    <View className="bg-white dark:bg-zinc-800 w-full rounded-2xl p-4">
                        <Text className="text-xl font-bold mb-4 dark:text-white">Choisir une ville</Text>
                        {CITIES.map(city => (
                            <TouchableOpacity
                                key={city}
                                onPress={() => { setLocation(city); setShowCityModal(false); }}
                                className="py-4 border-b border-gray-100 dark:border-zinc-700 flex-row justify-between items-center"
                            >
                                <Text className="text-lg dark:text-white">{city}</Text>
                                {location === city && <Check size={20} color="#b39164" />}
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity onPress={() => setShowCityModal(false)} className="mt-4 p-3 bg-gray-200 dark:bg-zinc-700 rounded-xl items-center">
                            <Text className="dark:text-white font-bold">Annuler</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Languages Modal */}
            <Modal visible={showLangModal} transparent animationType="slide">
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white dark:bg-zinc-800 rounded-t-3xl p-6 h-[70%]">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold dark:text-white">Choisir les langues</Text>
                            <TouchableOpacity onPress={() => setShowLangModal(false)}>
                                <X size={24} color="gray" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {LANGUAGES_LIST.map(lang => (
                                <TouchableOpacity
                                    key={lang}
                                    onPress={() => toggleLanguage(lang)}
                                    className="py-4 border-b border-gray-100 dark:border-zinc-700 flex-row justify-between items-center"
                                >
                                    <Text className="text-lg dark:text-white">{lang}</Text>
                                    <View className={`w-6 h-6 rounded-md border-2 items-center justify-center ${selectedLanguages.includes(lang) ? 'bg-[#b39164] border-[#b39164]' : 'border-gray-300'}`}>
                                        {selectedLanguages.includes(lang) && <Check size={14} color="white" />}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity onPress={() => setShowLangModal(false)} className="mt-4 bg-[#b39164] py-4 rounded-xl items-center">
                            <Text className="text-white font-bold text-lg">Valider</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Date Picker Modal */}
            {renderDatePicker()}

        </View>
    );
}
