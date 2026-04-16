import { useAuth } from '@/context/AuthContext';
import { signIn as apiSignIn, updateCurrentEmail, updateCurrentPassword, updateCurrentProfile } from '@/lib/api';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronLeft, Lock, Mail, User } from 'lucide-react-native';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditProfileScreen() {
    const router = useRouter();
    const { user, profile, refreshProfile } = useAuth();
    const { t } = useTranslation('profile');

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [gender, setGender] = useState<'male' | 'female'>('male');
    const [openGender, setOpenGender] = useState(false);
    const [day, setDay] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');
    const [language, setLanguage] = useState<'fr' | 'ar'>('fr');
    const [openLanguage, setOpenLanguage] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!profile || !user) return;
        setFullName(profile.full_name || '');
        setEmail(user.email || '');
        setGender(profile.gender || 'male');
        setLanguage(profile.language || 'fr');

        if (profile.date_of_birth) {
            const parts = profile.date_of_birth.split('-');
            if (parts.length === 3) {
                setYear(parts[0]);
                setMonth(parts[1].replace(/^0/, ''));
                setDay(parts[2].replace(/^0/, ''));
            }
        }
    }, [profile, user]);

    const handleSave = async () => {
        if (!fullName.trim()) {
            Alert.alert(t('common:error'), t('nameRequired'));
            return;
        }

        if (!email.trim()) {
            Alert.alert(t('common:error'), t('emailRequired'));
            return;
        }

        if (day || month || year) {
            const d = parseInt(day);
            const m = parseInt(month);
            const y = parseInt(year);
            if (isNaN(d) || isNaN(m) || isNaN(y) || d < 1 || d > 31 || m < 1 || m > 12 || y < 1900 || y > new Date().getFullYear()) {
                Alert.alert(t('common:error'), t('invalidDate'));
                return;
            }
        }

        if (newPassword || oldPassword || confirmPassword) {
            if (!oldPassword) {
                Alert.alert(t('common:error'), t('oldPasswordRequired'));
                return;
            }
            if (!newPassword) {
                Alert.alert(t('common:error'), t('newPasswordRequired'));
                return;
            }
            if (newPassword.length < 6) {
                Alert.alert(t('common:error'), t('passwordMinLength'));
                return;
            }
            if (newPassword !== confirmPassword) {
                Alert.alert(t('common:error'), t('passwordMismatch'));
                return;
            }
        }

        setLoading(true);
        try {
            const dobFields: { date_of_birth?: string } = {};
            if (day && month && year) {
                const d = parseInt(day);
                const m = parseInt(month);
                const y = parseInt(year);
                dobFields.date_of_birth = `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
            }

            await updateCurrentProfile({
                full_name: fullName.trim(),
                gender,
                language,
                ...dobFields,
            });

            if (email.trim() !== user?.email) {
                await updateCurrentEmail(email.trim());
            }

            if (newPassword.trim()) {
                try {
                    await apiSignIn(user!.email, oldPassword);
                } catch {
                    throw new Error(t('oldPasswordIncorrect'));
                }
                await updateCurrentPassword(newPassword.trim());
            }

            await refreshProfile();

            Alert.alert(t('common:success'), t('updateSuccess'), [
                { text: 'OK', onPress: () => router.back() },
            ]);
        } catch (error: any) {
            Alert.alert(t('common:error'), error?.message || t('updateError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-gray-50 dark:bg-zinc-900">
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="light-content" />
            <SafeAreaView className="flex-1">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">

                    {/* Header */}
                    <View className="flex-row items-center px-5 py-4 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-zinc-900">
                        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
                            <ChevronLeft size={24} color="#b39164" />
                        </TouchableOpacity>
                        <Text className="text-gray-900 dark:text-white text-lg font-bold flex-1">{t('editInfo')}</Text>
                    </View>

                    <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                        <View className="gap-5">
                            {/* Nom complet */}
                            <View>
                                <Text className="text-gray-500 dark:text-gray-400 mb-2 font-medium">{t('fullName')}</Text>
                                <View className="flex-row items-center bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3">
                                    <User size={20} color="#9CA3AF" />
                                    <TextInput
                                        className="flex-1 ml-3 text-gray-900 dark:text-white"
                                        placeholder={t('fullNamePlaceholder')}
                                        placeholderTextColor="#9CA3AF"
                                        value={fullName}
                                        onChangeText={setFullName}
                                    />
                                </View>
                            </View>

                            {/* Email */}
                            <View>
                                <Text className="text-gray-500 dark:text-gray-400 mb-2 font-medium">{t('email')}</Text>
                                <View className="flex-row items-center bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3">
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

                            {/* Mot de passe */}
                            <View className="gap-3">
                                <Text className="text-gray-500 dark:text-gray-400 font-medium">{t('changePassword')}</Text>
                                <Text className="text-gray-400 dark:text-gray-500 text-xs -mt-2">{t('leaveEmptyPassword')}</Text>

                                <View className="flex-row items-center bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3">
                                    <Lock size={20} color="#9CA3AF" />
                                    <TextInput
                                        className="flex-1 ml-3 text-gray-900 dark:text-white"
                                        placeholder={t('oldPassword')}
                                        placeholderTextColor="#9CA3AF"
                                        value={oldPassword}
                                        onChangeText={setOldPassword}
                                        secureTextEntry
                                    />
                                </View>

                                <View className="flex-row items-center bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3">
                                    <Lock size={20} color="#9CA3AF" />
                                    <TextInput
                                        className="flex-1 ml-3 text-gray-900 dark:text-white"
                                        placeholder={t('newPassword')}
                                        placeholderTextColor="#9CA3AF"
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        secureTextEntry
                                    />
                                </View>

                                <View className="flex-row items-center bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3">
                                    <Lock size={20} color="#9CA3AF" />
                                    <TextInput
                                        className="flex-1 ml-3 text-gray-900 dark:text-white"
                                        placeholder={t('confirmPassword')}
                                        placeholderTextColor="#9CA3AF"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry
                                    />
                                </View>
                            </View>

                            {/* Genre */}
                            <View className="z-50">
                                <Text className="text-gray-500 dark:text-gray-400 mb-2 font-medium">{t('gender')}</Text>
                                <TouchableOpacity
                                    onPress={() => { setOpenGender(!openGender); setOpenLanguage(false); }}
                                    className="flex-row justify-between items-center bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3"
                                >
                                    <Text className="text-gray-900 dark:text-white">
                                        {gender === 'male' ? t('common:male') : t('common:female')}
                                    </Text>
                                    <ChevronDown size={20} color="#9CA3AF" />
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

                            {/* Date de naissance */}
                            <View>
                                <Text className="text-gray-500 dark:text-gray-400 mb-2 font-medium">{t('dateOfBirth')}</Text>
                                <View className="flex-row gap-2">
                                    <View className="flex-1 flex-row items-center bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3">
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
                                    <View className="flex-1 flex-row items-center bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3">
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
                                    <View className="flex-[1.5] flex-row items-center bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3">
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

                            {/* Langue */}
                            <View className="z-40">
                                <Text className="text-gray-500 dark:text-gray-400 mb-2 font-medium">{t('preferredLanguage')}</Text>
                                <TouchableOpacity
                                    onPress={() => { setOpenLanguage(!openLanguage); setOpenGender(false); }}
                                    className="flex-row justify-between items-center bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3"
                                >
                                    <View className="flex-row items-center gap-2">
                                        <Text className="text-lg">{language === 'fr' ? '🇫🇷' : '🇸🇦'}</Text>
                                        <Text className="text-gray-900 dark:text-white">
                                            {language === 'fr' ? t('common:french') : t('common:arabic')}
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
                                            <Text className="text-gray-900 dark:text-white">{t('common:french')}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => { setLanguage('ar'); setOpenLanguage(false); }}
                                            className="px-4 py-3 active:bg-gray-50 dark:active:bg-zinc-700 flex-row items-center gap-2"
                                        >
                                            <Text className="text-lg">🇸🇦</Text>
                                            <Text className="text-gray-900 dark:text-white">{t('common:arabic')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>

                            {/* Bouton enregistrer */}
                            <TouchableOpacity
                                onPress={handleSave}
                                disabled={loading}
                                className={`bg-[#b39164] py-4 rounded-xl items-center shadow-lg shadow-[#b39164]/20 mt-4 active:bg-[#a08055] ${loading ? 'opacity-70' : ''}`}
                            >
                                <Text className="text-white font-bold text-lg">
                                    {loading ? t('saving') : t('saveChanges')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
