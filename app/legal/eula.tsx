import { Stack, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CGVU_TEXT = `CONDITIONS GENERALES DE VENTE ET D'UTILISATION (CGVU)

Article 1 - Identification de la societe
Raison sociale : SMHRJU
Siege social : 78 Avenue des Champs Elysees, 75008 Paris, France
Numero d'immatriculation : 100957091
Objet : Plateforme de mise en relation entre pelerins et guides pour l'organisation de prestations religieuses (Omra, visites guidees, Omra Badal).

Article 2 - Documents Contractuels
L'utilisation de l'application et la souscription a une prestation impliquent l'acceptation sans reserve des presentes CGVU ainsi que des documents suivants, disponibles en consultation permanente dans l'application :
- La Charte du Pelerin.
- Le Reglement des Guides Religieux.
- Le Code de Conduite et Regles Operationnelles des Guides.

Article 3 - Description du Service
L'application permet aux pelerins de reserver des prestations de guidage a Makkah et Medine, incluant l'accompagnement religieux, les visites historiques et la realisation de l'Omra Badal.

Article 4 - Engagements des Parties

Engagements du Pelerin :
Le pelerin s'engage a fournir des informations exactes, a respecter les horaires, les consignes de securite et les principes ethiques de l'Islam.

Engagements du Guide :
Le guide s'engage a une mission d'interet general fondee sur le Coran et la Sounna. Il a l'obligation de porter son gilet officiel pour identification et de respecter une ponctualite stricte.

Article 5 - Dispositions specifiques aux prestations

Omra Badal :
Le guide a l'obligation de realiser et transmettre deux videos (entree en ihram et fin de mission) pour attester de l'accomplissement.

Prise en charge :
Si l'hotel est a moins de 500m du Masjid Al-Haram, le guide s'y rend directement. Au-dela, un point de rendez-vous est fixe d'un commun accord.

Article 6 - Prix et Modalites de Paiement
Les prix sont indiques dans l'application au moment de la reservation. Le paiement s'effectue exclusivement en ligne via une plateforme securisee externe. Aucune donnee bancaire n'est stockee par l'application. La validation du paiement vaut acceptation de la mission par le guide et des presentes conditions par le pelerin.

Article 7 - Responsabilite
Le pelerin demeure responsable de ses effets personnels, de son etat de sante et du respect des lois locales.
Le guide est responsable de l'execution fidele de sa mission (Amanah) devant les pelerins et devant Allah.
La societe SMHRJU agit en tant qu'intermediaire et ne saurait etre tenue responsable en cas de force majeure ou de fait imputable a l'utilisateur.

Article 8 - Propriete Intellectuelle
L'ensemble des contenus de l'application (logos, interfaces, textes) est la propriete exclusive de SMHRJU. Toute reproduction ou pret de compte utilisateur/guide est strictement interdit.

Article 9 - Droit applicable et Litiges
Les presentes CGVU sont soumises au droit francais. Tout litige relatif a leur interpretation ou execution releve de la competence des tribunaux de Paris.

Contact : support@nefsy.app`;

export default function EulaScreen() {
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
                    <Text className="text-gray-900 dark:text-white font-bold text-lg">CGVU</Text>
                </View>

                <ScrollView className="flex-1 px-6 py-5" contentContainerStyle={{ paddingBottom: 40 }}>
                    <Text className="text-gray-700 dark:text-gray-300 leading-7">{CGVU_TEXT}</Text>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
