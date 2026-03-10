import BookingModal from '@/components/BookingModal';
import { getServiceImageForLocation } from '@/constants/serviceLocationImages';
import { getGuideById, getPublicGuideServices, getReviews, getServiceById } from '@/lib/api';
import { formatEUR } from '@/lib/pricing';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Briefcase, ChevronRight, ShieldCheck, Star, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { Image, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GuideDetails() {
    const { id, startDate, endDate, servicePrice, serviceGuideNetPrice, serviceLocation, serviceTitle, serviceId } = useLocalSearchParams();
    const router = useRouter();
    const selectedStartDateParam = Array.isArray(startDate) ? startDate[0] : startDate;
    const selectedEndDateParam = Array.isArray(endDate) ? endDate[0] : endDate;
    const selectedServiceIdParam = Array.isArray(serviceId) ? serviceId[0] : serviceId;
    const selectedServiceTitleParam = Array.isArray(serviceTitle) ? serviceTitle[0] : serviceTitle;
    const selectedServiceLocationParam = Array.isArray(serviceLocation) ? serviceLocation[0] : serviceLocation;
    const selectedStartDateTs = selectedStartDateParam ? Number(selectedStartDateParam) : NaN;
    const selectedEndDateTs = selectedEndDateParam ? Number(selectedEndDateParam) : NaN;
    const selectedServicePrice = servicePrice ? Number(Array.isArray(servicePrice) ? servicePrice[0] : servicePrice) : NaN;
    const selectedServiceGuideNetPrice = serviceGuideNetPrice ? Number(Array.isArray(serviceGuideNetPrice) ? serviceGuideNetPrice[0] : serviceGuideNetPrice) : NaN;
    const isServicesListMode = !selectedServiceIdParam;

    const [guide, setGuide] = useState<any>(null);
    const [service, setService] = useState<any>(null);
    const [guideServices, setGuideServices] = useState<any[]>([]);
    const [isLoadingGuideServices, setIsLoadingGuideServices] = useState(false);
    const [reviews, setReviews] = useState<any[]>([]);
    const [reviewsLoaded, setReviewsLoaded] = useState(false);
    const [isBookingModalVisible, setBookingModalVisible] = useState(false);

    React.useEffect(() => {
        if (id) {
            getGuideById(id as string).then(setGuide).catch(e => console.error("Err Guide:", e));
            getReviews(id as string)
                .then(setReviews)
                .catch(e => console.error("Err Reviews:", e))
                .finally(() => setReviewsLoaded(true));
        }
    }, [id]);

    React.useEffect(() => {
        if (!id) return;

        if (selectedServiceIdParam) {
            setIsLoadingGuideServices(false);
            setGuideServices([]);
            getServiceById(selectedServiceIdParam as string)
                .then(setService)
                .catch((e) => {
                    console.error("Err Service:", e);
                    setService(null);
                });
            return;
        }

        setService(null);
        setIsLoadingGuideServices(true);
        getPublicGuideServices(id as string)
            .then(setGuideServices)
            .catch((e) => {
                console.error("Err Guide Services:", e);
                setGuideServices([]);
            })
            .finally(() => setIsLoadingGuideServices(false));
    }, [id, selectedServiceIdParam]);

    // Construct a fallback service object if specific service fetching failed but we have params
    // OR if we are just viewing a guide profile (no serviceId) but user wants to book??
    // User feedback implies we ARE on a service context.
    const activeService = service || (selectedServiceTitleParam ? {
        title: selectedServiceTitleParam,
        price: Number.isFinite(selectedServicePrice) ? selectedServicePrice : undefined,
        guideNetBasePriceEur: Number.isFinite(selectedServiceGuideNetPrice)
            ? selectedServiceGuideNetPrice
            : Number.isFinite(selectedServicePrice)
                ? selectedServicePrice
                : undefined,
        location: selectedServiceLocationParam,
        category: 'Omra accompagnée', // Fallback? Or try to deduce? Best to rely on serviceId fetch.
        meetingPoints: []
    } : null);
    const displayedServicePrice = Number.isFinite(Number(activeService?.price))
        ? Number(activeService?.price)
        : Number.isFinite(selectedServicePrice)
            ? selectedServicePrice
            : NaN;
    const heroLocation = (selectedServiceLocationParam || activeService?.location || guide?.location || '') as string;
    const fallbackStartDateTs = activeService?.startDate ? new Date(activeService.startDate).getTime() : undefined;
    const fallbackEndDateTs = activeService?.endDate ? new Date(activeService.endDate).getTime() : undefined;
    const modalStartDate = Number.isFinite(selectedStartDateTs) ? selectedStartDateTs : fallbackStartDateTs;
    const modalEndDate = Number.isFinite(selectedEndDateTs) ? selectedEndDateTs : fallbackEndDateTs;
    const computedReviewsCount = reviews.length;
    const computedAverageRatingRaw = computedReviewsCount > 0
        ? reviews.reduce((sum, review) => sum + Number(review?.rating || 0), 0) / computedReviewsCount
        : 0;
    const displayedReviewsCount = reviewsLoaded ? computedReviewsCount : Number(guide?.reviews || 0);
    const displayedAverageRating = reviewsLoaded
        ? computedAverageRatingRaw
        : Number(guide?.rating || 0);
    const formattedDisplayedAverageRating = Number.isFinite(displayedAverageRating)
        ? displayedAverageRating.toFixed(1)
        : '0.0';
    const handleSelectService = (serviceItem: any) => {
        if (!guide?.id || !serviceItem?.id) return;

        const nextParams: Record<string, any> = {
            id: guide.id,
            serviceId: serviceItem.id,
            serviceTitle: serviceItem.title,
            servicePrice: serviceItem.price,
            serviceGuideNetPrice: serviceItem.guideNetBasePriceEur,
            serviceLocation: serviceItem.location,
        };

        if (selectedStartDateParam) {
            nextParams.startDate = selectedStartDateParam;
        } else if (serviceItem?.startDate) {
            nextParams.startDate = new Date(serviceItem.startDate).getTime();
        }

        if (selectedEndDateParam) {
            nextParams.endDate = selectedEndDateParam;
        } else if (serviceItem?.endDate) {
            nextParams.endDate = new Date(serviceItem.endDate).getTime();
        }

        router.push({
            pathname: '/guide/[id]',
            params: nextParams,
        });
    };
    const formatServiceDateRange = (start?: string, end?: string) => {
        if (!start) return 'Date à définir';
        const startDateObject = new Date(start);
        if (Number.isNaN(startDateObject.getTime())) return 'Date à définir';

        const startLabel = startDateObject.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        if (!end) return startLabel;

        const endDateObject = new Date(end);
        if (Number.isNaN(endDateObject.getTime())) return startLabel;

        const endLabel = endDateObject.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        return `${startLabel} - ${endLabel}`;
    };

    if (!guide) {
        return (
            <View className="flex-1 bg-white items-center justify-center">
                <Text>Chargement...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white dark:bg-zinc-900">
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="default" />

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Header Image */}
                <View className="relative h-64">
                    <Image
                        source={getServiceImageForLocation(heroLocation)}
                        className="w-full h-full object-cover"
                    />
                    <View className="absolute inset-0 bg-black/30" />
                    <View className="absolute inset-0 bg-gradient-to-t from-gray-50 dark:from-zinc-900 to-transparent" />

                    <View className="absolute top-0 left-0 right-0 p-6 pt-12 flex-row justify-between">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="bg-black/30 p-2 rounded-full backdrop-blur-md border border-white/20"
                        >
                            <ArrowLeft color="white" size={24} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Content */}
                <View className="-mt-16 px-6 pb-32">
                    {/* Circle Avatar */}
                    <View className="flex-row justify-between items-end mb-4">
                        <View className="relative">
                            <Image
                                source={guide.image}
                                className="w-32 h-32 rounded-full border-4 border-white dark:border-zinc-900"
                            />
                            {guide.verified && (
                                <View className="absolute bottom-0 right-0 bg-white dark:bg-zinc-900 p-1.5 rounded-full">
                                    <ShieldCheck size={20} color="#b39164" fill="#b39164" />
                                </View>
                            )}
                        </View>

                        <View className="mb-2">
                            <View className="flex-row items-center bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
                                <Star size={14} color="#b39164" fill="#b39164" />
                                <Text className="text-primary font-bold ml-1.5">{formattedDisplayedAverageRating} ({displayedReviewsCount})</Text>
                            </View>
                        </View>
                    </View>

                    <View className="mb-6">
                        {/* Service Title */}
                        {selectedServiceTitleParam && <Text className="text-lg font-medium text-[#b39164] uppercase tracking-wide mb-1">{selectedServiceTitleParam}</Text>}
                        {/* Guide Name */}
                        <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{guide.name}</Text>
                        <Text className="text-gray-500 dark:text-gray-400 text-lg">{guide.role} • {selectedServiceLocationParam || guide.location}</Text>
                        {!isServicesListMode && !!activeService?.description && (
                            <Text className="text-gray-500 dark:text-gray-400 text-sm leading-6 mt-3">
                                {activeService.description}
                            </Text>
                        )}
                    </View>

                    {!isServicesListMode && Number.isFinite(displayedServicePrice) && (
                        <View className="flex-row items-center mb-6">
                            <Text className="text-3xl font-bold text-primary">
                                {formatEUR(displayedServicePrice)}
                            </Text>
                        </View>
                    )}

                    {isServicesListMode && (
                        <View className="mb-8">
                            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-3">Services actuellement disponibles</Text>
                            {isLoadingGuideServices ? (
                                <Text className="text-gray-500 dark:text-gray-400">Chargement des services...</Text>
                            ) : guideServices.length === 0 ? (
                                <Text className="text-gray-500 dark:text-gray-400">Ce guide n&apos;a pas encore de service actif.</Text>
                            ) : (
                                guideServices.map((serviceItem) => (
                                    <TouchableOpacity
                                        key={serviceItem.id}
                                        className="bg-white dark:bg-zinc-800 rounded-2xl p-4 mb-3 border border-gray-100 dark:border-white/5"
                                        activeOpacity={0.8}
                                        onPress={() => handleSelectService(serviceItem)}
                                    >
                                        <View className="flex-row items-start justify-between mb-2">
                                            <View className="flex-1 mr-3">
                                                <Text className="text-gray-900 dark:text-white font-bold text-base">{serviceItem.title}</Text>
                                                <Text className="text-[#b39164] text-xs font-semibold uppercase tracking-wide mt-1">{serviceItem.category}</Text>
                                            </View>
                                            <View className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                                                <Text className="text-primary text-xs font-bold">{formatEUR(Number(serviceItem.price || 0))}</Text>
                                            </View>
                                        </View>

                                        {!!serviceItem.description && (
                                            <Text className="text-gray-500 dark:text-gray-400 text-sm leading-5 mb-3" numberOfLines={3}>
                                                {serviceItem.description}
                                            </Text>
                                        )}

                                        <View className="flex-row items-center justify-between border-t border-gray-100 dark:border-white/5 pt-3">
                                            <View className="flex-1 mr-3">
                                                <Text className="text-gray-500 dark:text-gray-400 text-xs">
                                                    {serviceItem.location || 'Lieu non renseigné'}
                                                </Text>
                                                <Text className="text-gray-400 text-[11px] mt-1">
                                                    {formatServiceDateRange(serviceItem.startDate, serviceItem.endDate)}
                                                </Text>
                                            </View>
                                            <View className="flex-row items-center">
                                                <Text className="text-primary font-semibold text-xs mr-1">Réserver</Text>
                                                <ChevronRight size={14} color="#b39164" />
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>
                    )}

                    {/* Stats Row */}
                    <View className="flex-row items-center justify-between py-6 border-y border-gray-100 dark:border-white/5 mb-6 bg-gray-50 dark:bg-zinc-800/30 rounded-2xl px-4">
                        <View className="items-center flex-1 border-r border-gray-200 dark:border-white/5">
                            <View className="flex-row items-center">
                                <Star size={20} color="#b39164" fill="#b39164" />
                                <Text className="text-xl font-bold text-gray-900 dark:text-white ml-2">{formattedDisplayedAverageRating}</Text>
                            </View>
                            <Text className="text-gray-500 text-xs mt-1">Note</Text>
                        </View>

                        <View className="items-center flex-1 border-r border-gray-200 dark:border-white/5">
                            <Text className="text-xl font-bold text-gray-900 dark:text-white">{displayedReviewsCount}</Text>
                            <Text className="text-gray-500 text-xs mt-1">Avis</Text>
                        </View>

                        <View className="items-center flex-1">
                            <Text className="text-xl font-bold text-gray-900 dark:text-white">{selectedServiceLocationParam || guide.location}</Text>
                            <Text className="text-gray-500 text-xs mt-1">Lieu</Text>
                        </View>
                    </View>

                    <Text className="text-xl font-bold text-gray-900 dark:text-white mb-3">À propos du guide</Text>
                    <Text className="text-gray-500 dark:text-gray-400 leading-7 mb-8 text-base">
                        {guide.bio}
                    </Text>

                    {/* Profile Info Badges */}
                    <View className="flex-row flex-wrap gap-3 mb-8">
                        {guide.experience > 0 && (
                            <View className="bg-primary/10 px-4 py-2 rounded-full border border-primary/20 flex-row items-center">
                                <Briefcase size={16} color="#b39164" />
                                <Text className="text-primary font-bold ml-2">{guide.experience} ans d&apos;expérience</Text>
                            </View>
                        )}
                        {guide.age && (
                            <View className="bg-gray-100 dark:bg-zinc-800 px-4 py-2 rounded-full border border-gray-200 dark:border-white/5 flex-row items-center">
                                <Text className="text-gray-700 dark:text-gray-300 font-medium">{guide.age} ans</Text>
                            </View>
                        )}
                        {guide.gender && (
                            <View className="bg-gray-100 dark:bg-zinc-800 px-4 py-2 rounded-full border border-gray-200 dark:border-white/5 flex-row items-center">
                                <User size={16} color="#4B5563" />
                                <Text className="text-gray-700 dark:text-gray-300 font-medium ml-2 capitalize">
                                    {guide.gender === 'male' ? 'Homme' : 'Femme'}
                                </Text>
                            </View>
                        )}
                    </View>

                    <Text className="text-xl font-bold text-gray-900 dark:text-white mb-3">Langues parlées</Text>
                    <View className="flex-row flex-wrap gap-2 mb-6">
                        {guide.languages.map((lang: string, idx: number) => (
                            <View key={idx} className="bg-white dark:bg-zinc-800 px-5 py-3 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm">
                                <Text className="text-gray-600 dark:text-gray-300 font-medium">{lang}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Reviews List */}
                    <Text className="text-xl font-bold text-gray-900 dark:text-white mb-3 mt-4">Avis ({reviews.length})</Text>
                    <View className="mb-6">
                        {reviews.length === 0 && <Text className="text-gray-500 italic mb-4">Aucun avis pour le moment.</Text>}
                        {reviews.map((r, i) => (
                            <View key={i} className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-xl mb-3 border border-gray-100 dark:border-white/5">
                                <View className="flex-row justify-between mb-2">
                                    <View className="flex-row items-center gap-2">
                                        {r.avatar && <Image source={r.avatar} className="w-8 h-8 rounded-full" />}
                                        <Text className="font-bold text-gray-900 dark:text-white">{r.user}</Text>
                                    </View>
                                    <View className="flex-row gap-1 items-center bg-white dark:bg-zinc-900 px-2 py-1 rounded-full border border-gray-100 dark:border-white/5">
                                        <Star size={12} color="#b39164" fill="#b39164" />
                                        <Text className="text-xs font-bold text-gray-700 dark:text-gray-300">{r.rating}</Text>
                                    </View>
                                </View>
                                <Text className="text-gray-600 dark:text-gray-300 leading-5 text-sm">{r.comment}</Text>
                                <Text className="text-gray-400 text-xs mt-2 text-right">{r.date}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Add Review Section REMOVED */}
                </View>
            </ScrollView>

            {/* Bottom Action Bar */}
            {!isServicesListMode && activeService && (
                <View className="absolute bottom-0 left-0 right-0 bg-white/90 dark:bg-zinc-900/90 p-6 border-t border-gray-100 dark:border-white/5 backdrop-blur-xl">
                    <SafeAreaView edges={['bottom']} className="flex-row gap-4">
                        <TouchableOpacity
                            className="bg-primary flex-1 p-4 rounded-2xl items-center justify-center shadow-lg shadow-primary/20"
                            onPress={() => setBookingModalVisible(true)}
                        >
                            <Text className="text-white font-bold text-lg">Réserver maintenant</Text>
                        </TouchableOpacity>
                    </SafeAreaView>
                </View>
            )}

            {/* Booking Modal */}
            {!isServicesListMode && activeService && (
                <BookingModal
                    visible={isBookingModalVisible}
                    onClose={() => setBookingModalVisible(false)}
                    startDate={modalStartDate}
                    endDate={modalEndDate}
                    guideName={guide.name}
                    guideId={guide.id}
                    service={activeService}
                />
            )}
        </View>
    );
}
