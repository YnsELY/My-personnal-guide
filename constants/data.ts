export const CATEGORIES = [
    { id: '1', name: 'Omra accompagnée', icon: 'users' },
    { id: '2', name: 'Omra Badal', icon: 'user-check' },
    { id: '3', name: 'Visites guidées', icon: 'map' },
];

const buildServiceOption = (label: string, price: number, guideNetSar: number) => ({
    label,
    price,
    guideNetSar,
});

export const SERVICE_OPTIONS = [
    {
        category: 'Omra accompagnée (hors Ramadan)',
        options: [
            buildServiceOption('Omra seul ou en couple', 200, 530),
            buildServiceOption('Omra en famille (3 à 7 personnes)', 250, 665),
            buildServiceOption('Omra en groupe', 300, 800),
        ]
    },
    {
        category: 'Omra accompagnée Ramadan',
        options: [
            buildServiceOption('Omra seul ou en couple', 300, 800),
            buildServiceOption('Omra en famille (3 à 7 personnes)', 350, 930),
            buildServiceOption('Omra en groupe', 400, 1060),
        ]
    },
    {
        category: '2ème Omra accompagnée (hors Ramadan)',
        options: [
            buildServiceOption('Omra seul ou en couple', 200, 530),
            buildServiceOption('Omra en famille (3 à 7 personnes)', 250, 665),
            buildServiceOption('Omra en groupe', 300, 800),
        ]
    },
    {
        category: '2ème Omra accompagnée Ramadan',
        options: [
            buildServiceOption('Omra seul ou en couple', 300, 800),
            buildServiceOption('Omra en famille (3 à 7 personnes)', 350, 930),
            buildServiceOption('Omra en groupe', 400, 1060),
        ]
    },
    {
        category: 'Omra Badal',
        options: [
            buildServiceOption('Standard', 150, 400),
            buildServiceOption('Ramadan', 250, 600),
        ]
    },
    {
        category: 'Visites guidées légiféré Médine ou Makkah',
        options: [
            buildServiceOption('Standard Médine', 150, 400),
            buildServiceOption('Standard Mekkah', 150, 400),
        ]
    }
];

export const GUIDES = [
    {
        id: '1',
        name: 'Ahmed Al-Farsi',
        role: 'Historical Guide',
        rating: 4.9,
        reviews: 128,
        price: '200 €',
        priceUnit: '/tour',
        languages: ['French', 'Arabic', 'English'],
        // Photo of a man in traditional Saudi dress / Omra context
        image: require('@/assets/images/services/9.webp'),
        location: 'Mecca',
        verified: true,
        bio: 'Specialized in the history of Mecca and the Seerah. 10 years of experience taking pilgrims to historical sites.',
        gender: 'male'
    },
    {
        id: '2',
        name: 'Karim Benali',
        role: 'Transport & Ziyara',
        rating: 4.7,
        reviews: 85,
        price: '150 €',
        priceUnit: '/trip',
        languages: ['French', 'Darija', 'Arabic'],
        // Photo representing Medina / Transport or Guide
        image: require('@/assets/images/services/9.webp'), // Fallback to same profile or different if available
        location: 'Medina',
        verified: true,
        bio: 'Comfortable transport for Ziyara in Medina. Knowledgeable about all holy sites and best times to visit.',
        gender: 'male'
    },
    {
        id: '3',
        name: 'Sara Omar',
        role: 'Female Group Guide',
        rating: 5.0,
        reviews: 42,
        price: '300 €',
        priceUnit: '/day',
        languages: ['French', 'English'],
        // Photo of a woman in Hijab / Pilgrim context
        image: require('@/assets/images/services/9.webp'),
        location: 'Mecca',
        verified: true,
        bio: 'Dedicated guide for sisters performing Omra. Assisting with rituals, shopping, and navigating the Haram.',
        gender: 'female'
    },
    {
        id: '4',
        name: 'Youssef Kaboul',
        role: 'VIP Services',
        rating: 4.8,
        reviews: 56,
        price: '500 €',
        priceUnit: '/day',
        languages: ['French', 'English', 'Urdu'],
        // Man in business/formal attire or traditional
        image: require('@/assets/images/services/9.webp'),
        location: 'Mecca',
        verified: true,
        bio: 'Luxury experience for VIP pilgrims. Private car, exclusive access assistance, and 24/7 support.',
        gender: 'male'
    },
];

export const MESSAGES = [
    {
        id: '1',
        user: 'Ahmed Al-Farsi',
        message: 'Wa alaykum salam! Yes, I am available this Friday for the Ziyara.',
        time: '10:30 AM',
        unread: 2,
        avatar: require('@/assets/images/services/9.webp'),
    },
    {
        id: '2',
        user: 'Karim Benali',
        message: 'Can you confirm the pickup location at the hotel?',
        time: 'Yesterday',
        unread: 0,
        avatar: require('@/assets/images/services/9.webp'),
    },
];

export const SERVICES = [
    {
        id: 'omra-accompagne',
        title: 'Omra accompagné',
        titleArabic: 'Omra accompagnée',
        shortDescription: 'Vivez votre Omra avec sérénité',
        description: 'Accomplissez votre Omra aux côtés de guides qualifiés pour un accompagnement fiable et bienveillant.',
        mainText: 'Accomplissez votre Omra en toute confiance aux côtés de nos guides qualifiés et reconnus pour leur sérieux, leur science et leur éthique. Présents à chaque étape, ils vous accompagnent avec bienveillance afin que vous viviez ce voyage sacré dans la sérénité, la conformité aux rites et la recherche sincère de l\'agrément d\'Allah.',
        details: 'Présents à chaque étape, ils vous accompagnent avec bienveillance afin que vous viviez ce voyage sacré dans la sérénité, la conformité aux rites et la recherche sincère de l\'agrément d\'Allah.',
        hadith: 'Le Prophète ﷺ a dit : "La Omra efface les péchés commis entre elle et la précédente."',
        image: require('@/assets/images/services/Design sans titre-3.webp'),
    },
    {
        id: 'deuxieme-omra',
        title: '2ème Omra – Masjid Aisha (Tan\'im)',
        titleArabic: '2ème Omra – Masjid Aisha',
        shortDescription: 'Une 2ème Omra depuis Masjid Aisha (Tan\'im)',
        description: 'Effectuez une 2ème Omra en toute sérénité depuis Masjid Aisha (Tan\'im), lieu authentique où le Prophète ﷺ autorisa Aïcha رضي الله عنها à entrer en ihram.',
        mainText: 'Effectuez une 2ème Omra en toute sérénité depuis Masjid Aisha (Tan\'im), lieu authentique où le Prophète ﷺ autorisa Aïcha رضي الله عنها à entrer en ihram.\n\nCette prestation est proposée selon l\'avis majoritaire des savants, tout en respectant la divergence existante.\n\nCette prestation est basée sur l\'avis de grands savants tels que l\'Imam Ash-Shafi\'i, l\'Imam Ahmad, An-Nawawi, Ibn Baz et Ibn \'Uthaymin, qui ont autorisé la répétition de la Omra depuis Tan\'im, conformément au hadith authentique de Aïcha رضي الله عنها.',
        details: 'Accomplissez votre deuxième Omra aux côtés de nos guides qualifiés pour un accompagnement fiable, conforme aux rites, dans la sérénité et la recherche de l\'agrément d\'Allah.',
        hadith: 'Le Prophète ﷺ a dit : "La Omra efface les péchés commis entre elle et la précédente."',
        image: require('@/assets/images/services/6-copie-2 copie.webp'),
    },
    {
        id: 'omra-badal',
        title: 'Omra Badal',
        titleArabic: 'Omra par Procuration', // Changed to French as requested to have "text in French"
        shortDescription: 'Une Miséricorde pour vos proches',
        description: 'Accomplissez une Omra au nom d\'un proche décédé ou malade, une œuvre pieuse d\'une immense valeur spirituelle.',
        mainText: 'Confiez-nous votre Omra Badal : une adoration accomplie avec sérieux, transparence et sincérité. Votre guide vous enverra une courte vidéo à l\'entrée en état de sacralisation (Ihram) ainsi qu\'à la fin de la Omra, pour vous permettre de vivre chaque étape en toute confiance.',
        details: 'Félicitations à vous pour ce voyage de foi grandiose. Vous laissez derrière vous les soucis d\'ici-bas pour atteindre La Mecque honorée, la terre bénie qu\'Allah a magnifiée.',
        hadith: 'Le Prophète ﷺ a dit : "La Omra efface les péchés commis entre elle et la précédente."',
        image: require('@/assets/images/services/9.webp'),
    },
    {
        id: 'visite-guidee',
        title: 'Visites Guidées — Médine',
        titleArabic: 'Visite de Médine',
        shortDescription: 'Découvrez l\'histoire sacrée de Médine',
        description: 'Explorez les lieux saints de Médine avec des guides experts pour comprendre l\'histoire prophétique.',
        mainText: 'La visite de Médine est une immersion au cœur de l\'histoire et de l\'amour du Prophète ﷺ : entre la Mosquée de Quba, le mont Uhud et ses martyrs, et la douceur des palmeraies, chaque étape est un rappel vivant de foi, de sacrifice et de miséricorde, guidé avec bienveillance pour nourrir votre cœur autant que votre esprit.',
        details: 'Visitez la montagne de Uhud, la mosquée de Quba, et les sites historiques de la bataille du Fossé. Une immersion totale dans l\'histoire de l\'Islam.',
        hadith: 'Une prière dans ma mosquée est meilleure que mille prières ailleurs, sauf la Mosquée Sacrée.',
        image: require('@/assets/images/services/2-copie copie.webp'),
    },
    {
        id: 'visite-guidee-makkah',
        title: 'Visites Guidées — La Mecque',
        titleArabic: 'Visite de Makkah',
        shortDescription: 'Découvrez les lieux saints de La Mecque',
        description: 'Explorez les sites historiques de La Mecque avec un guide expert en histoire et en rites islamiques.',
        mainText: 'La visite de Makkah est un voyage au cœur de la foi et de la dévotion : du Jabal Thawr, refuge du Prophète ﷺ, aux plaines sacrées d\'Arafât, Mina et Mouzdalifa, jusqu\'au Jabal Nour qui abrite la grotte de Hira, chaque étape vous rapproche de l\'histoire, des sacrifices et de la lumière de l\'Islam, guidé avec soin pour que votre cœur et votre esprit s\'élèvent dans la contemplation et la sérénité.',
        details: 'Du Jabal Nour à la grotte de Hira, en passant par les plaines d\'Arafât et Mina, chaque étape est un rappel vivant de la foi et du sacrifice.',
        hadith: 'La Mosquée Sacrée est la plus noble des mosquées sur terre.',
        image: require('@/assets/images/services/7-copie copie.webp'),
    }
];

export const RESERVATIONS = [
    {
        id: 'r1',
        guideId: '1',
        guideName: 'Ahmed Al-Farsi',
        serviceName: 'Visite Historique',
        date: '15 Jan 2026',
        time: '08:00',
        status: 'upcoming', // upcoming, completed, cancelled
        price: '200 €',
        image: require('@/assets/images/services/9.webp'),
        location: 'Hôtel Makkah',
    },
    {
        id: 'r2',
        guideId: '2',
        guideName: 'Karim Benali',
        serviceName: 'Omra Badal',
        date: '10 Jan 2026',
        time: '14:00',
        status: 'completed',
        price: '450 €',
        image: require('@/assets/images/services/9.webp'),
        location: 'Gare Haramain',
    },
];

export const HADITHS = [
    {
        text: "Les actions ne valent que par leurs intentions, et chacun n'aura que ce qu'il a eu l'intention d'avoir.",
        source: "Bukhari & Muslim"
    },
    {
        text: "Le meilleur d'entre vous est celui qui apprend le Coran et l'enseigne.",
        source: "Bukhari"
    },
    {
        text: "Méfiez-vous de l'injustice, car l'injustice sera ténèbres le Jour de la Résurrection.",
        source: "Muslim"
    },
    {
        text: "La patience est une lumière.",
        source: "Muslim"
    },
    {
        text: "Celui qui ne remercie pas les gens ne remercie pas Allah.",
        source: "Tirmidhi"
    },
    {
        text: "Souris à ton frère est une aumône.",
        source: "Tirmidhi"
    },
    {
        text: "La richesse ne consiste pas en l'abondance des biens, mais la vraie richesse est celle de l'âme.",
        source: "Bukhari & Muslim"
    }
];

export const GUIDE_VISITS = [
    {
        id: '1',
        pilgrimName: 'Amine Z.',
        date: '25 Jan 2026',
        time: '09:00',
        location: 'Hôtel Makkah',
        service: 'Ziyara Historique',
        status: 'upcoming'
    },
    {
        id: '2',
        pilgrimName: 'Sarah B.',
        date: '26 Jan 2026',
        time: '14:30',
        location: 'Mosquée Quba',
        service: 'Visite Guidée',
        status: 'upcoming'
    },
    {
        id: '3',
        pilgrimName: 'Famille K.',
        date: '28 Jan 2026',
        time: '08:00',
        location: 'Mont Uhud',
        service: 'Transport VIP',
        status: 'upcoming'
    }
];

export const GUIDE_REQUESTS = [
    {
        id: 'r1',
        pilgrimName: 'Yassir M.',
        date: '30 Jan 2026',
        service: 'Omra Badal',
        price: '450 €',
        time: '10:00',
        status: 'pending'
    },
    {
        id: 'r2',
        pilgrimName: 'Noura T.',
        date: '02 Feb 2026',
        service: 'Ziyara Médine',
        price: '200 €',
        time: '15:00',
        status: 'pending'
    },
    {
        id: 'r3',
        pilgrimName: 'Karim L.',
        date: '05 Feb 2026',
        service: 'Accompagnement',
        price: '300 €',
        time: '09:00',
        status: 'pending'
    }
];
