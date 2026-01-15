import { Link } from 'expo-router';
import { Calendar, MapPin } from 'lucide-react-native';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

interface ServiceGridCardProps {
    service: any; // Using any for simplicity or define interface
}

export function ServiceGridCard({ service }: ServiceGridCardProps) {
    const formattedDate = service.startDate
        ? new Date(service.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + (service.endDate ? ' - ' + new Date(service.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '')
        : 'Date à définir';

    return (
        <Link href={{
            pathname: '/guide/[id]',
            params: {
                id: service.guideId,
                servicePrice: service.price,
                serviceLocation: service.location,
                serviceImage: service.image?.uri
            }
        }} asChild>
            <TouchableOpacity className="w-[48%] bg-white dark:bg-zinc-800 rounded-2xl mb-4 shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
                {/* Image / Placeholder */}
                <View className="h-32 bg-gray-200 dark:bg-zinc-700 relative">
                    {service.image ? (
                        <Image source={service.image} className="w-full h-full" resizeMode="cover" />
                    ) : (
                        <View className="w-full h-full items-center justify-center bg-[#b39164]/20">
                            <Text className="text-[#b39164] font-serif text-3xl opacity-50">{service.category?.charAt(0) || 'S'}</Text>
                        </View>
                    )}

                    <View className="absolute top-2 right-2 bg-white/90 dark:bg-zinc-900/90 py-1 px-2 rounded-lg">
                        <Text className="text-xs font-bold text-gray-900 dark:text-white">{service.price ? `${service.price} SAR` : 'Sur devis'}</Text>
                    </View>
                </View>

                {/* Content */}
                <View className="p-3">
                    {/* Category */}
                    <Text className="text-[#b39164] text-xs font-bold uppercase mb-1">{service.category}</Text>

                    {/* Title */}
                    <Text className="text-gray-900 dark:text-white font-bold text-sm mb-1" numberOfLines={2}>
                        {service.title}
                    </Text>

                    {/* Guide Info */}
                    <View className="flex-row items-center mt-2 mb-2">
                        <Image
                            source={service.guideAvatar ? { uri: service.guideAvatar } : require('@/assets/images/profil.jpeg')}
                            className="w-5 h-5 rounded-full mr-2"
                        />
                        <Text className="text-gray-500 dark:text-gray-400 text-xs flex-1" numberOfLines={1}>
                            {service.guideName}
                        </Text>
                    </View>

                    <View className="flex-row items-center border-t border-gray-100 dark:border-white/5 pt-2 mt-1">
                        <MapPin size={12} color="white" style={{ marginRight: 4 }} />
                        <Text className="text-gray-400 text-xs flex-1" numberOfLines={1}>{service.location}</Text>
                    </View>

                    {service.startDate && (
                        <View className="flex-row items-center mt-1">
                            <Calendar size={12} color="white" style={{ marginRight: 4 }} />
                            <Text className="text-gray-400 text-xs flex-1" numberOfLines={1}>{formattedDate}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        </Link>
    );
}
