export const CATEGORIES = [
    { id: '1', name: 'Omra accompagnée', icon: 'users' },
    { id: '2', name: 'Omra Badal', icon: 'user-check' }, // Changed icon to valid Lucide icon name if needed, or keep 'hands-praying' if valid in set
    { id: '3', name: 'Visites guidées', icon: 'map' },
    { id: '4', name: 'Transport VIP', icon: 'car' },
    { id: '5', name: 'Hébergement', icon: 'home' }, // Changed 'hotel' to 'home' as generic or 'bed' if available
];

export const SERVICE_OPTIONS = [
    {
        category: 'Omra accompagnée (hors Ramadan)',
        options: [
            { label: 'Omra seul ou en couple', price: 200 },
            { label: 'Omra en famille (3 à 7 personnes)', price: 250 },
            { label: 'Omra en groupe', price: 300 }
        ]
    },
    {
        category: 'Omra accompagnée Ramadan',
        options: [
            { label: 'Omra seul ou en couple', price: 300 },
            { label: 'Omra en famille (3 à 7 personnes)', price: 350 },
            { label: 'Omra en groupe', price: 400 }
        ]
    },
    {
        category: 'Omra PMR ♿',
        options: [
            { label: 'Standard', price: 200 },
            { label: 'Ramadan', price: 300 }
        ]
    },
    {
        category: 'Omra Badal',
        options: [
            { label: 'Standard', price: 150 },
            { label: 'Ramadan', price: 250 }
        ]
    },
    {
        category: 'Visites guidées légiféré Médine ou Makkah',
        options: [
            { label: 'Standard', price: 150 }
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
        image: require('@/assets/images/profil.jpeg'),
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
        image: require('@/assets/images/profil.jpeg'), // Fallback to same profile or different if available
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
        image: require('@/assets/images/profil.jpeg'),
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
        image: require('@/assets/images/profil.jpeg'),
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
        avatar: require('@/assets/images/profil.jpeg'),
    },
    {
        id: '2',
        user: 'Karim Benali',
        message: 'Can you confirm the pickup location at the hotel?',
        time: 'Yesterday',
        unread: 0,
        avatar: require('@/assets/images/profil.jpeg'),
    },
];

export const SERVICES = [
    {
        id: 'omra-badal',
        title: 'Omra Badal',
        titleArabic: 'Omra par Procuration', // Changed to French as requested to have "text in French"
        shortDescription: 'Une Miséricorde pour vos proches',
        description: 'Accomplissez une Omra au nom d\'un proche décédé ou malade, une œuvre pieuse d\'une immense valeur spirituelle.',
        mainText: 'Un voyage de foi vers les lieux les plus purs de la Terre, qui efface les péchés et purifie le cœur. De l\'Ihram au Tawaf autour de la Kaaba, jusqu\'au Sa\'i entre Safa et Marwa.',
        details: 'Félicitations à vous pour ce voyage de foi grandiose. Vous laissez derrière vous les soucis d\'ici-bas pour atteindre La Mecque honorée, la terre bénie qu\'Allah a magnifiée.',
        hadith: 'Le Prophète ﷺ a dit : "La Omra efface les péchés commis entre elle et la précédente."',
        image: require('@/assets/images/mecca.jpg'),
    },
    {
        id: 'visite-guidee',
        title: 'Visites Guidées',
        titleArabic: 'Visite de Médine',
        shortDescription: 'Découvrez l\'histoire sacrée',
        description: 'Explorez les lieux saints de Médine et La Mecque avec des guides experts pour comprendre l\'histoire prophétique.',
        mainText: 'Visiter les sites historiques de La Mecque et Médine vous relie à la vie du Prophète ﷺ et de ses compagnons.',
        details: 'Visitez la montagne de Uhud, la mosquée de Quba, et les sites historiques de la bataille du Fossé. Une immersion totale dans l\'histoire de l\'Islam.',
        hadith: 'Une prière dans ma mosquée est meilleure que mille prières ailleurs, sauf la Mosquée Sacrée.',
        image: require('@/assets/images/medina.jpeg'),
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
        image: require('@/assets/images/profil.jpeg'),
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
        image: require('@/assets/images/profil.jpeg'),
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
