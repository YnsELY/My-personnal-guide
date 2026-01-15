import { useAuth } from '@/context/AuthContext';
import { Link, useRouter } from 'expo-router';
import { Lock, Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
    const router = useRouter();
    const { signIn } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Erreur", "Veuillez remplir tous les champs");
            return;
        }
        setLoading(true);
        try {
            await signIn(email, password);
            router.replace('/(tabs)');
        } catch (e: any) {
            Alert.alert("Erreur de connexion", e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-white dark:bg-zinc-900">
            <StatusBar barStyle="light-content" />

            {/* Background / Header Image */}
            <View className="h-1/3 w-full bg-zinc-900 relative">
                <Image
                    source={require('@/assets/images/mecca.jpg')}
                    className="w-full h-full opacity-30"
                />
                <View className="absolute inset-0 bg-gradient-to-b from-transparent to-white dark:to-zinc-900" />
                <View className="absolute bottom-10 left-6">
                    <Text className="text-white text-4xl font-bold font-serif">Bienvenue</Text>
                    <Text className="text-gray-300 text-lg">Connectez-vous pour continuer</Text>
                </View>
            </View>

            <View className="flex-1 px-6 -mt-8 bg-white dark:bg-zinc-900 rounded-t-3xl pt-8">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                    <ScrollView showsVerticalScrollIndicator={false}>

                        <View className="gap-5">
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
                                onPress={handleLogin}
                                disabled={loading}
                                className="bg-[#b39164] py-4 rounded-xl items-center shadow-lg shadow-[#b39164]/20 mt-4 active:bg-[#a08055]"
                            >
                                <Text className="text-white font-bold text-lg">{loading ? 'Connexion...' : 'Se connecter'}</Text>
                            </TouchableOpacity>

                            <View className="flex-row justify-center mt-4">
                                <Text className="text-gray-500">Pas encore de compte ? </Text>
                                <Link href="/(auth)/register" asChild>
                                    <TouchableOpacity>
                                        <Text className="text-[#b39164] font-bold">S'inscrire</Text>
                                    </TouchableOpacity>
                                </Link>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </View>
    );
}
