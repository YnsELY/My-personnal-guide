import { SERVICES } from '@/constants/data';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Award, Share2 } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Image, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ServiceDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const service = SERVICES.find(s => s.id === id) || SERVICES[0];
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateAnim = useRef(new Animated.Value(24)).current;
    const [hadithIndex, setHadithIndex] = useState(0);
    const cardWidth = Dimensions.get('window').width - 48;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 420,
                useNativeDriver: true,
            }),
            Animated.timing(translateAnim, {
                toValue: 0,
                duration: 420,
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, translateAnim]);

    const serviceMeta = useMemo(() => {
        if (service.id === 'omra-badal') {
            return {
                sectionTag: 'Accompagnement à distance',
                intensity: 'Expérience guidée',
                duration: 'Suivi de la Omra',
                location: 'La Mecque',
                highlights: [
                    'Preuves visuelles des étapes clés',
                    'Réalisation conforme et transparente',
                    'Suivi clair du début à la fin',
                ],
                steps: [
                    { title: 'Période choisie', description: 'Vous indiquez une fourchette d’une semaine, sans choix d’heure, pour l’accomplissement de la Omra Badal.' },
                    { title: 'Début du rite', description: 'Le guide vous transmet une preuve visuelle à l’entrée en état de sacralisation.' },
                    { title: 'Réalisation', description: 'La Omra est effectuée avec sérieux en respectant les rites prescrits.' },
                    { title: 'Clôture', description: 'Un retour final vous est transmis pour valider l’achèvement du service.' },
                ],
            };
        }

        if (service.id === 'visite-masjid-nabawi') {
            return {
                sectionTag: 'Visite légiférée à Médine',
                intensity: 'Parcours spirituel',
                duration: 'Demi-journée',
                location: 'Médine',
                highlights: [
                    'Portes importantes du Masjid Nabawi',
                    'Al-Rawdha et le cimetière du Baqi\'',
                    'Repères pratiques pour la prière et le cortège funéraire',
                ],
                steps: [
                    { title: 'Accueil', description: 'Le guide vous accueille et présente le déroulé de la visite du Masjid Nabawi.' },
                    { title: 'Portes & Rawdha', description: 'Découverte des portes importantes du Masjid Nabawi et orientation vers Al-Rawdha.' },
                    { title: 'Baqi\' & repères de prière', description: 'Visite du cimetière du Baqi\', emplacement pour suivre le cortège funéraire et limite à ne pas dépasser pour la prière.' },
                    { title: 'Musée & restauration', description: 'Découverte du Musée et indications des meilleurs endroits pour aller se restaurer.' },
                ],
            };
        }

        return {
            sectionTag: 'Accompagnement sur place',
            intensity: 'Parcours spirituel',
            duration: 'Demi-journée à journée',
            location: 'Médine & Makkah',
            highlights: [
                'Visites légiférées avec contexte historique',
                'Accompagnement humain et rassurant',
                'Rythme adapté à votre groupe',
            ],
            steps: [
                { title: 'Briefing', description: 'Le guide prépare le parcours selon votre date, lieu et profil de visite.' },
                { title: 'Départ', description: 'Prise en charge et démarrage avec rappel des objectifs de la visite.' },
                { title: 'Immersion', description: 'Découverte des sites avec explications claires et références fiables.' },
                { title: 'Synthèse', description: 'Clôture de la visite avec récapitulatif et recommandations pratiques.' },
            ],
        };
    }, [service.id]);

    return (
        <View className="flex-1 bg-zinc-900">
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="light-content" />

            <ScrollView
                className="flex-1 bg-zinc-900"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 28 }}
            >
                <View className="h-[320px] relative">
                    <Image
                        source={service.image}
                        className="w-full h-full object-cover"
                    />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.2)', 'rgba(24,24,27,0.78)', '#18181b']}
                        locations={[0, 0.35, 0.78, 1]}
                        className="absolute inset-0"
                    />

                    <SafeAreaView className="absolute top-0 left-0 right-0 px-6 pt-2 flex-row justify-between items-center z-10">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="bg-black/30 p-2 rounded-full border border-white/20"
                        >
                            <ArrowLeft color="white" size={24} />
                        </TouchableOpacity>
                        <TouchableOpacity className="bg-black/30 p-2 rounded-full border border-white/20">
                            <Share2 color="white" size={20} />
                        </TouchableOpacity>
                    </SafeAreaView>
                </View>

                <Animated.View
                    style={{ opacity: fadeAnim, transform: [{ translateY: translateAnim }] }}
                    className="px-6 pt-7"
                >
                    <View className="mb-6 rounded-3xl border border-white/10 bg-zinc-800/75 px-6 py-6">
                        <View className="self-start rounded-full border border-[#d2b387]/45 bg-zinc-700/45 px-4 py-2 mb-4">
                            <Text className="text-[#f4dfbe] text-[11px] font-bold tracking-widest uppercase">
                                {serviceMeta.sectionTag}
                            </Text>
                        </View>
                        <Text className="text-[#f6dfbf] text-xs mb-2 font-bold tracking-widest uppercase">
                            {service.title}
                        </Text>
                        <Text className="text-white text-4xl font-serif font-bold leading-tight">
                            {service.titleArabic}
                        </Text>
                        <Text className="text-zinc-300 text-sm leading-6 mt-3">
                            {service.shortDescription}
                        </Text>
                    </View>

                    <Text className="text-zinc-100 text-xl leading-8 font-light mb-6">
                        {service.mainText}
                    </Text>

                    <View className="mb-8 rounded-3xl border border-white/10 bg-zinc-800/70 px-6 py-6">
                        <Text className="text-white text-lg font-semibold mb-3">Ce que vous allez vivre</Text>
                        <Text className="text-zinc-300 text-[15px] leading-7">
                            {service.details}
                        </Text>
                    </View>

                    <View className="mb-8">
                        <Text className="text-white text-lg font-semibold mb-4">Points forts du service</Text>
                        <View className="gap-3">
                            {serviceMeta.highlights.map((highlight, index) => (
                                <View key={highlight} className="flex-row items-start rounded-2xl border border-white/10 bg-zinc-800/55 px-5 py-4">
                                    <View className="mt-0.5 mr-3 w-6 h-6 rounded-full bg-[#b39164]/20 items-center justify-center">
                                        <Text className="text-[#f6dfbf] text-xs font-bold">{index + 1}</Text>
                                    </View>
                                    <Text className="text-zinc-200 text-sm leading-6 flex-1">{highlight}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    <View className="mb-8">
                        <Text className="text-white text-lg font-semibold mb-4">Parcours du service</Text>
                        <View className="gap-3">
                            {serviceMeta.steps.map((step, index) => (
                                <View key={step.title} className="rounded-2xl border border-white/10 bg-zinc-800/55 px-5 py-4">
                                    <View className="flex-row items-center mb-2">
                                        <View className="w-6 h-6 rounded-full bg-[#b39164]/20 items-center justify-center mr-2">
                                            <Text className="text-[#f6dfbf] text-xs font-bold">{index + 1}</Text>
                                        </View>
                                        <Text className="text-white font-semibold">{step.title}</Text>
                                    </View>
                                    <Text className="text-zinc-300 text-sm leading-6">{step.description}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {service.hadiths ? (
                        <View>
                            <View className="flex-row items-center justify-between mb-4">
                                <View className="flex-row items-center gap-2">
                                    <Award size={16} color="#f2d7b1" />
                                    <Text className="text-[#f2d7b1] text-xs font-bold uppercase tracking-widest">
                                        {service.id === 'visite-masjid-nabawi'
                                            ? 'Hadiths sur le Masjid Nabawi'
                                            : service.id === 'visite-guidee'
                                                ? 'Hadiths sur Médine'
                                                : 'Hadiths sur Makkah'}
                                    </Text>
                                </View>
                                <Text className="text-zinc-500 text-xs">
                                    {hadithIndex + 1} / {service.hadiths.length}
                                </Text>
                            </View>

                            <ScrollView
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                decelerationRate="fast"
                                onMomentumScrollEnd={(e) => {
                                    const index = Math.round(e.nativeEvent.contentOffset.x / cardWidth);
                                    setHadithIndex(index);
                                }}
                            >
                                {service.hadiths.map((h) => (
                                    <View
                                        key={h.number}
                                        style={{ width: cardWidth }}
                                        className="rounded-3xl border border-[#b39164]/20 bg-zinc-800/70 px-6 py-6 mr-0"
                                    >
                                        <View className="flex-row items-center mb-4 gap-3">
                                            <View className="w-7 h-7 rounded-full bg-[#b39164]/20 items-center justify-center">
                                                <Text className="text-[#f6dfbf] text-xs font-bold">{h.number}</Text>
                                            </View>
                                            <Text className="text-[#f2d7b1] text-sm font-semibold flex-1">{h.title}</Text>
                                        </View>
                                        <Text className="text-zinc-200 text-lg leading-9 font-serif text-right mb-4" style={{ writingDirection: 'rtl' }}>
                                            {h.arabic}
                                        </Text>
                                        <Text className="text-zinc-300 text-sm leading-6 italic mb-3">
                                            {h.text}
                                        </Text>
                                        <Text className="text-[#b39164] text-xs font-medium">
                                            {h.source}
                                        </Text>
                                    </View>
                                ))}
                            </ScrollView>

                            <View className="flex-row justify-center items-center gap-1.5 mt-4">
                                {service.hadiths.map((_, i) => (
                                    <View
                                        key={i}
                                        style={{
                                            width: i === hadithIndex ? 16 : 6,
                                            height: 6,
                                            borderRadius: 3,
                                            backgroundColor: i === hadithIndex ? '#b39164' : '#52525b',
                                        }}
                                    />
                                ))}
                            </View>
                        </View>
                    ) : service.hadith ? (
                        <View className="rounded-3xl border border-[#b39164]/20 bg-zinc-800/70 px-6 py-6">
                            <View className="flex-row items-center mb-4">
                                <Award size={16} color="#f2d7b1" />
                                <Text className="text-[#f2d7b1] text-xs font-bold uppercase tracking-widest ml-2">
                                    Référence spirituelle
                                </Text>
                            </View>
                            <Text className="text-zinc-100 text-lg leading-8 font-serif italic">
                                {service.hadith}
                            </Text>
                        </View>
                    ) : null}
                </Animated.View>
            </ScrollView>
        </View>
    );
}
