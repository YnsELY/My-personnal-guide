import { SERVICES } from '@/constants/data';

export const FIXED_SERVICE_DESCRIPTIONS = {
    omraBadal: SERVICES.find((service) => service.id === 'omra-badal')?.description || '',
    omra: SERVICES.find((service) => service.id === 'omra-accompagne')?.description || '',
    visiteMedine: SERVICES.find((service) => service.id === 'visite-guidee')?.description || '',
    visiteMakkah: "La visite de Makkah est un voyage au cœur de la foi et de la dévotion : du Jabal Thawr, refuge du Prophète ﷺ, aux plaines sacrées d'Arafât, Mina et Mouzdalifa, jusqu'au Jabal Nour qui abrite la grotte de Hira, chaque étape vous rapproche de l'histoire, des sacrifices et de la lumière de l'Islam, guidé avec soin pour que votre cœur et votre esprit s'élèvent dans la contemplation et la sérénité.",
    visiteMasjidNabawi: SERVICES.find((service) => service.id === 'visite-masjid-nabawi')?.description || '',
} as const;

const normalize = (value?: string | null) =>
    (value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

export const getFixedServiceDescription = (params: {
    title?: string | null;
    category?: string | null;
    location?: string | null;
}): string | null => {
    const text = `${params.title || ''} ${params.category || ''}`.trim();
    const normalizedText = normalize(text);
    const normalizedLocation = normalize(params.location);

    if (!normalizedText && !normalizedLocation) return null;

    if (normalizedText.includes('badal')) {
        return FIXED_SERVICE_DESCRIPTIONS.omraBadal;
    }

    if (
        normalizedText.includes('masjid nabawi')
        || normalizedText.includes('masjid al nabawi')
        || normalizedText.includes('nabawi')
    ) {
        return FIXED_SERVICE_DESCRIPTIONS.visiteMasjidNabawi;
    }

    const hasMedine = normalizedText.includes('medine') || normalizedLocation.includes('medine');
    const hasMakkah = normalizedText.includes('makkah') || normalizedText.includes('mecque') || normalizedLocation.includes('makkah') || normalizedLocation.includes('mecque');

    if (hasMedine && !hasMakkah) {
        return FIXED_SERVICE_DESCRIPTIONS.visiteMedine;
    }

    if (hasMakkah && !hasMedine) {
        return FIXED_SERVICE_DESCRIPTIONS.visiteMakkah;
    }

    if (normalizedText.includes('visite')) {
        if (normalizedLocation.includes('medine')) {
            return FIXED_SERVICE_DESCRIPTIONS.visiteMedine;
        }
        if (normalizedLocation.includes('mecque') || normalizedLocation.includes('makkah')) {
            return FIXED_SERVICE_DESCRIPTIONS.visiteMakkah;
        }
        return FIXED_SERVICE_DESCRIPTIONS.visiteMedine;
    }

    if (normalizedText.includes('omra')) {
        return FIXED_SERVICE_DESCRIPTIONS.omra;
    }

    return null;
};
