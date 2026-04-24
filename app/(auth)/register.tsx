import { CHARTER_TEXT, GUIDE_CODE_OF_CONDUCT_TEXT, GUIDE_RELIGIOUS_REGULATION_TEXT } from '@/constants/charter';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { directionStyle, endSpacing, flipChevron, forceLTRText, rowStyle, textStart } from '@/lib/rtl';
import { useRouter } from 'expo-router';
import { Briefcase, Check, ChevronDown, Lock, Mail, User, UserCircle2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type GuideConsentStep = 'code_of_conduct' | 'religious_regulation';

export default function RegisterScreen() {
    const router = useRouter();
    const { signUp } = useAuth();
    const { t } = useTranslation('auth');
    const { isRTL } = useLanguage();

    const [lastName, setLastName] = useState('');
    const [firstName, setFirstName] = useState('');
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
    const [guideCodeAccepted, setGuideCodeAccepted] = useState(false);
    const [guideRegulationAccepted, setGuideRegulationAccepted] = useState(false);
    const [guideConsentStep, setGuideConsentStep] = useState<GuideConsentStep>('code_of_conduct');

    const submitRegistration = async () => {
        setLoading(true);
        try {
            // Re-validate dates just in case, or assume handleRegister did it? 
            // Better to just use the state.
            const d = parseInt(day);
            const m = parseInt(month);
            const y = parseInt(year);
            const dob = `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;

            await signUp(email, password, `${firstName.trim()} ${lastName.trim()}`, role, gender, dob, language);
            Alert.alert(t('accountCreated'), t('accountCreatedMessage'), [
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
            Alert.alert(t('registrationError'), e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!email || !password || !lastName || !firstName || !day || !month || !year) {
            Alert.alert(t('common:error'), t('fillAllFields'));
            return;
        }

        // Validate Date
        const d = parseInt(day);
        const m = parseInt(month);
        const y = parseInt(year);

        if (isNaN(d) || isNaN(m) || isNaN(y) || d < 1 || d > 31 || m < 1 || m > 12 || y < 1900 || y > new Date().getFullYear()) {
            Alert.alert(t('common:error'), t('invalidDate'));
            return;
        }

        if (role === 'guide') {
            if (!guideCodeAccepted) {
                setGuideConsentStep('code_of_conduct');
                setShowCharterModal(true);
                return;
            }

            if (!guideRegulationAccepted) {
                setGuideConsentStep('religious_regulation');
                setShowCharterModal(true);
                return;
            }
        } else if (!charterAccepted) {
            setShowCharterModal(true);
            return;
        }

        // Proceed
        submitRegistration();
    };

    return (
        <View className="flex-1 bg-white dark:bg-zinc-900" style={directionStyle(isRTL)}>
            <StatusBar barStyle="light-content" />
            <SafeAreaView className="flex-1 px-6">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                    <ScrollView showsVerticalScrollIndicator={false}>

                        <View className="my-8">
                            <Text className="text-3xl font-bold font-serif text-gray-900 dark:text-white mb-2" style={textStart(isRTL)}>{t('createAccount')}</Text>
                            <Text className="text-gray-500" style={textStart(isRTL)}>{t('joinCommunity')}</Text>
                        </View>

                        {/* Role Selection */}
                        <Text className="text-gray-500 mb-3 font-medium" style={textStart(isRTL)}>{t('youAre')}</Text>
                        <View className="gap-4 mb-8" style={rowStyle(isRTL)}>
                            <TouchableOpacity
                                onPress={() => {
                                    setRole('pilgrim');
                                    setCharterAccepted(false);
                                    setGuideCodeAccepted(false);
                                    setGuideRegulationAccepted(false);
                                    setGuideConsentStep('code_of_conduct');
                                }}
                                className={`flex-1 p-4 rounded-xl border-2 flex-row items-center justify-center gap-2 ${role === 'pilgrim' ? 'border-[#b39164] bg-[#b39164]/10' : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-800'}`}
                            >
                                <UserCircle2 size={24} color={role === 'pilgrim' ? '#b39164' : '#9CA3AF'} />
                                <Text className={`font-bold ${role === 'pilgrim' ? 'text-[#b39164]' : 'text-gray-500'}`}>{t('pilgrim')}</Text>
                                {role === 'pilgrim' && <View className="absolute top-2 right-2"><Check size={14} color="#b39164" /></View>}
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => {
                                    setRole('guide');
                                    setCharterAccepted(false);
                                    setGuideCodeAccepted(false);
                                    setGuideRegulationAccepted(false);
                                    setGuideConsentStep('code_of_conduct');
                                }}
                                className={`flex-1 p-4 rounded-xl border-2 flex-row items-center justify-center gap-2 ${role === 'guide' ? 'border-[#b39164] bg-[#b39164]/10' : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-800'}`}
                            >
                                <Briefcase size={24} color={role === 'guide' ? '#b39164' : '#9CA3AF'} />
                                <Text className={`font-bold ${role === 'guide' ? 'text-[#b39164]' : 'text-gray-500'}`}>{t('guide')}</Text>
                                {role === 'guide' && <View className="absolute top-2 right-2"><Check size={14} color="#b39164" /></View>}
                            </TouchableOpacity>
                        </View>

                        <View className="gap-5">
                            <View>
                                <Text className="text-gray-500 mb-2 font-medium" style={textStart(isRTL)}>Nom</Text>
                                <View className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3" style={rowStyle(isRTL)}>
                                    <User size={20} color="#9CA3AF" />
                                    <TextInput
                                        className="flex-1 text-gray-900 dark:text-white"
                                        placeholder="Nom de famille"
                                        placeholderTextColor="#9CA3AF"
                                        value={lastName}
                                        onChangeText={setLastName}
                                        style={[endSpacing(12, isRTL), textStart(isRTL)]}
                                        autoCapitalize="words"
                                    />
                                </View>
                            </View>

                            <View>
                                <Text className="text-gray-500 mb-2 font-medium" style={textStart(isRTL)}>Prénom</Text>
                                <View className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3" style={rowStyle(isRTL)}>
                                    <User size={20} color="#9CA3AF" />
                                    <TextInput
                                        className="flex-1 text-gray-900 dark:text-white"
                                        placeholder="Prénom"
                                        placeholderTextColor="#9CA3AF"
                                        value={firstName}
                                        onChangeText={setFirstName}
                                        style={[endSpacing(12, isRTL), textStart(isRTL)]}
                                        autoCapitalize="words"
                                    />
                                </View>
                            </View>

                            <View>
                                <Text className="text-gray-500 mb-2 font-medium" style={textStart(isRTL)}>{t('email')}</Text>
                                <View className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3" style={rowStyle(isRTL)}>
                                    <Mail size={20} color="#9CA3AF" />
                                    <TextInput
                                        className="flex-1 text-gray-900 dark:text-white"
                                        placeholder={t('emailPlaceholder')}
                                        placeholderTextColor="#9CA3AF"
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        style={[endSpacing(12, isRTL), forceLTRText()]}
                                    />
                                </View>
                            </View>

                            <View>
                                <Text className="text-gray-500 mb-2 font-medium" style={textStart(isRTL)}>{t('password')}</Text>
                                <View className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3" style={rowStyle(isRTL)}>
                                    <Lock size={20} color="#9CA3AF" />
                                    <TextInput
                                        className="flex-1 text-gray-900 dark:text-white"
                                        placeholder={t('passwordPlaceholder')}
                                        placeholderTextColor="#9CA3AF"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                        style={[endSpacing(12, isRTL), forceLTRText()]}
                                    />
                                </View>
                            </View>

                            {/* Gender */}
                            <View className="z-50">
                                <Text className="text-gray-500 mb-2 font-medium" style={textStart(isRTL)}>{t('gender')}</Text>
                                <TouchableOpacity
                                    onPress={() => setOpenGender(!openGender)}
                                    className="flex-row justify-between items-center bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3"
                                    style={rowStyle(isRTL)}
                                >
                                    <Text className="text-gray-900 dark:text-white capitalize" style={textStart(isRTL)}>
                                        {gender === 'male' ? t('common:male') : t('common:female')}
                                    </Text>
                                    <ChevronDown size={20} color="#9CA3AF" style={flipChevron(isRTL)} />
                                </TouchableOpacity>

                                {openGender && (
                                    <View className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl shadow-lg z-50 overflow-hidden">
                                        <TouchableOpacity
                                            onPress={() => { setGender('male'); setOpenGender(false); }}
                                            className="px-4 py-3 border-b border-gray-100 dark:border-white/5 active:bg-gray-50 dark:active:bg-zinc-700"
                                        >
                                            <Text className="text-gray-900 dark:text-white">{t('common:male')}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => { setGender('female'); setOpenGender(false); }}
                                            className="px-4 py-3 active:bg-gray-50 dark:active:bg-zinc-700"
                                        >
                                            <Text className="text-gray-900 dark:text-white">{t('common:female')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>

                            {/* Date of Birth */}
                            <View>
                                <Text className="text-gray-500 mb-2 font-medium" style={textStart(isRTL)}>{t('dateOfBirth')}</Text>
                                <View className="gap-2" style={rowStyle(isRTL)}>
                                    <View className="flex-1 flex-row items-center bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3">
                                        <TextInput
                                            className="flex-1 text-center text-gray-900 dark:text-white"
                                            placeholder={t('dayPlaceholder')}
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
                                            placeholder={t('monthPlaceholder')}
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
                                            placeholder={t('yearPlaceholder')}
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
                                <Text className="text-gray-500 mb-2 font-medium" style={textStart(isRTL)}>{t('preferredLanguage')}</Text>
                                <TouchableOpacity
                                    onPress={() => setOpenLanguage(!openLanguage)}
                                    className="flex-row justify-between items-center bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3"
                                    style={rowStyle(isRTL)}
                                >
                                    <View className="flex-row items-center gap-2" style={rowStyle(isRTL)}>
                                        <Text className="text-lg">{language === 'ar' ? '🇸🇦' : language === 'en' ? '🇬🇧' : '🇫🇷'}</Text>
                                        <Text className="text-gray-900 dark:text-white capitalize" style={textStart(isRTL)}>
                                            {language === 'ar' ? t('common:arabic') : language === 'en' ? t('common:english') : t('common:french')}
                                        </Text>
                                    </View>
                                    <ChevronDown size={20} color="#9CA3AF" style={flipChevron(isRTL)} />
                                </TouchableOpacity>

                                {openLanguage && (
                                    <View className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl shadow-lg z-50 overflow-hidden">
                                        <TouchableOpacity
                                            onPress={() => { setLanguage('fr'); setOpenLanguage(false); }}
                                            className="px-4 py-3 border-b border-gray-100 dark:border-white/5 active:bg-gray-50 dark:active:bg-zinc-700 flex-row items-center gap-2"
                                        >
                                            <Text className="text-lg">🇫🇷</Text>
                                            <Text className="text-gray-900 dark:text-white">{t('common:french')}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => { setLanguage('ar'); setOpenLanguage(false); }}
                                            className="px-4 py-3 border-b border-gray-100 dark:border-white/5 active:bg-gray-50 dark:active:bg-zinc-700 flex-row items-center gap-2"
                                        >
                                            <Text className="text-lg">🇸🇦</Text>
                                            <Text className="text-gray-900 dark:text-white">{t('common:arabic')}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => { setLanguage('en'); setOpenLanguage(false); }}
                                            className="px-4 py-3 active:bg-gray-50 dark:active:bg-zinc-700 flex-row items-center gap-2"
                                        >
                                            <Text className="text-lg">🇬🇧</Text>
                                            <Text className="text-gray-900 dark:text-white">{t('common:english')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>

                            {/* Removed Checkbox UI for Charter */}

                            {/* Charter / Guide Documents Modal */}
                            <Modal visible={showCharterModal} animationType="slide" presentationStyle="pageSheet">
                                <View className="flex-1 bg-white dark:bg-zinc-900">
                                    <SafeAreaView className="flex-1">
                                        <View className="flex-row justify-between items-center p-4 border-b border-gray-100 dark:border-white/5" style={rowStyle(isRTL)}>
                                            <Text className="text-xl font-bold text-gray-900 dark:text-white" style={textStart(isRTL)}>
                                                {role === 'guide'
                                                    ? (guideConsentStep === 'code_of_conduct'
                                                        ? t('guideCodeOfConduct')
                                                        : t('guideReligiousRegulation'))
                                                    : t('charterTitle')}
                                            </Text>
                                            <TouchableOpacity onPress={() => setShowCharterModal(false)} className="p-2">
                                                <Text className="text-gray-500 font-bold">{t('common:cancel')}</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <ScrollView className="flex-1 p-6" contentContainerStyle={{ paddingBottom: 40 }}>
                                            <Text className="text-gray-700 dark:text-gray-300 leading-6 text-base" style={textStart(isRTL)}>
                                                {role === 'guide'
                                                    ? (guideConsentStep === 'code_of_conduct'
                                                        ? GUIDE_CODE_OF_CONDUCT_TEXT
                                                        : GUIDE_RELIGIOUS_REGULATION_TEXT)
                                                    : CHARTER_TEXT}
                                            </Text>
                                        </ScrollView>
                                        <View className="p-4 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-zinc-800">
                                            {role === 'guide' ? (
                                                guideConsentStep === 'code_of_conduct' ? (
                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            setGuideCodeAccepted(true);
                                                            setGuideConsentStep('religious_regulation');
                                                        }}
                                                        className="bg-[#b39164] py-4 rounded-xl items-center shadow-sm"
                                                    >
                                                        <Text className="text-white font-bold text-lg">{t('acceptCodeOfConduct')}</Text>
                                                    </TouchableOpacity>
                                                ) : (
                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            setGuideRegulationAccepted(true);
                                                            setShowCharterModal(false);
                                                            submitRegistration();
                                                        }}
                                                        className="bg-[#b39164] py-4 rounded-xl items-center shadow-sm"
                                                    >
                                                        <Text className="text-white font-bold text-lg">{t('acceptRegulationAndRegister')}</Text>
                                                    </TouchableOpacity>
                                                )
                                            ) : (
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        setCharterAccepted(true);
                                                        setShowCharterModal(false);
                                                        submitRegistration();
                                                    }}
                                                    className="bg-[#b39164] py-4 rounded-xl items-center shadow-sm"
                                                >
                                                    <Text className="text-white font-bold text-lg">{t('acceptAndRegister')}</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </SafeAreaView>
                                </View>
                            </Modal>

                            <TouchableOpacity
                                onPress={handleRegister}
                                disabled={loading}
                                className={`bg-[#b39164] py-4 rounded-xl items-center shadow-lg shadow-[#b39164]/20 mt-4 active:bg-[#a08055] ${loading ? 'opacity-70' : ''}`}
                            >
                                <Text className="text-white font-bold text-lg">{loading ? t('registering') : t('register')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => router.replace('/(auth)/login')} className="mt-4 items-center mb-8">
                                <Text className="text-gray-500">{t('alreadyHaveAccount')} <Text className="text-[#b39164] font-bold">{t('signIn')}</Text></Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
