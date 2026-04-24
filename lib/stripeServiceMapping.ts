export type ServicePriceCode =
  | 'OMRA_SOLO_HORS'
  | 'OMRA_FAMILLE_HORS'
  | 'OMRA_GROUPE_HORS'
  | 'OMRA_SOLO_RAMADAN'
  | 'OMRA_FAMILLE_RAMADAN'
  | 'OMRA_GROUPE_RAMADAN'
  | 'OMRA2_SOLO_HORS'
  | 'OMRA2_FAMILLE_HORS'
  | 'OMRA2_GROUPE_HORS'
  | 'OMRA2_SOLO_RAMADAN'
  | 'OMRA2_FAMILLE_RAMADAN'
  | 'OMRA2_GROUPE_RAMADAN'
  | 'BADAL_HORS'
  | 'BADAL_RAMADAN'
  | 'PMR_HORS'
  | 'PMR_RAMADAN'
  | 'VISITE_MAKKAH'
  | 'VISITE_MEDINE';

export const PRICE_ID_BY_SERVICE_CODE: Partial<Record<ServicePriceCode, string>> = {
  OMRA_SOLO_HORS: 'price_1TAHzVL9j73enH7JJSyr6PEF',
  OMRA_FAMILLE_HORS: 'price_1TAI2qL9j73enH7J2AQzHfu7',
  OMRA_GROUPE_HORS: 'price_1TAI3ML9j73enH7JhgMwRul0',
  OMRA_SOLO_RAMADAN: 'price_1TAI43L9j73enH7JAFqyFlEN',
  OMRA_FAMILLE_RAMADAN: 'price_1TAI4XL9j73enH7JRlUmuaaZ',
  OMRA_GROUPE_RAMADAN: 'price_1TAI56L9j73enH7Jn3kxcDx5',
  OMRA2_SOLO_HORS: 'price_1TPWs7L9j73enH7JJNU9DQ0K',
  OMRA2_FAMILLE_HORS: 'price_1TPWutL9j73enH7JxQ83hjmS',
  OMRA2_GROUPE_HORS: 'price_1TPWu3L9j73enH7JO6MLBhyN',
  OMRA2_SOLO_RAMADAN: 'price_1TPWsaL9j73enH7JlCUz0UwB',
  OMRA2_FAMILLE_RAMADAN: 'price_1TPWvJL9j73enH7JcJtubtj1',
  OMRA2_GROUPE_RAMADAN: 'price_1TPWtdL9j73enH7JeAYhBX2x',
  BADAL_HORS: 'price_1TAI5yL9j73enH7JZD5OgaMX',
  BADAL_RAMADAN: 'price_1TAI6GL9j73enH7J6ZX3VW4c',
  VISITE_MEDINE: 'price_1TAI77L9j73enH7JRNbldbeV',
  VISITE_MAKKAH: 'price_1TAI7jL9j73enH7JIDKwRF81',
};

const normalizeText = (value?: string | null) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const resolveServicePriceCode = (params: {
  title?: string | null;
  category?: string | null;
  location?: string | null;
}): ServicePriceCode | null => {
  const text = `${normalizeText(params.title)} ${normalizeText(params.category)}`.trim();
  const location = normalizeText(params.location);

  const titleOnly = normalizeText(params.title);
  const isBadal = text.includes('badal');
  const isPmr = text.includes('pmr') || text.includes('mobilite reduite') || text.includes('pousseur');
  const isRamadan = text.includes('ramadan') && !text.includes('hors ramadan');
  const isVisite = text.includes('visite');
  const isOmra2 = text.includes('2eme') && text.includes('omra');
  const isOmra = text.includes('omra');
  const isSolo = text.includes('seul') || text.includes('couple');
  const isFamille = text.includes('famille') || text.includes('3 a 7');
  const isGroupe = text.includes('groupe');

  if (isBadal) {
    return isRamadan ? 'BADAL_RAMADAN' : 'BADAL_HORS';
  }

  if (isPmr) {
    return isRamadan ? 'PMR_RAMADAN' : 'PMR_HORS';
  }

  if (isVisite) {
    if (location.includes('medine')) return 'VISITE_MEDINE';
    if (location.includes('makkah') || location.includes('mecque')) return 'VISITE_MAKKAH';
    if (titleOnly.includes('medine')) return 'VISITE_MEDINE';
    if (titleOnly.includes('makkah') || titleOnly.includes('mecque') || titleOnly.includes('mekkah')) return 'VISITE_MAKKAH';
    return null;
  }

  if (isOmra2) {
    if (isSolo) return isRamadan ? 'OMRA2_SOLO_RAMADAN' : 'OMRA2_SOLO_HORS';
    if (isFamille) return isRamadan ? 'OMRA2_FAMILLE_RAMADAN' : 'OMRA2_FAMILLE_HORS';
    if (isGroupe) return isRamadan ? 'OMRA2_GROUPE_RAMADAN' : 'OMRA2_GROUPE_HORS';
  }

  if (isOmra) {
    if (isSolo) return isRamadan ? 'OMRA_SOLO_RAMADAN' : 'OMRA_SOLO_HORS';
    if (isFamille) return isRamadan ? 'OMRA_FAMILLE_RAMADAN' : 'OMRA_FAMILLE_HORS';
    if (isGroupe) return isRamadan ? 'OMRA_GROUPE_RAMADAN' : 'OMRA_GROUPE_HORS';
  }

  return null;
};

export const resolveStripePriceIdForService = (params: {
  title?: string | null;
  category?: string | null;
  location?: string | null;
}) => {
  const code = resolveServicePriceCode(params);
  if (!code) return { code: null, priceId: null };
  return {
    code,
    priceId: PRICE_ID_BY_SERVICE_CODE[code],
  };
};
