import { SERVICES } from '@/constants/data';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Share2 } from 'lucide-react-native';
import React from 'react';
import { Image, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ServiceDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const service = SERVICES.find(s => s.id === id) || SERVICES[0];

    return (
        <View className="flex-1 bg-zinc-900">
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="light-content" />

            <ScrollView className="flex-1 bg-zinc-900" showsVerticalScrollIndicator={false}>

                {/* Hero Header */}
                <View className="h-[600px] relative">
                    <Image
                        source={service.image}
                        className="w-full h-full object-cover opacity-90"
                    />
                    {/* Seamless Gradient Fade */}
                    <LinearGradient
                        colors={['transparent', 'transparent', 'rgba(24, 24, 27, 0.6)', '#18181b', '#18181b']}
                        locations={[0, 0.4, 0.7, 0.9, 1]}
                        className="absolute inset-0"
                    />

                    {/* Header Actions */}
                    <SafeAreaView className="absolute top-0 left-0 right-0 px-6 pt-2 flex-row justify-between items-center z-10">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="bg-black/20 backdrop-blur-md p-2 rounded-full"
                        >
                            <ArrowLeft color="white" size={24} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="bg-black/20 backdrop-blur-md p-2 rounded-full"
                        >
                            <Share2 color="white" size={20} />
                        </TouchableOpacity>
                    </SafeAreaView>

                    {/* Title Content Overlay - Positioned in the fade */}
                    <View className="absolute bottom-12 px-6 w-full">
                        <Text className="text-[#b39164] text-sm mb-3 font-bold tracking-widest uppercase">
                            {service.title}
                        </Text>
                        <Text className="text-white text-4xl font-serif font-bold mb-4 text-left leading-tight">
                            {service.titleArabic}
                        </Text>
                    </View>
                </View>

                {/* Main Content - Starts after the fade */}
                <View className="px-6 pb-32 -mt-4">

                    <Text className="text-gray-200 text-lg leading-7 font-light mb-10">
                        {service.mainText}
                    </Text>

                    {/* Introduction Paragraph */}
                    <Text className="text-gray-300 text-lg leading-8 mb-10 font-light">
                        <Text className="font-bold text-white text-xl">Vous avez l'intention d'accomplir la Omra ?</Text>
                        {'\n\n'}
                        {service.details}
                    </Text>

                    {/* Hadith / Quote Card */}
                    <View className="items-center my-6 bg-zinc-800/50 p-6 rounded-2xl border border-[#b39164]/20 shadow-sm">
                        <View className="w-10 h-10 bg-[#b39164]/20 rounded-full items-center justify-center mb-4">
                            <Text className="text-[#b39164] text-xl font-serif">❝</Text>
                        </View>

                        <Text className="text-gray-100 text-center text-lg italic leading-8 font-serif">
                            {service.hadith}
                        </Text>
                    </View>

                </View>
            </ScrollView>

            {/* Bottom Floating Action */}
            <View className="absolute bottom-8 left-6 right-6">
                <TouchableOpacity
                    className="bg-[#b39164] py-4 rounded-full items-center shadow-lg shadow-[#b39164]/20 flex-row justify-center"
                    onPress={() => router.push('/date-select')}
                >
                    <Text className="text-white font-bold text-lg mr-2">Réserver ce service</Text>
                </TouchableOpacity>
            </View>

        </View>
    );
}
