import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

const steps: Step[] = [
  {
    id: 1,
    number: '01',
    icon: '🕋',
    title: "L'Intention",
    subtitle: "Niyya & entrée en état de sacralisation",
    content: [
      { type: 'intro', text: "Vous vous apprêtez à accomplir votre Omra et à répondre à l'invitation d'Allah. Mettez l'intention et entrez en état de sacralisation avec les paroles :" },
      { type: 'arabic', text: 'لَبَّيْكَ اللَّهُمَّ عُمْرَةً' },
      { type: 'transliteration', text: 'Labayka Allâhoumma ʿUmrah' },
      { type: 'translation', text: 'Je réponds à Ton appel, ô Allah, par une ʿOmra.' },
      { type: 'intro', text: "On peut ajouter :" },
      { type: 'arabic', text: 'اللَّهُمَّ هَذِهِ عُمْرَةٌ لَا رِيَاءَ فِيهَا وَلَا سُمْعَةَ' },
      { type: 'transliteration', text: 'Allâhoumma hâdhihî ʿumratun lâ riyâʾa fîhâ wa lâ sumʿah' },
      { type: 'translation', text: 'Ô Allah, ceci est une Omra sans ostentation ni recherche de réputation.' },
      { type: 'intro', text: "Et si l'on craint un empêchement, on peut dire :" },
      { type: 'arabic', text: 'اللَّهُمَّ مَحِلِّي حَيْثُ حَبَسْتَنِي' },
      { type: 'transliteration', text: 'Allâhoumma maḥillî ḥaythu ḥabastanî' },
      { type: 'translation', text: 'Mon Seigneur, je me désacraliserai là où Tu m\'arrêteras.' },
      { type: 'note', text: 'Si une personne accomplit un acte interdit par oubli ou inattention, elle n\'a rien de particulier à faire. Les ablutions ne sont obligatoires que pour le Tawaf et les deux unités de prière derrière Maqam Ibrahim.' },
    ],
  },
  {
    id: 2,
    number: '02',
    icon: '📿',
    title: "La Talbiya",
    subtitle: "Récitation tout au long du trajet",
    content: [
      { type: 'intro', text: "Une fois en état de sacralisation, le pèlerin commence à réciter la Talbiya à voix haute (les femmes la disent à voix basse) :" },
      { type: 'arabic', text: 'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ،\nلَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ،\nإِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكُ، لَا شَرِيكَ لَكَ' },
      { type: 'transliteration', text: 'Labayka Allâhoumma labayk\nLabayka lâ sharîka laka labayk\nInna l-ḥamda wan-niʿmata laka wal-mulk\nLâ sharîka lak' },
      { type: 'translation', text: 'Je réponds à Ton appel, ô Allah. Je réponds à Ton appel. Tu n\'as point d\'associé. À Toi la Louange, à Toi les Bienfaits et à Toi la Royauté. Tu n\'as point d\'associé.' },
      { type: 'intro', text: "On peut aussi réciter de temps à autre :" },
      { type: 'arabic', text: 'لَا إِلَٰهَ إِلَّا اللَّهُ' },
      { type: 'transliteration', text: 'Lâ ilâha illâ Allâh' },
      { type: 'translation', text: 'Nul n\'est digne d\'adoration en dehors d\'Allah.' },
    ],
  },
  {
    id: 3,
    number: '03',
    icon: '✨',
    title: "En voyant la Kaaba",
    subtitle: "Doua à la première vue de la Ka'ba",
    content: [
      { type: 'intro', text: "Lorsque vous apercevez la Ka'ba pour la première fois, prononcez :" },
      { type: 'arabic', text: 'اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ فَحَيِّنَا رَبَّنَا بِالسَّلَامِ' },
      { type: 'transliteration', text: 'Allâhoumma anta as-salâm wa minka as-salâm faḥayyinâ bis-salâm' },
      { type: 'translation', text: 'Ô Allah, Tu es la paix et la paix vient de Toi. Fais-nous vivre dans la paix.' },
    ],
  },
  {
    id: 4,
    number: '04',
    icon: '🔁',
    title: "Tawaf — 7 Tours",
    subtitle: "Circumambulation autour de la Ka'ba",
    content: [
      { type: 'intro', text: "On découvre l'épaule droite (iḍṭibâʿ), puis on effectue sept tours autour de la Ka'ba en sens antihoraire, en commençant par la Pierre Noire." },
      { type: 'intro', text: "À chaque passage devant la Pierre Noire, on la salue en disant :" },
      { type: 'arabic', text: 'بِسْمِ اللَّهِ، اللَّهُ أَكْبَرُ' },
      { type: 'transliteration', text: 'Bismi Llâh, Allâhou akbar' },
      { type: 'translation', text: 'Au nom d\'Allah, Allah est le plus grand.' },
      { type: 'intro', text: "Entre le Coin Yéménite et la Pierre Noire, on récite :" },
      { type: 'arabic', text: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ' },
      { type: 'transliteration', text: 'Rabbana âtinâ fî d-dunyâ ḥasanatan wa fî l-âkhirati ḥasanatan waqinâ ʿadhâban-nâr' },
      { type: 'translation', text: 'Seigneur, accorde-nous une belle part ici-bas, une belle part dans l\'au-delà, et protège-nous du châtiment du Feu.' },
    ],
  },
  {
    id: 5,
    number: '05',
    icon: '🕌',
    title: "Prière — Maqam Ibrahim",
    subtitle: "Deux rak'ât derrière la station d'Ibrahim",
    content: [
      { type: 'intro', text: "À la fin des 7 tours, le pèlerin se dirige vers Maqâm Ibrâhîm et récite le verset :" },
      { type: 'arabic', text: 'وَاتَّخِذُوا مِنْ مَقَامِ إِبْرَاهِيمَ مُصَلًّى' },
      { type: 'transliteration', text: 'Wa-ttakhidhû min maqâmi ibrâhîma muṣallâ' },
      { type: 'translation', text: 'Faites de la station d\'Ibrahim un lieu de prière.' },
      { type: 'intro', text: "Il accomplit ensuite deux rak'ât derrière Maqâm Ibrâhîm, la Ka'ba dans son alignement :" },
      { type: 'list', items: [
        "1ère rak'a : Sourate Al-Kâfirûn (n°109)",
        "2ème rak'a : Sourate Al-Ikhlâs (n°112)",
      ]},
    ],
  },
  {
    id: 6,
    number: '06',
    icon: '💧',
    title: "Zamzam",
    subtitle: "L'eau bénie de la source sacrée",
    content: [
      { type: 'list', items: [
        "Se tourner face à la Qibla (recommandé)",
        "Faire la doua avant de boire",
        "Boire l'eau",
        "Se verser un peu d'eau sur la tête et le visage",
      ]},
      { type: 'intro', text: "Doua avant de boire :" },
      { type: 'arabic', text: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا وَاسِعًا وَشِفَاءً مِنْ كُلِّ دَاءٍ' },
      { type: 'transliteration', text: 'Allâhoumma innî asʾaluka ʿilman nâfiʿan wa rizqan wâsiʿan wa shifâʾan min kulli dâʾ' },
      { type: 'translation', text: 'Ô Allah, accorde-moi un savoir utile, une subsistance abondante et une guérison de toute maladie.' },
    ],
  },
  {
    id: 7,
    number: '07',
    icon: '🏃',
    title: "Saʿî — Ṣafâ & Marwâ",
    subtitle: "Sept allers-retours entre les deux monts",
    content: [
      { type: 'intro', text: "Le pèlerin se dirige vers Ṣafâ. En s'en approchant, il récite :" },
      { type: 'arabic', text: 'إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ' },
      { type: 'transliteration', text: 'Inna aṣ-ṣafâ wa l-marwata min shaʿâʾiri llâh' },
      { type: 'translation', text: 'Ṣafâ et Marwah comptent parmi les rites sacrés d\'Allah.' },
      { type: 'intro', text: "Puis il dit :" },
      { type: 'arabic', text: 'أَبْدَأُ بِمَا بَدَأَ اللَّهُ بِهِ' },
      { type: 'transliteration', text: "Abdaʾou bi-mâ badaʾa Allâhou bih" },
      { type: 'translation', text: 'Je débute par ce qu\'Allah a cité en premier lieu.' },
      { type: 'intro', text: "Sur Ṣafâ et Marwah, tourné vers la Ka'ba, on récite :" },
      { type: 'arabic', text: 'اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ\nلَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ،\nلَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ\nلَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ،\nأَنْجَزَ وَعْدَهُ، وَنَصَرَ عَبْدَهُ،\nوَهَزَمَ الْأَحْزَابَ وَحْدَهُ' },
      { type: 'transliteration', text: 'Allâhou Akbar, Allâhou Akbar, Allâhou Akbar.\nLâ ilâha illa Allâhou wahdahou lâ sharîkalah.\nLahou-l-moulk wa lahou-l-hamd, yuḥyî wa yumît,\nwa houwa ʿalâ koulli shayʾin Qadîr.\nLâ ilâha illa Allâhou wahdahou lâ sharîkalah.\nAndjaza waʿdah, wa nasara ʿabdah,\nwa hazama-l-aḥzâb wahdah.' },
      { type: 'translation', text: "Allah est le Plus Grand (×3). Il n'y a pas de divinité autre qu'Allah, Seul sans associé. À Lui la royauté et la louange. Il fait vivre et mourir, et Il est Capable de toute chose. Il a réalisé Sa promesse, donné la victoire à son serviteur et vaincu Seul toutes les factions." },
      { type: 'note', text: "Les hommes accélèrent le pas entre les deux lumières vertes situées entre Ṣafâ et Marwah." },
    ],
  },
  {
    id: 8,
    number: '08',
    icon: '✂️',
    title: "Fin — Rasage ou Coupe",
    subtitle: "Sortie de l'état de sacralisation",
    content: [
      { type: 'list', items: [
        "Homme : Se raser complètement (plus méritoire, invoqué 3× par le Prophète ﷺ) ou raccourcir les cheveux",
        "Femme : Couper l'extrémité des cheveux (environ 1 à 2 cm — une phalange)",
      ]},
      { type: 'note', text: "Al-ḥamdu lillâh — Vous avez accompli votre Omra. Vous pouvez sortir de l'état de sacralisation." },
    ],
  },
];

const pillarsData = {
  title: "Les Piliers de la ʿOmra",
  subtitle: "Sans l'un d'eux, la ʿOmra est invalide",
  items: [
    "L'état de sacralisation (Iḥrâm) — l'intention de débuter les rites",
    "Les 7 tours autour de la Ka'ba (Ṭawâf Al-Qoudoum)",
    "Les allers-retours entre les monts Ṣafâ et Marwâ (Saʿî)",
  ],
};

const obligatoryData = {
  title: "Les Actes Obligatoires",
  subtitle: "Un manquement nécessite un sacrifice compensatoire",
  items: [
    "Se mettre en état de sacralisation depuis le Mîqât (limite du territoire sacré)",
    "Le rasage ou la coupe des cheveux",
  ],
};

const sunnasData = {
  title: "Les Actes Surérogatoires",
  subtitle: "Méritoires mais sans péché si omis",
  items: [
    "Tout acte authentiquement rapporté du Prophète ﷺ. Celui qui les accomplit, cela est meilleur pour lui ; celui qui les délaisse ne commet aucun péché.",
  ],
};

function StepCard({ step }: { step: Step }) {
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
                ÉTAPE {step.number}
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
        <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: GOLD, textTransform: 'uppercase', marginBottom: 5 }}>Translittération</Text>
        <Text style={{ fontSize: 14, fontStyle: 'italic', color: '#4a4a4a', lineHeight: 23 }}>
          {section.text}
        </Text>
      </View>
    );
  }

  if (section.type === 'translation') {
    return (
      <View style={{ marginBottom: 14, marginTop: 6, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, backgroundColor: '#f2f2f2' }}>
        <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: '#999', textTransform: 'uppercase', marginBottom: 6 }}>Traduction</Text>
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

function SummaryCard({ data, color }: { data: typeof pillarsData; color: string }) {
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
                GUIDE COMPLET
              </Text>
              <Text style={{ fontSize: 30, fontWeight: '800', color: '#fff', textAlign: 'center', letterSpacing: -0.5, lineHeight: 36 }}>
                La ʿOmra
              </Text>
              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: 8, lineHeight: 20, paddingHorizontal: 20 }}>
                Guide sunnah — étapes, invocations{'\n'}et conseils pratiques
              </Text>

              {/* Step count pill */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}>
                <CheckCircle size={14} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13, marginLeft: 6 }}>8 étapes • Complet</Text>
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
            Appuyez sur chaque étape pour la développer et lire les invocations détaillées.
          </Text>
        </View>

        {/* Steps */}
        <Text style={{ fontSize: 13, fontWeight: '700', letterSpacing: 2, color: GOLD, textTransform: 'uppercase', marginBottom: 12, marginLeft: 4 }}>
          Les Étapes
        </Text>
        {steps.map((step) => (
          <StepCard key={step.id} step={step} />
        ))}

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: '#e8d9c0', marginVertical: 24, marginHorizontal: 8 }} />

        {/* Summary Section */}
        <Text style={{ fontSize: 13, fontWeight: '700', letterSpacing: 2, color: GOLD, textTransform: 'uppercase', marginBottom: 12, marginLeft: 4 }}>
          Résumé
        </Text>
        <SummaryCard data={pillarsData} color={GOLD} />
        <SummaryCard data={obligatoryData} color="#e67e22" />
        <SummaryCard data={sunnasData} color="#27ae60" />

        {/* Footer */}
        <View className="items-center mt-6 mb-10">
          <Text style={{ fontSize: 22, marginBottom: 6 }}>🤲</Text>
          <Text style={{ fontSize: 13, color: '#aaa', textAlign: 'center', lineHeight: 20 }}>
            Qu'Allah vous accorde une ʿOmra acceptée,{'\n'}des péchés pardonnés et une récompense immense.
          </Text>
          <Text style={{ fontSize: 15, color: GOLD, fontWeight: '600', marginTop: 8, textAlign: 'center' }}>
            آمين يا رب العالمين
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
