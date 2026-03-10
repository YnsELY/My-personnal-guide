import type { ImageSourcePropType } from 'react-native';

const MECCA_SERVICE_IMAGE = require('@/assets/images/services/7.jpg');
const MEDINA_SERVICE_IMAGE = require('@/assets/images/services/8.webp');

const normalizeLocationKey = (location?: string | null): 'mecca' | 'medina' => {
  const value = (location || '').trim().toLowerCase();

  if (value.includes('medine') || value.includes('médine') || value.includes('medina')) {
    return 'medina';
  }

  if (value.includes('mecque') || value.includes('mecca') || value.includes('makkah')) {
    return 'mecca';
  }

  return 'mecca';
};

export const getServiceImageForLocation = (location?: string | null): ImageSourcePropType => {
  return normalizeLocationKey(location) === 'medina' ? MEDINA_SERVICE_IMAGE : MECCA_SERVICE_IMAGE;
};
