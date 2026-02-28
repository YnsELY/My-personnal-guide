import { CHARTER_TEXT } from '@/constants/charter';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { Briefcase, Check, ChevronDown, Lock, Mail, User, UserCircle2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen() {
    const router = useRouter();
    const { signUp } = useAuth();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'pilgrim' | 'guide'>('pilgrim');

    // New Fields
    const [gender, setGender] = useState<'male' | 'female'>('male');
    const [openGender, setOpenGender] = useState(false);

    const [day, setDay] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');
    const [language, setLanguage] = useState<'fr' | 'ar'>('fr');
    const [openLanguage, setOpenLanguage] = useState(false);

    const [loading, setLoading] = useState(false);

    // Charter State
    const [charterAccepted, setCharterAccepted] = useState(false);
    const [showCharterModal, setShowCharterModal] = useState(false);

    const submitRegistration = async () => {
        setLoading(true);
        try {
            // Re-validate dates just in case, or assume handleRegister did it? 
            // Better to just use the state.
            const d = parseInt(day);
            const m = parseInt(month);
            const y = parseInt(year);
            const dob = `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;

            await signUp(email, password, fullName, role, gender, dob, language);
            Alert.alert("Compte créé", "Veuillez vérifier votre email pour confirmer votre compte (si activé) ou connectez-vous.", [
                {
                    text: "OK",
                    onPress: () => {
                        if (role === 'guide') {
                            router.replace('/guide/complete-profile');
                        } else {
                            router.replace('/(tabs)');
                        }
                    }
                }
            ]);
        } catch (e: any) {
            Alert.alert("Erreur d'inscription", e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!email || !password || !fullName || !day || !month || !year) {
            Alert.alert("Erreur", "Veuillez remplir tous les champs");
            return;
        }

        // Validate Date
        const d = parseInt(day);
        const m = parseInt(month);
        const y = parseInt(year);

        if (isNaN(d) || isNaN(m) || isNaN(y) || d < 1 || d > 31 || m < 1 || m > 12 || y < 1900 || y > new Date().getFullYear()) {
            Alert.alert("Erreur", "Date de naissance invalide");
            return;
        }

        // Validate Charter for both pilgrim and guide
        if (!charterAccepted) {
            setShowCharterModal(true);
            return;
        }

        // Proceed
        submitRegistration();
    };

    return (
        <View className="flex-1 bg-white dark:bg-zinc-900">
            <StatusBar barStyle="dark-content" />
            <SafeAreaView className="flex-1 px-6">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                    <ScrollView showsVerticalScrollIndicator={false}>

                        <View className="my-8">
                            <Text className="text-3xl font-bold font-serif text-gray-900 dark:text-white mb-2">Créer un compte</Text>
                            <Text className="text-gray-500">Rejoignez la communauté Guide Omra</Text>
                        </View>

                        {/* Role Selection */}
                        <Text className="text-gray-500 mb-3 font-medium">Vous êtes ?</Text>
                        <View className="flex-row gap-4 mb-8">
                            <TouchableOpacity
                                onPress={() => {
                                    setRole('pilgrim');
                                    setCharterAccepted(false);
                                }}
                                className={`flex-1 p-4 rounded-xl border-2 flex-row items-center justify-center gap-2 ${role === 'pilgrim' ? 'border-[#b39164] bg-[#b39164]/10' : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-800'}`}
                            >
                                <UserCircle2 size={24} color={role === 'pilgrim' ? '#b39164' : '#9CA3AF'} />
                                <Text className={`font-bold ${role === 'pilgrim' ? 'text-[#b39164]' : 'text-gray-500'}`}>Pèlerin</Text>
                                {role === 'pilgrim' && <View className="absolute top-2 right-2"><Check size={14} color="#b39164" /></View>}
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => {
                                    setRole('guide');
                                    setCharterAccepted(false);
                                }}
                                className={`flex-1 p-4 rounded-xl border-2 flex-row items-center justify-center gap-2 ${role === 'guide' ? 'border-[#b39164] bg-[#b39164]/10' : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-800'}`}
                            >
                                <Briefcase size={24} color={role === 'guide' ? '#b39164' : '#9CA3AF'} />
                                <Text className={`font-bold ${role === 'guide' ? 'text-[#b39164]' : 'text-gray-500'}`}>Guide</Text>
                                {role === 'guide' && <View className="absolute top-2 right-2"><Check size={14} color="#b39164" /></View>}
                            </TouchableOpacity>
                        </View>

                        <View className="gap-5">
                            <View>
                                <Text className="text-gray-500 mb-2 font-medium">Nom complet</Text>
                                <View className="flex-row items-center bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3">
                                    <User size={20} color="#9CA3AF" />
                                    <TextInput
                                        className="flex-1 ml-3 text-gray-900 dark:text-white"
                                        placeholder="Votre nom"
                                        placeholderTextColor="#9CA3AF"
                                        value={fullName}
                                        onChangeText={setFullName}
                                    />
                                </View>
                            </View>

                            <View>
                                <Text className="text-gray-500 mb-2 font-medium">Email</Text>
                                <View className="flex-row items-center bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3">
                                    <Mail size={20} color="#9CA3AF" />
                                    <TextInput
                                        className="flex-1 ml-3 text-gray-900 dark:text-white"
                                        placeholder="exemple@email.com"
                                        placeholderTextColor="#9CA3AF"
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                    />
                                </View>
                            </View>

                            <View>
                                <Text className="text-gray-500 mb-2 font-medium">Mot de passe</Text>
                                <View className="flex-row items-center bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3">
                                    <Lock size={20} color="#9CA3AF" />
                                    <TextInput
                                        className="flex-1 ml-3 text-gray-900 dark:text-white"
                                        placeholder="••••••••"
                                        placeholderTextColor="#9CA3AF"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                    />
                                </View>
                            </View>

                            {/* Gender */}
                            <View className="z-50">
                                <Text className="text-gray-500 mb-2 font-medium">Genre</Text>
                                <TouchableOpacity
                                    onPress={() => setOpenGender(!openGender)}
                                    className="flex-row justify-between items-center bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3"
                                >
                                    <Text className="text-gray-900 dark:text-white capitalize">
                                        {gender === 'male' ? 'Homme' : 'Femme'}
                                    </Text>
                                    <ChevronDown size={20} color="#9CA3AF" />
                                </TouchableOpacity>

                                {openGender && (
                                    <View className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl shadow-lg z-50 overflow-hidden">
                                        <TouchableOpacity
                                            onPress={() => { setGender('male'); setOpenGender(false); }}
                                            className="px-4 py-3 border-b border-gray-100 dark:border-white/5 active:bg-gray-50 dark:active:bg-zinc-700"
                                        >
                                            <Text className="text-gray-900 dark:text-white">Homme</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => { setGender('female'); setOpenGender(false); }}
                                            className="px-4 py-3 active:bg-gray-50 dark:active:bg-zinc-700"
                                        >
                                            <Text className="text-gray-900 dark:text-white">Femme</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>

                            {/* Date of Birth */}
                            <View>
                                <Text className="text-gray-500 mb-2 font-medium">Date de naissance</Text>
                                <View className="flex-row gap-2">
                                    <View className="flex-1 flex-row items-center bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3">
                                        <TextInput
                                            className="flex-1 text-center text-gray-900 dark:text-white"
                                            placeholder="JJ"
                                            placeholderTextColor="#9CA3AF"
                                            value={day}
                                            onChangeText={setDay}
                                            keyboardType="numeric"
                                            maxLength={2}
                                        />
                                    </View>
                                    <View className="flex-1 flex-row items-center bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3">
                                        <TextInput
                                            className="flex-1 text-center text-gray-900 dark:text-white"
                                            placeholder="MM"
                                            placeholderTextColor="#9CA3AF"
                                            value={month}
                                            onChangeText={setMonth}
                                            keyboardType="numeric"
                                            maxLength={2}
                                        />
                                    </View>
                                    <View className="flex-[1.5] flex-row items-center bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3">
                                        <TextInput
                                            className="flex-1 text-center text-gray-900 dark:text-white"
                                            placeholder="AAAA"
                                            placeholderTextColor="#9CA3AF"
                                            value={year}
                                            onChangeText={setYear}
                                            keyboardType="numeric"
                                            maxLength={4}
                                        />
                                    </View>
                                </View>
                            </View>

                            {/* Language */}
                            <View className="z-40">
                                <Text className="text-gray-500 mb-2 font-medium">Langue préférée</Text>
                                <TouchableOpacity
                                    onPress={() => setOpenLanguage(!openLanguage)}
                                    className="flex-row justify-between items-center bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3"
                                >
                                    <View className="flex-row items-center gap-2">
                                        <Text className="text-lg">{language === 'fr' ? '🇫🇷' : '🇸🇦'}</Text>
                                        <Text className="text-gray-900 dark:text-white capitalize">
                                            {language === 'fr' ? 'Français' : 'Arabe'}
                                        </Text>
                                    </View>
                                    <ChevronDown size={20} color="#9CA3AF" />
                                </TouchableOpacity>

                                {openLanguage && (
                                    <View className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl shadow-lg z-50 overflow-hidden">
                                        <TouchableOpacity
                                            onPress={() => { setLanguage('fr'); setOpenLanguage(false); }}
                                            className="px-4 py-3 border-b border-gray-100 dark:border-white/5 active:bg-gray-50 dark:active:bg-zinc-700 flex-row items-center gap-2"
                                        >
                                            <Text className="text-lg">🇫🇷</Text>
                                            <Text className="text-gray-900 dark:text-white">Français</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => { setLanguage('ar'); setOpenLanguage(false); }}
                                            className="px-4 py-3 active:bg-gray-50 dark:active:bg-zinc-700 flex-row items-center gap-2"
                                        >
                                            <Text className="text-lg">🇸🇦</Text>
                                            <Text className="text-gray-900 dark:text-white">Arabe</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>

                            {/* Removed Checkbox UI for Charter */}

                            {/* Charter Modal */}
                            <Modal visible={showCharterModal} animationType="slide" presentationStyle="pageSheet">
                                <View className="flex-1 bg-white dark:bg-zinc-900">
                                    <SafeAreaView className="flex-1">
                                        <View className="flex-row justify-between items-center p-4 border-b border-gray-100 dark:border-white/5">
                                            <Text className="text-xl font-bold text-gray-900 dark:text-white">
                                                {role === 'guide' ? 'Charte du guide' : 'Charte du pèlerin'}
                                            </Text>
                                            <TouchableOpacity onPress={() => setShowCharterModal(false)} className="p-2">
                                                <Text className="text-gray-500 font-bold">Annuler</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <ScrollView className="flex-1 p-6" contentContainerStyle={{ paddingBottom: 40 }}>
                                            <Text className="text-gray-700 dark:text-gray-300 leading-6 text-base">{CHARTER_TEXT}</Text>
                                        </ScrollView>
                                        <View className="p-4 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-zinc-800">
                                            <TouchableOpacity
                                                onPress={() => {
                                                    setCharterAccepted(true);
                                                    setShowCharterModal(false);
                                                    submitRegistration(); // Trigger registration immediately after acceptance
                                                }}
                                                className="bg-[#b39164] py-4 rounded-xl items-center shadow-sm"
                                            >
                                                <Text className="text-white font-bold text-lg">Accepter et S'inscrire</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </SafeAreaView>
                                </View>
                            </Modal>

                            <TouchableOpacity
                                onPress={handleRegister}
                                disabled={loading}
                                className={`bg-[#b39164] py-4 rounded-xl items-center shadow-lg shadow-[#b39164]/20 mt-4 active:bg-[#a08055] ${loading ? 'opacity-70' : ''}`}
                            >
                                <Text className="text-white font-bold text-lg">{loading ? 'Inscription...' : 'S\'inscrire'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => router.replace('/(auth)/login')} className="mt-4 items-center mb-8">
                                <Text className="text-gray-500">Déjà un compte ? <Text className="text-[#b39164] font-bold">Se connecter</Text></Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
