export const PLATFORM_COMMISSION_RATE = 0.30;
export const EUR_TO_SAR_RATE = 4;

const toNumber = (value: any) => {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
};

export const roundMoney = (value: number) => Math.round(toNumber(value) * 100) / 100;

const normalizeMoney = (value: any) => Math.max(0, toNumber(value));
const normalizeRate = (value: any) => Math.max(0, Math.min(1, toNumber(value)));

export const toSar = (eurAmount: number) => roundMoney(normalizeMoney(eurAmount) * EUR_TO_SAR_RATE);

export const formatEUR = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(normalizeMoney(value));

export const formatSAR = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'SAR', maximumFractionDigits: 2 }).format(normalizeMoney(value));

export const computeGrossFromCommissionableNet = (
    commissionableNetAmountEur: number,
    transportExtraFeeEur = 0,
    commissionRate = PLATFORM_COMMISSION_RATE
) => {
    const normalizedCommissionableNet = normalizeMoney(commissionableNetAmountEur);
    const normalizedTransport = normalizeMoney(transportExtraFeeEur);
    normalizeRate(commissionRate);

    // The pilgrim total is not increased by commission.
    return roundMoney(normalizedCommissionableNet + normalizedTransport);
};

export const computeReservationFinance = ({
    totalPriceEur,
    transportExtraFeeEur = 0,
    commissionableNetAmountEur,
    commissionRate = PLATFORM_COMMISSION_RATE,
}: {
    totalPriceEur: number;
    transportExtraFeeEur?: number;
    commissionableNetAmountEur?: number | null;
    commissionRate?: number;
}) => {
    const normalizedTotal = normalizeMoney(totalPriceEur);
    const normalizedTransport = normalizeMoney(transportExtraFeeEur);
    const normalizedRate = normalizeRate(commissionRate);

    const derivedCommissionableNet = roundMoney(
        Math.max(normalizedTotal - normalizedTransport, 0)
    );
    const normalizedCommissionableNet = commissionableNetAmountEur === null || commissionableNetAmountEur === undefined
        ? derivedCommissionableNet
        : normalizeMoney(commissionableNetAmountEur);

    const platformFeeEur = roundMoney(normalizedCommissionableNet * normalizedRate);
    const guideNetEur = roundMoney(normalizedTotal - platformFeeEur);
    const expectedTotalEur = roundMoney(normalizedCommissionableNet + normalizedTransport);

    return {
        commissionRate: normalizedRate,
        totalPriceEur: normalizedTotal,
        transportExtraFeeEur: normalizedTransport,
        commissionableNetAmountEur: normalizedCommissionableNet,
        platformFeeEur,
        guideNetEur,
        expectedTotalEur,
    };
};

export const computePilgrimTotalFromGuideNet = ({
    serviceNetAmountEur,
    extraPilgrimsNetAmountEur = 0,
    transportExtraFeeEur = 0,
    commissionRate = PLATFORM_COMMISSION_RATE,
}: {
    serviceNetAmountEur: number;
    extraPilgrimsNetAmountEur?: number;
    transportExtraFeeEur?: number;
    commissionRate?: number;
}) => {
    const commissionableNetAmountEur = roundMoney(normalizeMoney(serviceNetAmountEur) + normalizeMoney(extraPilgrimsNetAmountEur));
    const totalPriceEur = computeGrossFromCommissionableNet(
        commissionableNetAmountEur,
        transportExtraFeeEur,
        commissionRate
    );

    const finance = computeReservationFinance({
        totalPriceEur,
        transportExtraFeeEur,
        commissionableNetAmountEur,
        commissionRate,
    });

    return {
        ...finance,
        totalPriceEur,
    };
};
