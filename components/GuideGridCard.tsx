import { useRouter } from 'expo-router';
import { Heart, MapPin, Star } from 'lucide-react-native';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

interface GuideProps {
    id: string;
    name: string;
    role: string;
    rating: number;
    reviews: number;
    price: string;
    priceUnit: string;
    image: any;
    location: string;
}

export function GuideGridCard({ guide, startDate, endDate }: { guide: GuideProps, startDate?: number, endDate?: number }) {
    const router = useRouter();

    return (
        <TouchableOpacity
            className="bg-white dark:bg-zinc-800 rounded-3xl mb-4 border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm w-[48%]"
            onPress={() => router.push({ pathname: '/guide/[id]', params: { id: guide.id, startDate, endDate } })}
            activeOpacity={0.8}
        >
            {/* Image Section */}
            <View className="relative h-40 w-full bg-gray-200 dark:bg-zinc-700">
                <Image
                    source={guide.image}
                    className="w-full h-full object-cover"
                />

                {/* Favorite Button Overlay */}
                <TouchableOpacity className="absolute top-3 right-3 bg-white/20 backdrop-blur-md p-2 rounded-full">
                    <Heart size={18} color="white" />
                </TouchableOpacity>
            </View>

            {/* Content Section */}
            <View className="p-3">
                <View className="flex-row justify-between items-start mb-1">
                    <Text className="text-lg font-bold text-gray-900 dark:text-white flex-1 mr-1 numberOfLines={1}">{guide.name}</Text>
                    <View className="flex-row items-center">
                        <Star size={12} color="#b39164" fill="#b39164" />
                        <Text className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">{guide.rating}</Text>
                    </View>
                </View>

                <Text className="text-gray-500 dark:text-gray-400 text-xs mb-2" numberOfLines={1}>{guide.role}</Text>

                <View className="flex-row items-center justify-between mt-1">
                    <View className="flex-row items-center">
                        <MapPin size={12} className="text-gray-400" />
                        <Text className="text-gray-400 text-xs ml-0.5">{guide.location}</Text>
                    </View>
                    <Text className="text-primary font-bold text-sm">
                        {guide.price}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}
