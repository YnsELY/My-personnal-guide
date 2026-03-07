import type { ImageSourcePropType } from 'react-native';

export type AvatarPresetId = '16' | '17' | '18';

export const DEFAULT_AVATAR_PRESET_ID: AvatarPresetId = '18';
const AVATAR_PRESET_PREFIX = 'preset://';

const AVATAR_PRESET_SOURCES: Record<AvatarPresetId, ImageSourcePropType> = {
  '16': require('@/assets/images/Profile/16.png'),
  '17': require('@/assets/images/Profile/17.png'),
  '18': require('@/assets/images/Profile/18.png'),
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

export const toAvatarPresetUrl = (presetId: AvatarPresetId): string => `${AVATAR_PRESET_PREFIX}${presetId}`;

export const getAvatarPresetIdFromUrl = (avatarUrl?: string | null): AvatarPresetId | null => {
  if (!avatarUrl || typeof avatarUrl !== 'string') return null;
  const trimmed = avatarUrl.trim();
  if (!trimmed.startsWith(AVATAR_PRESET_PREFIX)) return null;

  const presetId = trimmed.slice(AVATAR_PRESET_PREFIX.length) as AvatarPresetId;
  if (presetId === '16' || presetId === '17' || presetId === '18') {
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
