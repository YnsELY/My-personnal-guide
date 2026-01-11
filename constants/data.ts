export const CATEGORIES = [
    { id: '1', name: 'Omra Badal', icon: 'heart' },
    { id: '2', name: 'Visite Guidée', icon: 'map' },
    { id: '3', name: 'Transport', icon: 'car' },
    { id: '4', name: 'Omra PMR', icon: 'accessibility' },
    { id: '5', name: 'Famille', icon: 'users' },
];

export const GUIDES = [
    {
        id: '1',
        name: 'Ahmed Al-Farsi',
        role: 'Historical Guide',
        rating: 4.9,
        reviews: 128,
        price: '200 SAR',
        priceUnit: '/tour',
        languages: ['French', 'Arabic', 'English'],
        // Photo of a man in traditional Saudi dress / Omra context
        image: require('@/assets/images/profil.jpeg'),
        location: 'Mecca',
        verified: true,
        bio: 'Specialized in the history of Mecca and the Seerah. 10 years of experience taking pilgrims to historical sites.',
    },
    {
        id: '2',
        name: 'Karim Benali',
        role: 'Transport & Ziyara',
        rating: 4.7,
        reviews: 85,
        price: '150 SAR',
        priceUnit: '/trip',
        languages: ['French', 'Darija', 'Arabic'],
        // Photo representing Medina / Transport or Guide
        image: require('@/assets/images/profil.jpeg'), // Fallback to same profile or different if available
        location: 'Medina',
        verified: true,
        bio: 'Comfortable transport for Ziyara in Medina. Knowledgeable about all holy sites and best times to visit.',
    },
    {
        id: '3',
        name: 'Sara Omar',
        role: 'Female Group Guide',
        rating: 5.0,
        reviews: 42,
        price: '300 SAR',
        priceUnit: '/day',
        languages: ['French', 'English'],
        // Photo of a woman in Hijab / Pilgrim context
        image: require('@/assets/images/profil.jpeg'),
        location: 'Mecca',
        verified: true,
        bio: 'Dedicated guide for sisters performing Omra. Assisting with rituals, shopping, and navigating the Haram.',
    },
    {
        id: '4',
        name: 'Youssef Kaboul',
        role: 'VIP Services',
        rating: 4.8,
        reviews: 56,
        price: '500 SAR',
        priceUnit: '/day',
        languages: ['French', 'English', 'Urdu'],
        // Man in business/formal attire or traditional
        image: require('@/assets/images/profil.jpeg'),
        location: 'Mecca',
        verified: true,
        bio: 'Luxury experience for VIP pilgrims. Private car, exclusive access assistance, and 24/7 support.',
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
