import type { ImageSourcePropType } from 'react-native';

export type AvatarPresetId = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';

export const DEFAULT_AVATAR_PRESET_ID: AvatarPresetId = '1';
const AVATAR_PRESET_PREFIX = 'preset://';

const AVATAR_PRESET_SOURCES: Record<AvatarPresetId, ImageSourcePropType> = {
  '1': require('@/assets/images/Profile/1.webp'),
  '2': require('@/assets/images/Profile/2.webp'),
  '3': require('@/assets/images/Profile/3.webp'),
  '4': require('@/assets/images/Profile/4.webp'),
  '5': require('@/assets/images/Profile/5.webp'),
  '6': require('@/assets/images/Profile/6.webp'),
  '7': require('@/assets/images/Profile/7.webp'),
  '8': require('@/assets/images/Profile/8.webp'),
};

export const AVATAR_PRESET_OPTIONS: {
  id: AvatarPresetId;
  label: string;
  source: ImageSourcePropType;
}[] = [
  { id: '1', label: 'Avatar 1', source: AVATAR_PRESET_SOURCES['1'] },
  { id: '2', label: 'Avatar 2', source: AVATAR_PRESET_SOURCES['2'] },
  { id: '3', label: 'Avatar 3', source: AVATAR_PRESET_SOURCES['3'] },
  { id: '4', label: 'Avatar 4', source: AVATAR_PRESET_SOURCES['4'] },
  { id: '5', label: 'Avatar 5', source: AVATAR_PRESET_SOURCES['5'] },
  { id: '6', label: 'Avatar 6', source: AVATAR_PRESET_SOURCES['6'] },
  { id: '7', label: 'Avatar 7', source: AVATAR_PRESET_SOURCES['7'] },
  { id: '8', label: 'Avatar 8', source: AVATAR_PRESET_SOURCES['8'] },
];

export const toAvatarPresetUrl = (presetId: AvatarPresetId): string => `${AVATAR_PRESET_PREFIX}${presetId}`;

export const getAvatarPresetIdFromUrl = (avatarUrl?: string | null): AvatarPresetId | null => {
  if (!avatarUrl || typeof avatarUrl !== 'string') return null;
  const trimmed = avatarUrl.trim();
  if (!trimmed.startsWith(AVATAR_PRESET_PREFIX)) return null;

  const rawPresetId = trimmed.slice(AVATAR_PRESET_PREFIX.length);

  // Legacy preset ids are mapped to new WebP presets.
  if (rawPresetId === '16') return '1';
  if (rawPresetId === '17') return '2';
  if (rawPresetId === '18') return '3';

  const presetId = rawPresetId as AvatarPresetId;
  if (presetId in AVATAR_PRESET_SOURCES) return presetId;
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
