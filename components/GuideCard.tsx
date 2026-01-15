import { useRouter } from 'expo-router';
import { MapPin, Star } from 'lucide-react-native';
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
    image: any; // Changed from string to any to support require()
    location: string;
}

export function GuideCard({ guide }: { guide: GuideProps }) {
    const router = useRouter();

    return (
        <TouchableOpacity
            className="bg-white dark:bg-zinc-800 rounded-2xl p-4 mb-4 border border-gray-100 dark:border-white/5 flex-row shadow-sm"
            onPress={() => router.push(`/guide/${guide.id}`)}
            activeOpacity={0.7}
        >
            <Image
                source={guide.image}
                className="w-24 h-24 rounded-xl bg-gray-200 dark:bg-gray-700"
            />
            <View className="flex-1 ml-4 justify-between">
                <View>
                    <View className="flex-row justify-between items-start">
                        <Text className="text-lg font-bold text-gray-900 dark:text-white flex-1 mr-2">{guide.name}</Text>
                        <View className="flex-row items-center bg-primary/10 px-2 py-1 rounded-lg">
                            <Star size={12} color="#b39164" fill="#b39164" />
                            <Text className="text-xs font-bold text-primary ml-1">{guide.rating}</Text>
                        </View>
                    </View>
                    <Text className="text-gray-500 dark:text-gray-400 text-sm">{guide.role}</Text>
                </View>

                <View className="flex-row items-center mt-2">
                    <MapPin size={14} color="white" />
                    <Text className="text-gray-400 text-xs ml-1">{guide.location}</Text>
                </View>

                <View className="flex-row justify-between items-end mt-2">
                    <Text className="text-primary font-bold text-lg">
                        {guide.price}
                        <Text className="text-gray-500 dark:text-gray-400 text-xs font-normal">{guide.priceUnit}</Text>
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}
