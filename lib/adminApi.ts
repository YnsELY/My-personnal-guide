import { getCurrentProfile, getCurrentUser } from '@/lib/api';
import { computeReservationFinance, PLATFORM_COMMISSION_RATE } from '@/lib/pricing';
import { supabase } from '@/lib/supabase';

type AccountStatus = 'active' | 'suspended';
type ServiceStatus = 'active' | 'hidden' | 'archived';
type GuideOnboardingStatus = 'pending_review' | 'approved' | 'rejected';
type ReservationStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
type PayoutStatus = 'not_due' | 'to_pay' | 'processing' | 'paid' | 'failed';
type GuideInterviewStatus = 'pending_guide' | 'pending_admin' | 'accepted' | 'cancelled';
const DUE_PAYOUT_STATUSES: PayoutStatus[] = ['to_pay', 'processing', 'failed'];
const REPLACEMENT_PENDING_TIMEOUT_HOURS = 12;

export type GuideCandidate = {
    id: string;
    fullName: string;
    email: string;
    location: string | null;
    rating: number;
    reviewsCount: number;
    verified: boolean;
    onboardingStatus: string | null;
    fallbackAllZones?: boolean;
};

export type AdminWalletRoleFilter = 'all' | 'guide' | 'pilgrim';
export type AdminWalletRole = 'guide' | 'pilgrim';
export type AdminReportStatus = 'open' | 'in_review' | 'resolved' | 'rejected';
export type AdminReportCategory = 'harassment' | 'fraud' | 'inappropriate_content' | 'safety' | 'other';

export type AdminReport = {
    id: string;
    reporterId: string;
    reporterName: string;
    reporterEmail: string;
    targetUserId: string;
    targetUserName: string;
    targetUserEmail: string;
    context: 'chat' | 'guide_profile';
    category: AdminReportCategory;
    description: string | null;
    conversationUserId: string | null;
    reservationId: string | null;
    status: AdminReportStatus;
    adminNote: string | null;
    resolvedAt: string | null;
    resolvedBy: string | null;
    resolvedByName: string | null;
    createdAt: string;
    updatedAt: string;
};

export type AdminWalletRow = {
    userId: string;
    fullName: string;
    email: string;
    role: AdminWalletRole;
    currency: 'EUR';
    availableBalance: number;
    pilgrimTotalCredited: number;
    pilgrimTotalDebited: number;
    guideTotalGenerated: number;
    guidePaidOut: number;
    guideAdjustments: number;
    guidePendingPayoutVisits: number;
};

const asNumber = (value: any) => {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
};

const fromMaybeArray = <T>(value: T | T[] | null | undefined): T | null => {
    if (!value) return null;
    return Array.isArray(value) ? value[0] || null : value;
};

const periodStartISO = (periodDays: number) => {
    const date = new Date();
    date.setDate(date.getDate() - periodDays);
    return date.toISOString();
};

const ensureAdmin = async () => {
    const user = await getCurrentUser();
    if (!user) throw new Error("Vous devez être connecté.");

    const profile = await getCurrentProfile();
    if (!profile || profile.role !== 'admin') {
        throw new Error("Accès réservé aux administrateurs.");
    }
    if (profile.account_status === 'suspended') {
        throw new Error("Votre compte admin est suspendu.");
    }
    return { adminId: profile.id };
};

const logAdminAction = async (payload: {
    adminId: string;
    entityType: string;
    entityId: string;
    action: string;
    details?: Record<string, any>;
}) => {
    try {
        await supabase.from('admin_audit_logs').insert({
            admin_id: payload.adminId,
            entity_type: payload.entityType,
            entity_id: payload.entityId,
            action: payload.action,
            payload: payload.details || {},
        });
    } catch (error) {
        // Keep admin actions non-blocking if the audit table is not migrated yet.
        console.warn('Audit log insert failed:', error);
    }
};

const isMissingGuideWalletAdjustmentsTableError = (error: any) => {
    const message = String(error?.message || '').toLowerCase();
    return message.includes('guide_wallet_adjustments');
};

export const getAdminOverview = async (periodDays = 30) => {
    await ensureAdmin();
    const startISO = periodStartISO(periodDays);

    const [
        pendingGuidesCount,
        guidesCount,
        pilgrimsCount,
        accountsCount,
        servicesCount,
        reservationsCount,
        reservationsWindow,
    ] = await Promise.all([
        supabase.from('guides').select('*', { count: 'exact', head: true }).eq('onboarding_status', 'pending_review'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'guide'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'pilgrim'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('services').select('*', { count: 'exact', head: true }).in('service_status', ['active', 'hidden', 'archived']),
        supabase.from('reservations').select('*', { count: 'exact', head: true }),
        supabase
            .from('reservations')
            .select('id,status,total_price,platform_fee_amount,guide_net_amount,commission_rate,commissionable_net_amount,transport_extra_fee_amount,guide_id,payout_status,created_at')
            .gte('created_at', startISO),
    ]);

    if (reservationsWindow.error) throw reservationsWindow.error;

    const byStatus: Record<ReservationStatus, number> = {
        pending: 0,
        confirmed: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0,
    };

    let gmv = 0;
    let platformRevenue = 0;
    let guidesToDistribute = 0;
    const guidesToPay = new Set<string>();

    for (const reservation of reservationsWindow.data || []) {
        const status = reservation.status as ReservationStatus;
        if (status in byStatus) {
            byStatus[status] += 1;
        }
        if (status !== 'completed') continue;

        const total = asNumber(reservation.total_price);
        const commissionRate = asNumber(reservation.commission_rate) || PLATFORM_COMMISSION_RATE;
        const rawCommissionable = (reservation as any).commissionable_net_amount;
        const fallback = computeReservationFinance({
            totalPriceEur: total,
            transportExtraFeeEur: asNumber((reservation as any).transport_extra_fee_amount),
            commissionableNetAmountEur: rawCommissionable === null || rawCommissionable === undefined ? null : asNumber(rawCommissionable),
            commissionRate,
        });

        const platform = asNumber(reservation.platform_fee_amount) || fallback.platformFeeEur;
        const net = asNumber(reservation.guide_net_amount) || fallback.guideNetEur;

        gmv += total;
        platformRevenue += platform;
        guidesToDistribute += net;

        if (reservation.payout_status !== 'paid' && reservation.guide_id) {
            guidesToPay.add(reservation.guide_id);
        }
    }

    return {
        periodDays,
        pendingGuides: pendingGuidesCount.count || 0,
        totalGuides: guidesCount.count || 0,
        totalPilgrims: pilgrimsCount.count || 0,
        totalAccounts: accountsCount.count || 0,
        totalServices: servicesCount.count || 0,
        totalReservations: reservationsCount.count || 0,
        reservationsByStatus: byStatus,
        gmv,
        platformRevenue,
        guidesToDistribute,
        guidesToPay: guidesToPay.size,
    };
};

export const getPendingGuideApplications = async () => {
    await ensureAdmin();
    const { data, error } = await supabase
        .from('guides')
        .select(`
            id,
            bio,
            location,
            specialty,
            phone_number,
            languages,
            experience_since,
            rating,
            reviews_count,
            verified,
            onboarding_status,
            created_at,
            profiles:profiles!guides_id_fkey (
                id,
                full_name,
                email,
                avatar_url,
                account_status,
                created_at
            )
        `)
        .eq('onboarding_status', 'pending_review')
        .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map((guide: any) => {
        const profile = fromMaybeArray<any>(guide.profiles);
        return {
            id: guide.id,
            fullName: profile?.full_name || 'Guide',
            email: profile?.email || '',
            phoneNumber: guide.phone_number || '',
            location: guide.location || 'Non renseigné',
            specialty: guide.specialty || 'Non renseigné',
            languages: guide.languages || [],
            bio: guide.bio || '',
            status: guide.onboarding_status as GuideOnboardingStatus,
            accountStatus: (profile?.account_status || 'active') as AccountStatus,
            submittedAt: guide.created_at,
            profileCreatedAt: profile?.created_at,
        };
    });
};

export const approveGuideApplication = async (guideId: string) => {
    const { adminId } = await ensureAdmin();
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from('guides')
        .update({
            onboarding_status: 'approved',
            verified: true,
            approved_at: now,
            approved_by: adminId,
            rejected_at: null,
            rejected_by: null,
            rejection_reason: null,
            updated_at: now,
        })
        .eq('id', guideId)
        .select()
        .single();

    if (error) throw error;

    await logAdminAction({
        adminId,
        entityType: 'guide',
        entityId: guideId,
        action: 'approve_guide',
    });

    return data;
};

export const rejectGuideApplication = async (guideId: string, reason: string) => {
    const { adminId } = await ensureAdmin();
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from('guides')
        .update({
            onboarding_status: 'rejected',
            verified: false,
            rejected_at: now,
            rejected_by: adminId,
            rejection_reason: reason || 'Dossier refusé par l’administration.',
            approved_at: null,
            approved_by: null,
            updated_at: now,
        })
        .eq('id', guideId)
        .select()
        .single();

    if (error) throw error;

    await logAdminAction({
        adminId,
        entityType: 'guide',
        entityId: guideId,
        action: 'reject_guide',
        details: { reason },
    });

    return data;
};

export const proposeGuideInterview = async (payload: {
    guideId: string;
    scheduledAt: string;
    whatsappContact: string;
    adminNote?: string;
}) => {
    const { adminId } = await ensureAdmin();

    const { data, error } = await supabase
        .from('guide_interviews')
        .insert({
            guide_id: payload.guideId,
            admin_id: adminId,
            scheduled_at: payload.scheduledAt,
            whatsapp_contact: payload.whatsappContact,
            admin_note: payload.adminNote || null,
            proposed_by: 'admin',
            status: 'pending_guide',
        })
        .select()
        .single();

    if (error) throw error;

    await logAdminAction({
        adminId,
        entityType: 'guide_interview',
        entityId: data.id,
        action: 'propose_interview',
        details: {
            guideId: payload.guideId,
            scheduledAt: payload.scheduledAt,
            whatsappContact: payload.whatsappContact,
        },
    });

    return data;
};

export const getAdminGuideInterviews = async (status?: GuideInterviewStatus | 'all') => {
    await ensureAdmin();
    const nowISO = new Date().toISOString();

    const { error: cleanupError } = await supabase
        .from('guide_interviews')
        .delete()
        .lt('scheduled_at', nowISO);

    if (cleanupError) {
        console.warn('Guide interviews cleanup failed:', cleanupError);
    }

    let query = supabase
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
            guide_profile:profiles!guide_interviews_guide_id_fkey (
                id,
                full_name,
                email
            ),
            admin_profile:profiles!guide_interviews_admin_id_fkey (
                id,
                full_name,
                email
            )
        `)
        .gte('scheduled_at', nowISO)
        .order('scheduled_at', { ascending: true });

    if (status && status !== 'all') {
        query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((row: any) => {
        const guide = fromMaybeArray<any>(row.guide_profile);
        const admin = fromMaybeArray<any>(row.admin_profile);
        return {
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
            guideName: guide?.full_name || 'Guide',
            guideEmail: guide?.email || '',
            adminName: admin?.full_name || 'Admin',
            adminEmail: admin?.email || '',
        };
    });
};

export const acceptGuideInterviewProposalAsAdmin = async (interviewId: string) => {
    const { adminId } = await ensureAdmin();
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from('guide_interviews')
        .update({
            status: 'accepted',
            accepted_at: now,
            updated_at: now,
        })
        .eq('id', interviewId)
        .select()
        .single();

    if (error) throw error;

    await logAdminAction({
        adminId,
        entityType: 'guide_interview',
        entityId: interviewId,
        action: 'accept_interview_proposal',
    });

    return data;
};

export const counterProposeGuideInterviewAsAdmin = async (payload: {
    interviewId: string;
    scheduledAt: string;
    whatsappContact: string;
    adminNote?: string;
}) => {
    const { adminId } = await ensureAdmin();
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from('guide_interviews')
        .update({
            admin_id: adminId,
            scheduled_at: payload.scheduledAt,
            whatsapp_contact: payload.whatsappContact,
            admin_note: payload.adminNote || null,
            proposed_by: 'admin',
            status: 'pending_guide',
            accepted_at: null,
            updated_at: now,
        })
        .eq('id', payload.interviewId)
        .select()
        .single();

    if (error) throw error;

    await logAdminAction({
        adminId,
        entityType: 'guide_interview',
        entityId: payload.interviewId,
        action: 'counter_propose_interview',
        details: {
            scheduledAt: payload.scheduledAt,
            whatsappContact: payload.whatsappContact,
        },
    });

    return data;
};

export const getAdminAccounts = async (options?: { search?: string; role?: 'guide' | 'pilgrim' | 'admin' | 'all' }) => {
    await ensureAdmin();
    const search = options?.search?.trim();

    let query = supabase
        .from('profiles')
        .select(`
            id,
            email,
            full_name,
            avatar_url,
            role,
            account_status,
            created_at,
            guides:guides!guides_id_fkey (
                onboarding_status,
                verified,
                location,
                rating,
                reviews_count,
                specialty
            )
        `)
        .order('created_at', { ascending: false });

    if (options?.role && options.role !== 'all') {
        query = query.eq('role', options.role);
    }
    if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((account: any) => {
        const guide = fromMaybeArray<any>(account.guides);
        return {
            id: account.id,
            fullName: account.full_name || 'Utilisateur',
            email: account.email || '',
            role: account.role as 'guide' | 'pilgrim' | 'admin',
            accountStatus: (account.account_status || 'active') as AccountStatus,
            createdAt: account.created_at,
            guideStatus: (guide?.onboarding_status || null) as GuideOnboardingStatus | null,
            guideVerified: !!guide?.verified,
            location: guide?.location || null,
            specialty: guide?.specialty || null,
            rating: asNumber(guide?.rating),
            reviewsCount: asNumber(guide?.reviews_count),
        };
    });
};

export const updateAdminAccountStatus = async (accountId: string, accountStatus: AccountStatus) => {
    const { adminId } = await ensureAdmin();

    const { data, error } = await supabase
        .from('profiles')
        .update({
            account_status: accountStatus,
            updated_at: new Date().toISOString(),
        })
        .eq('id', accountId)
        .select()
        .single();

    if (error) throw error;

    await logAdminAction({
        adminId,
        entityType: 'profile',
        entityId: accountId,
        action: accountStatus === 'suspended' ? 'suspend_account' : 'reactivate_account',
        details: { accountStatus },
    });

    return data;
};

export const getAdminWallets = async (options?: { search?: string; role?: AdminWalletRoleFilter }): Promise<AdminWalletRow[]> => {
    await ensureAdmin();
    const search = options?.search?.trim();
    const roleFilter = options?.role || 'all';

    let query = supabase
        .from('profiles')
        .select('id,full_name,email,role,created_at')
        .in('role', ['guide', 'pilgrim'])
        .order('created_at', { ascending: false });

    if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
    }
    if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: profiles, error: profilesError } = await query;
    if (profilesError) throw profilesError;

    const rows = profiles || [];
    if (!rows.length) return [];

    const pilgrimIds = rows.filter((row: any) => row.role === 'pilgrim').map((row: any) => row.id);
    const guideIds = rows.filter((row: any) => row.role === 'guide').map((row: any) => row.id);

    let pilgrimWallets: any[] = [];
    if (pilgrimIds.length) {
        const { data, error } = await supabase
            .from('pilgrim_wallets')
            .select('user_id,available_balance,total_credited,total_debited')
            .in('user_id', pilgrimIds);
        if (error) throw error;
        pilgrimWallets = data || [];
    }

    const pilgrimWalletMap = new Map<string, { available: number; credited: number; debited: number }>(
        pilgrimWallets.map((row: any) => [
            row.user_id,
            {
                available: asNumber(row.available_balance),
                credited: asNumber(row.total_credited),
                debited: asNumber(row.total_debited),
            },
        ])
    );

    const guideStatsMap = new Map<string, {
        totalGenerated: number;
        paidOut: number;
        dueBase: number;
        adjustments: number;
        pendingPayoutVisits: number;
    }>();

    for (const guideId of guideIds) {
        guideStatsMap.set(guideId, {
            totalGenerated: 0,
            paidOut: 0,
            dueBase: 0,
            adjustments: 0,
            pendingPayoutVisits: 0,
        });
    }

    if (guideIds.length) {
        const { data: reservations, error: reservationsError } = await supabase
            .from('reservations')
            .select('guide_id,total_price,commission_rate,commissionable_net_amount,transport_extra_fee_amount,guide_net_amount,payout_status')
            .in('guide_id', guideIds)
            .eq('status', 'completed');
        if (reservationsError) throw reservationsError;

        for (const reservation of reservations || []) {
            const guideId = reservation.guide_id as string;
            const stats = guideStatsMap.get(guideId);
            if (!stats) continue;

            const commissionRate = asNumber((reservation as any).commission_rate) || PLATFORM_COMMISSION_RATE;
            const rawCommissionable = (reservation as any).commissionable_net_amount;
            const finance = computeReservationFinance({
                totalPriceEur: asNumber((reservation as any).total_price),
                transportExtraFeeEur: asNumber((reservation as any).transport_extra_fee_amount),
                commissionableNetAmountEur: rawCommissionable === null || rawCommissionable === undefined ? null : asNumber(rawCommissionable),
                commissionRate,
            });
            const guideNet = asNumber((reservation as any).guide_net_amount) || finance.guideNetEur;
            const payoutStatus = ((reservation as any).payout_status || 'to_pay') as PayoutStatus;

            stats.totalGenerated += guideNet;

            if (payoutStatus === 'paid') {
                stats.paidOut += guideNet;
            } else if (DUE_PAYOUT_STATUSES.includes(payoutStatus)) {
                stats.dueBase += guideNet;
                stats.pendingPayoutVisits += 1;
            }
        }

        const { data: adjustments, error: adjustmentsError } = await supabase
            .from('guide_wallet_adjustments')
            .select('guide_id,amount_eur')
            .in('guide_id', guideIds);

        if (adjustmentsError && !isMissingGuideWalletAdjustmentsTableError(adjustmentsError)) {
            throw adjustmentsError;
        }

        for (const adjustment of adjustments || []) {
            const stats = guideStatsMap.get(adjustment.guide_id);
            if (!stats) continue;
            stats.adjustments += asNumber(adjustment.amount_eur);
        }
    }

    return rows.map((row: any) => {
        const role = row.role as AdminWalletRole;
        if (role === 'pilgrim') {
            const wallet = pilgrimWalletMap.get(row.id);
            return {
                userId: row.id,
                fullName: row.full_name || 'Utilisateur',
                email: row.email || '',
                role: 'pilgrim' as const,
                currency: 'EUR' as const,
                availableBalance: asNumber(wallet?.available),
                pilgrimTotalCredited: asNumber(wallet?.credited),
                pilgrimTotalDebited: asNumber(wallet?.debited),
                guideTotalGenerated: 0,
                guidePaidOut: 0,
                guideAdjustments: 0,
                guidePendingPayoutVisits: 0,
            };
        }

        const stats = guideStatsMap.get(row.id) || {
            totalGenerated: 0,
            paidOut: 0,
            dueBase: 0,
            adjustments: 0,
            pendingPayoutVisits: 0,
        };

        return {
            userId: row.id,
            fullName: row.full_name || 'Guide',
            email: row.email || '',
            role: 'guide' as const,
            currency: 'EUR' as const,
            availableBalance: Math.max(0, stats.dueBase + stats.adjustments),
            pilgrimTotalCredited: 0,
            pilgrimTotalDebited: 0,
            guideTotalGenerated: stats.totalGenerated,
            guidePaidOut: stats.paidOut,
            guideAdjustments: stats.adjustments,
            guidePendingPayoutVisits: stats.pendingPayoutVisits,
        };
    });
};

export const adjustAdminWallet = async (payload: {
    userId: string;
    role: AdminWalletRole;
    amountEur: number;
    reason?: string;
}) => {
    const { adminId } = await ensureAdmin();
    const amountEur = asNumber(payload.amountEur);

    if (!Number.isFinite(amountEur) || amountEur === 0) {
        throw new Error("Le montant doit être non nul.");
    }

    let rpcName = '';
    let rpcPayload: Record<string, any> = {};
    if (payload.role === 'pilgrim') {
        rpcName = 'admin_adjust_pilgrim_wallet';
        rpcPayload = {
            p_user_id: payload.userId,
            p_amount_eur: amountEur,
            p_reason: payload.reason?.trim() || null,
        };
    } else {
        rpcName = 'admin_add_guide_wallet_adjustment';
        rpcPayload = {
            p_guide_id: payload.userId,
            p_amount_eur: amountEur,
            p_reason: payload.reason?.trim() || null,
        };
    }

    const { data, error } = await supabase.rpc(rpcName, rpcPayload);
    if (error) throw error;

    const result = Array.isArray(data) ? data[0] : data;

    await logAdminAction({
        adminId,
        entityType: 'wallet',
        entityId: payload.userId,
        action: 'wallet_adjustment',
        details: {
            role: payload.role,
            amountEur,
            reason: payload.reason?.trim() || null,
        },
    });

    return result;
};

export const getAdminServices = async (options?: { search?: string; status?: ServiceStatus | 'all' }) => {
    await ensureAdmin();
    const search = options?.search?.trim();

    let query = supabase
        .from('services')
        .select(`
            id,
            title,
            category,
            description,
            guide_id,
            price_override,
            location,
            availability_start,
            availability_end,
            service_status,
            created_at,
            profiles!services_guide_id_fkey (
                full_name,
                email
            )
        `)
        .order('created_at', { ascending: false });

    if (options?.status && options.status !== 'all') {
        query = query.eq('service_status', options.status);
    }
    if (search) {
        query = query.or(`title.ilike.%${search}%,category.ilike.%${search}%,location.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    const guideIds = Array.from(new Set((data || []).map((service: any) => service.guide_id).filter(Boolean)));
    let guideStatuses = new Map<string, { onboarding_status: GuideOnboardingStatus; verified: boolean }>();

    if (guideIds.length) {
        const { data: guides, error: guidesError } = await supabase
            .from('guides')
            .select('id,onboarding_status,verified')
            .in('id', guideIds);
        if (guidesError) throw guidesError;
        guideStatuses = new Map((guides || []).map((g: any) => [g.id, { onboarding_status: g.onboarding_status, verified: g.verified }]));
    }

    return (data || []).map((service: any) => {
        const profile = fromMaybeArray<any>(service.profiles);
        const guide = guideStatuses.get(service.guide_id);
        return {
            id: service.id,
            title: service.title,
            category: service.category,
            description: service.description,
            guideId: service.guide_id,
            guideName: profile?.full_name || 'Guide inconnu',
            guideEmail: profile?.email || '',
            guideOnboardingStatus: guide?.onboarding_status || null,
            guideVerified: guide?.verified ?? false,
            price: asNumber(service.price_override),
            location: service.location || 'Non renseigné',
            availabilityStart: service.availability_start,
            availabilityEnd: service.availability_end,
            status: (service.service_status || 'active') as ServiceStatus,
            createdAt: service.created_at,
        };
    });
};

export const updateAdminServiceStatus = async (serviceId: string, status: ServiceStatus) => {
    const { adminId } = await ensureAdmin();

    const { data, error } = await supabase
        .from('services')
        .update({
            service_status: status,
        })
        .eq('id', serviceId)
        .select()
        .single();

    if (error) throw error;

    await logAdminAction({
        adminId,
        entityType: 'service',
        entityId: serviceId,
        action: 'update_service_status',
        details: { status },
    });

    return data;
};

export const getAdminReservations = async (options?: {
    search?: string;
    status?: ReservationStatus | 'all';
    periodDays?: number;
}) => {
    await ensureAdmin();

    const search = options?.search?.trim();
    const periodDays = options?.periodDays || 90;
    const startISO = periodStartISO(periodDays);

    let query = supabase
        .from('reservations')
        .select(`
            id,
            user_id,
            guide_id,
            service_name,
            start_date,
            end_date,
            visit_time,
            location,
            transport_pickup_type,
            hotel_address,
            hotel_over_2km_by_car,
            hotel_distance_km,
            transport_extra_fee_amount,
            commissionable_net_amount,
            commission_rate,
            total_price,
            status,
            payout_status,
            cancelled_by,
            guide_net_amount,
            platform_fee_amount,
            created_at,
            updated_at,
            completed_at,
            guide_profile:profiles!reservations_guide_id_fkey (
                full_name,
                email
            ),
            pilgrim_profile:profiles!reservations_user_id_fkey (
                full_name,
                email
            )
        `)
        .gte('created_at', startISO)
        .order('created_at', { ascending: false });

    if (options?.status && options.status !== 'all') {
        query = query.eq('status', options.status);
    }

    const { data, error } = await query;
    if (error) throw error;

    const nowMs = Date.now();
    const rows = (data || []).map((reservation: any) => {
        const guideProfile = fromMaybeArray<any>(reservation.guide_profile);
        const pilgrimProfile = fromMaybeArray<any>(reservation.pilgrim_profile);
        const commissionRate = asNumber(reservation.commission_rate) || PLATFORM_COMMISSION_RATE;
        const rawCommissionable = reservation.commissionable_net_amount;
        const createdAtRaw = reservation.created_at ? String(reservation.created_at) : null;
        const createdAtMs = createdAtRaw ? new Date(createdAtRaw).getTime() : NaN;
        const hoursSinceReservation = Number.isFinite(createdAtMs)
            ? Math.max(0, Math.floor((nowMs - createdAtMs) / (1000 * 60 * 60)))
            : 0;
        const isPendingTooLong = reservation.status === 'pending' && hoursSinceReservation >= REPLACEMENT_PENDING_TIMEOUT_HOURS;
        const isGuideCancelled = reservation.status === 'cancelled'
            && (
                (reservation.cancelled_by && reservation.cancelled_by === reservation.guide_id)
                || reservation.cancelled_by === null
            );
        const canAssignReplacement = isGuideCancelled || isPendingTooLong;
        const replacementReason = isGuideCancelled
            ? 'guide_cancelled'
            : isPendingTooLong
                ? 'pending_timeout_12h'
                : null;
        const finance = computeReservationFinance({
            totalPriceEur: asNumber(reservation.total_price),
            transportExtraFeeEur: asNumber(reservation.transport_extra_fee_amount),
            commissionableNetAmountEur: rawCommissionable === null || rawCommissionable === undefined ? null : asNumber(rawCommissionable),
            commissionRate,
        });
        const guideNetAmount = reservation.guide_net_amount === null || reservation.guide_net_amount === undefined
            ? finance.guideNetEur
            : asNumber(reservation.guide_net_amount);
        const platformFeeAmount = reservation.platform_fee_amount === null || reservation.platform_fee_amount === undefined
            ? finance.platformFeeEur
            : asNumber(reservation.platform_fee_amount);

        return {
            id: reservation.id,
            userId: reservation.user_id,
            guideId: reservation.guide_id,
            serviceName: reservation.service_name,
            startDate: reservation.start_date,
            endDate: reservation.end_date,
            visitTime: reservation.visit_time,
            location: reservation.location,
            transportPickupType: (reservation.transport_pickup_type || null) as 'haram' | 'hotel' | null,
            hotelAddress: reservation.hotel_address || null,
            hotelOver2KmByCar: typeof reservation.hotel_over_2km_by_car === 'boolean'
                ? reservation.hotel_over_2km_by_car
                : null,
            hotelDistanceKm: reservation.hotel_distance_km !== null && reservation.hotel_distance_km !== undefined
                ? asNumber(reservation.hotel_distance_km)
                : null,
            transportExtraFeeAmount: asNumber(reservation.transport_extra_fee_amount),
            totalPrice: asNumber(reservation.total_price),
            status: reservation.status as ReservationStatus,
            payoutStatus: (reservation.payout_status || 'not_due') as PayoutStatus,
            createdAt: createdAtRaw,
            hoursSinceReservation,
            isPendingTooLong,
            isGuideCancelled,
            canAssignReplacement,
            replacementReason,
            cancelledBy: reservation.cancelled_by || null,
            guideNetAmount,
            commissionableNetAmount: reservation.commissionable_net_amount === null || reservation.commissionable_net_amount === undefined
                ? null
                : asNumber(reservation.commissionable_net_amount),
            platformFeeAmount,
            updatedAt: reservation.updated_at,
            completedAt: reservation.completed_at,
            guideName: guideProfile?.full_name || 'Guide inconnu',
            guideEmail: guideProfile?.email || '',
            pilgrimName: pilgrimProfile?.full_name || 'Pèlerin inconnu',
            pilgrimEmail: pilgrimProfile?.email || '',
        };
    });

    if (!search) return rows;

    const lowered = search.toLowerCase();
    return rows.filter((row) =>
        row.serviceName?.toLowerCase().includes(lowered) ||
        row.guideName.toLowerCase().includes(lowered) ||
        row.pilgrimName.toLowerCase().includes(lowered) ||
        row.location?.toLowerCase().includes(lowered) ||
        row.hotelAddress?.toLowerCase().includes(lowered)
    );
};

export const updateAdminReservationStatus = async (reservationId: string, status: ReservationStatus, reason?: string) => {
    const { adminId } = await ensureAdmin();
    const updates: any = {
        status,
        updated_at: new Date().toISOString(),
    };

    if (status === 'completed') {
        const { data: reservation, error: reservationError } = await supabase
            .from('reservations')
            .select('total_price,commission_rate,transport_extra_fee_amount,commissionable_net_amount')
            .eq('id', reservationId)
            .single();

        if (reservationError) throw reservationError;

        const commissionRate = PLATFORM_COMMISSION_RATE;
        const rawCommissionable = (reservation as any)?.commissionable_net_amount;
        const finance = computeReservationFinance({
            totalPriceEur: asNumber(reservation?.total_price),
            transportExtraFeeEur: asNumber((reservation as any)?.transport_extra_fee_amount),
            commissionableNetAmountEur: rawCommissionable === null || rawCommissionable === undefined ? null : asNumber(rawCommissionable),
            commissionRate,
        });

        updates.completed_at = new Date().toISOString();
        updates.commission_rate = finance.commissionRate;
        updates.commissionable_net_amount = finance.commissionableNetAmountEur;
        updates.platform_fee_amount = finance.platformFeeEur;
        updates.guide_net_amount = finance.guideNetEur;
        updates.payout_status = 'to_pay';
    }

    if (status === 'cancelled') {
        updates.payout_status = 'not_due';
        updates.cancelled_at = new Date().toISOString();
        updates.cancelled_by = adminId;
    }

    const { data, error } = await supabase
        .from('reservations')
        .update(updates)
        .eq('id', reservationId)
        .select()
        .single();

    if (error) throw error;

    await logAdminAction({
        adminId,
        entityType: 'reservation',
        entityId: reservationId,
        action: 'update_reservation_status',
        details: { status, reason: reason || null },
    });

    return data;
};

export const getAdminReplacementGuideCandidates = async (reservationId: string): Promise<GuideCandidate[]> => {
    await ensureAdmin();

    const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .select('id,guide_id,status,cancelled_by,created_at')
        .eq('id', reservationId)
        .single();

    if (reservationError) throw reservationError;
    if (!reservation) throw new Error('Réservation introuvable.');

    const createdAtMs = reservation.created_at ? new Date(reservation.created_at).getTime() : NaN;
    const hoursSinceReservation = Number.isFinite(createdAtMs)
        ? Math.max(0, Math.floor((Date.now() - createdAtMs) / (1000 * 60 * 60)))
        : 0;
    const isPendingTooLong = reservation.status === 'pending' && hoursSinceReservation >= REPLACEMENT_PENDING_TIMEOUT_HOURS;
    const isGuideCancelled = reservation.status === 'cancelled'
        && (
            (reservation.cancelled_by && reservation.cancelled_by === reservation.guide_id)
            || reservation.cancelled_by === null
        );
    const canAssignReplacement = isGuideCancelled || isPendingTooLong;
    if (!canAssignReplacement) {
        throw new Error("Cette réservation n'est pas éligible au remplacement de guide.");
    }

    const { data: currentGuide, error: currentGuideError } = await supabase
        .from('guides')
        .select('id,location')
        .eq('id', reservation.guide_id)
        .maybeSingle();

    if (currentGuideError) throw currentGuideError;

    const buildCandidates = async (location?: string | null): Promise<GuideCandidate[]> => {
        let query = supabase
            .from('guides')
            .select(`
                id,
                location,
                rating,
                reviews_count,
                verified,
                onboarding_status,
                profiles:profiles!guides_id_fkey (
                    full_name,
                    email
                )
            `)
            .neq('id', reservation.guide_id)
            .or('onboarding_status.eq.approved,verified.eq.true');

        if (location && location.trim().length > 0) {
            query = query.eq('location', location.trim());
        }

        const { data, error } = await query;
        if (error) throw error;

        return (data || [])
            .map((guide: any) => {
                const profile = fromMaybeArray<any>(guide.profiles);
                return {
                    id: guide.id,
                    fullName: profile?.full_name || 'Guide',
                    email: profile?.email || '',
                    location: guide.location || null,
                    rating: asNumber(guide.rating),
                    reviewsCount: asNumber(guide.reviews_count),
                    verified: !!guide.verified,
                    onboardingStatus: guide.onboarding_status || null,
                };
            })
            .sort((a, b) => {
                if (Number(b.verified) !== Number(a.verified)) {
                    return Number(b.verified) - Number(a.verified);
                }
                if (b.rating !== a.rating) {
                    return b.rating - a.rating;
                }
                return b.reviewsCount - a.reviewsCount;
            });
    };

    const currentLocation = currentGuide?.location || null;
    const sameZoneCandidates = await buildCandidates(currentLocation);
    if (sameZoneCandidates.length > 0) {
        return sameZoneCandidates.map((candidate) => ({ ...candidate, fallbackAllZones: false }));
    }

    const fallbackCandidates = await buildCandidates(null);
    return fallbackCandidates.map((candidate) => ({ ...candidate, fallbackAllZones: true }));
};

export const assignReplacementGuide = async (params: {
    reservationId: string;
    newGuideId: string;
    reason?: string;
}): Promise<{ reservationId: string; previousGuideId: string; newGuideId: string; status: 'confirmed' }> => {
    await ensureAdmin();

    const { data, error } = await supabase.rpc('admin_assign_replacement_guide', {
        p_reservation_id: params.reservationId,
        p_new_guide_id: params.newGuideId,
        p_reason: params.reason || null,
    });

    if (error) throw error;

    const payload = Array.isArray(data) ? data[0] : data;
    if (!payload) throw new Error('Aucune donnée de remplacement retournée.');

    return {
        reservationId: payload.reservationId || payload.reservation_id,
        previousGuideId: payload.previousGuideId || payload.previous_guide_id,
        newGuideId: payload.newGuideId || payload.new_guide_id,
        status: 'confirmed',
    };
};

export const getAdminReports = async (filters?: {
    search?: string;
    status?: AdminReportStatus | 'all';
    category?: AdminReportCategory | 'all';
    periodDays?: number;
}): Promise<AdminReport[]> => {
    await ensureAdmin();

    const search = filters?.search?.trim().toLowerCase();
    const periodDays = filters?.periodDays || 90;
    const startISO = periodStartISO(periodDays);

    let query = supabase
        .from('user_reports')
        .select(`
            id,
            reporter_id,
            target_user_id,
            context,
            category,
            description,
            conversation_user_id,
            reservation_id,
            status,
            admin_note,
            resolved_at,
            resolved_by,
            created_at,
            updated_at,
            reporter_profile:profiles!user_reports_reporter_id_fkey (
                full_name,
                email
            ),
            target_profile:profiles!user_reports_target_user_id_fkey (
                full_name,
                email
            ),
            resolver_profile:profiles!user_reports_resolved_by_fkey (
                full_name
            )
        `)
        .gte('created_at', startISO)
        .order('created_at', { ascending: false });

    if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
    }

    if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
    }

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data || []).map((row: any): AdminReport => {
        const reporter = fromMaybeArray<any>(row.reporter_profile);
        const target = fromMaybeArray<any>(row.target_profile);
        const resolver = fromMaybeArray<any>(row.resolver_profile);

        return {
            id: row.id,
            reporterId: row.reporter_id,
            reporterName: reporter?.full_name || 'Utilisateur',
            reporterEmail: reporter?.email || '',
            targetUserId: row.target_user_id,
            targetUserName: target?.full_name || 'Utilisateur',
            targetUserEmail: target?.email || '',
            context: row.context as 'chat' | 'guide_profile',
            category: row.category as AdminReportCategory,
            description: row.description || null,
            conversationUserId: row.conversation_user_id || null,
            reservationId: row.reservation_id || null,
            status: row.status as AdminReportStatus,
            adminNote: row.admin_note || null,
            resolvedAt: row.resolved_at || null,
            resolvedBy: row.resolved_by || null,
            resolvedByName: resolver?.full_name || null,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    });

    if (!search) return rows;

    return rows.filter((row) => (
        row.reporterName.toLowerCase().includes(search)
        || row.reporterEmail.toLowerCase().includes(search)
        || row.targetUserName.toLowerCase().includes(search)
        || row.targetUserEmail.toLowerCase().includes(search)
        || row.category.toLowerCase().includes(search)
        || (row.description || '').toLowerCase().includes(search)
    ));
};

export const updateAdminReportStatus = async (payload: {
    reportId: string;
    status: AdminReportStatus;
    note?: string;
}) => {
    const { adminId } = await ensureAdmin();

    const isResolved = payload.status === 'resolved' || payload.status === 'rejected';
    const updates: any = {
        status: payload.status,
        admin_note: payload.note?.trim() ? payload.note.trim() : null,
        updated_at: new Date().toISOString(),
        resolved_at: isResolved ? new Date().toISOString() : null,
        resolved_by: isResolved ? adminId : null,
    };

    const { data, error } = await supabase
        .from('user_reports')
        .update(updates)
        .eq('id', payload.reportId)
        .select('*')
        .single();

    if (error) throw error;

    await logAdminAction({
        adminId,
        entityType: 'user_report',
        entityId: payload.reportId,
        action: 'update_report_status',
        details: {
            status: payload.status,
            note: payload.note?.trim() || null,
        },
    });

    return data;
};

export const getAdminFinance = async (periodDays = 30) => {
    await ensureAdmin();
    const startISO = periodStartISO(periodDays);

    const { data: reservations, error } = await supabase
        .from('reservations')
        .select('id,guide_id,total_price,commission_rate,commissionable_net_amount,transport_extra_fee_amount,platform_fee_amount,guide_net_amount,payout_status,status,created_at')
        .eq('status', 'completed')
        .gte('created_at', startISO);

    if (error) throw error;

    const guideIds = Array.from(new Set((reservations || []).map((reservation: any) => reservation.guide_id).filter(Boolean)));
    let guideMap = new Map<string, { full_name: string; email: string }>();

    if (guideIds.length) {
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id,full_name,email')
            .in('id', guideIds);
        if (profilesError) throw profilesError;
        guideMap = new Map((profiles || []).map((profile: any) => [profile.id, { full_name: profile.full_name, email: profile.email }]));
    }

    let gmv = 0;
    let platformRevenue = 0;
    let netToGuides = 0;
    let paidToGuides = 0;
    let dueToGuides = 0;

    const byGuide = new Map<string, {
        guideId: string;
        guideName: string;
        guideEmail: string;
        ordersCount: number;
        grossAmount: number;
        platformFeeAmount: number;
        netAmount: number;
        paidAmount: number;
        dueAmount: number;
    }>();

    for (const reservation of reservations || []) {
        const totalPrice = asNumber(reservation.total_price);
        const commissionRate = asNumber(reservation.commission_rate) || PLATFORM_COMMISSION_RATE;
        const rawCommissionable = (reservation as any).commissionable_net_amount;
        const fallback = computeReservationFinance({
            totalPriceEur: totalPrice,
            transportExtraFeeEur: asNumber((reservation as any).transport_extra_fee_amount),
            commissionableNetAmountEur: rawCommissionable === null || rawCommissionable === undefined ? null : asNumber(rawCommissionable),
            commissionRate,
        });
        const platformFee = asNumber(reservation.platform_fee_amount) || fallback.platformFeeEur;
        const guideNet = asNumber(reservation.guide_net_amount) || fallback.guideNetEur;
        const payoutStatus = (reservation.payout_status || 'to_pay') as PayoutStatus;

        gmv += totalPrice;
        platformRevenue += platformFee;
        netToGuides += guideNet;

        const paid = payoutStatus === 'paid' ? guideNet : 0;
        const due = DUE_PAYOUT_STATUSES.includes(payoutStatus) ? guideNet : 0;
        paidToGuides += paid;
        dueToGuides += due;

        const guideId = reservation.guide_id as string;
        const existing = byGuide.get(guideId);
        const profile = guideMap.get(guideId);

        const current = existing || {
            guideId,
            guideName: profile?.full_name || 'Guide inconnu',
            guideEmail: profile?.email || '',
            ordersCount: 0,
            grossAmount: 0,
            platformFeeAmount: 0,
            netAmount: 0,
            paidAmount: 0,
            dueAmount: 0,
        };

        current.ordersCount += 1;
        current.grossAmount += totalPrice;
        current.platformFeeAmount += platformFee;
        current.netAmount += guideNet;
        current.paidAmount += paid;
        current.dueAmount += due;

        byGuide.set(guideId, current);
    }

    return {
        periodDays,
        gmv,
        platformRevenue,
        netToGuides,
        paidToGuides,
        dueToGuides,
        byGuide: Array.from(byGuide.values()).sort((a, b) => b.dueAmount - a.dueAmount),
    };
};

export const markGuidePayoutAsPaid = async (guideId: string, paymentReference?: string) => {
    const { adminId } = await ensureAdmin();

    const { data: reservations, error: reservationsError } = await supabase
        .from('reservations')
        .select('id,total_price,commission_rate,commissionable_net_amount,transport_extra_fee_amount,guide_net_amount,platform_fee_amount,created_at')
        .eq('guide_id', guideId)
        .eq('status', 'completed')
        .in('payout_status', DUE_PAYOUT_STATUSES);

    if (reservationsError) throw reservationsError;
    if (!reservations || reservations.length === 0) {
        return { updatedReservations: 0, netAmount: 0 };
    }

    const reservationIds = reservations.map((reservation: any) => reservation.id);
    const now = new Date().toISOString();

    const { error: updateError } = await supabase
        .from('reservations')
        .update({
            payout_status: 'paid',
            updated_at: now,
        })
        .in('id', reservationIds);

    if (updateError) throw updateError;

    let grossAmount = 0;
    let platformFee = 0;
    let netAmount = 0;
    let periodStart = now;

    for (const reservation of reservations) {
        const totalPrice = asNumber(reservation.total_price);
        const commissionRate = asNumber(reservation.commission_rate) || PLATFORM_COMMISSION_RATE;
        const rawCommissionable = (reservation as any).commissionable_net_amount;
        const fallback = computeReservationFinance({
            totalPriceEur: totalPrice,
            transportExtraFeeEur: asNumber((reservation as any).transport_extra_fee_amount),
            commissionableNetAmountEur: rawCommissionable === null || rawCommissionable === undefined ? null : asNumber(rawCommissionable),
            commissionRate,
        });
        const linePlatformFee = asNumber(reservation.platform_fee_amount) || fallback.platformFeeEur;
        const lineNet = asNumber(reservation.guide_net_amount) || fallback.guideNetEur;

        grossAmount += totalPrice;
        platformFee += linePlatformFee;
        netAmount += lineNet;
        if (reservation.created_at && reservation.created_at < periodStart) {
            periodStart = reservation.created_at;
        }
    }

    try {
        await supabase.from('guide_payouts').insert({
            guide_id: guideId,
            period_start: periodStart,
            period_end: now,
            gross_amount: grossAmount,
            platform_fee: platformFee,
            net_amount: netAmount,
            status: 'paid',
            paid_at: now,
            payment_reference: paymentReference || null,
            notes: `Paiement manuel validé par admin ${adminId}`,
        });
    } catch (error) {
        console.warn('Payout insert failed:', error);
    }

    await logAdminAction({
        adminId,
        entityType: 'payout',
        entityId: guideId,
        action: 'mark_guide_payout_paid',
        details: {
            reservations: reservationIds.length,
            grossAmount,
            platformFee,
            netAmount,
            paymentReference: paymentReference || null,
        },
    });

    return { updatedReservations: reservationIds.length, netAmount };
};
