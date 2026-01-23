import { GUIDES } from '@/constants/data';
import { supabase } from '@/lib/supabase';

// --- Auth & Seeding ---

// --- Auth ---

export const signUp = async (email: string, password: string, fullName: string, role: 'guide' | 'pilgrim') => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                role: role
            }
        }
    });
    if (error) throw error;
    return data;
};

export const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    if (error) throw error;
    return data;
};

export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};

export const getCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user || null;
};

export const getCurrentProfile = async () => {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) return null; // Profile might not exist yet if trigger failed or loose consistency
    return data;
};

// Kept for legacy/testing if needed, but updated to use real auth check only
export const ensureUser = async () => {
    const user = await getCurrentUser();
    return user?.id;
};

export const seedGuides = async () => {
    try {
        const { count } = await supabase.from('guides').select('*', { count: 'exact', head: true });
        if (count && count > 0) return; // Already seeded

        console.log("Seeding guides...");
        for (const guide of GUIDES) {
            const email = `guide_${guide.id}@guideomra.com`;
            const password = 'password123';

            // 1. Create User
            let userId;
            const signUp = await supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: guide.name, role: 'guide' } }
            });

            if (signUp.data.user) {
                userId = signUp.data.user.id;
            } else if (signUp.error?.message.includes('already registered')) {
                const signIn = await supabase.auth.signInWithPassword({ email, password });
                userId = signIn.data.user?.id;
            }

            if (userId) {
                // 2. Insert into guides table
                const priceMatch = guide.price.match(/\d+/);
                const price = priceMatch ? parseInt(priceMatch[0]) : 0;

                const { error: guideError } = await supabase.from('guides').upsert({
                    id: userId,
                    bio: guide.bio,
                    location: guide.location,
                    price_per_day: price,
                    currency: 'SAR',
                    price_unit: guide.priceUnit,
                    languages: guide.languages,
                    verified: guide.verified,
                    rating: guide.rating,
                    reviews_count: guide.reviews,
                    specialty: guide.role
                });

                if (guideError) console.error(`Error creating guide profile for ${guide.name}:`, guideError);
            }
        }
        console.log("Seeding complete.");
    } catch (e) {
        console.error("Seeding failed", e);
    }
};


// --- Data Access ---

// Deprecated or used for other purposes?
export const getGuides = async () => {
    const { data, error } = await supabase
        .from('guides')
        .select('*, profiles(full_name, avatar_url)');

    if (error) throw error;

    return data.map((g: any) => ({
        id: g.id,
        name: g.profiles?.full_name || 'Unknown',
        role: g.specialty,
        rating: g.rating,
        reviews: g.reviews_count,
        price: `${g.price_per_day} ${g.currency}`,
        priceUnit: g.price_unit,
        languages: g.languages,
        image: g.profiles?.avatar_url ? { uri: g.profiles.avatar_url } : require('@/assets/images/profil.jpeg'),
        location: g.location,
        verified: g.verified,
        bio: g.bio
    }));
};

export const getServices = async () => {
    const { data, error } = await supabase
        .from('services')
        .select('*, profiles(full_name, avatar_url, role)')
        .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((s: any) => ({
        id: s.id,
        title: s.title,
        category: s.category,
        description: s.description,
        price: s.price_override,
        location: s.location || 'Lieu non spécifié', // Fallback
        guideId: s.guide_id,
        guideName: s.profiles?.full_name || 'Guide Inconnu',
        guideAvatar: s.profiles?.avatar_url,
        startDate: s.availability_start,
        endDate: s.availability_end,
        meetingPoints: s.meeting_points || [], // Add this
        image: s.image_url ? { uri: s.image_url } : null
    }));
};

export const getGuideServices = async (guideId: string) => {
    const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('guide_id', guideId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((s: any) => ({
        id: s.id,
        title: s.title,
        category: s.category,
        price: s.price_override,
        meetingPoints: s.meeting_points || []
    }));
};

export const getGuideById = async (id: string) => {
    // We query 'profiles' instead of 'guides' to ensure we get a result even if guide details are missing
    const { data, error } = await supabase
        .from('profiles')
        .select('*, guides(*)')
        .eq('id', id)
        .single();

    if (error) throw error;

    const guideDetails = data.guides?.[0] || data.guides || {}; // One-to-one usually returns object or array depending on Supabase client setup, usually object for single relation or array. References usually return array or object. Let's assume object if it's 1:1 or array.
    // Actually, 'guides(*)' on a one-to-one reverse relation might return an array or object.
    // Safest to handle both or index 0.
    // However, since profiles->guides is 1:1 (id maps to id), Supabase might return an array or single object depending on definition.
    // Let's assume it might be null.

    // Correct way: The 'guides' table has 'id' as PK refs profiles.id.
    // So distinct profiles row has 0 or 1 guide row.
    // It usually returns an array or null. 

    // Let's inspect what we access.
    // data.full_name, data.avatar_url
    // guideDetails = data.guides (if using select '*, guides(*)') 

    // Note: If we query 'profiles' and join 'guides', we get data.guides as object or array.
    // Let's try to be safe.

    // Safer: 
    const g = Array.isArray(data.guides) ? data.guides[0] : data.guides;

    return {
        id: data.id,
        name: data.full_name || 'Guide',
        role: g?.specialty || 'Guide',
        rating: g?.rating || 0,
        reviews: g?.reviews_count || 0,
        price: g?.price_per_day ? `${g.price_per_day} ${g.currency || 'SAR'}` : 'Sur devis',
        priceUnit: g?.price_unit || '',
        languages: g?.languages || [],
        image: data.avatar_url ? { uri: data.avatar_url } : require('@/assets/images/profil.jpeg'),
        location: g?.location || 'Lieu non renseigné',
        verified: g?.verified || false,
        bio: g?.bio || 'Aucune biographie disponible.'
    };
};

export const createReservation = async (reservationData: any) => {
    const userId = await ensureUser();
    if (!userId) throw new Error("Vous devez être connecté pour réserver. (Test User création échouée)");

    // Clean price string
    const priceStr = reservationData.price || '0';
    const price = parseInt(priceStr.toString().replace(/\D/g, ''));

    const { data, error } = await supabase
        .from('reservations')
        .insert({
            user_id: userId,
            guide_id: reservationData.guideId,
            service_name: reservationData.serviceName,
            start_date: reservationData.startDate ? new Date(parseInt(reservationData.startDate)).toISOString() : new Date().toISOString(),
            end_date: reservationData.endDate ? new Date(parseInt(reservationData.endDate)).toISOString() : new Date().toISOString(),
            total_price: price,
            location: reservationData.location,
            visit_time: reservationData.visitTime,
            pilgrims_names: reservationData.pilgrims,
            status: 'pending'
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const getReservations = async () => {
    const userId = await ensureUser();
    if (!userId) return [];

    const { data, error } = await supabase
        .from('reservations')
        .select(`
            *,
            guide_profile:profiles!reservations_guide_id_fkey (
                full_name,
                avatar_url
            )
        `)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((r: any) => ({
        id: r.id,
        guideId: r.guide_id,
        serviceName: r.service_name,
        date: new Date(r.start_date).toLocaleDateString(),
        time: r.visit_time,
        status: r.status,
        price: r.total_price,
        location: r.location,
        guideName: r.guide_profile?.full_name || 'Guide Inconnu',
        guideAvatar: r.guide_profile?.avatar_url,
    }));
};

export const getReviews = async (guideId: string) => {
    const { data, error } = await supabase
        .from('reviews')
        .select('*, profiles(full_name, avatar_url)')
        .eq('guide_id', guideId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((r: any) => ({
        id: r.id,
        user: r.profiles?.full_name || 'Anonyme',
        rating: r.rating,
        comment: r.comment,
        date: new Date(r.created_at).toLocaleDateString(),
        avatar: r.profiles?.avatar_url ? { uri: r.profiles.avatar_url } : require('@/assets/images/profil.jpeg')
    }));
};

export const createReview = async (reviewData: { guideId: string, rating: number, comment: string }) => {
    const userId = await ensureUser();
    if (!userId) throw new Error("Vous devez être connecté pour laisser un avis.");

    const { data, error } = await supabase
        .from('reviews')
        .insert({
            reviewer_id: userId,
            guide_id: reviewData.guideId,
            rating: reviewData.rating,
            comment: reviewData.comment
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const createService = async (serviceData: {
    title: string, category: string, description: string, price: number, location: string, availability_start: string;
    availability_end: string;
    image?: string;
    max_participants?: number;
    meeting_points?: { name: string; supplement: number }[];
}) => {
    const userId = await ensureUser();
    if (!userId) throw new Error("Vous devez être connecté.");

    // Check if user is a guide
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
    if (profile?.role !== 'guide') throw new Error("Seuls les guides peuvent créer des services.");

    const { data, error } = await supabase
        .from('services')
        .insert({
            guide_id: userId,
            title: serviceData.title,
            category: serviceData.category,
            description: serviceData.description,
            price_override: serviceData.price,
            location: serviceData.location,
            availability_start: serviceData.availability_start,
            availability_end: serviceData.availability_end,
            image_url: serviceData.image || null,
            max_participants: serviceData.max_participants,
            meeting_points: serviceData.meeting_points
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const uploadImage = async (uri: string) => {
    const formData = new FormData();
    formData.append('image', {
        uri,
        name: 'photo.jpg',
        type: 'image/jpeg',
    } as any);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.EXPO_PUBLIC_IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData,
    });

    const result = await response.json();
    if (!result.success) throw new Error('Image upload failed');
    return result.data.url;
};

// --- Messaging ---

export const getMessages = async (otherUserId: string) => {
    const userId = await ensureUser();
    if (!userId) return [];

    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
};

export const sendMessage = async (receiverId: string, content: string) => {
    const userId = await ensureUser();
    if (!userId) throw new Error("Vous devez être connecté.");

    const { data, error } = await supabase
        .from('messages')
        .insert({
            sender_id: userId,
            receiver_id: receiverId,
            content: content
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const getConversations = async () => {
    const userId = await ensureUser();
    if (!userId) return [];

    const { data, error } = await supabase
        .from('messages')
        .select(`
            *,
            sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url),
            receiver:profiles!messages_receiver_id_fkey(id, full_name, avatar_url)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false });

    if (error) throw error;

    const conversations = new Map();

    for (const msg of data) {
        const isSender = msg.sender_id === userId;
        const otherUser = isSender ? msg.receiver : msg.sender;

        if (!otherUser) continue;

        const otherId = otherUser.id;

        if (!conversations.has(otherId)) {
            conversations.set(otherId, {
                id: otherId,
                user: otherUser.full_name || 'Utilisateur',
                avatar: otherUser.avatar_url ? { uri: otherUser.avatar_url } : require('@/assets/images/profil.jpeg'),
                message: msg.content,
                time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                unread: !msg.is_read && !isSender ? 1 : 0,
                lastMessageDate: new Date(msg.created_at)
            });
        }
    }

    return Array.from(conversations.values());
};

export const getPrayerTimes = async (city: string, country: string) => {
    try {
        const response = await fetch(`http://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}&method=4`);
        const data = await response.json();
        if (data.code === 200) {
            return data.data.timings;
        }
        return null;
    } catch (e) {
        console.error(e);
    }
};
