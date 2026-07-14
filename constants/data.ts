export const CATEGORIES = [
    { id: '1', name: 'Omra', icon: 'users' },
    { id: '2', name: 'Omra Badal', icon: 'user-check' }, // Changed icon to valid Lucide icon name if needed, or keep 'hands-praying' if valid in set
    { id: '3', name: 'Visites guidées', icon: 'map' },
    { id: '4', name: 'Transport VIP', icon: 'car' },
    { id: '5', name: 'Hébergement', icon: 'home' }, // Changed 'hotel' to 'home' as generic or 'bed' if available
];

const buildServiceOption = (label: string, price: number, guideNetSar: number) => ({
    label,
    price,
    guideNetSar,
});

export const SERVICE_OPTIONS = [
    {
        category: 'Omra',
        options: [
            buildServiceOption('Omra seul ou en couple', 200, 530),
            buildServiceOption('Omra en famille ou entre amies', 250, 665),
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
            buildServiceOption('Standard', 150, 400),
        ]
    },
    {
        category: 'Visite du Masjid Nabawi',
        options: [
            buildServiceOption('Standard', 50, 130),
        ]
    },
    {
        category: 'Omra Ramadan',
        options: [
            buildServiceOption('Omra Ramadan seul ou en couple', 300, 800),
            buildServiceOption('Omra Ramadan en famille ou entre amies', 350, 930),
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

const MAKKAH_HADITHS = [
    {
        number: 1,
        title: 'Le caractère sacré (Ḥaram) de Makkah',
        arabic: 'إِنَّ هَذَا الْبَلَدَ حَرَّمَهُ اللَّهُ يَوْمَ خَلَقَ السَّمَاوَاتِ وَالْأَرْضَ، فَهُوَ حَرَامٌ بِحُرْمَةِ اللَّهِ إِلَى يَوْمِ الْقِيَامَةِ',
        text: 'Allah a rendu cette ville sacrée le jour où Il créa les cieux et la terre. Elle est donc sacrée par la sacralité d\'Allah jusqu\'au Jour de la Résurrection.',
        source: 'Ṣaḥīḥ al-Bukhārī n°1832 • Ṣaḥīḥ Muslim n°1353',
    },
    {
        number: 2,
        title: 'Interdiction de verser le sang et de couper les arbres à Makkah',
        arabic: 'لَا يَحِلُّ لِامْرِئٍ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ أَنْ يَسْفِكَ فِيهَا دَمًا، وَلَا يَعْضُدَ بِهَا شَجَرًا',
        text: 'Il n\'est pas permis à celui qui croit en Allah et au Jour dernier d\'y verser du sang ni d\'y couper un arbre.',
        source: 'Ṣaḥīḥ al-Bukhārī n°104 • Ṣaḥīḥ Muslim n°1354',
    },
    {
        number: 3,
        title: 'Makkah, la terre la plus aimée d\'Allah',
        arabic: 'وَاللَّهِ إِنَّكِ لَخَيْرُ أَرْضِ اللَّهِ، وَأَحَبُّ أَرْضِ اللَّهِ إِلَى اللَّهِ، وَلَوْلَا أَنِّي أُخْرِجْتُ مِنْكِ مَا خَرَجْتُ',
        text: 'Par Allah ! Tu es la meilleure terre d\'Allah et la plus aimée d\'Allah. Si je n\'en avais pas été expulsé, je ne t\'aurais jamais quittée.',
        source: 'Sunan at-Tirmidhī n°3925 • Ḥasan Ṣaḥīḥ, authentifié par al-Albānī',
    },
    {
        number: 4,
        title: 'La valeur de la prière à la Mosquée sacrée (al-Masjid al-Ḥarām)',
        arabic: 'صَلَاةٌ فِي الْمَسْجِدِ الْحَرَامِ خَيْرٌ مِنْ مِائَةِ أَلْفِ صَلَاةٍ فِيمَا سِوَاهُ',
        text: 'Une prière accomplie dans la Mosquée sacrée vaut cent mille prières accomplies ailleurs.',
        source: 'Musnad Aḥmad n°14694 • Authentifié par al-Albānī dans Ṣaḥīḥ al-Jāmiʿ',
    },
    {
        number: 5,
        title: 'La Kaaba, première maison édifiée sur terre',
        arabic: 'الْمَسْجِدُ الْحَرَامُ',
        text: 'Abū Dharr rapporte avoir demandé : « Ô Messager d\'Allah, quelle est la première mosquée qui fut établie sur terre ? » Il répondit : « La Mosquée sacrée (de Makkah). »',
        source: 'Ṣaḥīḥ al-Bukhārī n°3366',
    },
    {
        number: 6,
        title: 'La protection divine de Makkah',
        arabic: 'إِنَّ اللَّهَ حَبَسَ عَنْ مَكَّةَ الْفِيلَ، وَسَلَّطَ عَلَيْهَا رَسُولَهُ وَالْمُؤْمِنِينَ',
        text: 'Allah a empêché l\'éléphant d\'entrer à Makkah, puis Il y a établi Son Messager et les croyants.',
        source: 'Ṣaḥīḥ al-Bukhārī n°1053',
    },
    {
        number: 7,
        title: 'Les anges gardent les accès de Makkah',
        arabic: 'عَلَى أَنْقَابِ مَكَّةَ مَلَائِكَةٌ، لَا يَدْخُلُهَا الطَّاعُونُ وَلَا الدَّجَّالُ',
        text: 'Aux entrées de Makkah se trouvent des anges. Ni la peste ni l\'Antéchrist (Dajjāl) n\'y entreront.',
        source: 'Ṣaḥīḥ al-Bukhārī n°1880 • Ṣaḥīḥ Muslim n°1379',
    },
    {
        number: 8,
        title: 'Gravité du péché commis à Makkah',
        arabic: 'مَنْ أَحْدَثَ فِيهَا حَدَثًا أَوْ آوَى مُحْدِثًا فَعَلَيْهِ لَعْنَةُ اللَّهِ',
        text: 'Celui qui y commet une innovation ou protège un fauteur de troubles encourt la malédiction d\'Allah.',
        source: 'Ṣaḥīḥ Muslim n°1366',
    },
    {
        number: 9,
        title: 'Invocation du Prophète ﷺ pour Makkah',
        arabic: 'اللَّهُمَّ حَبِّبْ إِلَيْنَا مَكَّةَ كَحُبِّنَا الْمَدِينَةَ أَوْ أَشَدَّ',
        text: 'Ô Allah ! Fais-nous aimer Makkah comme nous aimons Médine, ou plus encore.',
        source: 'Ṣaḥīḥ al-Bukhārī n°6372 • Ṣaḥīḥ Muslim n°1376',
    },
];

export const SERVICES = [
    {
        id: 'omra-accompagne',
        title: 'Omra',
        titleArabic: 'Omra',
        shortDescription: 'Vivez votre Omra avec sérénité',
        description: 'Accomplissez votre Omra en toute confiance aux côtés de nos guides qualifiés et reconnus pour leur sérieux, leur science et leur éthique. Présents à chaque étape, ils vous accompagnent avec bienveillance afin que vous viviez ce voyage sacré dans la sérénité, la conformité aux rites et la recherche sincère de l\'agrément d\'Allah.',
        mainText: 'Accomplissez votre Omra en toute confiance aux côtés de nos guides qualifiés et reconnus pour leur sérieux, leur science et leur éthique.',
        details: 'Présents à chaque étape, ils vous accompagnent avec bienveillance afin que vous viviez ce voyage sacré dans la sérénité, la conformité aux rites et la recherche sincère de l\'agrément d\'Allah.',
        hadith: null,
        hadiths: MAKKAH_HADITHS,
        image: require('@/assets/images/mecca.jpg'),
    },
    {
        id: 'omra-badal',
        title: 'Omra Badal',
        titleArabic: 'Omra par Procuration',
        shortDescription: 'Une Miséricorde pour vos proches',
        description: 'Confiez-nous votre Omra Badal : une adoration accomplie avec sérieux, transparence et sincérité. Votre guide vous enverra 2 à 3 vidéos pendant les étapes essentielles, pour vous permettre de vivre la prestation en toute confiance.',
        mainText: 'Un voyage de foi vers les lieux les plus purs de la Terre, qui efface les péchés et purifie le cœur. De l\'Ihram au Tawaf autour de la Kaaba, jusqu\'au Sa\'i entre Safa et Marwa.',
        details: 'Félicitations à vous pour ce voyage de foi grandiose. Vous laissez derrière vous les soucis d\'ici-bas pour atteindre La Mecque honorée, la terre bénie qu\'Allah a magnifiée.',
        hadith: null,
        hadiths: MAKKAH_HADITHS,
        image: require('@/assets/images/mecca.jpg'),
    },
    {
        id: 'visite-guidee',
        title: 'Visites Guidées',
        titleArabic: 'Visite de Médine',
        shortDescription: 'Découvrez l\'histoire sacrée',
        description: 'Masjid Nabawi en toute sérénité : foi, histoire et émotion guidées par nos guides experts.',
        mainText: 'Visiter les sites historiques de La Mecque et Médine vous relie à la vie du Prophète ﷺ et de ses compagnons.',
        details: 'Visitez la montagne de Uhud, la mosquée de Quba, et le cimetière d\'Al-Baqi\' où reposent les compagnons du Prophète ﷺ. Une immersion totale dans l\'histoire de l\'Islam.',
        hadith: null,
        hadiths: [
            {
                number: 1,
                title: 'Médine est un sanctuaire sacré (Haram)',
                arabic: 'إِنَّ إِبْرَاهِيمَ حَرَّمَ مَكَّةَ، وَإِنِّي حَرَّمْتُ الْمَدِينَةَ، مَا بَيْنَ لَابَتَيْهَا، لَا يُقْطَعُ شَجَرُهَا، وَلَا يُحْدَثُ فِيهَا حَدَثٌ',
                text: 'Ibrahim a rendu sacrée La Mecque, et moi j\'ai rendu sacrée Médine, ce qui se trouve entre ses deux terrains volcaniques. On n\'y coupe pas ses arbres et on n\'y commet aucune innovation (grave).',
                source: 'Sahîh al-Bukhârî n°1867 • Sahîh Muslim n°1370',
            },
            {
                number: 2,
                title: 'Médine est sacrée entre ses deux montagnes',
                arabic: 'إِنِّي أُحَرِّمُ مَا بَيْنَ لَابَتَيِ الْمَدِينَةِ',
                text: 'Je déclare sacré ce qui se trouve entre les deux terrains volcaniques de Médine.',
                source: 'Sahîh al-Bukhârî n°1869',
            },
            {
                number: 3,
                title: 'La malédiction sur celui qui profane Médine',
                arabic: 'مَنْ أَحْدَثَ فِيهَا حَدَثًا أَوْ آوَى مُحْدِثًا فَعَلَيْهِ لَعْنَةُ اللَّهِ وَالْمَلَائِكَةِ وَالنَّاسِ أَجْمَعِينَ',
                text: 'Celui qui y commet une innovation (grave) ou protège un innovateur, sur lui sera la malédiction d\'Allah, des anges et de l\'ensemble des gens.',
                source: 'Sahîh al-Bukhârî n°1870 • Sahîh Muslim n°1370',
            },
            {
                number: 4,
                title: 'Médine expulse les mauvais comme un soufflet',
                arabic: 'إِنَّ الْمَدِينَةَ كَالْكِيرِ، تَنْفِي خَبَثَهَا وَيَنْصَعُ طَيِّبُهَا',
                text: 'Médine est comme un soufflet : elle expulse ce qui est mauvais et purifie ce qui est bon.',
                source: 'Sahîh al-Bukhârî n°1883 • Sahîh Muslim n°1383',
            },
            {
                number: 5,
                title: 'La foi se réfugiera à Médine',
                arabic: 'إِنَّ الْإِيمَانَ لَيَأْرِزُ إِلَى الْمَدِينَةِ كَمَا تَأْرِزُ الْحَيَّةُ إِلَى جُحْرِهَا',
                text: 'La foi se réfugiera à Médine comme le serpent se réfugie dans son trou.',
                source: 'Sahîh al-Bukhârî n°1876 • Sahîh Muslim n°147',
            },
            {
                number: 6,
                title: 'Invocation du Prophète ﷺ pour la bénédiction de Médine',
                arabic: 'اللَّهُمَّ بَارِكْ لَنَا فِي مَدِينَتِنَا، وَفِي صَاعِنَا، وَفِي مُدِّنَا، وَزِدْ مَعَ الْبَرَكَةِ بَرَكَةً',
                text: 'Ô Allah, bénis pour nous notre Médine, bénis notre mesure (sa\') et notre demi-mesure (mudd), et ajoute bénédiction sur bénédiction.',
                source: 'Sahîh al-Bukhârî n°1885 • Sahîh Muslim n°1374',
            },
            {
                number: 7,
                title: 'Médine est appelée "Taybah / Tâbah" (la pure)',
                arabic: 'هَذِهِ طَابَةُ',
                text: 'Ceci est Tâbah (la Pure).',
                source: 'Sahîh Muslim n°1383',
            },
            {
                number: 8,
                title: 'Encouragement à mourir à Médine',
                arabic: 'مَنْ اسْتَطَاعَ مِنْكُمْ أَنْ يَمُوتَ بِالْمَدِينَةِ فَلْيَمُتْ بِهَا، فَإِنِّي أَشْفَعُ لِمَنْ يَمُوتُ بِهَا',
                text: 'Que celui d\'entre vous qui peut mourir à Médine, qu\'il y meure, car j\'intercéderai pour celui qui y meurt.',
                source: 'Musnad Ahmad n°16645 • Authentifié par Al-Albânî (Sahîh at-Targhîb 1196)',
            },
            {
                number: 9,
                title: 'Patience face aux épreuves de Médine',
                arabic: 'لَا يَصْبِرُ عَلَى لَأْوَائِهَا وَشِدَّتِهَا أَحَدٌ إِلَّا كُنْتُ لَهُ شَهِيدًا أَوْ شَفِيعًا يَوْمَ الْقِيَامَةِ',
                text: 'Nul ne patiente face aux difficultés de Médine sans que je ne sois pour lui un témoin ou un intercesseur le Jour de la Résurrection.',
                source: 'Sahîh Muslim n°1377',
            },
        ],
        image: require('@/assets/images/medina.jpeg'),
    },
    {
        id: 'visite-masjid-nabawi',
        title: 'Visite du Masjid Nabawi',
        titleArabic: 'زيارة المسجد النبوي',
        shortDescription: 'Foi, histoire et émotion au cœur de la mosquée du Prophète ﷺ',
        description: 'Masjid Nabawi en toute sérénité : foi, histoire et émotion guidées par nos guides experts.',
        mainText: 'Vivez une visite légiférée du Masjid Nabawi accompagné par un guide expert : portes importantes, Al-Rawdha, cimetière du Baqi\' et lieux historiques expliqués avec sérieux et bienveillance.',
        details: 'Vous découvrirez les portes importantes du Masjid Nabawi, Al-Rawdha, le cimetière du Baqi\', l\'emplacement où prier pour suivre le cortège funéraire, l\'emplacement maximum de la prière (pour ne pas se retrouver devant l\'imam), le Musée ainsi que les endroits où aller se restaurer.',
        hadith: null,
        hadiths: [
            {
                number: 1,
                title: 'La prière au Masjid Nabawi vaut mille prières',
                arabic: 'صَلَاةٌ فِي مَسْجِدِي هَذَا خَيْرٌ مِنْ أَلْفِ صَلَاةٍ فِيمَا سِوَاهُ، إِلَّا الْمَسْجِدَ الْحَرَامَ',
                text: 'Une prière dans cette mosquée qui est la mienne vaut mieux que mille prières accomplies ailleurs, à l\'exception de la Mosquée sacrée.',
                source: 'Ṣaḥīḥ al-Bukhārī n°1190 • Ṣaḥīḥ Muslim n°1394',
            },
            {
                number: 2,
                title: 'Al-Rawdha, un jardin du Paradis',
                arabic: 'مَا بَيْنَ بَيْتِي وَمِنْبَرِي رَوْضَةٌ مِنْ رِيَاضِ الْجَنَّةِ',
                text: 'Ce qui se trouve entre ma maison et mon minbar est l\'un des jardins du Paradis.',
                source: 'Ṣaḥīḥ al-Bukhārī n°1196 • Ṣaḥīḥ Muslim n°1391',
            },
            {
                number: 3,
                title: 'Le minbar du Prophète ﷺ',
                arabic: 'وَمِنْبَرِي عَلَى حَوْضِي',
                text: 'Et mon minbar se trouve au-dessus de mon Bassin (al-Ḥawḍ).',
                source: 'Ṣaḥīḥ al-Bukhārī n°1196 • Ṣaḥīḥ Muslim n°1391',
            },
            {
                number: 4,
                title: 'Mérite de visiter le Masjid Nabawi',
                arabic: 'لَا تُشَدُّ الرِّحَالُ إِلَّا إِلَى ثَلَاثَةِ مَسَاجِدَ: الْمَسْجِدِ الْحَرَامِ، وَمَسْجِدِي هَذَا، وَالْمَسْجِدِ الْأَقْصَى',
                text: 'On ne se met en voyage que vers trois mosquées : la Mosquée sacrée, ma mosquée que voici, et la Mosquée al-Aqsa.',
                source: 'Ṣaḥīḥ al-Bukhārī n°1189 • Ṣaḥīḥ Muslim n°1397',
            },
            {
                number: 5,
                title: 'Médine est sacrée',
                arabic: 'إِنَّ إِبْرَاهِيمَ حَرَّمَ مَكَّةَ، وَإِنِّي حَرَّمْتُ الْمَدِينَةَ، مَا بَيْنَ لَابَتَيْهَا',
                text: 'Ibrahim a rendu sacrée La Mecque, et moi j\'ai rendu sacrée Médine, ce qui se trouve entre ses deux terrains volcaniques.',
                source: 'Ṣaḥīḥ al-Bukhārī n°1867 • Ṣaḥīḥ Muslim n°1370',
            },
            {
                number: 6,
                title: 'Invocation pour les habitants du Baqi\'',
                arabic: 'السَّلَامُ عَلَيْكُمْ أَهْلَ الدِّيَارِ مِنَ الْمُؤْمِنِينَ وَالْمُسْلِمِينَ، وَإِنَّا إِنْ شَاءَ اللَّهُ بِكُمْ لَلَاحِقُونَ، يَرْحَمُ اللَّهُ الْمُسْتَقْدِمِينَ مِنَّا وَالْمُسْتَأْخِرِينَ، نَسْأَلُ اللَّهَ لَنَا وَلَكُمُ الْعَافِيَةَ',
                text: 'Que la paix soit sur vous, gens de ces demeures parmi les croyants et les musulmans. Nous, si Allah le veut, vous rejoindrons. Qu\'Allah fasse miséricorde à ceux d\'entre nous qui sont partis avant et à ceux qui les suivront. Nous demandons à Allah la préservation pour nous et pour vous.',
                source: 'Ṣaḥīḥ Muslim n°974',
            },
            {
                number: 7,
                title: 'Médine, refuge de la foi',
                arabic: 'إِنَّ الْإِيمَانَ لَيَأْرِزُ إِلَى الْمَدِينَةِ كَمَا تَأْرِزُ الْحَيَّةُ إِلَى جُحْرِهَا',
                text: 'La foi se réfugiera à Médine comme le serpent se réfugie dans son trou.',
                source: 'Ṣaḥīḥ al-Bukhārī n°1876 • Ṣaḥīḥ Muslim n°147',
            },
            {
                number: 8,
                title: 'Les anges gardent Médine',
                arabic: 'عَلَى أَنْقَابِ الْمَدِينَةِ مَلَائِكَةٌ، لَا يَدْخُلُهَا الطَّاعُونُ وَلَا الدَّجَّالُ',
                text: 'Aux entrées de Médine se trouvent des anges. Ni la peste ni l\'Antéchrist (Dajjāl) n\'y entreront.',
                source: 'Ṣaḥīḥ al-Bukhārī n°1880 • Ṣaḥīḥ Muslim n°1379',
            },
            {
                number: 9,
                title: 'Mérite de mourir à Médine',
                arabic: 'مَنِ اسْتَطَاعَ مِنْكُمْ أَنْ يَمُوتَ بِالْمَدِينَةِ فَلْيَمُتْ بِهَا، فَإِنِّي أَشْفَعُ لِمَنْ يَمُوتُ بِهَا',
                text: 'Que celui d\'entre vous qui peut mourir à Médine, qu\'il y meure, car j\'intercéderai pour celui qui y meurt.',
                source: 'Sunan at-Tirmidhī n°3917 • Authentifié par al-Albānī',
            },
        ],
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
