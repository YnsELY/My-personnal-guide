import { useAuth } from '@/context/AuthContext';
import { useReservations } from '@/context/ReservationsContext';
import { Redirect } from 'expo-router';
import { Check, Clock, MapPin, User, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, ScrollView, StatusBar, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GuideDashboardScreen() {
    const { profile, isLoading: authLoading } = useAuth();
    const { getReservationsByRole, updateReservationStatus, isLoading: dataLoading } = useReservations();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [activeTab, setActiveTab] = useState<'visits' | 'requests'>('visits');

    if (authLoading || dataLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-zinc-900">
                <Text className="text-gray-500">Chargement...</Text>
            </View>
        );
    }

    // If not a guide, redirect (safety measure, though tab shouldn't be visible)
    if (profile?.role !== 'guide') {
        return <Redirect href="/" />;
    }

    // Get reservations for current guide
    const guideReservations = getReservationsByRole('guide', profile?.id || '1');
    const requests = guideReservations.filter(r => r.status === 'pending');
    const visits = guideReservations.filter(r => r.status === 'confirmed');


    const handleAccept = (id: string, name: string) => {
        Alert.alert(
            "Accepter la demande",
            `Voulez-vous accepter la demande de ${name} ?`,
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Accepter",
                    onPress: () => {
                        updateReservationStatus(id, 'confirmed');
                        Alert.alert("Succès", "Demande acceptée avec succès.");
                    }
                }
            ]
        );
    };

    const handleRefuse = (id: string, name: string) => {
        Alert.alert(
            "Refuser la demande",
            `Voulez-vous refuser la demande de ${name} ?`,
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Refuser",
                    style: "destructive",
                    onPress: () => {
                        updateReservationStatus(id, 'cancelled');
                    }
                }
            ]
        );
    };

    return (
        <View className="flex-1 bg-gray-50 dark:bg-zinc-900">
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-6 pt-4 pb-4 border-b border-gray-100 dark:border-white/5 flex-row justify-between items-start">
                    <View>
                        <Text className="text-2xl font-serif font-medium text-gray-900 dark:text-white">
                            Espace Guide
                        </Text>
                        <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            {activeTab === 'visits' ? 'Vos prochaines visites' : 'Vos demandes en cours'}
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => setActiveTab(prev => prev === 'visits' ? 'requests' : 'visits')}
                        className="bg-[#b39164]/10 px-4 py-2 rounded-full border border-[#b39164]/20"
                    >
                        <Text className="text-[#b39164] font-medium text-xs">
                            {activeTab === 'visits' ? 'Voir Demandes' : 'Voir Visites'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>

                    {/* Upcoming Visits Section */}
                    {activeTab === 'visits' && (
                        <>
                            <View className="gap-3 mb-8">
                                {visits.length === 0 ? (
                                    <View className="items-center justify-center py-8 bg-white dark:bg-zinc-800 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700">
                                        <Text className="text-gray-400 text-sm">Aucune visite prévue pour le moment.</Text>
                                    </View>
                                ) : (
                                    visits.map((visit) => (
                                        <View key={visit.id} className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5 flex-row items-center justify-between">
                                            <View className="flex-row items-center flex-1">
                                                <View className="bg-green-500/10 p-3 rounded-full mr-3">
                                                    <User color="#22c55e" size={20} />
                                                </View>
                                                <View className="flex-1">
                                                    <Text className="text-gray-900 dark:text-white font-medium">{visit.pilgrimName}</Text>
                                                    <Text className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{visit.serviceName} • {visit.date}</Text>
                                                    <View className="flex-row items-center mt-1">
                                                        <MapPin size={10} color="#9CA3AF" />
                                                        <Text className="text-gray-400 text-[10px] ml-1">{visit.location || 'Lieu à définir'}</Text>
                                                    </View>
                                                </View>
                                            </View>
                                            <View className="items-end">
                                                <Text className="text-gray-900 dark:text-white font-bold">{visit.time}</Text>
                                                <View className="bg-green-500/20 px-2 py-0.5 rounded-full mt-1">
                                                    <Text className="text-green-600 text-[10px] font-medium">Confirmé</Text>
                                                </View>
                                            </View>
                                        </View>
                                    ))
                                )}
                            </View>
                        </>
                    )}

                    {/* Requests Management Section */}
                    {activeTab === 'requests' && (
                        <>
                            {requests.length === 0 ? (
                                <View className="items-center justify-center py-8 bg-white dark:bg-zinc-800 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700">
                                    <Text className="text-gray-400 text-sm">Aucune demande en attente</Text>
                                </View>
                            ) : (
                                <View className="gap-3 mb-24">
                                    {requests.map((req) => (
                                        <View key={req.id} className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
                                            <View className="flex-row items-center justify-between mb-3">
                                                <View className="flex-row items-center flex-1">
                                                    <View className="bg-[#b39164]/10 p-3 rounded-full mr-3">
                                                        <Clock color="#b39164" size={20} />
                                                    </View>
                                                    <View className="flex-1">
                                                        <Text className="text-gray-900 dark:text-white font-medium">{req.pilgrimName}</Text>
                                                        <Text className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{req.serviceName}</Text>
                                                        <Text className="text-gray-500 dark:text-gray-400 text-xs">{req.date} à {req.time}</Text>
                                                    </View>
                                                </View>
                                                <View className="items-end">
                                                    <Text className="text-[#b39164] font-bold text-lg">{req.price}</Text>
                                                </View>
                                            </View>

                                            <View className="flex-row gap-3 mt-1">
                                                <TouchableOpacity
                                                    className="flex-1 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 py-3 rounded-lg flex-row items-center justify-center"
                                                    onPress={() => handleRefuse(req.id, req.pilgrimName)}
                                                >
                                                    <X size={16} color="#ef4444" className="mr-2" />
                                                    <Text className="text-red-500 font-medium text-sm">Refuser</Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    className="flex-1 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 py-3 rounded-lg flex-row items-center justify-center"
                                                    onPress={() => handleAccept(req.id, req.pilgrimName)}
                                                >
                                                    <Check size={16} color="#22c55e" className="mr-2" />
                                                    <Text className="text-green-600 font-medium text-sm">Accepter</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </>
                    )}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
