import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { omraGuideTranslations } from '@/constants/omraGuideTranslations';
import { useLanguage } from '@/context/LanguageContext';
import { textStart } from '@/lib/rtl';

const GOLD = '#b39164';
const GOLD_LIGHT = '#d4b896';
const GOLD_DARK = '#7a6143';

type Step = {
  id: number;
  number: string;
  icon: string;
  title: string;
  subtitle: string;
  content: Section[];
};

type Section = {
  type: 'intro' | 'arabic' | 'transliteration' | 'translation' | 'note' | 'list';
  text?: string;
  items?: string[];
};









function StepCard({ step }: { step: Step }) {
  const { language, isRTL } = useLanguage();
  const t = omraGuideTranslations[language as keyof typeof omraGuideTranslations] || omraGuideTranslations.fr;
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.95}
      className="mb-4 rounded-3xl overflow-hidden border border-gray-100 dark:border-white/8"
      style={{ backgroundColor: expanded ? '#fff' : '#fff', shadowColor: '#b39164', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 }}
    >
      {/* Card Header */}
      <LinearGradient
        colors={expanded ? [GOLD, GOLD_DARK] : ['#fafaf9', '#f5f0ea']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ paddingHorizontal: 18, paddingVertical: 16 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: expanded ? 'rgba(255,255,255,0.18)' : 'rgba(179,145,100,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 14, flexShrink: 0 }}>
              <Text style={{ fontSize: 22 }}>{step.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 2, color: expanded ? 'rgba(255,255,255,0.6)' : GOLD, textTransform: 'uppercase', marginBottom: 3 }}>
                {t.step} {step.number}
              </Text>
              <Text style={{ fontSize: 17, fontWeight: '700', color: expanded ? '#fff' : '#1a1a1a', letterSpacing: -0.3 }}>
                {step.title}
              </Text>
              <Text style={{ fontSize: 12, color: expanded ? 'rgba(255,255,255,0.7)' : '#888', marginTop: 3 }}>
                {step.subtitle}
              </Text>
            </View>
          </View>
          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: expanded ? 'rgba(255,255,255,0.2)' : 'rgba(179,145,100,0.12)', alignItems: 'center', justifyContent: 'center', marginLeft: 10, flexShrink: 0 }}>
            {expanded
              ? <ChevronUp size={16} color="#fff" />
              : <ChevronDown size={16} color={GOLD} />
            }
          </View>
        </View>
      </LinearGradient>

      {/* Card Body */}
      {expanded && (
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, backgroundColor: '#fff' }}>
          {step.content.map((section, i) => (
            <ContentSection key={i} section={section} />
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

function ContentSection({ section }: { section: Section }) {
  const { language, isRTL } = useLanguage();
  const t = omraGuideTranslations[language as keyof typeof omraGuideTranslations] || omraGuideTranslations.fr;
  if (section.type === 'arabic') {
    return (
      <View style={{ marginVertical: 12, paddingVertical: 18, paddingHorizontal: 18, borderRadius: 16, backgroundColor: '#fdf8f2', borderLeftWidth: 3, borderLeftColor: GOLD }}>
        <Text style={{ fontSize: 24, lineHeight: 44, color: GOLD_DARK, fontWeight: '500', textAlign: 'right', writingDirection: 'rtl' }}>
          {section.text}
        </Text>
      </View>
    );
  }

  if (section.type === 'transliteration') {
    return (
      <View style={{ marginBottom: 6, paddingHorizontal: 4 }}>
        <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: GOLD, textTransform: 'uppercase', marginBottom: 5 }}>{t.transliteration}</Text>
        <Text style={{ fontSize: 14, fontStyle: 'italic', color: '#4a4a4a', lineHeight: 23 }}>
          {section.text}
        </Text>
      </View>
    );
  }

  if (section.type === 'translation') {
    return (
      <View style={{ marginBottom: 14, marginTop: 6, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, backgroundColor: '#f2f2f2' }}>
        <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: '#999', textTransform: 'uppercase', marginBottom: 6 }}>{t.translation}</Text>
        <Text style={{ fontSize: 14, color: '#333', lineHeight: 23, fontStyle: 'italic' }}>
          {section.text}
        </Text>
      </View>
    );
  }

  if (section.type === 'note') {
    return (
      <View style={{ flexDirection: 'row', marginVertical: 10, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, backgroundColor: '#fffbf0', borderWidth: 1, borderColor: '#f0e4c8' }}>
        <Text style={{ fontSize: 15, marginRight: 10, marginTop: 1 }}>💡</Text>
        <Text style={{ flex: 1, fontSize: 13, color: '#7a6143', lineHeight: 21 }}>{section.text}</Text>
      </View>
    );
  }

  if (section.type === 'list' && section.items) {
    return (
      <View style={{ marginVertical: 8, paddingHorizontal: 4 }}>
        {section.items.map((item, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
            <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: GOLD, marginTop: 8, marginRight: 12, flexShrink: 0 }} />
            <Text style={{ flex: 1, fontSize: 14, color: '#333', lineHeight: 23 }}>{item}</Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <Text style={{ fontSize: 14, color: '#555', lineHeight: 23, marginVertical: 5, paddingHorizontal: 4 }}>
      {section.text}
    </Text>
  );
}

function SummaryCard({ data, color }: { data: { title: string, subtitle: string, items: string[] }; color: string }) {
  return (
    <View style={{ marginBottom: 16, borderRadius: 24, overflow: 'hidden' }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14, backgroundColor: color }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>{data.title}</Text>
        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>{data.subtitle}</Text>
      </View>
      {/* Body */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 18, backgroundColor: '#2a2318' }}>
        {data.items.map((item, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: i < data.items.length - 1 ? 14 : 0 }}>
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: color, alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 1, flexShrink: 0 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>{i + 1}</Text>
            </View>
            <Text style={{ flex: 1, fontSize: 13.5, color: '#fff', lineHeight: 22 }}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function OmraGuideScreen() {
  const router = useRouter();
  const { language, isRTL } = useLanguage();
  const t = omraGuideTranslations[language as keyof typeof omraGuideTranslations] || omraGuideTranslations.fr;
  const steps = t.steps as Step[];

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />

      {/* Hero Header */}
      <LinearGradient colors={[GOLD_DARK, GOLD, '#c8a87a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingBottom: 32 }}>
        <SafeAreaView edges={['top']}>
          <View className="px-5 pt-2">
            <TouchableOpacity onPress={() => router.back()} className="flex-row items-center mb-6" activeOpacity={0.7}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowLeft size={18} color="#fff" />
              </View>
            </TouchableOpacity>

            <View className="items-center pb-2">
              <Text style={{ fontSize: 52, marginBottom: 4 }}>🕋</Text>
              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 4, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', marginBottom: 6 }}>
                {t.tag}
              </Text>
              <Text style={{ fontSize: 30, fontWeight: '800', color: '#fff', textAlign: 'center', letterSpacing: -0.5, lineHeight: 36 }}>
                {t.title}
              </Text>
              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: 8, lineHeight: 20, paddingHorizontal: 20 }}>
                {t.subtitle}
              </Text>

              {/* Step count pill */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}>
                <CheckCircle size={14} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13, marginLeft: 6 }}>{t.stepsCount}</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingTop: 20 }}>
        {/* Intro quote */}
        <View className="mb-6 mx-1 py-4 px-5 rounded-2xl" style={{ backgroundColor: '#fffbf4', borderWidth: 1, borderColor: '#e8d9c0' }}>
          <Text style={{ fontSize: 20, textAlign: 'center', marginBottom: 8 }}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
          <Text style={{ fontSize: 13, color: '#7a6143', textAlign: 'center', fontStyle: 'italic', lineHeight: 20 }}>
            {t.introQuote}
          </Text>
        </View>

        {/* Steps */}
        <Text style={{ fontSize: 13, fontWeight: '700', letterSpacing: 2, color: GOLD, textTransform: 'uppercase', marginBottom: 12, marginLeft: 4 }}>
          {t.stepsTitle}
        </Text>
        {steps.map((step) => (
          <StepCard key={step.id} step={step} />
        ))}

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: '#e8d9c0', marginVertical: 24, marginHorizontal: 8 }} />

        {/* Summary Section */}
        <Text style={{ fontSize: 13, fontWeight: '700', letterSpacing: 2, color: GOLD, textTransform: 'uppercase', marginBottom: 12, marginLeft: 4 }}>
          {t.summaryTitle}
        </Text>
        <SummaryCard data={t.pillarsData} color={GOLD} />
        <SummaryCard data={t.obligatoryData} color="#e67e22" />
        <SummaryCard data={t.sunnasData} color="#27ae60" />

        {/* Footer */}
        <View className="items-center mt-6 mb-10">
          <Text style={{ fontSize: 22, marginBottom: 6 }}>🤲</Text>
          <Text style={{ fontSize: 13, color: '#aaa', textAlign: 'center', lineHeight: 20 }}>
            {t.footerText}
          </Text>
          <Text style={{ fontSize: 15, color: GOLD, fontWeight: '600', marginTop: 8, textAlign: 'center' }}>
            آمين يا رب العالمين
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
