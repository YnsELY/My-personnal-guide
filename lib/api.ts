import { GUIDES } from '@/constants/data';
import { getFixedServiceDescription } from '@/constants/serviceDescriptions';
import { supabase } from '@/lib/supabase';

// --- Auth & Seeding ---

// --- Auth ---

export const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: 'guide' | 'pilgrim',
    gender: 'male' | 'female',
    dob: string,
    language: 'fr' | 'ar'
) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                role: role,
                gender: gender,
                date_of_birth: dob,
                language: language
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

export const DEFAULT_PLATFORM_COMMISSION_RATE = 0.15;

const toNumber = (value: any) => {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
};

const roundMoney = (value: number) => Math.round(value * 100) / 100;
const toCurrencyLabel = (currency?: string | null) => {
    if (!currency || currency === 'EUR') return '€';
    return currency;
};

const parseDateValue = (value: any): Date | null => {
    if (value === null || value === undefined) return null;

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    if (typeof value === 'number') {
        const date = new Date(value > 1e12 ? value : value * 1000);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return null;

        if (/^\d+$/.test(trimmed)) {
            const numeric = Number(trimmed);
            if (!Number.isFinite(numeric)) return null;
            const date = new Date(trimmed.length <= 10 ? numeric * 1000 : numeric);
            return Number.isNaN(date.getTime()) ? null : date;
        }

        const date = new Date(trimmed);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    return null;
};

const toSqlDate = (value: any): string => {
    const parsed = parseDateValue(value) || new Date();
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const computeReservationFinance = (totalPrice: number, commissionRate = DEFAULT_PLATFORM_COMMISSION_RATE) => {
    const normalizedPrice = toNumber(totalPrice);
    const normalizedRate = Math.max(0, Math.min(1, toNumber(commissionRate)));
    const platformFee = roundMoney(normalizedPrice * normalizedRate);
    const guideNet = roundMoney(normalizedPrice - platformFee);
    return { platformFee, guideNet, commissionRate: normalizedRate };
};

type ReservationPayoutStatus = 'not_due' | 'to_pay' | 'processing' | 'paid' | 'failed';
type ReservationCancellationPolicy = 'full_credit_over_48h' | 'no_credit_under_48h';
const DUE_PAYOUT_STATUSES: ReservationPayoutStatus[] = ['to_pay', 'processing', 'failed'];

export const getGuideWalletSummary = async (): Promise<{
    currency: 'EUR';
    availableBalance: number;
    totalGenerated: number;
    paidOut: number;
    completedVisits: number;
    pendingPayoutVisits: number;
}> => {
    const userId = await ensureUser();
    if (!userId) throw new Error("Vous devez être connecté.");

    const { data, error } = await supabase
        .from('reservations')
        .select('total_price,commission_rate,platform_fee_amount,guide_net_amount,payout_status')
        .eq('guide_id', userId)
        .eq('status', 'completed');

    if (error) throw error;

    let totalGenerated = 0;
    let availableBalance = 0;
    let paidOut = 0;
    let pendingPayoutVisits = 0;

    for (const reservation of data || []) {
        const totalPrice = toNumber(reservation.total_price);
        const commissionRate = toNumber(reservation.commission_rate) || DEFAULT_PLATFORM_COMMISSION_RATE;
        const fallback = computeReservationFinance(totalPrice, commissionRate);
        const guideNet = toNumber(reservation.guide_net_amount) || fallback.guideNet;
        const payoutStatus = (reservation.payout_status || 'to_pay') as ReservationPayoutStatus;

        totalGenerated += guideNet;

        if (DUE_PAYOUT_STATUSES.includes(payoutStatus)) {
            availableBalance += guideNet;
            pendingPayoutVisits += 1;
            continue;
        }

        if (payoutStatus === 'paid') {
            paidOut += guideNet;
        }
    }

    return {
        currency: 'EUR',
        availableBalance: roundMoney(availableBalance),
        totalGenerated: roundMoney(totalGenerated),
        paidOut: roundMoney(paidOut),
        completedVisits: (data || []).length,
        pendingPayoutVisits,
    };
};

export const getPilgrimWalletSummary = async (): Promise<{
    currency: 'EUR';
    availableBalance: number;
    totalCredited: number;
    totalDebited: number;
    cancellationCreditsCount: number;
}> => {
    const userId = await ensureUser();
    if (!userId) throw new Error("Vous devez être connecté.");

    const [{ data: walletRow, error: walletError }, cancellationCount] = await Promise.all([
        supabase
            .from('pilgrim_wallets')
            .select('currency,available_balance,total_credited,total_debited')
            .eq('user_id', userId)
            .maybeSingle(),
        supabase
            .from('pilgrim_wallet_transactions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('type', 'cancellation_credit'),
    ]);

    if (walletError) throw walletError;
    if (cancellationCount.error) throw cancellationCount.error;

    return {
        currency: 'EUR',
        availableBalance: roundMoney(toNumber(walletRow?.available_balance)),
        totalCredited: roundMoney(toNumber(walletRow?.total_credited)),
        totalDebited: roundMoney(toNumber(walletRow?.total_debited)),
        cancellationCreditsCount: cancellationCount.count || 0,
    };
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
                    currency: 'EUR',
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

export const createGuideProfile = async (guideData: {
    bio: string,
    location: string,
    languages: string[],
    phone_number: string,
    experience_since: string
}) => {
    const userId = await ensureUser();
    if (!userId) throw new Error("User not found");

    const { data, error } = await supabase
        .from('guides')
        .upsert({
            id: userId,
            bio: guideData.bio,
            location: guideData.location,
            languages: guideData.languages,
            phone_number: guideData.phone_number,
            experience_since: guideData.experience_since,
            verified: false,
            onboarding_status: 'pending_review',
            rating: 0,
            reviews_count: 0,
            price_per_day: 0, // Default until set elsewhere
            price_unit: '/hour'
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const getCurrentGuideProfile = async () => {
    const userId = await ensureUser();
    if (!userId) return null;

    const { data, error } = await supabase
        .from('guides')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) return null;
    return data;
};

type GuideApprovalStatus = 'pending_review' | 'approved' | 'rejected';

export const getGuideApprovalInfo = async (guideId?: string): Promise<{
    status: GuideApprovalStatus;
    isApproved: boolean;
    rejectionReason: string | null;
}> => {
    const userId = guideId || await ensureUser();
    if (!userId) {
        return {
            status: 'pending_review',
            isApproved: false,
            rejectionReason: null,
        };
    }

    const { data, error } = await supabase
        .from('guides')
        .select('onboarding_status, verified, rejection_reason')
        .eq('id', userId)
        .maybeSingle();

    if (error) {
        // If guide row does not exist yet, treat as pending approval.
        if (error.code === 'PGRST116') {
            return {
                status: 'pending_review',
                isApproved: false,
                rejectionReason: null,
            };
        }
        throw error;
    }

    const status = (data?.onboarding_status || (data?.verified ? 'approved' : 'pending_review')) as GuideApprovalStatus;
    const isApproved = status === 'approved' || data?.verified === true;

    return {
        status,
        isApproved,
        rejectionReason: data?.rejection_reason || null,
    };
};

type GuideInterviewStatus = 'pending_guide' | 'pending_admin' | 'accepted' | 'cancelled';

export const getMyGuideInterviews = async () => {
    const userId = await ensureUser();
    if (!userId) return [];
    const nowISO = new Date().toISOString();

    const { data, error } = await supabase
        .from('guide_interviews')
        .select(`
            id,
            guide_id,
            admin_id,
            scheduled_at,
            whatsapp_contact,
            status,
            proposed_by,
            admin_note,
            guide_note,
            accepted_at,
            created_at,
            updated_at,
            admin_profile:profiles!guide_interviews_admin_id_fkey (
                id,
                full_name,
                email
            )
        `)
        .eq('guide_id', userId)
        .gte('scheduled_at', nowISO)
        .order('scheduled_at', { ascending: true });

    if (error) throw error;

    return (data || []).map((row: any) => ({
        id: row.id,
        guideId: row.guide_id,
        adminId: row.admin_id,
        scheduledAt: row.scheduled_at,
        whatsappContact: row.whatsapp_contact || '',
        status: row.status as GuideInterviewStatus,
        proposedBy: row.proposed_by as 'admin' | 'guide',
        adminNote: row.admin_note || '',
        guideNote: row.guide_note || '',
        acceptedAt: row.accepted_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        adminName: Array.isArray(row.admin_profile)
            ? row.admin_profile[0]?.full_name || 'Admin'
            : row.admin_profile?.full_name || 'Admin',
        adminEmail: Array.isArray(row.admin_profile)
            ? row.admin_profile[0]?.email || ''
            : row.admin_profile?.email || '',
    }));
};

export const acceptGuideInterviewProposal = async (interviewId: string) => {
    const userId = await ensureUser();
    if (!userId) throw new Error("Vous devez être connecté.");

    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from('guide_interviews')
        .update({
            status: 'accepted',
            accepted_at: now,
            updated_at: now,
        })
        .eq('id', interviewId)
        .eq('guide_id', userId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const counterProposeGuideInterview = async (payload: {
    interviewId: string;
    scheduledAt: string;
    guideNote?: string;
}) => {
    const userId = await ensureUser();
    if (!userId) throw new Error("Vous devez être connecté.");

    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from('guide_interviews')
        .update({
            scheduled_at: payload.scheduledAt,
            guide_note: payload.guideNote || null,
            proposed_by: 'guide',
            status: 'pending_admin',
            accepted_at: null,
            updated_at: now,
        })
        .eq('id', payload.interviewId)
        .eq('guide_id', userId)
        .select()
        .single();

    if (error) throw error;
    return data;
};


// --- Data Access ---

// Deprecated or used for other purposes?
export const getGuides = async () => {
    let query = supabase
        .from('guides')
        .select('*, profiles:profiles!guides_id_fkey(full_name, avatar_url, gender)')
        .or('onboarding_status.eq.approved,verified.eq.true');

    const { data, error } = await query;

    if (error) throw error;

    const guides = data.map((g: any) => ({
        id: g.id,
        name: g.profiles?.full_name || 'Unknown',
        role: g.specialty,
        rating: g.rating,
        reviews: g.reviews_count,
        price: `${g.price_per_day} ${toCurrencyLabel(g.currency)}`,
        priceUnit: g.price_unit,
        languages: g.languages,
        image: g.profiles?.avatar_url ? { uri: g.profiles.avatar_url } : require('@/assets/images/profil.jpeg'),
        location: g.location,
        verified: g.verified,
        bio: g.bio,
        gender: g.profiles?.gender
    }));

    return guides;
};

export const getServices = async () => {
    let query = supabase
        .from('services')
        .select('*, profiles(full_name, avatar_url, role, gender)')
        .or('service_status.eq.active,service_status.is.null')
        .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    const services = data.map((s: any) => ({
        id: s.id,
        title: s.title,
        category: s.category,
        description: getFixedServiceDescription({
            title: s.title,
            category: s.category,
            location: s.location,
        }) || s.description || '',
        price: s.price_override,
        location: s.location || 'Lieu non spécifié', // Fallback
        guideId: s.guide_id,
        guideName: s.profiles?.full_name || 'Guide Inconnu',
        guideAvatar: s.profiles?.avatar_url,
        guideGender: s.profiles?.gender,
        startDate: s.availability_start,
        endDate: s.availability_end,
        meetingPoints: s.meeting_points || [], // Add this
        image: s.image_url ? { uri: s.image_url } : null
    }));

    return services;
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
        status: s.service_status || 'active',
        meetingPoints: s.meeting_points || []
    }));
};

export const getGuideById = async (id: string) => {
    // We query 'profiles' instead of 'guides' to ensure we get a result even if guide details are missing
    const { data, error } = await supabase
        .from('profiles')
        .select('*, guides:guides!guides_id_fkey(*)')
        .eq('id', id)
        .single();

    if (error) throw error;

    // Safer: 
    const g = Array.isArray(data.guides) ? data.guides[0] : data.guides;

    return {
        id: data.id,
        name: data.full_name || 'Guide',
        role: g?.specialty || 'Guide',
        rating: g?.rating || 0,
        reviews: g?.reviews_count || 0,
        price: g?.price_per_day ? `${g.price_per_day} ${toCurrencyLabel(g?.currency || 'EUR')}` : 'Sur devis',
        priceUnit: g?.price_unit || '',
        languages: g?.languages || [],
        image: data.avatar_url ? { uri: data.avatar_url } : require('@/assets/images/profil.jpeg'),
        location: g?.location || 'Lieu non renseigné',
        verified: g?.verified || false,
        bio: g?.bio || 'Aucune biographie disponible.',
        gender: data.gender,
        age: data.date_of_birth ? new Date().getFullYear() - new Date(data.date_of_birth).getFullYear() : null,
        experience: g?.experience_since ? new Date().getFullYear() - new Date(g.experience_since).getFullYear() : 0
    };
};

export const createReservation = async (reservationData: any, options?: { useWallet?: boolean }) => {
    const userId = await ensureUser();
    if (!userId) throw new Error("Vous devez être connecté pour réserver. (Test User création échouée)");

    const rawPrice = reservationData.price;
    let normalizedPrice = 0;
    if (typeof rawPrice === 'number') {
        normalizedPrice = rawPrice;
    } else if (typeof rawPrice === 'string') {
        const sanitized = rawPrice.replace(/[^\d,.-]/g, '').replace(',', '.');
        const parsed = Number(sanitized);
        normalizedPrice = Number.isFinite(parsed) ? parsed : 0;
    }
    normalizedPrice = Math.max(0, normalizedPrice);

    const transportPickupType = reservationData.transportPickupType || null;
    const hotelAddress = reservationData.hotelAddress === null || reservationData.hotelAddress === undefined
        ? null
        : String(reservationData.hotelAddress).trim() || null;
    const hotelOver2KmByCar = typeof reservationData.hotelOver2KmByCar === 'boolean'
        ? reservationData.hotelOver2KmByCar
        : reservationData.hotelOver2KmByCar === 'true'
            ? true
            : reservationData.hotelOver2KmByCar === 'false'
                ? false
                : null;
    const hotelDistanceRaw = reservationData.hotelDistanceKm;
    const hotelDistanceParsed = hotelDistanceRaw === null || hotelDistanceRaw === undefined || hotelDistanceRaw === ''
        ? null
        : Number(String(hotelDistanceRaw).replace(',', '.'));
    const hotelDistanceKm = hotelDistanceParsed !== null && Number.isFinite(hotelDistanceParsed)
        ? hotelDistanceParsed
        : null;
    const transportExtraFeeAmount = toNumber(reservationData.transportExtraFeeAmount);
    const transportWarningAcknowledged = !!reservationData.transportWarningAcknowledged;

    const { data: rpcData, error: rpcError } = await supabase.rpc('create_reservation_with_wallet', {
        p_guide_id: reservationData.guideId,
        p_service_name: reservationData.serviceName,
        p_start_date: toSqlDate(reservationData.startDate),
        p_end_date: toSqlDate(reservationData.endDate ?? reservationData.startDate),
        p_total_price: normalizedPrice,
        p_location: reservationData.location || null,
        p_visit_time: reservationData.visitTime || null,
        p_pilgrims_names: reservationData.pilgrims || [],
        p_use_wallet: !!options?.useWallet,
        p_transport_pickup_type: transportPickupType,
        p_hotel_address: hotelAddress,
        p_hotel_over_2km_by_car: hotelOver2KmByCar,
        p_hotel_distance_km: hotelDistanceKm,
        p_transport_extra_fee_amount: transportExtraFeeAmount,
        p_transport_warning_acknowledged: transportWarningAcknowledged,
    });

    if (rpcError) throw rpcError;

    const rpcPayload = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    const reservationId = rpcPayload?.reservationId || rpcPayload?.reservation_id;
    if (!reservationId) throw new Error("Impossible de créer la réservation.");

    const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', reservationId)
        .single();

    if (error) throw error;
    return data;
};

export const getReservedGuideTimeSlots = async (guideId: string, dateValue: any): Promise<string[]> => {
    if (!guideId) return [];

    const sqlDate = toSqlDate(dateValue);
    const { data, error } = await supabase
        .from('reservations')
        .select('visit_time,status')
        .eq('guide_id', guideId)
        .eq('start_date', sqlDate)
        .in('status', ['pending', 'confirmed', 'in_progress']);

    if (error) throw error;

    const slots = (data || [])
        .map((row: any) => String(row?.visit_time || '').trim())
        .filter((time) => /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(time));

    return Array.from(new Set(slots));
};

export const updateReservationStatus = async (id: string, status: string) => {
    const userId = await ensureUser();
    if (!userId) throw new Error("Vous devez être connecté.");

    const updates: any = {
        status,
        updated_at: new Date().toISOString(),
    };

    if (status === 'completed') {
        const { data: reservation, error: reservationError } = await supabase
            .from('reservations')
            .select('total_price, commission_rate')
            .eq('id', id)
            .single();

        if (reservationError) throw reservationError;

        const commissionRate = toNumber(reservation?.commission_rate) || DEFAULT_PLATFORM_COMMISSION_RATE;
        const { platformFee, guideNet } = computeReservationFinance(toNumber(reservation?.total_price), commissionRate);
        updates.completed_at = new Date().toISOString();
        updates.commission_rate = commissionRate;
        updates.platform_fee_amount = platformFee;
        updates.guide_net_amount = guideNet;
        updates.payout_status = 'to_pay';
    }

    if (status === 'cancelled') {
        updates.payout_status = 'not_due';
    }

    const { data, error } = await supabase
        .from('reservations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const cancelReservationAsPilgrim = async (reservationId: string) => {
    const userId = await ensureUser();
    if (!userId) throw new Error("Vous devez etre connecte.");

    const { data, error } = await supabase.rpc('cancel_reservation_as_pilgrim_with_policy', {
        p_reservation_id: reservationId,
    });

    if (error) throw error;

    const payload = Array.isArray(data) ? data[0] : data;
    if (!payload) throw new Error("Reservation introuvable ou non eligible a l'annulation.");

    return {
        reservationId: payload.reservationId || payload.reservation_id,
        status: 'cancelled' as const,
        creditedAmount: roundMoney(toNumber(payload.creditedAmount ?? payload.credited_amount)),
        policyApplied: (payload.policyApplied || payload.policy_applied || 'no_credit_under_48h') as ReservationCancellationPolicy,
        serviceStartAt: payload.serviceStartAt || payload.service_start_at,
        cutoffAt: payload.cutoffAt || payload.cutoff_at,
    };
};

const getReservationById = async (reservationId: string) => {
    const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', reservationId)
        .single();

    if (error) throw error;
    return data;
};

const syncReservationStartState = async (reservationId: string) => {
    const reservation = await getReservationById(reservationId);

    const canStart =
        reservation.status === 'confirmed' &&
        reservation.guide_start_confirmed_at &&
        reservation.pilgrim_start_confirmed_at;

    if (!canStart) return reservation;

    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from('reservations')
        .update({
            status: 'in_progress',
            visit_started_at: reservation.visit_started_at || now,
            guide_end_confirmed_at: null,
            pilgrim_end_confirmed_at: null,
            updated_at: now,
        })
        .eq('id', reservationId)
        .select('*')
        .single();

    if (error) throw error;
    return data;
};

const syncReservationCompletionState = async (reservationId: string) => {
    const reservation = await getReservationById(reservationId);

    const canComplete =
        reservation.status === 'in_progress' &&
        reservation.guide_end_confirmed_at &&
        reservation.pilgrim_end_confirmed_at;

    if (!canComplete) return reservation;

    await updateReservationStatus(reservationId, 'completed');
    return await getReservationById(reservationId);
};

export const confirmVisitStartAsGuide = async (reservationId: string) => {
    const userId = await ensureUser();
    if (!userId) throw new Error("Vous devez être connecté.");

    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from('reservations')
        .update({
            guide_start_confirmed_at: now,
            updated_at: now,
        })
        .eq('id', reservationId)
        .eq('guide_id', userId)
        .eq('status', 'confirmed')
        .select('*')
        .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Réservation introuvable ou non éligible au démarrage.");

    return await syncReservationStartState(reservationId);
};

export const confirmVisitStartAsPilgrim = async (reservationId: string) => {
    const userId = await ensureUser();
    if (!userId) throw new Error("Vous devez être connecté.");

    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from('reservations')
        .update({
            pilgrim_start_confirmed_at: now,
            updated_at: now,
        })
        .eq('id', reservationId)
        .eq('user_id', userId)
        .eq('status', 'confirmed')
        .not('guide_start_confirmed_at', 'is', null)
        .select('*')
        .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Le guide doit d'abord confirmer le début de la visite.");

    return await syncReservationStartState(reservationId);
};

export const confirmVisitEndAsGuide = async (reservationId: string) => {
    const userId = await ensureUser();
    if (!userId) throw new Error("Vous devez être connecté.");

    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from('reservations')
        .update({
            guide_end_confirmed_at: now,
            updated_at: now,
        })
        .eq('id', reservationId)
        .eq('guide_id', userId)
        .eq('status', 'in_progress')
        .select('*')
        .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Réservation introuvable ou non éligible à la clôture.");

    return await syncReservationCompletionState(reservationId);
};

export const confirmVisitEndAsPilgrim = async (reservationId: string) => {
    const userId = await ensureUser();
    if (!userId) throw new Error("Vous devez être connecté.");

    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from('reservations')
        .update({
            pilgrim_end_confirmed_at: now,
            updated_at: now,
        })
        .eq('id', reservationId)
        .eq('user_id', userId)
        .eq('status', 'in_progress')
        .not('guide_end_confirmed_at', 'is', null)
        .select('*')
        .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Le guide doit d'abord confirmer la fin de la visite.");

    return await syncReservationCompletionState(reservationId);
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
            ),
            pilgrim_profile:profiles!reservations_user_id_fkey (
                full_name,
                avatar_url
            )
        `)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((r: any) => {
        const startDate = parseDateValue(r.start_date);
        const createdAt = parseDateValue(r.created_at);
        const displayDate =
            startDate && startDate.getFullYear() >= 2000
                ? startDate
                : createdAt && createdAt.getFullYear() >= 2000
                    ? createdAt
                    : null;

        return {
        id: r.id,
        guideId: r.guide_id,
        pilgrimId: r.user_id,
        serviceName: r.service_name,
        startDate: r.start_date,
        endDate: r.end_date,
        date: displayDate
            ? displayDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
            : 'Date indisponible',
        time: r.visit_time,
        status: r.status,
        payoutStatus: (r.payout_status || 'not_due') as ReservationPayoutStatus,
        price: r.total_price,
        location: r.location,
        transportPickupType: (r.transport_pickup_type || null) as 'haram' | 'hotel' | null,
        hotelAddress: r.hotel_address || null,
        hotelOver2KmByCar: typeof r.hotel_over_2km_by_car === 'boolean' ? r.hotel_over_2km_by_car : null,
        hotelDistanceKm: r.hotel_distance_km !== null && r.hotel_distance_km !== undefined
            ? toNumber(r.hotel_distance_km)
            : null,
        transportExtraFeeAmount: toNumber(r.transport_extra_fee_amount),
        walletAmountUsed: toNumber(r.wallet_amount_used),
        cardAmountPaid: toNumber(r.card_amount_paid),
        cancellationCreditAmount: toNumber(r.cancellation_credit_amount),
        cancelledAt: r.cancelled_at,
        cancellationPolicyApplied: (r.cancellation_policy_applied || null) as ReservationCancellationPolicy | null,
        guideStartConfirmedAt: r.guide_start_confirmed_at,
        pilgrimStartConfirmedAt: r.pilgrim_start_confirmed_at,
        visitStartedAt: r.visit_started_at,
        guideEndConfirmedAt: r.guide_end_confirmed_at,
        pilgrimEndConfirmedAt: r.pilgrim_end_confirmed_at,
        completedAt: r.completed_at,
        guideName: r.guide_profile?.full_name || 'Guide Inconnu',
        guideAvatar: r.guide_profile?.avatar_url,
        pilgrimName: r.pilgrim_profile?.full_name || 'Pèlerin Inconnu',
        pilgrimAvatar: r.pilgrim_profile?.avatar_url,
    };
    });
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
    title: string, category: string, description?: string, price: number, location: string, availability_start: string;
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

    const fixedDescription = getFixedServiceDescription({
        title: serviceData.title,
        category: serviceData.category,
        location: serviceData.location,
    }) || serviceData.description || null;

    const { data, error } = await supabase
        .from('services')
        .insert({
            guide_id: userId,
            title: serviceData.title,
            category: serviceData.category,
            description: fixedDescription,
            price_override: serviceData.price,
            location: serviceData.location,
            availability_start: serviceData.availability_start,
            availability_end: serviceData.availability_end,
            image_url: serviceData.image || null,
            max_participants: serviceData.max_participants,
            meeting_points: serviceData.meeting_points,
            service_status: 'active'
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateService = async (serviceId: string, updates: any) => {
    const userId = await ensureUser();
    if (!userId) throw new Error("Vous devez être connecté.");

    // Check ownership
    const { data: service } = await supabase.from('services').select('guide_id').eq('id', serviceId).single();
    if (!service || service.guide_id !== userId) throw new Error("Vous ne pouvez modifier que vos propres services.");

    const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', serviceId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteService = async (serviceId: string) => {
    const userId = await ensureUser();
    if (!userId) throw new Error("Vous devez être connecté.");

    // Check ownership
    const { data: service } = await supabase.from('services').select('guide_id').eq('id', serviceId).single();
    if (!service || service.guide_id !== userId) throw new Error("Vous ne pouvez supprimer que vos propres services.");

    const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

    if (error) throw error;
};

export const getServiceById = async (serviceId: string) => {
    const { data, error } = await supabase
        .from('services')
        .select('*, profiles(full_name, avatar_url, role, gender)')
        .eq('id', serviceId)
        .single();

    if (error) throw error;

    return {
        id: data.id,
        title: data.title,
        category: data.category,
        description: getFixedServiceDescription({
            title: data.title,
            category: data.category,
            location: data.location,
        }) || data.description || '',
        price: data.price_override,
        location: data.location || 'Lieu non spécifié',
        guideId: data.guide_id,
        guideName: data.profiles?.full_name || 'Guide Inconnu',
        guideAvatar: data.profiles?.avatar_url,
        guideGender: data.profiles?.gender,
        startDate: data.availability_start,
        endDate: data.availability_end,
        meetingPoints: data.meeting_points || [],
        image: data.image_url ? { uri: data.image_url } : null
    };
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
    return (data || []).map((message: any) => ({
        ...message,
        is_read: Boolean(message?.is_read),
    }));
};

export const sendMessage = async (receiverId: string, content: string) => {
    const userId = await ensureUser();
    if (!userId) throw new Error("Vous devez être connecté.");

    const { data, error } = await supabase
        .from('messages')
        .insert({
            sender_id: userId,
            receiver_id: receiverId,
            content: content,
            is_read: false,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const markConversationAsRead = async (otherUserId: string) => {
    const userId = await ensureUser();
    if (!userId) return;

    const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('receiver_id', userId)
        .eq('sender_id', otherUserId)
        .or('is_read.eq.false,is_read.is.null');

    if (error) throw error;
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

    const conversations = new Map<string, any>();

    for (const msg of data || []) {
        const isSender = msg.sender_id === userId;
        const otherUser = isSender ? msg.receiver : msg.sender;

        if (!otherUser?.id) continue;

        const otherId = otherUser.id;
        const isUnreadForCurrentUser = msg.receiver_id === userId && msg.is_read !== true;

        if (!conversations.has(otherId)) {
            conversations.set(otherId, {
                id: otherId,
                user: otherUser.full_name || 'Utilisateur',
                avatar: otherUser.avatar_url ? { uri: otherUser.avatar_url } : require('@/assets/images/profil.jpeg'),
                message: msg.content,
                time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                unread: 0,
                lastMessageDate: new Date(msg.created_at),
            });
        }

        const existingConversation = conversations.get(otherId);
        if (existingConversation && isUnreadForCurrentUser) {
            existingConversation.unread += 1;
        }
    }

    return Array.from(conversations.values()).sort(
        (a, b) => b.lastMessageDate.getTime() - a.lastMessageDate.getTime()
    );
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
