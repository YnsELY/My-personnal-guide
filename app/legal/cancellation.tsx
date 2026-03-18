import { Stack, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CANCELLATION_TEXT = `POLITIQUE D'ANNULATION ET DE REMBOURSEMENT

Cette politique s'applique a toute prestation reservee via l'application. L'achat d'une prestation vaut acceptation sans reserve de ces conditions.

Delais et Frais applicables

Annulation anticipee (plus de 48h avant) :
Toute prestation peut etre annulee sans frais jusqu'a 48 heures avant son debut, ouvrant droit a un remboursement integral.

Annulation tardive (moins de 48h avant) :
Pour toute annulation effectuee moins de 48 heures avant la prestation, une retenue de 25% de la somme totale est appliquee. Ces frais correspondent a la gestion, la reservation et l'organisation deja engagees.

Modalites de demande

Procedure :
Les demandes d'annulation doivent imperativement etre formulees par ecrit via le canal officiel de communication de l'application.

Absences :
En cas d'absence du pelerin ou de retard injustifie, aucun remboursement ne sera accorde, la prestation etant consideree comme engagee.

Cas de force majeure
En cas d'evenement exceptionnel (maladie grave justifiee, decision administrative ou evenement imprevisible), chaque situation sera etudiee avec equite et bienveillance par nos services.

Contact : support@nefsy.app`;

export default function CancellationScreen() {
    const router = useRouter();

    return (
        <View className="flex-1 bg-white dark:bg-zinc-900">
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="light-content" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-white/5">
                    <TouchableOpacity onPress={() => router.back()} className="mr-3">
                        <ArrowLeft size={24} className="text-gray-900 dark:text-white" />
                    </TouchableOpacity>
                    <Text className="text-gray-900 dark:text-white font-bold text-lg">Politique d'annulation</Text>
                </View>

                <ScrollView className="flex-1 px-6 py-5" contentContainerStyle={{ paddingBottom: 40 }}>
                    <Text className="text-gray-700 dark:text-gray-300 leading-7">{CANCELLATION_TEXT}</Text>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
