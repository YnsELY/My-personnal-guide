import {
    Bell,
    Calendar,
    Camera,
    ChevronRight,
    CircleHelp, LogOut,
    Globe2,
    LayoutDashboard,
    Shield,
    User
} from 'lucide-react-native';
import React from 'react';
import { Alert, Image, Modal, ScrollView, StatusBar, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { AVATAR_PRESET_OPTIONS, DEFAULT_AVATAR_PRESET_ID, getAvatarPresetIdFromUrl, type AvatarPresetId, resolveProfileAvatarSource } from '@/lib/avatar';
import { deleteMyAccount, getGuideWalletSummary, getPilgrimWalletSummary } from '@/lib/api';
import { formatEUR, formatSAR } from '@/lib/pricing';
import { directionStyle, flipChevron, forceLTRText, rowStyle, textEnd, textStart } from '@/lib/rtl';
import * as Linking from 'expo-linking';
import { useFocusEffect, useRouter } from 'expo-router';

export default function ProfileScreen() {
    const { user, profile, signOut, isLoading, updateProfileAvatar } = useAuth();
    const { t } = useTranslation('profile');
    const { language, setLanguage, isRTL } = useLanguage();
    const router = useRouter();
    const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
    const [isAvatarPickerOpen, setIsAvatarPickerOpen] = React.useState(false);
    const [isAvatarUpdating, setIsAvatarUpdating] = React.useState(false);
    const [walletSummary, setWalletSummary] = React.useState<Awaited<ReturnType<typeof getGuideWalletSummary>> | null>(null);
    const [walletLoading, setWalletLoading] = React.useState(false);
    const [walletError, setWalletError] = React.useState<string | null>(null);
    const [pilgrimWalletSummary, setPilgrimWalletSummary] = React.useState<Awaited<ReturnType<typeof getPilgrimWalletSummary>> | null>(null);
    const [pilgrimWalletLoading, setPilgrimWalletLoading] = React.useState(false);
    const [pilgrimWalletError, setPilgrimWalletError] = React.useState<string | null>(null);
    const [showLanguagePicker, setShowLanguagePicker] = React.useState(false);
    const [showDeleteModal, setShowDeleteModal] = React.useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = React.useState('');
    const [isDeletingAccount, setIsDeletingAccount] = React.useState(false);

    const loadGuideWalletSummary = React.useCallback(async () => {
        if (profile?.role !== 'guide') {
            setWalletSummary(null);
            setWalletError(null);
            return;
        }

        setWalletLoading(true);
        setWalletError(null);
        try {
            const summary = await getGuideWalletSummary();
            setWalletSummary(summary);
        } catch (error: any) {
            setWalletError(error?.message || t('walletLoadError'));
        } finally {
            setWalletLoading(false);
        }
    }, [profile?.role, t]);

    const loadPilgrimWalletSummary = React.useCallback(async () => {
        if (profile?.role !== 'pilgrim') {
            setPilgrimWalletSummary(null);
            setPilgrimWalletError(null);
            return;
        }

        setPilgrimWalletLoading(true);
        setPilgrimWalletError(null);
        try {
            const summary = await getPilgrimWalletSummary();
            setPilgrimWalletSummary(summary);
        } catch (error: any) {
            setPilgrimWalletError(error?.message || t('pilgrimWalletLoadError'));
        } finally {
            setPilgrimWalletLoading(false);
        }
    }, [profile?.role, t]);

    useFocusEffect(
        React.useCallback(() => {
            loadGuideWalletSummary();
            loadPilgrimWalletSummary();
        }, [loadGuideWalletSummary, loadPilgrimWalletSummary])
    );

    const canCustomizeAvatar = profile?.role === 'guide' || profile?.role === 'admin';
    const isPilgrimProfile = profile?.role === 'pilgrim';
    const currentAvatarPresetId = getAvatarPresetIdFromUrl(profile?.avatar_url) || DEFAULT_AVATAR_PRESET_ID;
    const profileAvatarSource = resolveProfileAvatarSource(profile?.avatar_url);

    const handleSelectAvatar = async (presetId: AvatarPresetId) => {
        if (!canCustomizeAvatar) return;
        if (isAvatarUpdating) return;
        try {
            setIsAvatarUpdating(true);
            await updateProfileAvatar(presetId);
            setIsAvatarPickerOpen(false);
        } catch (error: any) {
            Alert.alert(t('common:error'), error?.message || t('avatarError'));
        } finally {
            setIsAvatarUpdating(false);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            t('deleteAccount'),
            t('deleteAccountWarning'),
            [
                { text: t('common:cancel'), style: 'cancel' },
                {
                    text: t('common:continue'),
                    style: 'destructive',
                    onPress: () => setShowDeleteModal(true),
                },
            ]
        );
    };

    const confirmDeleteAccount = async () => {
        if (isDeletingAccount) return;
        if (deleteConfirmText.trim().toUpperCase() !== 'SUPPRIMER') {
            Alert.alert(t('deleteConfirmLabel'), t('deleteConfirmInvalid'));
            return;
        }

        setIsDeletingAccount(true);
        try {
            await deleteMyAccount();
            await signOut();
            setShowDeleteModal(false);
            setDeleteConfirmText('');
            router.replace('/(auth)/login');
        } catch (error: any) {
            console.error('Failed to delete account:', error);
            Alert.alert(t('common:error'), error?.message || t('deleteError'));
        } finally {
            setIsDeletingAccount(false);
        }
    };

    const openSupportMail = async () => {
        const email = 'support@nefsy.app';
        const url = `mailto:${email}`;
        const canOpen = await Linking.canOpenURL(url);
        if (!canOpen) {
            Alert.alert(t('contactSupport'), t('supportEmail', { email }));
            return;
        }
        await Linking.openURL(url);
    };

    if (isLoading) {
        return <View className="flex-1 bg-gray-50 dark:bg-zinc-900 justify-center items-center"><Text className="text-gray-500">{t('common:loading')}</Text></View>;
    }

    if (!user) {
        return (
            <View className="flex-1 bg-gray-50 dark:bg-zinc-900" style={directionStyle(isRTL)}>
                <StatusBar barStyle="light-content" />
                <View className="h-48 bg-zinc-900 relative justify-center items-center">
                    <Text className="text-white text-3xl font-bold font-serif">Guide Omra</Text>
                </View>
                <View className="flex-1 px-6 pt-10 items-center">
                    <Text className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('connectPrompt')}</Text>
                    <Text className="text-gray-500 text-center mb-8">{t('connectDescription')}</Text>

                    <TouchableOpacity onPress={() => router.push('/(auth)/login')} className="bg-[#b39164] w-full py-4 rounded-xl items-center mb-4 shadow-lg shadow-[#b39164]/20">
                        <Text className="text-white font-bold text-lg">{t('auth:signIn')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.push('/(auth)/register')} className="bg-white dark:bg-zinc-800 w-full py-4 rounded-xl items-center border border-gray-200 dark:border-white/10">
                        <Text className="text-gray-900 dark:text-white font-bold text-lg">{t('auth:createAccount')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50 dark:bg-zinc-900" style={directionStyle(isRTL)}>
            <StatusBar barStyle="light-content" />

            {/* Header Background */}
            <View className="h-48 bg-zinc-900 relative" />

            <SafeAreaView className="flex-1 -mt-48">
                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                    {/* Profile Header */}
                    <View className="items-center mt-4 mb-6">
                        <View className="relative">
                            {isPilgrimProfile ? (
                                <View className="w-28 h-28 rounded-full border-4 border-white dark:border-zinc-900 bg-zinc-700 items-center justify-center">
                                    <User size={46} color="#d4d4d8" />
                                </View>
                            ) : (
                                <Image
                                    source={profileAvatarSource}
                                    className="w-28 h-28 rounded-full border-4 border-white dark:border-zinc-900"
                                />
                            )}
                            {canCustomizeAvatar ? (
                                <TouchableOpacity
                                    onPress={() => setIsAvatarPickerOpen((prev) => !prev)}
                                    className="absolute bottom-1 right-1 bg-primary p-2 rounded-full border border-white dark:border-zinc-900"
                                >
                                    <Camera size={14} color="white" />
                                </TouchableOpacity>
                            ) : null}
                        </View>
                        <Text className="text-2xl font-bold text-white mt-3 mb-1" style={textStart(isRTL)}>{profile?.full_name || t('user')}</Text>
                        <Text className="text-gray-300 text-sm" style={forceLTRText()}>{user.email}</Text>
                        {canCustomizeAvatar && isAvatarPickerOpen && (
                            <View className="mt-4 bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-white/10 p-3 w-[92%]">
                                <Text className="text-gray-500 dark:text-gray-300 text-xs mb-3" style={textStart(isRTL)}>{t('chooseAvatar')}</Text>
                                <View className="flex-row flex-wrap items-center gap-2" style={rowStyle(isRTL)}>
                                    {AVATAR_PRESET_OPTIONS.map((avatar) => {
                                        const isSelected = currentAvatarPresetId === avatar.id;
                                        return (
                                            <TouchableOpacity
                                                key={avatar.id}
                                                onPress={() => handleSelectAvatar(avatar.id)}
                                                disabled={isAvatarUpdating}
                                                className={`p-1 rounded-full ${isSelected ? 'border-2 border-[#b39164]' : 'border-2 border-transparent'}`}
                                            >
                                                <Image source={avatar.source} className="w-16 h-16 rounded-full" />
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                                {isAvatarUpdating && (
                                    <Text className="text-gray-400 text-xs mt-2">{t('common:updating')}</Text>
                                )}
                            </View>
                        )}
                        <View className="gap-2 mt-4" style={rowStyle(isRTL)}>

                            {profile?.role === 'guide' && (
                                <TouchableOpacity
                                    onPress={() => router.push('/guide/create-service')}
                                    className="bg-[#b39164] px-5 py-2 rounded-full border border-[#b39164]"
                                >
                                    <Text className="text-white text-xs font-bold">{t('createService')}</Text>
                                </TouchableOpacity>
                            )}
                            {profile?.role === 'admin' && (
                                <TouchableOpacity
                                    onPress={() => router.push('/(tabs)/admin-dashboard' as any)}
                                    className="bg-blue-500 px-5 py-2 rounded-full border border-blue-500"
                                >
                                    <Text className="text-white text-xs font-bold">{t('adminSpace')}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Menu Sections */}
                    <View className="px-5 pb-10">
                        {profile?.role === 'guide' && (
                            <View className="mb-4 bg-white dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-white/10 p-4">
                                <Text className="text-gray-500 text-xs uppercase tracking-wider">{t('guideWallet')}</Text>
                                <Text className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                    {formatSAR(walletSummary?.availableBalance || 0)}
                                </Text>
                                <Text className="text-gray-500 text-xs mt-2">
                                    {t('guideWalletDescription')}
                                </Text>

                                {walletLoading && !walletSummary ? (
                                    <View className="mt-4 gap-2">
                                        <View className="h-3 rounded-full bg-gray-200 dark:bg-zinc-700" />
                                        <View className="h-3 rounded-full bg-gray-200 dark:bg-zinc-700 w-4/5" />
                                        <View className="h-3 rounded-full bg-gray-200 dark:bg-zinc-700 w-3/5" />
                                    </View>
                                ) : walletError ? (
                                    <View className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
                                        <Text className="text-red-400 text-xs">{walletError}</Text>
                                        <TouchableOpacity onPress={loadGuideWalletSummary} className="mt-2 self-start">
                                            <Text className="text-red-300 text-xs font-semibold">{t('common:retry')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View className="mt-4 gap-2">
                                        <WalletRow label={t('totalGenerated')} value={formatSAR(walletSummary?.totalGenerated || 0)} />
                                        <WalletRow label={t('paidOut')} value={formatSAR(walletSummary?.paidOut || 0)} />
                                        <WalletRow label={t('completedVisits')} value={`${walletSummary?.completedVisits || 0}`} />
                                    </View>
                                )}
                            </View>
                        )}
                        {profile?.role === 'pilgrim' && (
                            <View className="mb-4 bg-white dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-white/10 p-4">
                                <Text className="text-gray-500 text-xs uppercase tracking-wider">{t('pilgrimWallet')}</Text>
                                <Text className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                    {formatEUR(pilgrimWalletSummary?.availableBalance || 0)}
                                </Text>
                                <Text className="text-gray-500 text-xs mt-2">
                                    {t('pilgrimWalletDescription')}
                                </Text>

                                {pilgrimWalletLoading && !pilgrimWalletSummary ? (
                                    <View className="mt-4 gap-2">
                                        <View className="h-3 rounded-full bg-gray-200 dark:bg-zinc-700" />
                                        <View className="h-3 rounded-full bg-gray-200 dark:bg-zinc-700 w-4/5" />
                                        <View className="h-3 rounded-full bg-gray-200 dark:bg-zinc-700 w-3/5" />
                                    </View>
                                ) : pilgrimWalletError ? (
                                    <View className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
                                        <Text className="text-red-400 text-xs">{pilgrimWalletError}</Text>
                                        <TouchableOpacity onPress={loadPilgrimWalletSummary} className="mt-2 self-start">
                                            <Text className="text-red-300 text-xs font-semibold">{t('common:retry')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View className="mt-4 gap-2">
                                        <WalletRow label={t('cancellationCredits')} value={`${pilgrimWalletSummary?.cancellationCreditsCount || 0}`} />
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Section: Account */}
                        <Text className="text-gray-500 dark:text-gray-400 font-bold mb-3 mt-4 ml-1" style={textStart(isRTL)}>{t('sectionAccount')}</Text>
                        <View className="bg-white dark:bg-zinc-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5">
                            <MenuItem
                                icon={User}
                                label={t('editInfo')}
                                onPress={() => {
                                    if (profile?.role === 'guide') {
                                        router.push('/guide/complete-profile');
                                    } else {
                                        router.push('/edit-profile');
                                    }
                                }}
                            />
                            <Separator />
                            {profile?.role === 'guide' ? (
                                <MenuItem
                                    icon={Calendar}
                                    label={t('myServices')}
                                    onPress={() => router.push('/guide/my-services')}
                                />
                            ) : (
                                <MenuItem
                                    icon={Calendar}
                                    label={t('myReservations')}
                                    onPress={() => router.push('/my-reservations')}
                                />
                            )}
                            <Separator />
                            <MenuItem icon={Bell} label={t('notifications')}
                                rightElement={
                                    <Switch
                                        trackColor={{ false: "#767577", true: "#b39164" }}
                                        thumbColor={notificationsEnabled ? "#fff" : "#f4f3f4"}
                                        onValueChange={setNotificationsEnabled}
                                        value={notificationsEnabled}
                                    />
                                }
                            />
                            <Separator />
                            <MenuItem
                                icon={Shield}
                                label={t('securityPrivacy')}
                                onPress={() => router.push('/legal' as any)}
                            />
                            {profile?.role === 'admin' && (
                                <>
                                    <Separator />
                                    <MenuItem
                                        icon={LayoutDashboard}
                                        label={t('adminDashboard')}
                                        onPress={() => router.push('/(tabs)/admin-dashboard' as any)}
                                    />
                                </>
                            )}
                        </View>

                        {/* Section: App */}
                        <Text className="text-gray-500 dark:text-gray-400 font-bold mb-3 mt-8 ml-1" style={textStart(isRTL)}>{t('sectionApp')}</Text>
                        <View className="bg-white dark:bg-zinc-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5">
                            <MenuItem icon={CircleHelp} label={t('helpSupport')} onPress={() => router.push('/support' as any)} />
                            <Separator />
                            <MenuItem icon={CircleHelp} label={t('contactSupport')} onPress={openSupportMail} />
                            <Separator />
                            <View className="relative">
                                <MenuItem
                                    icon={Globe2}
                                    label={t('appLanguage')}
                                    rightElement={
                                        <TouchableOpacity
                                            onPress={() => setShowLanguagePicker(!showLanguagePicker)}
                                            className="flex-row items-center gap-2 bg-gray-100 dark:bg-zinc-700 px-3 py-1.5 rounded-full"
                                            style={rowStyle(isRTL)}
                                        >
                                            <Text className="text-sm">
                                                {language === 'ar' ? '🇸🇦' : language === 'en' ? '🇬🇧' : '🇫🇷'}
                                            </Text>
                                            <Text className="text-gray-900 dark:text-white text-sm font-medium">
                                                {language === 'ar' ? t('common:arabic') : language === 'en' ? t('common:english') : t('common:french')}
                                            </Text>
                                        </TouchableOpacity>
                                    }
                                />
                                {showLanguagePicker && (
                                    <View className="absolute top-full right-0 mt-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl shadow-lg z-50 overflow-hidden" style={{ minWidth: 160 }}>
                                        {[
                                            { code: 'fr' as const, flag: '🇫🇷', label: t('common:french') },
                                            { code: 'ar' as const, flag: '🇸🇦', label: t('common:arabic') },
                                            { code: 'en' as const, flag: '🇬🇧', label: t('common:english') },
                                        ].map((opt, idx, arr) => (
                                            <TouchableOpacity
                                                key={opt.code}
                                                onPress={async () => { setShowLanguagePicker(false); await setLanguage(opt.code); }}
                                                className={`px-4 py-3 flex-row items-center gap-3 active:bg-gray-50 dark:active:bg-zinc-700 ${idx < arr.length - 1 ? 'border-b border-gray-100 dark:border-white/5' : ''} ${language === opt.code ? 'bg-primary/10' : ''}`}
                                            >
                                                <Text className="text-base">{opt.flag}</Text>
                                                <Text className={`font-medium ${language === opt.code ? 'text-primary' : 'text-gray-900 dark:text-white'}`}>{opt.label}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        </View>

                        <Text className="text-gray-500 dark:text-gray-400 font-bold mb-3 mt-8 ml-1" style={textStart(isRTL)}>{t('sectionDeletion')}</Text>
                        <View className="bg-white dark:bg-zinc-800 rounded-2xl overflow-hidden border border-red-500/20">
                            <MenuItem
                                icon={Shield}
                                label={t('deleteAccount')}
                                onPress={handleDeleteAccount}
                                labelClassName="text-red-500 font-semibold text-base"
                            />
                        </View>

                        {/* Section: Logout */}
                        <TouchableOpacity
                            onPress={signOut}
                            className="flex-row items-center justify-center bg-red-500/10 dark:bg-red-500/10 mt-8 p-4 rounded-2xl border border-red-500/20"
                            style={rowStyle(isRTL)}
                        >
                            <LogOut size={20} color="#ef4444" />
                            <Text className="text-red-500 font-bold ml-2">{t('signOut')}</Text>
                        </TouchableOpacity>

                        <Text className="text-gray-400 text-xs text-center mt-6">{t('common:version', { version: '1.0.0' })}</Text>
                    </View>
                </ScrollView>
            </SafeAreaView>

            <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
                <View className="flex-1 bg-black/70 justify-center px-6">
                    <View className="bg-white dark:bg-zinc-800 rounded-2xl p-5 border border-red-500/20">
                        <Text className="text-lg font-bold text-gray-900 dark:text-white" style={textStart(isRTL)}>{t('deleteConfirmTitle')}</Text>
                        <Text className="text-gray-500 dark:text-gray-300 text-sm mt-2" style={textStart(isRTL)}>
                            {t('deleteConfirmMessage')}
                        </Text>
                        <TextInput
                            value={deleteConfirmText}
                            onChangeText={setDeleteConfirmText}
                            autoCapitalize="characters"
                            placeholder="SUPPRIMER"
                            placeholderTextColor="#9CA3AF"
                            className="mt-4 bg-gray-100 dark:bg-zinc-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
                            style={forceLTRText()}
                        />
                        <View className="gap-3 mt-4" style={rowStyle(isRTL)}>
                            <TouchableOpacity
                                className="flex-1 py-3 rounded-xl bg-gray-200 dark:bg-zinc-700 items-center"
                                onPress={() => {
                                    if (isDeletingAccount) return;
                                    setShowDeleteModal(false);
                                    setDeleteConfirmText('');
                                }}
                                disabled={isDeletingAccount}
                            >
                                <Text className="text-gray-700 dark:text-gray-200 font-semibold">{t('common:cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="flex-1 py-3 rounded-xl bg-red-500 items-center"
                                onPress={confirmDeleteAccount}
                                disabled={isDeletingAccount}
                            >
                                <Text className="text-white font-semibold">{isDeletingAccount ? t('deleting') : t('common:delete')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// Components purely for this screen to keep it clean
function MenuItem({ icon: Icon, label, rightElement, onPress, labelClassName }: any) {
    const { isRTL } = useLanguage();

    return (
        <TouchableOpacity onPress={onPress} className="flex-row items-center justify-between p-4 active:bg-gray-50 dark:active:bg-zinc-700/50" style={rowStyle(isRTL)}>
            <View className="flex-row items-center" style={rowStyle(isRTL)}>
                <View className="bg-gray-100 dark:bg-zinc-700 p-2 rounded-full mr-3">
                    <Icon size={18} color="white" />
                </View>
                <Text className={labelClassName || 'text-gray-900 dark:text-white font-medium text-base'} style={textStart(isRTL)}>{label}</Text>
            </View>
            {rightElement ? rightElement : <ChevronRight size={18} color="white" style={flipChevron(isRTL)} />}
        </TouchableOpacity>
    );
}

function Separator() {
    return <View className="h-[1px] bg-gray-100 dark:bg-zinc-700/50 mx-4" />;
}

function WalletRow({ label, value }: { label: string; value: string }) {
    const { isRTL } = useLanguage();

    return (
        <View className="flex-row items-center justify-between" style={rowStyle(isRTL)}>
            <Text className="text-gray-500 text-xs" style={textStart(isRTL)}>{label}</Text>
            <Text className="text-gray-900 dark:text-white text-sm font-semibold" style={textEnd(isRTL)}>{value}</Text>
        </View>
    );
}
