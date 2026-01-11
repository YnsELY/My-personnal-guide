import { GuideCard } from '@/components/GuideCard';
import { GUIDES } from '@/constants/data';
import { Search as SearchIcon, SlidersHorizontal } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SearchScreen() {
  return (
    <View className="flex-1 bg-gray-50 dark:bg-zinc-900">
      <StatusBar barStyle="default" />
      <SafeAreaView className="flex-1 p-6" edges={['top']}>
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Rechercher</Text>

        {/* Search Input */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-white dark:bg-zinc-800 rounded-xl flex-row items-center px-4 py-3 border border-gray-200 dark:border-white/10 shadow-sm">
            <SearchIcon size={20} className="text-gray-400 dark:text-white" />
            <TextInput
              className="flex-1 ml-3 text-gray-900 dark:text-white font-medium h-full"
              placeholder="Nom, langue, localisation..."
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <TouchableOpacity className="bg-primary/10 rounded-xl w-14 items-center justify-center border border-primary/20">
            <SlidersHorizontal size={24} color="#B48E2D" />
          </TouchableOpacity>
        </View>

        {/* Results */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          <Text className="text-gray-500 dark:text-gray-400 font-medium mb-4">{GUIDES.length} guides trouvés</Text>
          {GUIDES.map((guide) => (
            <GuideCard key={guide.id} guide={guide} />
          ))}
          {/* Duplicate for demo scroll */}
          {GUIDES.map((guide) => (
            <GuideCard key={`demo-${guide.id}`} guide={{ ...guide, id: `demo-${guide.id}` }} />
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
