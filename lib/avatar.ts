import type { ImageSourcePropType } from 'react-native';

export type AvatarPresetId = '16' | '17' | '18' | 'female-16' | 'female-17' | 'female-18';
type LegacyAvatarPresetId = '1' | '2' | '3';
type ProfileRole = 'guide' | 'pilgrim' | 'admin' | string | null | undefined;
type ProfileGender = 'male' | 'female' | string | null | undefined;

export const DEFAULT_AVATAR_PRESET_ID: AvatarPresetId = '18';
const AVATAR_PRESET_PREFIX = 'preset://';

const AVATAR_PRESET_SOURCES: Record<AvatarPresetId, ImageSourcePropType> = {
  '16': require('@/assets/images/Profile/16_11zon.jpg'),
  '17': require('@/assets/images/Profile/17_11zon.jpg'),
  '18': require('@/assets/images/Profile/18_11zon.jpg'),
  'female-16': require('@/assets/images/Profile/16.png'),
  'female-17': require('@/assets/images/Profile/17.png'),
  'female-18': require('@/assets/images/Profile/18.png'),
};

const LEGACY_AVATAR_PRESET_ID_MAP: Record<LegacyAvatarPresetId, AvatarPresetId> = {
  '1': '16',
  '2': '17',
  '3': '18',
};

export const AVATAR_PRESET_OPTIONS: {
  id: AvatarPresetId;
  label: string;
  source: ImageSourcePropType;
}[] = [
  { id: '16', label: 'Avatar 1', source: AVATAR_PRESET_SOURCES['16'] },
  { id: '17', label: 'Avatar 2', source: AVATAR_PRESET_SOURCES['17'] },
  { id: '18', label: 'Avatar 3', source: AVATAR_PRESET_SOURCES['18'] },
];

export const FEMALE_GUIDE_AVATAR_PRESET_OPTIONS: {
  id: AvatarPresetId;
  label: string;
  source: ImageSourcePropType;
}[] = [
  { id: 'female-16', label: 'Avatar femme 1', source: AVATAR_PRESET_SOURCES['female-16'] },
  { id: 'female-17', label: 'Avatar femme 2', source: AVATAR_PRESET_SOURCES['female-17'] },
  { id: 'female-18', label: 'Avatar femme 3', source: AVATAR_PRESET_SOURCES['female-18'] },
];

export const getAvatarPresetOptionsForProfile = (role: ProfileRole, gender: ProfileGender) => {
  if (role === 'guide' && gender === 'female') {
    return FEMALE_GUIDE_AVATAR_PRESET_OPTIONS;
  }

  return AVATAR_PRESET_OPTIONS;
};

export const toAvatarPresetUrl = (presetId: AvatarPresetId): string => `${AVATAR_PRESET_PREFIX}${presetId}`;

export const getAvatarPresetIdFromUrl = (avatarUrl?: string | null): AvatarPresetId | null => {
  if (!avatarUrl || typeof avatarUrl !== 'string') return null;
  const trimmed = avatarUrl.trim();
  if (!trimmed.startsWith(AVATAR_PRESET_PREFIX)) return null;

  const rawPresetId = trimmed.slice(AVATAR_PRESET_PREFIX.length);
  const legacyPresetId = LEGACY_AVATAR_PRESET_ID_MAP[rawPresetId as LegacyAvatarPresetId];
  if (legacyPresetId) {
    return legacyPresetId;
  }

  const presetId = rawPresetId as AvatarPresetId;
  if (
    presetId === '16'
    || presetId === '17'
    || presetId === '18'
    || presetId === 'female-16'
    || presetId === 'female-17'
    || presetId === 'female-18'
  ) {
    return presetId;
  }
  return null;
};

export const resolveProfileAvatarSource = (avatarUrl?: string | null): ImageSourcePropType => {
  const presetId = getAvatarPresetIdFromUrl(avatarUrl);
  if (presetId) {
    return AVATAR_PRESET_SOURCES[presetId];
  }

  if (avatarUrl && avatarUrl.trim().length > 0) {
    return { uri: avatarUrl.trim() };
  }

  return AVATAR_PRESET_SOURCES[DEFAULT_AVATAR_PRESET_ID];
};
