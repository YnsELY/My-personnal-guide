import CalendarPicker from '@/components/CalendarPicker';
import { CATEGORIES, SERVICE_OPTIONS } from '@/constants/data';
import { getFixedServiceDescription } from '@/constants/serviceDescriptions';
import { createService, updateService } from '@/lib/api';
import { formatSAR, PLATFORM_COMMISSION_RATE, roundMoney, toSar } from '@/lib/pricing';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, ChevronDown, DollarSign, MapPin, Minus, Plus, Users } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const LOCATION_OPTIONS = ['La Mecque', 'Médine'] as const;
const normalizeGuideLocation = (value?: string | null) => {
    const location = (value || '').trim().toLowerCase();
    if (!location) return '';
    if (location.includes('mecque')) return 'La Mecque';
    if (location.includes('medine') || location.includes('médine')) return 'Médine';
    return '';
};

const getGuideNetEurFromDisplayedPrice = (rawPrice: number) =>
    roundMoney(Math.max(Number(rawPrice) || 0, 0) * (1 - PLATFORM_COMMISSION_RATE));


export default function CreateServiceScreen() {
    const router = useRouter();

    const { service } = useLocalSearchParams();
    const serviceToEdit = service ? JSON.parse(service as string) : null;
    const isEditing = !!serviceToEdit;

    const [title, setTitle] = useState(serviceToEdit?.title || '');
    const [category, setCategory] = useState(serviceToEdit?.category || CATEGORIES[1].name);
    const [price, setPrice] = useState(serviceToEdit?.price?.toString() || '');
    const [location, setLocation] = useState(normalizeGuideLocation(serviceToEdit?.location));
    const [maxParticipants, setMaxParticipants] = useState(serviceToEdit?.maxParticipants?.toString() || '');

    // Date Range State
    const [showCalendar, setShowCalendar] = useState(false);
    const [startDate, setStartDate] = useState<number | null>(serviceToEdit?.startDate ? new Date(serviceToEdit.startDate).getTime() : null);
    const [endDate, setEndDate] = useState<number | null>(serviceToEdit?.endDate ? new Date(serviceToEdit.endDate).getTime() : null);

    const [loading, setLoading] = useState(false);

    const [selectedServiceCategory, setSelectedServiceCategory] = useState<string | null>(null);
    const [selectedServiceOption, setSelectedServiceOption] = useState<any | null>(null);
    const [isCategoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
    const [isOptionDropdownOpen, setOptionDropdownOpen] = useState(false);

    const handleCreateOrUpdate = async () => {
        if (!title || !price || !location || !startDate) {
            Alert.alert("Erreur", "Veuillez remplir tous les champs (y compris la date)");
            return;
        }

        setLoading(true);
        try {
            // Convert timestamps to ISO dates
            const startIso = new Date(startDate).toISOString();
            const endIso = endDate ? new Date(endDate).toISOString() : startIso; // Single date = same start/end

            const fixedDescription = getFixedServiceDescription({
                title,
                category,
                location,
            }) || '';

            const serviceData = {
                title,
                category,
                description: fixedDescription,
                price: parseInt(price),
                location,
                meeting_points: [],
                availability_start: startIso,
                availability_end: endIso,
                max_participants: maxParticipants ? parseInt(maxParticipants) : undefined
            };

            if (isEditing) {
                await updateService(serviceToEdit.id, {
                    ...serviceData,
                    price_override: serviceData.price // Map to correct DB column
                });
                Alert.alert("Succès", "Votre service a été modifié avec succès !", [
                    { text: "OK", onPress: () => router.back() }
                ]);
            } else {
                await createService(serviceData);
                Alert.alert("Succès", "Votre service a été créé avec succès !", [
                    { text: "OK", onPress: () => router.back() }
                ]);
            }
        } catch (e: any) {
            Alert.alert("Erreur", "Impossible d'enregistrer le service : " + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-white dark:bg-zinc-900">
            <StatusBar barStyle="default" />
            <SafeAreaView className="flex-1">
                {/* Header */}
                <View className="px-6 py-4 flex-row justify-between items-center bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-white/5">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                        <ArrowLeft size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-gray-900 dark:text-white">{isEditing ? 'Modifier Service' : 'Nouveau Service'}</Text>
                    <View className="w-10" />
                </View>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                    <ScrollView className="px-6 pt-6" showsVerticalScrollIndicator={false}>

                        <View className="gap-6 pb-20">
                            {/* Service Category Dropdown */}
                            <View className="z-50">
                                <Text className="text-gray-500 mb-2 font-medium">Type de service</Text>
                                <TouchableOpacity
                                    onPress={() => { setCategoryDropdownOpen(!isCategoryDropdownOpen); setOptionDropdownOpen(false); }}
                                    className="flex-row justify-between items-center bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3"
                                >
                                    <Text className="text-gray-900 dark:text-white flex-1">
                                        {selectedServiceCategory || "Sélectionner un type"}
                                    </Text>
                                    <ChevronDown size={20} color="#9CA3AF" />
                                </TouchableOpacity>

                                {isCategoryDropdownOpen && (
                                    <View className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl shadow-lg z-50 max-h-60 overflow-hidden">
                                        <ScrollView nestedScrollEnabled>
                                            {SERVICE_OPTIONS.map((opt, idx) => (
                                                <TouchableOpacity
                                                    key={idx}
                                                    onPress={() => {
                                                        setSelectedServiceCategory(opt.category);
                                                        setCategory(opt.category); // Map to DB category field
                                                        setSelectedServiceOption(null); // Reset option
                                                        setPrice('');
                                                        setCategoryDropdownOpen(false);
                                                    }}
                                                    className="px-4 py-3 border-b border-gray-100 dark:border-white/5 flex-row items-center justify-between active:bg-gray-50 dark:active:bg-zinc-700"
                                                >
                                                    <Text className="text-gray-900 dark:text-white">
                                                        {opt.category}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>

                            {/* Service Option Dropdown */}
                            {selectedServiceCategory && (
                                <View className="z-40">
                                    <Text className="text-gray-500 mb-2 font-medium">Option</Text>
                                    <TouchableOpacity
                                        onPress={() => setOptionDropdownOpen(!isOptionDropdownOpen)}
                                        className="flex-row justify-between items-center bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3"
                                    >
                                        <Text className="text-gray-900 dark:text-white flex-1">
                                            {selectedServiceOption?.label || "Sélectionner une option"}
                                        </Text>
                                        <ChevronDown size={20} color="#9CA3AF" />
                                    </TouchableOpacity>

                                    {isOptionDropdownOpen && (
                                        <View className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl shadow-lg z-50">
                                            {SERVICE_OPTIONS.find(o => o.category === selectedServiceCategory)?.options.map((opt, idx) => (
                                                <TouchableOpacity
                                                    key={idx}
                                                    onPress={() => {
                                                        setSelectedServiceOption(opt);
                                                        setPrice(opt.price.toString());
                                                        setTitle(`${selectedServiceCategory} - ${opt.label}`); // Auto-set title
                                                        setOptionDropdownOpen(false);
                                                    }}
                                                    className="px-4 py-3 border-b border-gray-100 dark:border-white/5 active:bg-gray-50 dark:active:bg-zinc-700 flex-row justify-between"
                                                >
                                                    <Text className="text-gray-900 dark:text-white">{opt.label}</Text>
                                                    <Text className="text-gray-500 font-medium">
                                                        {formatSAR(toSar(getGuideNetEurFromDisplayedPrice(opt.price)))}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            )}

                            {/* Price Display (Read-Only) */}
                            <View>
                                <Text className="text-gray-500 mb-2 font-medium">Prix guide (net après commission)</Text>
                                <View className="flex-row items-center bg-gray-100 dark:bg-zinc-800/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 opacity-80">
                                    <DollarSign size={20} color="#9CA3AF" />
                                    <Text className="flex-1 ml-3 text-gray-900 dark:text-white font-bold text-lg">
                                        {price ? formatSAR(toSar(getGuideNetEurFromDisplayedPrice(Number(price)))) : '--'}
                                    </Text>
                                </View>
                            </View>

                            {/* Max Participants */}
                            <View>
                                <Text className="text-gray-500 mb-2 font-medium">Nombre de personnes maximum</Text>
                                <View className="flex-row items-center bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl p-2">
                                    <TouchableOpacity
                                        onPress={() => {
                                            const current = parseInt(maxParticipants) || 0;
                                            if (current > 1) setMaxParticipants((current - 1).toString());
                                            else setMaxParticipants('');
                                        }}
                                        className="bg-gray-200 dark:bg-zinc-700 p-3 rounded-lg"
                                    >
                                        <Minus size={20} color="white" />
                                    </TouchableOpacity>

                                    <View className="flex-1 flex-row items-center justify-center">
                                        <Users size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
                                        <TextInput
                                            value={maxParticipants}
                                            onChangeText={setMaxParticipants}
                                            placeholder="0"
                                            placeholderTextColor="#9CA3AF"
                                            keyboardType="numeric"
                                            className="text-gray-900 dark:text-white font-bold text-xl text-center min-w-[50px]"
                                        />
                                    </View>

                                    <TouchableOpacity
                                        onPress={() => {
                                            const current = parseInt(maxParticipants) || 0;
                                            setMaxParticipants((current + 1).toString());
                                        }}
                                        className="bg-[#b39164] p-3 rounded-lg"
                                    >
                                        <Plus size={20} color="white" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Location */}
                            <View>
                                <Text className="text-gray-500 mb-2 font-medium">Lieu</Text>
                                <View className="flex-row gap-3">
                                    {LOCATION_OPTIONS.map((option) => {
                                        const isSelected = location === option;
                                        return (
                                            <TouchableOpacity
                                                key={option}
                                                onPress={() => setLocation(option)}
                                                className={`flex-1 flex-row items-center justify-center rounded-xl border px-4 py-3 ${isSelected
                                                    ? 'bg-primary/20 border-primary'
                                                    : 'bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-white/10'
                                                    }`}
                                            >
                                                <MapPin size={16} color={isSelected ? '#b39164' : '#9CA3AF'} />
                                                <Text className={`ml-2 font-medium ${isSelected ? 'text-primary' : 'text-gray-700 dark:text-gray-300'}`}>
                                                    {option}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* Transport Rules */}
                            <View className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl p-4">
                                <Text className="text-gray-900 dark:text-white font-semibold mb-2">Transport géré automatiquement</Text>
                                <Text className="text-gray-500 dark:text-gray-300 text-xs leading-5">
                                    Le pèlerin choisira automatiquement entre:
                                </Text>
                                <Text className="text-gray-500 dark:text-gray-300 text-xs mt-1">- Rendez-vous au haram</Text>
                                <Text className="text-gray-500 dark:text-gray-300 text-xs mt-1">- Rendez-vous à l&apos;hôtel</Text>
                                <Text className="text-gray-500 dark:text-gray-300 text-xs mt-2 leading-5">
                                    Si l&apos;hôtel est déclaré à plus de 2 km en voiture du haram, un supplément fixe de 40 SAR sera ajouté.
                                </Text>
                            </View>

                            {/* Date Range */}
                            <View>
                                <Text className="text-gray-500 mb-2 font-medium">Disponibilité</Text>
                                <TouchableOpacity
                                    onPress={() => setShowCalendar(true)}
                                    className="flex-row items-center bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3"
                                >
                                    <Calendar size={20} color="#9CA3AF" />
                                    <Text className="flex-1 ml-3 text-gray-900 dark:text-white">
                                        {startDate
                                            ? `Du ${new Date(startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} ${endDate ? 'au ' + new Date(endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}`
                                            : "Sélectionner une période"}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <Modal visible={showCalendar} animationType="slide" transparent={true}>
                                <View className="flex-1 bg-black/50 justify-end">
                                    {/* We pass a specialized close handler to the component or wrap it */}
                                    <CalendarPicker
                                        onCancel={() => setShowCalendar(false)}
                                        onConfirm={(s, e) => {
                                            setStartDate(s);
                                            setEndDate(e);
                                            setShowCalendar(false);
                                        }}
                                        initialStart={startDate}
                                        initialEnd={endDate}
                                        mode="range"
                                    />
                                </View>
                            </Modal>

                            <TouchableOpacity
                                onPress={handleCreateOrUpdate}
                                disabled={loading}
                                className="bg-[#b39164] py-4 rounded-xl items-center shadow-lg shadow-[#b39164]/20 mt-2 active:bg-[#a08055]"
                            >
                                <Text className="text-white font-bold text-lg">{loading ? 'Enregistrement...' : (isEditing ? 'Modifier le service' : 'Publier le service')}</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View >
    );
}
