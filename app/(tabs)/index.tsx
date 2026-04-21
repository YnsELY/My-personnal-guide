import { GuideCard } from '@/components/GuideCard';
import { HadithWidget } from '@/components/HadithWidget';
import { PrayerTimesWidget } from '@/components/PrayerTimesWidget';
import { SlideToConfirmModal } from '@/components/SlideToConfirmModal';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useReservations } from '@/context/ReservationsContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { directionStyle, flipChevron, rowStyle, textStart } from '@/lib/rtl';
import { getRecommendedGuides } from '@/lib/api';
import { formatSAR, toSar } from '@/lib/pricing';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowUpRight, CalendarCheck, Check, ChevronRight, Clock, MapPin, MessageCircle, User, X } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Animated, Image, ImageBackground, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const { t } = useTranslation('home');
  const { isRTL } = useLanguage();
  const { profile, user } = useAuth();
  const { getReservationsByRole, updateReservationStatus, confirmVisitStartAsGuide, confirmVisitEndAsGuide } = useReservations();
  const [guides, setGuides] = React.useState<any[]>([]);
  const [isLoadingRecommendedGuides, setIsLoadingRecommendedGuides] = React.useState(false);
  const fullName = (profile?.full_name || user?.user_metadata?.full_name || '').trim();
  const firstName = fullName ? fullName.split(/\s+/)[0] : '';

  useEffect(() => {
    if (profile?.role !== 'pilgrim') return;
    setIsLoadingRecommendedGuides(true);
    getRecommendedGuides(5)
      .then(setGuides)
      .catch(console.error)
      .finally(() => setIsLoadingRecommendedGuides(false));
  }, [profile]);

  const serviceShowcaseCards = [
    {
      id: 'omra-badal',
      title: t('serviceCard.omraBadal.title'),
      subtitle: t('serviceCard.omraBadal.subtitle'),
      description: t('serviceCard.omraBadal.description'),
      image: require('@/assets/images/mecca.jpg'),
      badge: t('serviceCard.omraBadal.badge'),
      cta: t('serviceCard.omraBadal.cta'),
      accent: ['#5a4529', '#b39164'] as const,
      onPress: () => router.push('/service/omra-badal'),
    },
    {
      id: 'visite-guidee',
      title: t('serviceCard.visitGuidee.title'),
      subtitle: t('serviceCard.visitGuidee.subtitle'),
      description: t('serviceCard.visitGuidee.description'),
      image: require('@/assets/images/medina.jpeg'),
      badge: t('serviceCard.visitGuidee.badge'),
      cta: t('serviceCard.visitGuidee.cta'),
      accent: ['#365b64', '#6aa9ba'] as const,
      onPress: () => router.push('/service/visite-guidee'),
    },
    {
      id: 'omra-accompagne',
      title: t('serviceCard.omraAccompagne.title'),
      subtitle: t('serviceCard.omraAccompagne.subtitle'),
      description: t('serviceCard.omraAccompagne.description'),
      image: require('@/assets/images/mecca.jpg'),
      badge: t('serviceCard.omraAccompagne.badge'),
      cta: t('serviceCard.omraAccompagne.cta'),
      accent: ['#5a4529', '#b39164'] as const,
      onPress: () => router.push('/service/omra-accompagne'),
    },
    {
      id: 'all-services',
      title: t('serviceCard.allServices.title'),
      subtitle: t('serviceCard.allServices.subtitle'),
      description: t('serviceCard.allServices.description'),
      image: require('@/assets/images/hero.jpg'),
      badge: t('serviceCard.allServices.badge'),
      cta: t('serviceCard.allServices.cta'),
      accent: ['#2d3e5d', '#4f6d9c'] as const,
      onPress: () => router.push('/date-select'),
    },
  ];

  // Get data from context
  const guideReservations = getReservationsByRole('guide', profile?.id || '1');
  const pendingRequests = guideReservations.filter(r => r.status === 'pending');
  const upcomingVisits = guideReservations.filter(r => r.status === 'confirmed');
  const ongoingVisits = guideReservations.filter(r => r.status === 'in_progress');

  const isBadalReservation = (reservation: any) => {
    return String(reservation?.serviceName || '').toLowerCase().includes('badal');
  };

  const isWaitingPilgrimStartConfirmation = (reservation: any) => {
    return !!reservation?.guideStartConfirmedAt && !reservation?.pilgrimStartConfirmedAt;
  };

  const isWaitingPilgrimEndConfirmation = (reservation: any) => {
    return !!reservation?.guideEndConfirmedAt && !reservation?.pilgrimEndConfirmedAt;
  };

  // Guide action modal state
  const [pendingAction, setPendingAction] = React.useState<{
    type: 'accept' | 'refuse' | 'start' | 'end';
    reservationId: string;
    label: string;
  } | null>(null);
  const [isActionSubmitting, setIsActionSubmitting] = React.useState(false);

  const openActionConfirmation = (type: 'accept' | 'refuse' | 'start' | 'end', reservationId: string, label: string) => {
    setPendingAction({ type, reservationId, label });
  };

  const closeActionConfirmation = () => {
    setPendingAction(null);
  };

  const confirmPendingAction = async () => {
    if (!pendingAction) return;
    setIsActionSubmitting(true);
    try {
      if (pendingAction.type === 'accept') {
        await updateReservationStatus(pendingAction.reservationId, 'confirmed');
      } else if (pendingAction.type === 'refuse') {
        await updateReservationStatus(pendingAction.reservationId, 'cancelled');
      } else if (pendingAction.type === 'start') {
        await confirmVisitStartAsGuide(pendingAction.reservationId);
      } else if (pendingAction.type === 'end') {
        await confirmVisitEndAsGuide(pendingAction.reservationId);
      }
      setPendingAction(null);
    } catch (e) {
      Alert.alert(t('common:error'), t('actionError'));
    } finally {
      setIsActionSubmitting(false);
    }
  };


  // Animation for FAB
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1.3,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, [pulseAnim]);

  return (
    <View className="flex-1 bg-gray-50 dark:bg-zinc-900" style={directionStyle(isRTL)}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Full Screen Header Background */}
        <View className="h-80 relative">
          <Image
            source={require('@/assets/images/hero.jpg')}
            className="w-full h-full object-cover"
          />
          {/* Subtle dark overlay for text readability */}
          <View className="absolute inset-0 bg-black/20" />

          {/* Fade to bottom gradient */}
          <LinearGradient
            colors={['transparent', isDark ? '#18181b' : '#f9fafb']} // zinc-900 or gray-50
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 160 }}
          />

          {/* Content Overlay */}
          <SafeAreaView className="absolute inset-0 px-6 pt-2">
            <View className="flex-row justify-between items-center mb-6" style={rowStyle(isRTL)}>
              <TouchableOpacity onPress={() => router.back()}>
                {/* <ChevronLeft color="white" size={28} /> */}
              </TouchableOpacity>
            </View>

            <View className="mt-12">
              <Text className="text-white text-3xl font-serif font-medium mb-1">
                {firstName ? t('welcomeUser', { name: firstName }) : t('welcome')}
              </Text>
              <Text className="text-gray-200 text-sm w-3/4 leading-5 shadow-sm" style={textStart(isRTL)}>
                {t('welcomeSubtitle')}
              </Text>
            </View>
          </SafeAreaView>
        </View>

        <View className="-mt-12 px-6">
          {profile?.role === 'pilgrim' && (
            <>
              {/* Primary Action Card (Permis in design -> Find Guide here) */}
              <TouchableOpacity
                className="bg-white dark:bg-zinc-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 mb-4 overflow-hidden relative"
                onPress={() => router.push('/date-select')}
              >
                <ImageBackground
                  source={{ uri: 'https://www.transparenttextures.com/patterns/arabesque.png' }}
                  className="absolute inset-0 opacity-5"
                  resizeMode="repeat"
                />
                <View className="flex-row items-center justify-between" style={rowStyle(isRTL)}>
                  <View className="flex-row items-center" style={rowStyle(isRTL)}>
                    <View className="bg-[#b39164]/10 p-3 rounded-full mr-4">
                      <MapPin color="#b39164" size={24} />
                    </View>
                    <View>
                      <Text className="text-gray-900 dark:text-white text-lg font-medium" style={textStart(isRTL)}>{t('findGuide')}</Text>
                      <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1" style={textStart(isRTL)}>{t('bookGuide')}</Text>
                    </View>
                  </View>
                  <ChevronRight color="#9CA3AF" size={20} style={flipChevron(isRTL)} />
                </View>
              </TouchableOpacity>

              {/* Secondary Card (Reservations) */}
              <TouchableOpacity
                className="bg-white dark:bg-zinc-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 mb-4 flex-row items-center justify-between"
                style={rowStyle(isRTL)}
                onPress={() => router.push('/my-reservations')}
              >
                <View className="flex-row items-center" style={rowStyle(isRTL)}>
                  <View className="bg-primary/10 p-3 rounded-full mr-4">
                    <CalendarCheck color="#b39164" size={24} />
                  </View>
                  <View>
                    <Text className="text-gray-900 dark:text-white text-lg font-medium" style={textStart(isRTL)}>{t('yourReservations')}</Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1" style={textStart(isRTL)}>{t('viewBookedGuides')}</Text>
                  </View>
                </View>
                <ChevronRight color="#9CA3AF" size={20} style={flipChevron(isRTL)} />
              </TouchableOpacity>
            </>
          )}

          {/* Omra Guide Banner */}
          <TouchableOpacity
            onPress={() => router.push('/omra-guide' as any)}
            activeOpacity={0.92}
            className="mb-4 rounded-3xl overflow-hidden"
            style={{ shadowColor: '#7a6143', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 5 }}
          >
            <LinearGradient
              colors={['#7a6143', '#b39164', '#c8a87a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="px-5 py-5"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <Text style={{ fontSize: 40, marginRight: 14 }}>🕋</Text>
                  <View className="flex-1">
                    <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 2.5, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', marginBottom: 3 }}>
                      GUIDE COMPLET
                    </Text>
                    <Text style={{ fontSize: 19, fontWeight: '800', color: '#fff', letterSpacing: -0.4, lineHeight: 23 }}>
                      Accomplir la ʿOmra
                    </Text>
                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 3 }}>
                      Étapes, invocations & conseils
                    </Text>
                  </View>
                </View>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', marginLeft: 8 }}>
                  <ChevronRight size={18} color="#fff" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Prayer Times Section */}
          <PrayerTimesWidget />

          {/* Hadith Section */}
          <HadithWidget />

          {/* Guide: Créer un service + Voir mes services */}
          {profile?.role === 'guide' && (
            <View className="mb-6 gap-3">
              <TouchableOpacity
                onPress={() => router.push('/guide/create-service')}
                className="bg-[#b39164] py-4 rounded-2xl items-center flex-row justify-center shadow-sm shadow-[#b39164]/30 active:bg-[#a08055]"
              >
                <Text className="text-white font-bold text-base">{t('createService')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/guide/my-services')}
                className="bg-white dark:bg-zinc-800 py-4 rounded-2xl items-center flex-row justify-center border border-[#b39164]/40 active:bg-gray-50 dark:active:bg-zinc-700"
              >
                <Text className="text-[#b39164] font-semibold text-base">{t('viewMyServices')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Pilgrim Sections */}
          {profile?.role === 'pilgrim' && (
            <>
              {/* Services Section */}
              <View className="flex-row items-end justify-between mb-4" style={rowStyle(isRTL)}>
                <Text className="text-gray-900 dark:text-white text-lg font-bold" style={textStart(isRTL)}>{t('ourServices')}</Text>
                <Text className="text-[#b39164] text-xs font-semibold uppercase tracking-wide">{t('premiumSelection')}</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8" contentContainerStyle={{ gap: 16, paddingRight: 20 }}>
                {serviceShowcaseCards.map((card) => (
                  <TouchableOpacity
                    key={card.id}
                    className="rounded-3xl w-80 bg-white dark:bg-zinc-800 shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden"
                    onPress={card.onPress}
                    activeOpacity={0.9}
                  >
                    <View className="h-52 relative">
                      <Image source={card.image} className="w-full h-full object-cover" />
                      <LinearGradient
                        colors={['rgba(9, 9, 11, 0.02)', 'rgba(9, 9, 11, 0.2)', 'rgba(9, 9, 11, 0.45)']}
                        locations={[0.2, 0.6, 1]}
                        className="absolute inset-0"
                      />
                    </View>

                    <View className="px-5 pt-4 pb-5">
                      <Text className="text-gray-900 dark:text-white text-2xl font-serif font-semibold">{card.title}</Text>
                      <Text className="text-[#b39164] text-xs font-semibold uppercase tracking-widest mt-1">{card.subtitle}</Text>
                      <Text className="text-gray-600 dark:text-zinc-300 text-sm leading-6 mt-3" numberOfLines={3}>
                        {card.description}
                      </Text>

                      <View className="flex-row items-center justify-between mt-4 rounded-2xl border px-4 py-3 border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-zinc-700/30">
                        <Text className="text-sm font-semibold text-gray-900 dark:text-white">
                          {card.cta}
                        </Text>
                        <ArrowUpRight size={16} color={isDark ? '#ffffff' : '#18181b'} />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Recommended Section (Mini) */}
              <Text className="text-gray-900 dark:text-white text-lg font-bold mb-4" style={textStart(isRTL)}>{t('recommendedGuides')}</Text>
              {isLoadingRecommendedGuides ? (
                <Text className="text-gray-500 text-sm" style={textStart(isRTL)}>{t('loadingGuides')}</Text>
              ) : guides.length > 0 ? (
                guides.slice(0, 5).map((guide) => (
                  <GuideCard key={guide.id} guide={guide} />
                ))
              ) : (
                <Text className="text-gray-500 text-sm" style={textStart(isRTL)}>{t('noRecommendedGuides')}</Text>
              )}
            </>
          )}

          {/* Guide Sections */}
          {profile?.role === 'guide' && (
            <>
              {/* Ongoing Visits */}
              {ongoingVisits.length > 0 && (
                <>
                  <View className="flex-row items-center justify-between mb-4 mt-2">
                    <Text className="text-gray-900 dark:text-white text-lg font-bold">{t('ongoingVisits')}</Text>
                    <View className="bg-blue-500/10 px-2 py-0.5 rounded-full">
                      <Text className="text-blue-500 text-xs font-semibold">{t('activeCount', { count: ongoingVisits.length })}</Text>
                    </View>
                  </View>
                  <View className="gap-3 mb-8">
                    {ongoingVisits.map((visit) => (
                      <View key={visit.id} className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-blue-200 dark:border-blue-500/20">
                        {(() => {
                          const isWaitingEndConfirmation = isWaitingPilgrimEndConfirmation(visit);
                          return (
                            <>
                        <View className="flex-row items-center mb-3">
                          <View className="bg-blue-500/10 p-3 rounded-full mr-3">
                            <User color="#3b82f6" size={20} />
                          </View>
                          <View className="flex-1">
                            <Text className="text-gray-900 dark:text-white font-medium">{visit.pilgrimName}</Text>
                            <Text className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{visit.serviceName} • {visit.date}</Text>
                            <View className="flex-row items-center mt-1">
                              <MapPin size={10} color="#9CA3AF" />
                              <Text className="text-gray-400 text-[10px] ml-1">{visit.location || t('common:locationTbd')}</Text>
                            </View>
                          </View>
                          <View className={`px-2 py-0.5 rounded-full ${isWaitingEndConfirmation ? 'bg-amber-500/20' : 'bg-blue-500/20'}`}>
                            <Text className={`text-[10px] font-medium ${isWaitingEndConfirmation ? 'text-amber-600' : 'text-blue-600'}`}>
                              {isWaitingEndConfirmation ? t('waitingEnd') : t('inProgress')}
                            </Text>
                          </View>
                        </View>

                        {isWaitingEndConfirmation ? (
                          <View className="bg-amber-100 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 py-2.5 rounded-xl items-center">
                            <Text className="text-amber-700 dark:text-amber-300 font-semibold text-xs text-center">
                              {t('waitingPilgrimEndConfirmation')}
                            </Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            onPress={() => openActionConfirmation('end', visit.id, visit.pilgrimName)}
                            className="bg-blue-500 py-2.5 rounded-xl items-center"
                            activeOpacity={0.8}
                          >
                            <Text className="text-white font-semibold text-sm">{t('endVisit')}</Text>
                          </TouchableOpacity>
                        )}

                        {isBadalReservation(visit) && (
                          <TouchableOpacity
                            onPress={() => router.push(`/guide/proofs/${visit.id}` as any)}
                            className="mt-2 bg-indigo-500/10 border border-indigo-500/20 py-2.5 rounded-xl items-center"
                            activeOpacity={0.8}
                          >
                            <Text className="text-indigo-500 font-semibold text-sm">{t('submitBadalProofs')}</Text>
                          </TouchableOpacity>
                        )}
                            </>
                          );
                        })()}
                      </View>
                    ))}
                  </View>
                </>
              )}

              {/* Upcoming Visits */}
              <View className="flex-row items-center justify-between mb-4 mt-2">
                <Text className="text-gray-900 dark:text-white text-lg font-bold">{t('myUpcomingVisits')}</Text>
                <TouchableOpacity onPress={() => router.push('/guide-dashboard')}>
                  <Text className="text-[#b39164] text-sm font-medium">{t('viewAllVisits')}</Text>
                </TouchableOpacity>
              </View>

              <View className="gap-3 mb-8">
                {upcomingVisits.length > 0 ? upcomingVisits.map((visit) => (
                  <View key={visit.id} className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
                    {(() => {
                      const isWaitingStartConfirmation = isWaitingPilgrimStartConfirmation(visit);
                      return (
                        <>
                    <View className="flex-row items-center mb-3">
                      <View className="bg-green-500/10 p-3 rounded-full mr-3">
                        <User color="#22c55e" size={20} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-900 dark:text-white font-medium">{visit.pilgrimName}</Text>
                        <Text className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{visit.serviceName} • {visit.date}</Text>
                        <View className="flex-row items-center mt-1">
                          <MapPin size={10} color="#9CA3AF" />
                          <Text className="text-gray-400 text-[10px] ml-1">{visit.location || t('common:locationTbd')}</Text>
                        </View>
                      </View>
                      <View className="items-end">
                        <Text className="text-gray-900 dark:text-white font-bold">{visit.time}</Text>
                        <View className={`px-2 py-0.5 rounded-full mt-1 ${isWaitingStartConfirmation ? 'bg-amber-500/20' : 'bg-green-500/20'}`}>
                          <Text className={`text-[10px] font-medium ${isWaitingStartConfirmation ? 'text-amber-600' : 'text-green-600'}`}>
                            {isWaitingStartConfirmation ? t('waitingStart') : t('confirmed')}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {isWaitingStartConfirmation ? (
                      <View className="bg-amber-100 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 py-2.5 rounded-xl items-center">
                        <Text className="text-amber-700 dark:text-amber-300 font-semibold text-xs text-center">
                          {t('waitingPilgrimStartConfirmation')}
                        </Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => openActionConfirmation('start', visit.id, visit.pilgrimName)}
                        className="bg-green-500 py-2.5 rounded-xl items-center"
                        activeOpacity={0.8}
                      >
                        <Text className="text-white font-semibold text-sm">{t('startVisit')}</Text>
                      </TouchableOpacity>
                    )}

                    {isBadalReservation(visit) && (
                      <TouchableOpacity
                        onPress={() => router.push(`/guide/proofs/${visit.id}` as any)}
                        className="mt-2 bg-indigo-500/10 border border-indigo-500/20 py-2.5 rounded-xl items-center"
                        activeOpacity={0.8}
                      >
                        <Text className="text-indigo-500 font-semibold text-sm">Déposer les preuves Omra Badal</Text>
                      </TouchableOpacity>
                    )}
                        </>
                      );
                    })()}
                  </View>
                )) : (
                  <Text className="text-gray-400 text-sm text-center py-4">{t('noUpcomingVisits')}</Text>
                )}
              </View>

              {/* Guide Requests */}
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-gray-900 dark:text-white text-lg font-bold">{t('myRequests')}</Text>
                <TouchableOpacity onPress={() => router.push('/guide-dashboard')}>
                  <Text className="text-[#b39164] text-sm font-medium">{t('viewAllRequests')}</Text>
                </TouchableOpacity>
              </View>

              <View className="gap-3">
                {pendingRequests.length > 0 ? pendingRequests.map((req) => (
                  <View key={req.id} className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
                    <View className="flex-row items-center mb-3">
                      <View className="bg-[#b39164]/10 p-3 rounded-full mr-3">
                        <Clock color="#b39164" size={20} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-900 dark:text-white font-medium">{req.pilgrimName}</Text>
                        <Text className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{req.serviceName}</Text>
                        <Text className="text-gray-500 dark:text-gray-400 text-xs">{req.date} à {req.time}</Text>
                      </View>
                      <Text className="text-[#b39164] font-bold">
                        {formatSAR(toSar(Number(req.guideNetAmountEur ?? req.price ?? 0)))}
                      </Text>
                    </View>
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => openActionConfirmation('refuse', req.id, req.pilgrimName)}
                        className="flex-1 flex-row items-center justify-center border border-red-300 dark:border-red-500/40 py-2.5 rounded-xl gap-1.5"
                        activeOpacity={0.7}
                      >
                        <X size={14} color="#ef4444" />
                        <Text className="text-red-500 font-semibold text-sm">{t('refuse')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => openActionConfirmation('accept', req.id, req.pilgrimName)}
                        className="flex-1 flex-row items-center justify-center bg-[#b39164] py-2.5 rounded-xl gap-1.5"
                        activeOpacity={0.8}
                      >
                        <Check size={14} color="white" />
                        <Text className="text-white font-semibold text-sm">{t('accept')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )) : (
                  <Text className="text-gray-400 text-sm text-center py-4">{t('noRequests')}</Text>
                )}
              </View>
            </>
          )}

          {profile?.role === 'admin' && (
            <View className="mt-2">
              <Text className="text-gray-900 dark:text-white text-lg font-bold mb-4">{t('administration')}</Text>
              <TouchableOpacity
                className="bg-white dark:bg-zinc-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 flex-row items-center justify-between"
                onPress={() => router.push('/(tabs)/admin-dashboard' as any)}
              >
                <View>
                  <Text className="text-gray-900 dark:text-white text-base font-semibold">{t('openAdminDashboard')}</Text>
                  <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1">{t('adminDashboardSubtitle')}</Text>
                </View>
                <ChevronRight color="#9CA3AF" size={20} />
              </TouchableOpacity>
            </View>
          )}

          <View className="h-24" />
        </View>
      </ScrollView>

      {/* Guide action confirmation modal */}
      {pendingAction && (
        <SlideToConfirmModal
          visible={!!pendingAction}
          title={pendingAction.type === 'accept' ? t('slideAcceptTitle') :
                 pendingAction.type === 'refuse' ? t('slideRefuseTitle') :
                 pendingAction.type === 'start' ? t('slideStartTitle') : t('slideEndTitle')}
          message={pendingAction.label}
          sliderLabel={pendingAction.type === 'accept' ? t('slideAccept') :
                       pendingAction.type === 'refuse' ? t('slideRefuse') :
                       pendingAction.type === 'start' ? t('slideStart') : t('slideEnd')}
          onConfirm={confirmPendingAction}
          onClose={closeActionConfirmation}
          isProcessing={isActionSubmitting}
        />
      )}

      {/* Floating Support Button with Aura Effect */}
      <View className="absolute bottom-6 right-6 flex-row items-center justify-end pointer-events-box-none">

        {/* Helper Text */}
        <View className="bg-white dark:bg-zinc-800 px-3 py-2 rounded-xl border border-gray-100 dark:border-white/10 shadow-sm mr-4">
          <Text className="text-gray-900 dark:text-white font-medium text-xs">{t('needHelp')}</Text>
        </View>

        <View className="items-center justify-center">
          {/* Animated Aura/Ripple - More Subtle */}
          <Animated.View
            className="absolute bg-[#b39164] rounded-full"
            style={{
              width: 64,
              height: 64,
              opacity: pulseAnim.interpolate({
                inputRange: [1, 1.3], // Reduced scale range
                outputRange: [0.3, 0] // Reduced max opacity
              }),
              transform: [{
                scale: pulseAnim.interpolate({
                  inputRange: [1, 1.3],
                  outputRange: [1, 1.3]
                })
              }]
            }}
          />

          {/* Main Button */}
          <TouchableOpacity
            onPress={() => router.push('/support')}
            className="bg-[#b39164] p-4 rounded-full shadow-lg shadow-[#b39164]/40 items-center justify-center w-16 h-16 border-4 border-white dark:border-zinc-800 z-10"
            activeOpacity={0.8}
          >
            <MessageCircle color="white" size={28} fill="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
