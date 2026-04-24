import { PLATFORM_COMMISSION_RATE, roundMoney, toSar } from '@/lib/pricing';
import { resolveServicePriceCode, type ServicePriceCode } from '@/lib/stripeServiceMapping';

type GuideTariffParams = {
    title?: string | null;
    category?: string | null;
    location?: string | null;
    serviceBasePriceEur?: number | null;
};

const FIXED_GUIDE_NET_EUR_BY_SERVICE_CODE: Record<ServicePriceCode, number> = {
    OMRA_SOLO_HORS: 132.5,
    OMRA_FAMILLE_HORS: 166.25,
    OMRA_GROUPE_HORS: 200,
    OMRA_SOLO_RAMADAN: 200,
    OMRA_FAMILLE_RAMADAN: 232.5,
    OMRA_GROUPE_RAMADAN: 265,
    OMRA2_SOLO_HORS: 132.5,
    OMRA2_FAMILLE_HORS: 166.25,
    OMRA2_GROUPE_HORS: 200,
    OMRA2_SOLO_RAMADAN: 200,
    OMRA2_FAMILLE_RAMADAN: 232.5,
    OMRA2_GROUPE_RAMADAN: 265,
    BADAL_HORS: 100,
    BADAL_RAMADAN: 150,
    PMR_HORS: 112.5,
    PMR_RAMADAN: 137.5,
    VISITE_MAKKAH: 100,
    VISITE_MEDINE: 100,
};

const normalizeText = (value?: string | null) =>
    String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

const isSamePrice = (value: number, target: number) => Math.abs(roundMoney(value) - target) <= 0.01;

const inferServicePriceCodeFromBasePrice = (params: GuideTariffParams): ServicePriceCode | null => {
    const text = `${normalizeText(params.title)} ${normalizeText(params.category)}`.trim();
    const location = normalizeText(params.location);
    const amount = roundMoney(Number(params.serviceBasePriceEur || 0));

    const titleOnly = normalizeText(params.title);
    const isBadal = text.includes('badal');
    const isPmr = text.includes('pmr') || text.includes('mobilite reduite') || text.includes('pousseur');
    const isRamadan = text.includes('ramadan') && !text.includes('hors ramadan');
    const isVisite = text.includes('visite');
    const isOmra2 = text.includes('2eme') && text.includes('omra');
    const isOmra = text.includes('omra');
    const isSolo = text.includes('seul') || text.includes('couple');
    const isFamille = text.includes('famille') || text.includes('3 a 7') || text.includes('3 à 7');
    const isGroupe = text.includes('groupe');

    if (isBadal) {
        if (isRamadan || isSamePrice(amount, 250)) return 'BADAL_RAMADAN';
        if (isSamePrice(amount, 150)) return 'BADAL_HORS';
        return 'BADAL_HORS';
    }

    if (isPmr) {
        return isRamadan ? 'PMR_RAMADAN' : 'PMR_HORS';
    }

    if (isVisite) {
        if (location.includes('medine')) return 'VISITE_MEDINE';
        if (location.includes('makkah') || location.includes('mecque')) return 'VISITE_MAKKAH';
        if (titleOnly.includes('medine')) return 'VISITE_MEDINE';
        if (titleOnly.includes('makkah') || titleOnly.includes('mecque') || titleOnly.includes('mekkah')) return 'VISITE_MAKKAH';
        return 'VISITE_MEDINE';
    }

    if (!isOmra) return null;

    if (isOmra2) {
        if (isRamadan || isSamePrice(amount, 350) || isSamePrice(amount, 400)) {
            if (isSolo || isSamePrice(amount, 300)) return 'OMRA2_SOLO_RAMADAN';
            if (isFamille || isSamePrice(amount, 350)) return 'OMRA2_FAMILLE_RAMADAN';
            if (isGroupe || isSamePrice(amount, 400)) return 'OMRA2_GROUPE_RAMADAN';
        }
        if (isSolo || isSamePrice(amount, 200)) return 'OMRA2_SOLO_HORS';
        if (isFamille || isSamePrice(amount, 250)) return 'OMRA2_FAMILLE_HORS';
        if (isGroupe || isSamePrice(amount, 300)) return 'OMRA2_GROUPE_HORS';
    }

    if (isRamadan || isSamePrice(amount, 350) || isSamePrice(amount, 400)) {
        if (isSolo || isSamePrice(amount, 300)) return 'OMRA_SOLO_RAMADAN';
        if (isFamille || isSamePrice(amount, 350)) return 'OMRA_FAMILLE_RAMADAN';
        if (isGroupe || isSamePrice(amount, 400)) return 'OMRA_GROUPE_RAMADAN';
    }

    if (isSolo || isSamePrice(amount, 200)) return 'OMRA_SOLO_HORS';
    if (isFamille || isSamePrice(amount, 250)) return 'OMRA_FAMILLE_HORS';
    if (isGroupe || isSamePrice(amount, 300)) return 'OMRA_GROUPE_HORS';

    return null;
};

export const resolveGuideTariffCode = (params: GuideTariffParams): ServicePriceCode | null =>
    resolveServicePriceCode(params) || inferServicePriceCodeFromBasePrice(params);

export const resolveFixedGuideNetEurForService = (params: GuideTariffParams) => {
    const code = resolveGuideTariffCode(params);
    return code ? FIXED_GUIDE_NET_EUR_BY_SERVICE_CODE[code] : null;
};

export const resolveFixedGuideNetSarForService = (params: GuideTariffParams) => {
    const guideNetEur = resolveFixedGuideNetEurForService(params);
    return guideNetEur === null ? null : toSar(guideNetEur);
};

export const resolveEffectiveCommissionRateForService = (params: GuideTariffParams) => {
    const serviceBasePriceEur = roundMoney(Number(params.serviceBasePriceEur || 0));
    if (serviceBasePriceEur <= 0) return PLATFORM_COMMISSION_RATE;

    const fixedGuideNetEur = resolveFixedGuideNetEurForService(params);
    if (fixedGuideNetEur === null) return PLATFORM_COMMISSION_RATE;

    const effectiveRate = Math.max(Math.min((serviceBasePriceEur - fixedGuideNetEur) / serviceBasePriceEur, 1), 0);
    return Math.round(effectiveRate * 1_000_000) / 1_000_000;
};
