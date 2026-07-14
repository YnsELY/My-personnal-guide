import { FilterModal, FilterState } from '@/components/FilterModal';
import { ServiceGridCard } from '@/components/ServiceGridCard';
import { CATEGORIES } from '@/constants/data';
import { useLanguage } from '@/context/LanguageContext';
import { directionStyle, endSpacing, rowStyle, textStart } from '@/lib/rtl';
import { getCurrentProfile, getServices } from '@/lib/api'; // Changed import
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Accessibility, Calendar, Car, Heart, Map as MapIcon, Search as SearchIcon, SlidersHorizontal, Users, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const iconMap: { [key: string]: any } = {
  'heart': Heart,
  'map': MapIcon,
  'car': Car,
  'accessibility': Accessibility,
  'users': Users
};

export default function SearchScreen() {
  const { t } = useTranslation('booking');
  const { language, isRTL } = useLanguage();
  const router = useRouter();
  const { startDate, endDate, serviceType, serviceLabel } = useLocalSearchParams();
  const selectedStartDate = Array.isArray(startDate) ? startDate[0] : startDate;
  const selectedEndDate = Array.isArray(endDate) ? endDate[0] : endDate;
  const selectedServiceType = Array.isArray(serviceType) ? serviceType[0] : serviceType;
  const selectedServiceLabel = Array.isArray(serviceLabel) ? serviceLabel[0] : serviceLabel;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Advanced Filters State
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<FilterState>({
    languages: [],
    city: null,
    people: 1,
  });

  const [services, setServices] = useState<any[]>([]);
  const [currentProfile, setCurrentProfile] = useState<any | null>(null);
  const reserveServiceCards = [
    {
      id: 'omra-badal',
      title: 'Omra Badel',
      subtitle: 'Par procuration',
      description: 'Choisissez un créneau, puis sélectionnez un guide disponible pour votre Omra Badal.',
      serviceType: 'omra-badal',
      accent: ['#7f5539', '#b08968'] as const,
    },
    {
      id: 'visite-medine',
      title: 'Visite de Médine',
      subtitle: 'Sites historiques et rappels',
      description: 'Réservez une visite à Médine selon vos dates, avec les guides disponibles.',
      serviceType: 'visite-medine',
      accent: ['#0f766e', '#14b8a6'] as const,
    },
    {
      id: 'visite-makkah',
      title: 'Visite de Makkah',
      subtitle: 'Lieux marquants de Makkah',
      description: 'Consultez les créneaux ouverts puis choisissez le guide adapté à votre visite.',
      serviceType: 'visite-makkah',
      accent: ['#1d4ed8', '#60a5fa'] as const,
    },
    {
      id: 'visite-masjid-nabawi',
      title: 'Visite du Masgid Nabawi',
      subtitle: 'Visite légiférée',
      description: 'Sélectionnez une date et trouvez un guide disponible pour le Masgid Nabawi.',
      serviceType: 'visite-masjid-nabawi',
      accent: ['#047857', '#34d399'] as const,
    },
    {
      id: 'omra',
      title: 'Omra',
      subtitle: 'Seul, en couple, famille ou amies',
      description: 'Choisissez votre date, puis réservez un guide pour accomplir votre Omra.',
      serviceType: 'omra',
      accent: ['#9333ea', '#c084fc'] as const,
    },
  ];

  React.useEffect(() => {
    Promise.all([getServices(), getCurrentProfile()])
      .then(([serviceRows, profile]) => {
        setServices(serviceRows);
        setCurrentProfile(profile);
      })
      .catch(console.error);
  }, []);

  const openServicePlanning = (serviceTypeValue: string, serviceLabelValue: string) => {
    router.push({
      pathname: '/date-select',
      params: {
        serviceType: serviceTypeValue,
        serviceLabel: serviceLabelValue,
      },
    });
  };

  const normalizeText = (value?: string | null) => {
    return (value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/Ã©|ã©/g, 'e');
  };

  const serviceMatchesType = (service: any) => {
    if (!selectedServiceType) return true;

    const searchable = normalizeText(`${service.title || ''} ${service.category || ''} ${service.description || ''}`);
    const location = normalizeText(service.location);

    switch (selectedServiceType) {
      case 'omra-badal':
        return searchable.includes('badal');
      case 'visite-medine':
        return searchable.includes('visite') && (location.includes('medine') || location.includes('medina'));
      case 'visite-makkah':
        return searchable.includes('visite') && (location.includes('makkah') || location.includes('mecque') || location.includes('mecca'));
      case 'visite-masjid-nabawi':
        return searchable.includes('masjid nabawi') || searchable.includes('masgid nabawi');
      case 'omra':
        return searchable.includes('omra') && !searchable.includes('badal');
      default:
        return true;
    }
  };

  // Filter Logic
  const filteredServices = services.filter((service) => {
    // 1. Text Search
    const matchesSearch = service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.guideName.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Service Category (Pills)
    const matchesCategory = selectedCategory
      ? service.category === CATEGORIES.find(c => c.id === selectedCategory)?.name
      : true;

    // 3. Advanced Filters
    // City
    const matchesCity = advancedFilters.city ? service.location.toLowerCase().includes(advancedFilters.city === 'La Mecque' ? 'mecque' : 'médine') : true;

    // Language (Does service have language? Or check guide? Service doesn't have language column generally, but maybe implicitly via guide)
    // For now, ignoring language filter or assuming guide languages (which we didn't fetch in simplified getServices? 
    // Actually getServices joins profiles but not guides table where languages are...
    // Let's comment out language filter for now or assume true to avoid crash if field missing)
    const matchesLanguage = true;

    // 4. Date Filter - Strict Inclusion
    // User selects a range: [userStart, userEnd]
    // Service available: [serviceStart, serviceEnd]
    // Condition: serviceStart <= userStart AND serviceEnd >= userEnd
    let matchesDate = true;
    if (startDate && endDate) {
      const userStart = new Date(Number(startDate));
      const userEnd = new Date(Number(endDate));
      userStart.setHours(0, 0, 0, 0);
      userEnd.setHours(23, 59, 59, 999); // Compare end of day

      if (service.startDate && service.endDate) {
        const serviceStart = new Date(service.startDate);
        const serviceEnd = new Date(service.endDate);
        serviceStart.setHours(0, 0, 0, 0);
        serviceEnd.setHours(23, 59, 59, 999);

        matchesDate = serviceStart <= userStart && serviceEnd >= userEnd;
      } else {
        // If service has no dates, assume available or strictly hide?
        // Usually, availability is mandatory. Hiding is safer based on "The service must be available".
        matchesDate = false;
      }
    }

    return matchesSearch && matchesCategory && matchesCity && matchesLanguage && matchesDate && serviceMatchesType(service);
  });

  const visibleServices = filteredServices
    .filter((service) => {
      if (currentProfile?.role === 'pilgrim' && currentProfile?.gender === 'male') {
        return service.guideGender !== 'female';
      }
      return true;
    })
    .sort((a, b) => {
      if (currentProfile?.gender === 'female') {
        const aFemaleGuide = a.guideGender === 'female';
        const bFemaleGuide = b.guideGender === 'female';
        if (aFemaleGuide && !bFemaleGuide) return -1;
        if (!aFemaleGuide && bFemaleGuide) return 1;
      }
      return 0;
    });

  // Date Formatting Helper
  const formatDateDisplay = () => {
    if (!startDate || !endDate) return null;

    const start = new Date(Number(startDate));
    const end = new Date(Number(endDate));
    const locale = language === 'ar' ? 'ar-SA' : 'fr-FR';

    // Check if valid dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      // Fallback for legacy simple numbers if necessary (or just return raw)
      return t('dateRangeFromTo', { start: startDate, end: endDate });
    }

    if (startDate === endDate) {
      return t('dateRangeOn', { date: start.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) });
    }

    return t('dateRangeFromTo', {
      start: start.toLocaleDateString(locale, { day: 'numeric' }),
      end: end.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
    });
  };

  const formattedDateRange = formatDateDisplay();

  if (!selectedStartDate && !selectedEndDate) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-zinc-900" style={directionStyle(isRTL)}>
        <StatusBar barStyle="default" />
        <SafeAreaView className="flex-1" edges={['top']}>
          <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120, paddingTop: 12 }}>
            <Text className="text-gray-900 dark:text-white text-3xl font-bold mb-2" style={textStart(isRTL)}>
              Réserver
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 text-base leading-6 mb-6" style={textStart(isRTL)}>
              Choisissez un service, puis votre créneau.
            </Text>

            {reserveServiceCards.map((card) => (
              <TouchableOpacity
                key={card.id}
                className="mb-4 rounded-3xl overflow-hidden"
                activeOpacity={0.9}
                onPress={() => openServicePlanning(card.serviceType, card.title)}
                style={{ shadowColor: card.accent[0], shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 14, elevation: 4 }}
              >
                <LinearGradient
                  colors={card.accent}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ paddingHorizontal: 20, paddingVertical: 22 }}
                >
                  <View className="flex-row items-center justify-between" style={rowStyle(isRTL)}>
                    <View className="flex-1 pr-4">
                      <Text className="text-white text-3xl font-bold" style={textStart(isRTL)}>
                        {card.title}
                      </Text>
                      <Text className="text-white/90 text-base font-semibold mt-1" style={textStart(isRTL)}>
                        {card.subtitle}
                      </Text>
                      <Text className="text-white/80 text-sm leading-5 mt-3" style={textStart(isRTL)}>
                        {card.description}
                      </Text>
                    </View>
                    <View className="w-12 h-12 rounded-full bg-white/18 items-center justify-center">
                      <Calendar color="white" size={24} />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-zinc-900" style={directionStyle(isRTL)}>
      <StatusBar barStyle="default" />
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-6 pb-2">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-6" style={textStart(isRTL)}>{t('tabs:explore')}</Text>

          {/* Date Range Pill */}
          {formattedDateRange && (
            <TouchableOpacity
              className="flex-row items-center justify-center bg-[#b39164] py-2 px-4 rounded-full mb-6 self-center w-full"
              style={rowStyle(isRTL)}
              onPress={() => router.push({
                pathname: '/date-select',
                params: {
                  startDate,
                  endDate,
                  ...(selectedServiceType ? { serviceType: selectedServiceType } : {}),
                  ...(selectedServiceLabel ? { serviceLabel: selectedServiceLabel } : {}),
                },
              })}
            >
              <Calendar color="white" size={18} className="mr-3" />
              <Text className="text-white font-medium text-sm" style={textStart(isRTL)}>
                {formattedDateRange}
              </Text>
            </TouchableOpacity>
          )}

          {!!selectedServiceLabel && (
            <View className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-white/10 rounded-2xl p-4 mb-4">
              <Text className="text-[#b39164] text-xs font-bold uppercase tracking-widest mb-1" style={textStart(isRTL)}>
                Service sélectionné
              </Text>
              <Text className="text-gray-900 dark:text-white text-2xl font-bold" style={textStart(isRTL)}>
                {selectedServiceLabel}
              </Text>
            </View>
          )}

          {/* Search Input */}
          <View className="gap-3 mb-4" style={rowStyle(isRTL)}>
            <View className="flex-1 bg-white dark:bg-zinc-800 rounded-xl flex-row items-center px-4 py-3 border border-gray-200 dark:border-white/10 shadow-sm" style={rowStyle(isRTL)}>
              <SearchIcon size={20} color="white" />
              <TextInput
                className="flex-1 text-gray-900 dark:text-white font-medium h-full"
                placeholder={t('searchPlaceholder')}
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[endSpacing(12, isRTL), textStart(isRTL)]}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={16} className="text-gray-400" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              className="bg-primary/10 rounded-xl w-14 items-center justify-center border border-primary/20"
              onPress={() => setFilterModalVisible(true)}
            >
              <SlidersHorizontal size={24} color="#b39164" />
            </TouchableOpacity>
          </View>

          {/* Category Filters */}
          <View className="mb-2">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 24 }}>
              <TouchableOpacity
                onPress={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full border ${!selectedCategory ? 'bg-primary border-primary' : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-white/10'}`}
              >
                <Text className={`font-medium ${!selectedCategory ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>{t('common:all')}</Text>
              </TouchableOpacity>
              {CATEGORIES.map((cat) => {
                const IconComponent = iconMap[cat.icon];
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                    className={`px-4 py-2 rounded-full border flex-row items-center ${selectedCategory === cat.id ? 'bg-primary border-primary' : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-white/10'}`}
                    style={rowStyle(isRTL)}
                  >
                    {IconComponent && <IconComponent size={16} color={selectedCategory === cat.id ? 'white' : '#4B5563'} style={endSpacing(8, isRTL)} />}
                    <Text className={`font-medium ${selectedCategory === cat.id ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>{cat.name}</Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>
        </View>

        {/* Results */}
        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}>
          <View className="flex-row justify-between items-center mb-4" style={rowStyle(isRTL)}>
            <Text className="text-gray-900 dark:text-white font-bold text-2xl" style={textStart(isRTL)}>
              {selectedServiceLabel ? 'Guides disponibles' : t('results')}
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 text-base font-semibold" style={textStart(isRTL)}>{t('servicesFound', { count: visibleServices.length })}</Text>
          </View>

          <View className="flex-row flex-wrap justify-between">
            {visibleServices.length > 0 ? (
              visibleServices.map((service) => (
                <ServiceGridCard
                  key={service.id}
                  service={{
                    ...service,
                    selectedStartDate,
                    selectedEndDate,
                  }}
                  highlighted={!!selectedServiceType}
                />
              ))
            ) : (
              <View className="w-full items-center py-10 opacity-60">
                <SearchIcon size={48} color="white" style={{ marginBottom: 16 }} />
                <Text className="text-gray-500 text-center" style={textStart(isRTL)}>{t('noServicesMatch')}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      <FilterModal
        visible={isFilterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={(filters) => {
          setAdvancedFilters(filters);
          setFilterModalVisible(false);
        }}
        initialFilters={advancedFilters}
      />
    </View>
  );
}
