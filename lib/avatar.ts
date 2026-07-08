import type { ImageSourcePropType } from 'react-native';

export type Gender = 'male' | 'female';
export type Role = 'pilgrim' | 'guide' | 'admin';
export type AvatarPresetId = '16' | '17' | '18' | 'f1' | 'f2' | 'f3';

// Les avatars femmes ne sont proposés qu'aux guides femmes
const useFemaleAvatars = (gender?: Gender | null, role?: Role | null): boolean =>
  gender === 'female' && role === 'guide';

const MALE_PRESET_IDS: AvatarPresetId[] = ['16', '17', '18'];
const FEMALE_PRESET_IDS: AvatarPresetId[] = ['f1', 'f2', 'f3'];

// Défaut historique (homme) — conservé pour la rétro-compatibilité
export const DEFAULT_AVATAR_PRESET_ID: AvatarPresetId = '18';
export const DEFAULT_FEMALE_AVATAR_PRESET_ID: AvatarPresetId = 'f1';
const AVATAR_PRESET_PREFIX = 'preset://';

const AVATAR_PRESET_SOURCES: Record<AvatarPresetId, ImageSourcePropType> = {
  '16': require('@/assets/images/Profile/16_11zon.jpg'),
  '17': require('@/assets/images/Profile/17_11zon.jpg'),
  '18': require('@/assets/images/Profile/18_11zon.jpg'),
  'f1': require('@/assets/images/Profile/femme/f1.jpeg'),
  'f2': require('@/assets/images/Profile/femme/f2.jpeg'),
  'f3': require('@/assets/images/Profile/femme/f3.jpeg'),
};

const VALID_PRESET_IDS = new Set<string>([...MALE_PRESET_IDS, ...FEMALE_PRESET_IDS]);

export type AvatarPresetOption = {
  id: AvatarPresetId;
  label: string;
  source: ImageSourcePropType;
};

const MALE_AVATAR_OPTIONS: AvatarPresetOption[] = [
  { id: '16', label: 'Avatar 1', source: AVATAR_PRESET_SOURCES['16'] },
  { id: '17', label: 'Avatar 2', source: AVATAR_PRESET_SOURCES['17'] },
  { id: '18', label: 'Avatar 3', source: AVATAR_PRESET_SOURCES['18'] },
];

const FEMALE_AVATAR_OPTIONS: AvatarPresetOption[] = [
  { id: 'f1', label: 'Avatar 1', source: AVATAR_PRESET_SOURCES['f1'] },
  { id: 'f2', label: 'Avatar 2', source: AVATAR_PRESET_SOURCES['f2'] },
  { id: 'f3', label: 'Avatar 3', source: AVATAR_PRESET_SOURCES['f3'] },
];

// Export historique (jeu homme) conservé pour la rétro-compatibilité
export const AVATAR_PRESET_OPTIONS = MALE_AVATAR_OPTIONS;

export const getAvatarPresetOptions = (gender?: Gender | null, role?: Role | null): AvatarPresetOption[] =>
  useFemaleAvatars(gender, role) ? FEMALE_AVATAR_OPTIONS : MALE_AVATAR_OPTIONS;

export const getDefaultAvatarPresetId = (gender?: Gender | null, role?: Role | null): AvatarPresetId =>
  useFemaleAvatars(gender, role) ? DEFAULT_FEMALE_AVATAR_PRESET_ID : DEFAULT_AVATAR_PRESET_ID;

export const toAvatarPresetUrl = (presetId: AvatarPresetId): string => `${AVATAR_PRESET_PREFIX}${presetId}`;

export const getAvatarPresetIdFromUrl = (avatarUrl?: string | null): AvatarPresetId | null => {
  if (!avatarUrl || typeof avatarUrl !== 'string') return null;
  const trimmed = avatarUrl.trim();
  if (!trimmed.startsWith(AVATAR_PRESET_PREFIX)) return null;

  const presetId = trimmed.slice(AVATAR_PRESET_PREFIX.length);
  return VALID_PRESET_IDS.has(presetId) ? (presetId as AvatarPresetId) : null;
};

export const resolveProfileAvatarSource = (
  avatarUrl?: string | null,
  gender?: Gender | null,
  role?: Role | null,
): ImageSourcePropType => {
  const presetId = getAvatarPresetIdFromUrl(avatarUrl);
  if (presetId) {
    return AVATAR_PRESET_SOURCES[presetId];
  }

  if (avatarUrl && avatarUrl.trim().length > 0) {
    return { uri: avatarUrl.trim() };
  }

  // Aucune photo choisie : défaut femme uniquement pour les guides femmes
  return AVATAR_PRESET_SOURCES[getDefaultAvatarPresetId(gender, role)];
};
