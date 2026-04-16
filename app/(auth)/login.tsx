import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { directionStyle, endSpacing, forceLTRText, rowStyle, textStart } from '@/lib/rtl';
import { getCurrentProfile, getCurrentUser, getGuideApprovalInfo } from '@/lib/api';
import { Link, useRouter } from 'expo-router';
import { Lock, Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
    const router = useRouter();
    const { signIn } = useAuth();
    const { t } = useTranslation('auth');
    const { isRTL } = useLanguage();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert(t('common:error'), t('fillAllFields'));
            return;
        }
        setLoading(true);
        try {
            await signIn(email, password);
            const profile = await getCurrentProfile();
            const user = await getCurrentUser();
            const effectiveRole = profile?.role || user?.user_metadata?.role;
            if (profile?.role === 'admin') {
                router.replace('/(tabs)/admin-dashboard' as any);
            } else if (effectiveRole === 'guide') {
                const approval = await getGuideApprovalInfo(user?.id);
                if (!approval.isApproved) {
                    router.replace('/guide/pending-approval');
                } else {
                    router.replace('/(tabs)');
                }
            } else {
                router.replace('/(tabs)');
            }
        } catch (e: any) {
            Alert.alert(t('common:error'), e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-white dark:bg-zinc-900" style={directionStyle(isRTL)}>
            <StatusBar barStyle="light-content" />

            {/* Background / Header Image */}
            <View className="h-1/3 w-full bg-zinc-900 relative">
                <Image
                    source={require('@/assets/images/mecca.jpg')}
                    className="w-full h-full opacity-30"
                />
                <View className="absolute inset-0 bg-gradient-to-b from-transparent to-white dark:to-zinc-900" />
                <View className="absolute bottom-10 left-6 right-6">
                    <Text className="text-white text-4xl font-bold font-serif" style={textStart(isRTL)}>{t('login')}</Text>
                    <Text className="text-gray-300 text-lg" style={textStart(isRTL)}>{t('loginSubtitle')}</Text>
                </View>
            </View>

            <View className="flex-1 px-6 -mt-8 bg-white dark:bg-zinc-900 rounded-t-3xl pt-8">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                    <ScrollView showsVerticalScrollIndicator={false}>

                        <View className="gap-5">
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

                            <TouchableOpacity
                                onPress={handleLogin}
                                disabled={loading}
                                className="bg-[#b39164] py-4 rounded-xl items-center shadow-lg shadow-[#b39164]/20 mt-4 active:bg-[#a08055]"
                            >
                                <Text className="text-white font-bold text-lg">{loading ? t('common:loading') : t('signIn')}</Text>
                            </TouchableOpacity>

                            <View className="mt-4" style={rowStyle(isRTL)}>
                                <Text className="text-gray-500" style={textStart(isRTL)}>{t('noAccount')} </Text>
                                <Link href="/(auth)/register" asChild>
                                    <TouchableOpacity>
                                        <Text className="text-[#b39164] font-bold">{t('register')}</Text>
                                    </TouchableOpacity>
                                </Link>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </View>
    );
}
