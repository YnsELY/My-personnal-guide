import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { Briefcase, Check, Lock, Mail, User, UserCircle2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen() {
    const router = useRouter();
    const { signUp } = useAuth();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'pilgrim' | 'guide'>('pilgrim');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!email || !password || !fullName) {
            Alert.alert("Erreur", "Veuillez remplir tous les champs");
            return;
        }
        setLoading(true);
        try {
            await signUp(email, password, fullName, role);
            Alert.alert("Compte créé", "Veuillez vérifier votre email pour confirmer votre compte (si activé) ou connectez-vous.", [
                { text: "OK", onPress: () => router.replace('/(tabs)') }
            ]);
        } catch (e: any) {
            Alert.alert("Erreur d'inscription", e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-white dark:bg-zinc-900">
            <StatusBar barStyle="dark-content" />
            <SafeAreaView className="flex-1 px-6">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                    <ScrollView showsVerticalScrollIndicator={false}>

                        <View className="my-8">
                            <Text className="text-3xl font-bold font-serif text-gray-900 dark:text-white mb-2">Créer un compte</Text>
                            <Text className="text-gray-500">Rejoignez la communauté Guide Omra</Text>
                        </View>

                        {/* Role Selection */}
                        <Text className="text-gray-500 mb-3 font-medium">Vous êtes ?</Text>
                        <View className="flex-row gap-4 mb-8">
                            <TouchableOpacity
                                onPress={() => setRole('pilgrim')}
                                className={`flex-1 p-4 rounded-xl border-2 flex-row items-center justify-center gap-2 ${role === 'pilgrim' ? 'border-[#b39164] bg-[#b39164]/10' : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-800'}`}
                            >
                                <UserCircle2 size={24} color={role === 'pilgrim' ? '#b39164' : '#9CA3AF'} />
                                <Text className={`font-bold ${role === 'pilgrim' ? 'text-[#b39164]' : 'text-gray-500'}`}>Pèlerin</Text>
                                {role === 'pilgrim' && <View className="absolute top-2 right-2"><Check size={14} color="#b39164" /></View>}
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setRole('guide')}
                                className={`flex-1 p-4 rounded-xl border-2 flex-row items-center justify-center gap-2 ${role === 'guide' ? 'border-[#b39164] bg-[#b39164]/10' : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-800'}`}
                            >
                                <Briefcase size={24} color={role === 'guide' ? '#b39164' : '#9CA3AF'} />
                                <Text className={`font-bold ${role === 'guide' ? 'text-[#b39164]' : 'text-gray-500'}`}>Guide</Text>
                                {role === 'guide' && <View className="absolute top-2 right-2"><Check size={14} color="#b39164" /></View>}
                            </TouchableOpacity>
                        </View>

                        <View className="gap-5">
                            <View>
                                <Text className="text-gray-500 mb-2 font-medium">Nom complet</Text>
                                <View className="flex-row items-center bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3">
                                    <User size={20} color="#9CA3AF" />
                                    <TextInput
                                        className="flex-1 ml-3 text-gray-900 dark:text-white"
                                        placeholder="Votre nom"
                                        placeholderTextColor="#9CA3AF"
                                        value={fullName}
                                        onChangeText={setFullName}
                                    />
                                </View>
                            </View>

                            <View>
                                <Text className="text-gray-500 mb-2 font-medium">Email</Text>
                                <View className="flex-row items-center bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3">
                                    <Mail size={20} color="#9CA3AF" />
                                    <TextInput
                                        className="flex-1 ml-3 text-gray-900 dark:text-white"
                                        placeholder="exemple@email.com"
                                        placeholderTextColor="#9CA3AF"
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                    />
                                </View>
                            </View>

                            <View>
                                <Text className="text-gray-500 mb-2 font-medium">Mot de passe</Text>
                                <View className="flex-row items-center bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3">
                                    <Lock size={20} color="#9CA3AF" />
                                    <TextInput
                                        className="flex-1 ml-3 text-gray-900 dark:text-white"
                                        placeholder="••••••••"
                                        placeholderTextColor="#9CA3AF"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={handleRegister}
                                disabled={loading}
                                className="bg-[#b39164] py-4 rounded-xl items-center shadow-lg shadow-[#b39164]/20 mt-4 active:bg-[#a08055]"
                            >
                                <Text className="text-white font-bold text-lg">{loading ? 'Inscription...' : 'S\'inscrire'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => router.back()} className="mt-4 items-center mb-8">
                                <Text className="text-gray-500">Déjà un compte ? <Text className="text-[#b39164] font-bold">Se connecter</Text></Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
