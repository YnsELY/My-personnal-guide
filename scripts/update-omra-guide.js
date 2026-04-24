const fs = require('fs');

const file = 'app/omra-guide.tsx';
let content = fs.readFileSync(file, 'utf-8');

// Add import
content = content.replace(
  "import { SafeAreaView } from 'react-native-safe-area-context';",
  "import { SafeAreaView } from 'react-native-safe-area-context';\nimport { omraGuideTranslations } from '@/constants/omraGuideTranslations';\nimport { useLanguage } from '@/context/LanguageContext';\nimport { textStart } from '@/lib/rtl';"
);

// Remove static constants
content = content.replace(/const steps: Step\[\] = \[[\s\S]*?\];/, '');
content = content.replace(/const pillarsData = \{[\s\S]*?\};/, '');
content = content.replace(/const obligatoryData = \{[\s\S]*?\};/, '');
content = content.replace(/const sunnasData = \{[\s\S]*?\};/, '');

// Add useLanguage inside OmraGuideScreen
content = content.replace(
  "export default function OmraGuideScreen() {\n  const router = useRouter();",
  "export default function OmraGuideScreen() {\n  const router = useRouter();\n  const { language, isRTL } = useLanguage();\n  const t = omraGuideTranslations[language as keyof typeof omraGuideTranslations] || omraGuideTranslations.fr;\n  const steps = t.steps as Step[];"
);

// Update usages inside OmraGuideScreen
content = content.replace(
  "              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 4, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', marginBottom: 6 }}>\n                GUIDE COMPLET\n              </Text>",
  "              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 4, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', marginBottom: 6 }}>\n                {t.tag}\n              </Text>"
);

content = content.replace(
  "              <Text style={{ fontSize: 30, fontWeight: '800', color: '#fff', textAlign: 'center', letterSpacing: -0.5, lineHeight: 36 }}>\n                La ʿOmra\n              </Text>",
  "              <Text style={{ fontSize: 30, fontWeight: '800', color: '#fff', textAlign: 'center', letterSpacing: -0.5, lineHeight: 36 }}>\n                {t.title}\n              </Text>"
);

content = content.replace(
  "              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: 8, lineHeight: 20, paddingHorizontal: 20 }}>\n                Guide sunnah — étapes, invocations{'\\n'}et conseils pratiques\n              </Text>",
  "              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: 8, lineHeight: 20, paddingHorizontal: 20 }}>\n                {t.subtitle}\n              </Text>"
);

content = content.replace(
  "                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13, marginLeft: 6 }}>8 étapes • Complet</Text>",
  "                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13, marginLeft: 6 }}>{t.stepsCount}</Text>"
);

content = content.replace(
  "            Appuyez sur chaque étape pour la développer et lire les invocations détaillées.",
  "            {t.introQuote}"
);

content = content.replace(
  "          Les Étapes\n        </Text>",
  "          {t.stepsTitle}\n        </Text>"
);

content = content.replace(
  "          Résumé\n        </Text>",
  "          {t.summaryTitle}\n        </Text>"
);

content = content.replace(
  "        <SummaryCard data={pillarsData} color={GOLD} />\n        <SummaryCard data={obligatoryData} color=\"#e67e22\" />\n        <SummaryCard data={sunnasData} color=\"#27ae60\" />",
  "        <SummaryCard data={t.pillarsData} color={GOLD} />\n        <SummaryCard data={t.obligatoryData} color=\"#e67e22\" />\n        <SummaryCard data={t.sunnasData} color=\"#27ae60\" />"
);

content = content.replace(
  "            Qu'Allah vous accorde une ʿOmra acceptée,{'\\n'}des péchés pardonnés et une récompense immense.",
  "            {t.footerText}"
);

// We also need to update StepCard and ContentSection
// Since they are outside the component, we should pass 't' to them, or move them inside, or use useLanguage in them
content = content.replace(
  "function StepCard({ step }: { step: Step }) {",
  "function StepCard({ step }: { step: Step }) {\n  const { language, isRTL } = useLanguage();\n  const t = omraGuideTranslations[language as keyof typeof omraGuideTranslations] || omraGuideTranslations.fr;"
);
content = content.replace("ÉTAPE {step.number}", "{t.step} {step.number}");

content = content.replace(
  "function ContentSection({ section }: { section: Section }) {",
  "function ContentSection({ section }: { section: Section }) {\n  const { language, isRTL } = useLanguage();\n  const t = omraGuideTranslations[language as keyof typeof omraGuideTranslations] || omraGuideTranslations.fr;"
);
content = content.replace("Translittération", "{t.transliteration}");
content = content.replace("Traduction", "{t.translation}");

fs.writeFileSync(file, content);
