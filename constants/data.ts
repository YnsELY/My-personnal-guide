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
