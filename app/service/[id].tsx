import { SERVICES } from '@/constants/data';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Share2 } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Image, ScrollView, Share, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type HadithEntry = {
    title?: string;
    arabic: string;
    translation?: string;
    source: string;
};

export default function ServiceDetailsScreen() {
    const { t } = useTranslation('content');
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const service = SERVICES.find(s => s.id === id) || SERVICES[0];
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateAnim = useRef(new Animated.Value(24)).current;
    const [hadithIndex, setHadithIndex] = useState(0);
    const hadithFadeAnim = useRef(new Animated.Value(1)).current;

    const handleShare = async () => {
        try {
            const siteLink = 'https://nefsy.fr';
            const text = `${service.title}\n\n${service.shortDescription}\n\n${service.description}\n\nDécouvrez l'application Nefsy : ${siteLink}`;
            await Share.share({ message: text, title: service.title });
        } catch {}
    };

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
        if (service.id === 'deuxieme-omra') {
            return {
                sectionTag: 'Accompagnement sur place',
                intensity: 'Parcours spirituel',
                duration: 'Demi-journée à journée',
                location: 'La Mecque',
                highlights: [
                    'Accompagnement conforme aux rites pour votre 2ème Omra',
                    'Guides qualifiés et bienveillants à vos côtés',
                    'Rythme adapté à votre groupe',
                ],
                steps: [
                    { title: 'Briefing', description: 'Le guide prépare le parcours selon votre date et votre profil pour votre deuxième Omra.' },
                    { title: 'Départ', description: 'Prise en charge et démarrage avec rappel des objectifs et des étapes de la Omra.' },
                    { title: 'Immersion', description: 'Accomplissement des rites avec explications claires et références fiables.' },
                    { title: 'Clôture', description: 'Fin de la Omra avec récapitulatif et accompagnement jusqu\'à la fin du rite.' },
                ],
            };
        }

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
                    { title: 'Validation', description: 'Nous confirmons la demande et le profil du guide chargé de la Omra Badal.' },
                    { title: 'Début du rite', description: 'Vous recevez une confirmation visuelle à l’entrée en état de sacralisation.' },
                    { title: 'Réalisation', description: 'La Omra est effectuée avec sérieux en respectant les rites prescrits.' },
                    { title: 'Clôture', description: 'Un retour final vous est transmis pour valider l’achèvement du service.' },
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

    const hadithGroup = useMemo((): 'makkahHadiths' | 'medinaHadiths' => {
        const makkahServices = ['omra-accompagne', 'deuxieme-omra', 'omra-badal', 'visite-guidee-makkah'];
        return makkahServices.includes(service.id) ? 'makkahHadiths' : 'medinaHadiths';
    }, [service.id]);

    const serviceHadiths = useMemo(
        () => t(hadithGroup, { returnObjects: true, defaultValue: [] }) as HadithEntry[],
        [hadithGroup, t]
    );

    useEffect(() => {
        setHadithIndex(0);
    }, [hadithGroup]);

    useEffect(() => {
        if (!serviceHadiths.length) return;
        const interval = setInterval(() => {
            Animated.timing(hadithFadeAnim, {
                toValue: 0,
                duration: 350,
                useNativeDriver: true,
            }).start(() => {
                setHadithIndex((prev) => (prev + 1) % serviceHadiths.length);
                Animated.timing(hadithFadeAnim, {
                    toValue: 1,
                    duration: 350,
                    useNativeDriver: true,
                }).start();
            });
        }, 7000);
        return () => clearInterval(interval);
    }, [hadithFadeAnim, serviceHadiths.length]);

    const currentHadith = serviceHadiths[hadithIndex] || serviceHadiths[0];

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
                    <View className="absolute inset-0 bg-black/15" />
                    <LinearGradient
                        colors={['transparent', '#18181b']}
                        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 180 }}
                    />

                    <SafeAreaView className="absolute top-0 left-0 right-0 px-6 pt-2 flex-row justify-between items-center z-10">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="bg-black/30 p-2 rounded-full border border-white/20"
                        >
                            <ArrowLeft color="white" size={24} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleShare} className="bg-black/30 p-2 rounded-full border border-white/20">
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

                    {currentHadith ? (
                        <View className="mb-2">
                            <Text className="text-white text-lg font-semibold mb-4">{t('hadithToday')}</Text>
                            <Animated.View
                                style={{ opacity: hadithFadeAnim }}
                                className="rounded-2xl border border-[#d2b387]/35 bg-zinc-800/65 px-5 py-4"
                            >
                                {currentHadith.title ? (
                                    <Text className="text-white text-base font-bold leading-6 mb-3">{currentHadith.title}</Text>
                                ) : null}
                                <Text className="text-[#f6dfbf] text-base leading-7 mb-3">{currentHadith.arabic}</Text>
                                {currentHadith.translation ? (
                                    <Text className="text-zinc-200 text-sm leading-6 mb-3">{currentHadith.translation}</Text>
                                ) : null}
                                <Text className="text-zinc-400 text-xs leading-5 mb-1">
                                    {t('authenticSource', { defaultValue: 'Source authentique' })}
                                </Text>
                                <Text className="text-zinc-300 text-xs leading-5">{currentHadith.source}</Text>
                            </Animated.View>
                        </View>
                    ) : null}

                </Animated.View>
            </ScrollView>
        </View>
    );
}
