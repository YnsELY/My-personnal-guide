export const FIXED_SERVICE_DESCRIPTIONS = {
    omraBadal: "Confiez-nous votre Omra Badal : une adoration accomplie avec sérieux, transparence et sincérité. Votre guide vous enverra une courte vidéo à l'entrée en état de sacralisation (Ihram) ainsi qu'à la fin de la Omra, pour vous permettre de vivre chaque étape en toute confiance.",
    omra: "Accomplissez votre Omra en toute confiance aux côtés de nos guides qualifiés et reconnus pour leur sérieux, leur science et leur éthique. Présents à chaque étape, ils vous accompagnent avec bienveillance afin que vous viviez ce voyage sacré dans la sérénité, la conformité aux rites et la recherche sincère de l'agrément d'Allah.",
    omraPmr: "Offrez-vous une Omra PMR en toute dignité et sérénité : un accompagnement sur mesure assuré par nos guides qualifiés, avec une prise en charge directement à votre hôtel situé au Haram, une assistance attentive durant chaque rite, puis un raccompagnement sécurisé à la fin de votre Omra, afin que vous puissiez adorer Allah en toute tranquillité et confiance.",
    visiteMedine: "La visite de Médine est une immersion au cœur de l'histoire et de l'amour du Prophète ﷺ : entre la Mosquée de Quba, le mont Uhud et ses martyrs, et la douceur des palmeraies, chaque étape est un rappel vivant de foi, de sacrifice et de miséricorde, guidé avec bienveillance pour nourrir votre cœur autant que votre esprit.",
    visiteMakkah: "La visite de Makkah est un voyage au cœur de la foi et de la dévotion : du Jabal Thawr, refuge du Prophète ﷺ, aux plaines sacrées d'Arafât, Mina et Mouzdalifa, jusqu'au Jabal Nour qui abrite la grotte de Hira, chaque étape vous rapproche de l'histoire, des sacrifices et de la lumière de l'Islam, guidé avec soin pour que votre cœur et votre esprit s'élèvent dans la contemplation et la sérénité.",
    visiteMasjidNabawi: "Masjid Nabawi en toute sérénité : foi, histoire et émotion guidées par nos guides experts.",
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

    if (normalizedText.includes('pmr')) {
        return FIXED_SERVICE_DESCRIPTIONS.omraPmr;
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
