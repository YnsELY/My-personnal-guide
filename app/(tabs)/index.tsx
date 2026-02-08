import { GuideCard } from '@/components/GuideCard';
import { HadithWidget } from '@/components/HadithWidget';
import { PrayerTimesWidget } from '@/components/PrayerTimesWidget';
import { useAuth } from '@/context/AuthContext';
import { useReservations } from '@/context/ReservationsContext';
import { getGuides } from '@/lib/api';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Award, ChevronRight, Clock, Heart, MapPin, MessageCircle, User } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, Image, ImageBackground, ScrollView, StatusBar, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { profile } = useAuth();
  const { getReservationsByRole } = useReservations();
  const [guides, setGuides] = React.useState<any[]>([]);

  useEffect(() => {
    if (profile?.role === 'pilgrim') {
      const gender = profile.gender as 'male' | 'female' | undefined;
      getGuides(gender).then(setGuides).catch(console.error);
    } else {
      getGuides().then(setGuides).catch(console.error);
    }
  }, [profile]);

  // Get data from context
  const guideReservations = getReservationsByRole('guide', profile?.id || '1');
  const pendingRequests = guideReservations.filter(r => r.status === 'pending');
  const upcomingVisits = guideReservations.filter(r => r.status === 'confirmed');


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
    <View className="flex-1 bg-gray-50 dark:bg-zinc-900">
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
            <View className="flex-row justify-between items-center mb-6">
              <TouchableOpacity onPress={() => router.back()}>
                {/* <ChevronLeft color="white" size={28} /> */}
              </TouchableOpacity>
              <View className="flex-row gap-4">
                <View className="bg-green-500/20 px-3 py-1 rounded-full border border-green-500/30 flex-row items-center">
                  <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                  <Text className="text-green-500 text-xs font-bold">7:15</Text>
                </View>
              </View>
            </View>

            <View className="mt-12">
              <Text className="text-white text-3xl font-serif font-medium mb-1">Bienvenue YANIS</Text>
              <Text className="text-gray-200 text-sm w-3/4 leading-5 shadow-sm">
                Bienvenue au lieu de la révélation et à l'origine du message divin
              </Text>
            </View>
          </SafeAreaView>
        </View>

        <View className="-mt-12 px-6">
          {profile?.role !== 'guide' && (
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
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="bg-[#b39164]/10 p-3 rounded-full mr-4">
                      <MapPin color="#b39164" size={24} />
                    </View>
                    <View>
                      <Text className="text-gray-900 dark:text-white text-lg font-medium">Trouver un Guide</Text>
                      <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1">Réservez votre accompagnateur</Text>
                    </View>
                  </View>
                  <ChevronRight color="#9CA3AF" size={20} />
                </View>
              </TouchableOpacity>

              {/* Secondary Card (Reservations) */}
              <TouchableOpacity
                className="bg-white dark:bg-zinc-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 mb-4 flex-row items-center justify-between"
                onPress={() => router.push('/my-reservations')}
              >
                <View className="flex-row items-center">
                  <View className="bg-primary/10 p-3 rounded-full mr-4">
                    {/* Icon approximating the 'clipboard' or 'ticket' */}
                    <View className="w-6 h-4 border-2 border-primary rounded-sm" />
                  </View>
                  <View>
                    <Text className="text-gray-900 dark:text-white text-lg font-medium">Vos réservations</Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1">Voir les guides réservés</Text>
                  </View>
                </View>
                <ChevronRight color="#9CA3AF" size={20} />
              </TouchableOpacity>
            </>
          )}

          {/* Prayer Times Section */}
          <PrayerTimesWidget />

          {/* Hadith Section */}
          <HadithWidget />


          {/* Pilgrim Sections */}
          {profile?.role !== 'guide' && (
            <>
              {/* Services Section */}
              <Text className="text-gray-900 dark:text-white text-lg font-bold mb-4">Nos Services</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8" contentContainerStyle={{ gap: 16 }}>
                {/* Service 1: Omra Badal */}
                <TouchableOpacity
                  className="bg-white dark:bg-zinc-800 rounded-2xl w-64 shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden pb-4"
                  onPress={() => router.push('/service/omra-badal')}
                >
                  <View className="h-60 relative">
                    <Image
                      source={require('@/assets/images/mecca.jpg')}
                      className="w-full h-full object-cover"
                    />
                    <View className="absolute inset-0 bg-black/10" />
                  </View>
                  <View className="items-center -mt-8">
                    <View className="bg-primary h-16 w-16 rounded-full items-center justify-center border-4 border-white dark:border-zinc-800 shadow-md">
                      <Heart color="white" fill="white" size={24} />
                    </View>
                    <Text className="text-gray-900 dark:text-white font-bold text-lg mt-2">Omra Badal</Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-xs text-center px-2 mt-1">Par procuration</Text>
                  </View>
                </TouchableOpacity>

                {/* Service 2: Visites Guidées */}
                <TouchableOpacity className="bg-white dark:bg-zinc-800 rounded-2xl w-64 shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden pb-4">
                  <View className="h-60 relative">
                    <Image
                      source={require('@/assets/images/medina.jpeg')}
                      className="w-full h-full object-cover"
                    />
                    <View className="absolute inset-0 bg-black/10" />
                  </View>
                  <View className="items-center -mt-8">
                    <View className="bg-primary h-16 w-16 rounded-full items-center justify-center border-4 border-white dark:border-zinc-800 shadow-md">
                      <MapPin color="white" fill="white" size={24} />
                    </View>
                    <Text className="text-gray-900 dark:text-white font-bold text-lg mt-2">Visites Guidées</Text>
                    <Text className="text-500 dark:text-gray-400 text-xs text-center px-2 mt-1">Ziyara Lieux Saints</Text>
                  </View>
                </TouchableOpacity>

                {/* Service 3: Transport VIP (Bonus) */}
                <TouchableOpacity className="bg-white dark:bg-zinc-800 rounded-2xl w-64 shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden pb-4">
                  <View className="h-60 relative">
                    <Image
                      source={{ uri: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1000&auto=format&fit=crop' }}
                      className="w-full h-full object-cover"
                    />
                    <View className="absolute inset-0 bg-black/10" />
                  </View>
                  <View className="items-center -mt-8">
                    <View className="bg-primary h-16 w-16 rounded-full items-center justify-center border-4 border-white dark:border-zinc-800 shadow-md">
                      <Award color="white" fill="white" size={24} />
                    </View>
                    <Text className="text-gray-900 dark:text-white font-bold text-lg mt-2">Transport VIP</Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-xs text-center px-2 mt-1">Confort & Luxe</Text>
                  </View>
                </TouchableOpacity>
              </ScrollView>

              {/* Recommended Section (Mini) */}
              <Text className="text-gray-900 dark:text-white text-lg font-bold mb-4">Guides Recommandés</Text>
              {guides.length > 0 ? (
                guides.slice(0, 2).map((guide) => (
                  <GuideCard key={guide.id} guide={guide} />
                ))
              ) : (
                <Text className="text-gray-500 text-sm">Chargement des guides...</Text>
              )}
            </>
          )}

          {/* Guide Sections */}
          {profile?.role === 'guide' && (
            <>
              {/* Upcoming Visits */}
              <View className="flex-row items-center justify-between mb-4 mt-2">
                <Text className="text-gray-900 dark:text-white text-lg font-bold">Mes prochaines visites</Text>
                <TouchableOpacity onPress={() => router.push('/guide-dashboard')}>
                  <Text className="text-[#b39164] text-sm font-medium">Voir toutes mes visites</Text>
                </TouchableOpacity>
              </View>

              <View className="gap-3 mb-8">
                {upcomingVisits.length > 0 ? upcomingVisits.map((visit) => (
                  <View key={visit.id} className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5 flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="bg-green-500/10 p-3 rounded-full mr-3">
                        <User color="#22c55e" size={20} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-900 dark:text-white font-medium">{visit.pilgrimName}</Text>
                        <Text className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{visit.serviceName} • {visit.date}</Text>
                        <View className="flex-row items-center mt-1">
                          <MapPin size={10} color="#9CA3AF" />
                          <Text className="text-gray-400 text-[10px] ml-1">{visit.location || 'Lieu à définir'}</Text>
                        </View>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-gray-900 dark:text-white font-bold">{visit.time}</Text>
                      <View className="bg-green-500/20 px-2 py-0.5 rounded-full mt-1">
                        <Text className="text-green-600 text-[10px] font-medium">Confirmé</Text>
                      </View>
                    </View>
                  </View>
                )) : (
                  <Text className="text-gray-400 text-sm text-center py-4">Aucune visite à venir</Text>
                )}
              </View>

              {/* Guide Requests */}
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-gray-900 dark:text-white text-lg font-bold">Mes demandes</Text>
                <TouchableOpacity onPress={() => router.push('/guide-dashboard')}>
                  <Text className="text-[#b39164] text-sm font-medium">Voir toutes mes demandes</Text>
                </TouchableOpacity>
              </View>

              <View className="gap-3">
                {pendingRequests.length > 0 ? pendingRequests.map((req) => (
                  <View key={req.id} className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5 flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="bg-[#b39164]/10 p-3 rounded-full mr-3">
                        <Clock color="#b39164" size={20} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-900 dark:text-white font-medium">{req.pilgrimName}</Text>
                        <Text className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{req.serviceName}</Text>
                        <Text className="text-gray-500 dark:text-gray-400 text-xs">{req.date} à {req.time}</Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-[#b39164] font-bold">{req.price}</Text>
                    </View>
                  </View>
                )) : (
                  <Text className="text-gray-400 text-sm text-center py-4">Aucune demande en attente</Text>
                )}
              </View>
            </>
          )}

          <View className="h-24" />
        </View>
      </ScrollView>

      {/* Floating Support Button with Aura Effect */}
      <View className="absolute bottom-6 right-6 flex-row items-center justify-end pointer-events-box-none">

        {/* Helper Text */}
        <View className="bg-white dark:bg-zinc-800 px-3 py-2 rounded-xl border border-gray-100 dark:border-white/10 shadow-sm mr-4">
          <Text className="text-gray-900 dark:text-white font-medium text-xs">Besoin d'aide ?</Text>
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
