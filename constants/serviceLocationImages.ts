import type { ImageSourcePropType } from 'react-native';

const LOCAL_IMAGE_MAP: Record<string, any> = {
  'local:mecca_1': require('@/assets/images/Image création service partie guide /La Mecque /4-copie-2.webp'),
  'local:mecca_2': require('@/assets/images/Image création service partie guide /La Mecque /7-copie.webp'),
  'local:mecca_3': require('@/assets/images/Image création service partie guide /La Mecque /5-copie.webp'),
  'local:mecca_4': require('@/assets/images/Image création service partie guide /La Mecque /6-copie-2.webp'),
  'local:mecca_5': require('@/assets/images/Image création service partie guide /La Mecque /9 copie.webp'),
  'local:medina_1': require('@/assets/images/Image création service partie guide /Médine /1-copie.webp'),
  'local:medina_2': require('@/assets/images/Image création service partie guide /Médine /2-copie.webp'),
  'local:medina_3': require('@/assets/images/Image création service partie guide /Médine /3-copie-2.webp'),
  'local:medina_4': require('@/assets/images/Image création service partie guide /Médine /aneez-mohammed-KygbP copie.jpg.webp'),
};

export const SERVICE_PHOTO_OPTIONS: { key: string; location: 'mecca' | 'medina' }[] = [
  { key: 'local:mecca_1', location: 'mecca' },
  { key: 'local:mecca_2', location: 'mecca' },
  { key: 'local:mecca_3', location: 'mecca' },
  { key: 'local:mecca_4', location: 'mecca' },
  { key: 'local:mecca_5', location: 'mecca' },
  { key: 'local:medina_1', location: 'medina' },
  { key: 'local:medina_2', location: 'medina' },
  { key: 'local:medina_3', location: 'medina' },
  { key: 'local:medina_4', location: 'medina' },
];

const normalizeLocationKey = (location?: string | null): 'mecca' | 'medina' => {
  const value = (location || '').trim().toLowerCase();
  if (value.includes('medine') || value.includes('médine') || value.includes('medina')) {
    return 'medina';
  }
  return 'mecca';
};

export const getServiceImageForLocation = (location?: string | null): ImageSourcePropType => {
  return normalizeLocationKey(location) === 'medina'
    ? LOCAL_IMAGE_MAP['local:medina_1']
    : LOCAL_IMAGE_MAP['local:mecca_1'];
};

export const resolveServiceImageSource = (imageUrl?: string | null, location?: string | null): ImageSourcePropType => {
  if (imageUrl && LOCAL_IMAGE_MAP[imageUrl]) {
    return LOCAL_IMAGE_MAP[imageUrl];
  }
  if (imageUrl && /^https?:\/\//i.test(imageUrl)) {
    return { uri: imageUrl };
  }
  return getServiceImageForLocation(location);
};

export const getPhotoSource = (key: string): ImageSourcePropType => {
  return LOCAL_IMAGE_MAP[key] ?? LOCAL_IMAGE_MAP['local:mecca_1'];
};

export const getPhotosForLocation = (location?: string | null) => {
  const loc = normalizeLocationKey(location);
  return SERVICE_PHOTO_OPTIONS.filter(p => p.location === loc);
};
