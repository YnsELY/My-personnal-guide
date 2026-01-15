import CalendarPicker from '@/components/CalendarPicker';
import { CATEGORIES } from '@/constants/data';
import { createService, uploadImage } from '@/lib/api';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Camera, DollarSign, MapPin, Minus, Plus, Type, Users } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreateServiceScreen() {
    const router = useRouter();

    const [title, setTitle] = useState('');
    const [category, setCategory] = useState(CATEGORIES[1].name);
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [location, setLocation] = useState('');
    const [maxParticipants, setMaxParticipants] = useState('');
    const [image, setImage] = useState<string | null>(null);

    // Date Range State
    const [showCalendar, setShowCalendar] = useState(false);
    const [startDate, setStartDate] = useState<number | null>(null);
    const [endDate, setEndDate] = useState<number | null>(null);

    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleCreate = async () => {
        if (!title || !description || !price || !location || !startDate) {
            Alert.alert("Erreur", "Veuillez remplir tous les champs (y compris la date)");
            return;
        }

        setLoading(true);
        try {
            let imageUrl = null;
            if (image) {
                // Upload to ImgBB
                imageUrl = await uploadImage(image);
            }

            // Convert mock days to ISO dates for 2026-01 (Janvier 2026) as per component
            // ideally we use real date objects but sticking to mock consistency
            const startIso = new Date(2026, 0, startDate).toISOString();
            const endIso = endDate ? new Date(2026, 0, endDate).toISOString() : new Date(2026, 0, startDate).toISOString(); // Single date = same start/end

            await createService({
                title,
                category,
                description,
                price: parseInt(price),
                location,
                availability_start: startIso,
                availability_end: endIso,
                image: imageUrl || undefined,
                max_participants: maxParticipants ? parseInt(maxParticipants) : undefined
            });
            Alert.alert("Succès", "Votre service a été créé avec succès !", [
                { text: "OK", onPress: () => router.back() }
            ]);
        } catch (e: any) {
            Alert.alert("Erreur", "Impossible de créer le service : " + e.message);
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
                    <Text className="text-xl font-bold text-gray-900 dark:text-white">Nouveau Service</Text>
                    <View className="w-10" />
                </View>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                    <ScrollView className="px-6 pt-6" showsVerticalScrollIndicator={false}>

                        <View className="gap-6 pb-20">
                            {/* Image Picker */}
                            <TouchableOpacity onPress={pickImage}>
                                <View className="h-48 bg-gray-100 dark:bg-zinc-800 rounded-2xl items-center justify-center border-2 border-dashed border-gray-300 dark:border-white/10 overflow-hidden">
                                    {image ? (
                                        <Image source={{ uri: image }} className="w-full h-full" resizeMode="cover" />
                                    ) : (
                                        <>
                                            <View className="bg-white dark:bg-zinc-700 p-4 rounded-full mb-2">
                                                <Camera size={24} color="#9CA3AF" />
                                            </View>
                                            <Text className="text-gray-500 font-medium">Ajouter une photo de couverture</Text>
                                        </>
                                    )}
                                </View>
                            </TouchableOpacity>

                            {/* Title */}
                            <View>
                                <Text className="text-gray-500 mb-2 font-medium">Titre du service</Text>
                                <View className="flex-row items-center bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3">
                                    <Type size={20} color="#9CA3AF" />
                                    <TextInput
                                        className="flex-1 ml-3 text-gray-900 dark:text-white"
                                        placeholder="Ex: Visite guidée de La Mecque"
                                        placeholderTextColor="#9CA3AF"
                                        value={title}
                                        onChangeText={setTitle}
                                    />
                                </View>
                            </View>

                            {/* Category */}
                            <View>
                                <Text className="text-gray-500 mb-2 font-medium">Catégorie</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                                    {CATEGORIES.map((cat, idx) => (
                                        <TouchableOpacity
                                            key={idx}
                                            onPress={() => setCategory(cat.name)}
                                            className={`px-4 py-2 rounded-full border mr-2 ${category === cat.name ? 'bg-[#b39164] border-[#b39164]' : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-white/10'}`}
                                        >
                                            <Text className={`font-medium ${category === cat.name ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>{cat.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Price */}
                            <View>
                                <Text className="text-gray-500 mb-2 font-medium">Prix (SAR)</Text>
                                <View className="flex-row items-center bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3">
                                    <DollarSign size={20} color="#9CA3AF" />
                                    <TextInput
                                        value={price}
                                        onChangeText={setPrice}
                                        placeholder="Ex: 500"
                                        placeholderTextColor="#9CA3AF"
                                        keyboardType="numeric"
                                        className="flex-1 ml-3 text-gray-900 dark:text-white font-medium"
                                    />
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
                                <View className="flex-row items-center bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3">
                                    <MapPin size={20} color="#9CA3AF" />
                                    <TextInput
                                        className="flex-1 ml-3 text-gray-900 dark:text-white"
                                        placeholder="Ex: La Mecque, Médine..."
                                        placeholderTextColor="#9CA3AF"
                                        value={location}
                                        onChangeText={setLocation}
                                    />
                                </View>
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
                                            ? `Du ${startDate} ${endDate ? 'au ' + endDate : ''} Janvier 2026`
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
                                    />
                                </View>
                            </Modal>

                            {/* Description */}
                            <View>
                                <Text className="text-gray-500 mb-2 font-medium">Description</Text>
                                <View className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl p-4 h-32">
                                    <TextInput
                                        className="flex-1 text-gray-900 dark:text-white text-base" // Removed ml-3, added text-base for alignment
                                        placeholder="Décrivez votre service en détail..."
                                        placeholderTextColor="#9CA3AF"
                                        value={description}
                                        onChangeText={setDescription}
                                        multiline
                                        textAlignVertical="top"
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={handleCreate}
                                disabled={loading}
                                className="bg-[#b39164] py-4 rounded-xl items-center shadow-lg shadow-[#b39164]/20 mt-2 active:bg-[#a08055]"
                            >
                                <Text className="text-white font-bold text-lg">{loading ? 'Création...' : 'Publier le service'}</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View >
    );
}
