import { Link } from 'expo-router';
import { Calendar, MapPin } from 'lucide-react-native';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { resolveProfileAvatarSource } from '@/lib/avatar';
import { formatEUR } from '@/lib/pricing';

interface ServiceGridCardProps {
    service: any; // Using any for simplicity or define interface
    highlighted?: boolean;
}

export function ServiceGridCard({ service, highlighted = false }: ServiceGridCardProps) {
    const formattedDate = service.startDate
        ? new Date(service.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + (service.endDate ? ' - ' + new Date(service.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '')
        : 'Date à définir';

    return (
        <Link href={{
            pathname: '/guide/[id]',
            params: {
                id: service.guideId,
                servicePrice: service.price,
                serviceGuideNetPrice: service.guideNetBasePriceEur,
                serviceLocation: service.location,
                serviceTitle: service.title,
                startDate: service.selectedStartDate,
                endDate: service.selectedEndDate,
                serviceId: service.id // Add this
            }
        }} asChild>
            <TouchableOpacity className={`${highlighted ? 'w-full rounded-3xl' : 'w-[48%] rounded-2xl'} bg-white dark:bg-zinc-800 mb-4 shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden`}>
                {/* Image / Placeholder */}
                <View className={`${highlighted ? 'h-40' : 'h-32'} bg-gray-200 dark:bg-zinc-700 relative`}>
                    {service.image ? (
                        <Image source={service.image} className="w-full h-full" resizeMode="cover" />
                    ) : (
                        <View className="w-full h-full items-center justify-center bg-[#b39164]/20">
                            <Text className="text-[#b39164] font-serif text-3xl opacity-50">{service.category?.charAt(0) || 'S'}</Text>
                        </View>
                    )}

                    <View className="absolute top-2 right-2 bg-white/90 dark:bg-zinc-900/90 py-1 px-2 rounded-lg">
                        <Text className="text-xs font-bold text-gray-900 dark:text-white">{service.price ? formatEUR(Number(service.price)) : 'Sur devis'}</Text>
                    </View>
                </View>

                {/* Content */}
                <View className={highlighted ? 'p-5' : 'p-3'}>
                    {/* Category */}
                    <Text className="text-[#b39164] text-xs font-bold uppercase mb-1">{service.category}</Text>

                    {/* Title */}
                    <Text className={`text-gray-900 dark:text-white font-bold mb-1 ${highlighted ? 'text-xl' : 'text-sm'}`} numberOfLines={2}>
                        {service.title}
                    </Text>

                    {!!service.description && (
                        <Text className={`text-gray-500 dark:text-gray-400 mb-2 ${highlighted ? 'text-sm leading-5' : 'text-[11px] leading-4'}`} numberOfLines={highlighted ? 4 : 3}>
                            {service.description}
                        </Text>
                    )}

                    {/* Guide Info */}
                    <View className="flex-row items-center mt-1 mb-2">
                        <Image
                            source={resolveProfileAvatarSource(service.guideAvatar)}
                            className={`${highlighted ? 'w-8 h-8' : 'w-5 h-5'} rounded-full mr-2`}
                        />
                        <Text className={`text-gray-700 dark:text-gray-200 flex-1 ${highlighted ? 'text-base font-semibold' : 'text-xs'}`} numberOfLines={1}>
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
