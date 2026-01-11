import { FilterModal, FilterState } from '@/components/FilterModal';
import { GuideGridCard } from '@/components/GuideGridCard';
import { CATEGORIES, GUIDES } from '@/constants/data';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Accessibility, Calendar, Car, Heart, Map as MapIcon, Search as SearchIcon, SlidersHorizontal, Users, X } from 'lucide-react-native';
import React, { useState } from 'react';
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
  const router = useRouter();
  const { startDate, endDate } = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Advanced Filters State
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<FilterState>({
    languages: [],
    city: null,
    priceRange: null,
    people: 1,
  });

  // Filter Logic
  const filteredGuides = GUIDES.filter((guide) => {
    // 1. Text Search
    const matchesSearch = guide.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.location.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Service Category (Pills)
    const matchesCategory = selectedCategory
      ? (guide.role.includes(CATEGORIES.find(c => c.id === selectedCategory)?.name || '') ||
        guide.bio.includes(CATEGORIES.find(c => c.id === selectedCategory)?.name || ''))
      : true;

    // 3. Advanced Filters (Modal)
    // City
    const matchesCity = advancedFilters.city ? guide.location.toLowerCase() === (advancedFilters.city === 'La Mecque' ? 'mecca' : 'medina') : true;

    // Language (OR logic: if guide has ANY of the selected languages)
    const matchesLanguage = advancedFilters.languages.length > 0
      ? guide.languages.some(lang => advancedFilters.languages.includes(
        lang === 'French' ? 'Français' :
          lang === 'English' ? 'Anglais' :
            lang === 'Arabic' ? 'Arabe' : lang
      ))
      : true;


    // Price (Simple heuristic for demo)
    // < 200 = Eco, 200-400 = Standard, > 400 = Premium
    const priceVal = parseInt(guide.price.replace(/\D/g, '')) || 0;
    let priceCategory = 'standard';
    if (priceVal < 200) priceCategory = 'budget';
    else if (priceVal >= 400) priceCategory = 'premium';

    const matchesPrice = advancedFilters.priceRange ? priceCategory === advancedFilters.priceRange : true;

    return matchesSearch && matchesCategory && matchesCity && matchesLanguage && matchesPrice;
  });

  return (
    <View className="flex-1 bg-gray-50 dark:bg-zinc-900">
      <StatusBar barStyle="default" />
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-6 pb-2">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Explorer</Text>

          {/* Date Range Pill */}
          {startDate && endDate && (
            <TouchableOpacity
              className="flex-row items-center justify-center bg-[#b39164] py-2 px-4 rounded-full mb-6 self-center w-full"
              onPress={() => router.push({ pathname: '/date-select', params: { startDate, endDate } })}
            >
              <Calendar color="white" size={18} className="mr-3" />
              <Text className="text-white font-medium text-sm">
                Du {startDate} au {endDate} janvier 2026
              </Text>
            </TouchableOpacity>
          )}

          {/* Search Input */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-white dark:bg-zinc-800 rounded-xl flex-row items-center px-4 py-3 border border-gray-200 dark:border-white/10 shadow-sm">
              <SearchIcon size={20} className="text-gray-400 dark:text-white" />
              <TextInput
                className="flex-1 ml-3 text-gray-900 dark:text-white font-medium h-full"
                placeholder="Nom, langue, ville..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
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
                <Text className={`font-medium ${!selectedCategory ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>Tous</Text>
              </TouchableOpacity>
              {CATEGORIES.map((cat) => {
                const IconComponent = iconMap[cat.icon];
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                    className={`px-4 py-2 rounded-full border flex-row items-center ${selectedCategory === cat.id ? 'bg-primary border-primary' : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-white/10'}`}
                  >
                    {IconComponent && <IconComponent size={16} color={selectedCategory === cat.id ? 'white' : '#4B5563'} style={{ marginRight: 8 }} />}
                    <Text className={`font-medium ${selectedCategory === cat.id ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>{cat.name}</Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>
        </View>

        {/* Results */}
        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}>
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-gray-900 dark:text-white font-bold text-lg">Résultats</Text>
            <Text className="text-gray-500 dark:text-gray-400 text-sm">{filteredGuides.length} guides trouvés</Text>
          </View>

          <View className="flex-row flex-wrap justify-between">
            {filteredGuides.length > 0 ? (
              filteredGuides.map((guide) => (
                <GuideGridCard
                  key={guide.id}
                  guide={guide}
                  startDate={startDate ? Number(startDate) : undefined}
                  endDate={endDate ? Number(endDate) : undefined}
                />
              ))
            ) : (
              <View className="w-full items-center py-10 opacity-60">
                <SearchIcon size={48} className="text-gray-300 mb-4" />
                <Text className="text-gray-500 text-center">Aucun guide ne correspond à votre recherche.</Text>
              </View>
            )}
            {/* Duplicate for demo grid visual if needed */}
            {filteredGuides.length > 0 && filteredGuides.map((guide) => (
              <GuideGridCard key={`demo-${guide.id}`} guide={{ ...guide, id: `demo-${guide.id}` }} />
            ))}
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
