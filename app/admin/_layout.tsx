import { useLanguage } from '@/context/LanguageContext';
import { Stack } from 'expo-router';
import React from 'react';

export default function AdminLayout() {
    useLanguage();

    return <Stack screenOptions={{ headerShown: false }} />;
}
