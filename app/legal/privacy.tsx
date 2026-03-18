import { Stack, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PRIVACY_TEXT = `POLITIQUE DE CONFIDENTIALITE (NORME RGPD)

La protection de vos donnees est une priorite. Nous traitons vos informations conformement au Reglement General sur la Protection des Donnees (RGPD).

Collecte et Utilisation des donnees

Donnees d'inscription :
Nous collectons vos informations d'identite et documents necessaires a l'organisation de la mission.

Sante :
Le pelerin est responsable de signaler toute information medicale importante pour sa propre securite durant le parcours.

Organisation des rencontres et Logistique :
Aucune donnee de geolocalisation en temps reel (GPS) n'est collectee par l'application. Les lieux de rendez-vous et de prise en charge sont convenus de gre a gre entre le pelerin et le guide via la messagerie securisee. Le pelerin fournit les informations logistiques necessaires (nom de l'hotel, numero de chambre pour les personnes a mobilite reduite) pour permettre la prestation.

Medias et Preuves :
Pour les prestations de Omra Badal, des fichiers multimedias (videos et photos) sont collectes et transmis pour attester de la realisation des rites conformement aux engagements du guide.

Partage des donnees :
Pour le bon deroulement de la mission, les informations necessaires (nom, besoins specifiques, medias de preuve) sont partagees exclusivement entre le pelerin et le guide concerne. Aucune donnee n'est vendue a des tiers commerciaux.

Messagerie Interne et Confidentialite

Acces :
La messagerie entre le pelerin et le guide est activee uniquement apres la validation du paiement du service.

Usage :
Les echanges doivent se limiter exclusivement au cadre de la mission spirituelle et logistique.

Conservation :
Conformement au principe de minimisation du RGPD, les messages ne sont pas conserves de maniere permanente. Ils sont supprimes de nos serveurs actifs apres la cloture de la mission, sauf necessite de traitement d'un litige.

Ethique :
Il est strictement interdit aux guides d'utiliser cette messagerie pour detourner la clientele ou proposer des services prives hors plateforme.

Securite et Droits des utilisateurs

Protection :
Aucune donnee bancaire n'est stockee par l'application, les transactions etant traitees par un prestataire de paiement externe securise.

Hebergement :
Vos donnees sont stockees sur des serveurs securises chez un hebergeur professionnel garantissant un haut niveau de protection et de confidentialite.

Droits :
Vous disposez d'un droit d'acces, de rectification et de suppression de vos donnees.

Suppression de compte :
Conformement aux exigences d'Apple et de Google, un bouton de suppression de compte est disponible dans les reglages de l'application, entrainant l'effacement definitif de vos donnees personnelles (hors obligations legales de conservation).

Responsabilite du Compte
L'utilisateur est seul responsable de la confidentialite de ses identifiants. Toute substitution, pret ou partage de compte est une violation grave de l'engagement de confiance (Amanah).

Contact : support@nefsy.app`;

export default function PrivacyScreen() {
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
                    <Text className="text-gray-900 dark:text-white font-bold text-lg">Politique de confidentialite</Text>
                </View>

                <ScrollView className="flex-1 px-6 py-5" contentContainerStyle={{ paddingBottom: 40 }}>
                    <Text className="text-gray-700 dark:text-gray-300 leading-7">{PRIVACY_TEXT}</Text>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
