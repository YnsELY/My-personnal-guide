import { useAuth } from '@/context/AuthContext';
import {
    cancelReservationAsPilgrim as apiCancelReservationAsPilgrim,
    confirmVisitEndAsGuide as apiConfirmVisitEndAsGuide,
    confirmVisitEndAsPilgrim as apiConfirmVisitEndAsPilgrim,
    confirmVisitStartAsGuide as apiConfirmVisitStartAsGuide,
    confirmVisitStartAsPilgrim as apiConfirmVisitStartAsPilgrim,
    createReservation,
    getReservations,
    updateReservationStatus as apiUpdateStatus,
} from '@/lib/api';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

// Define types
export type ReservationStatus = 'pending' | 'confirmed' | 'in_progress' | 'cancelled' | 'completed';
export type ReservationPayoutStatus = 'not_due' | 'to_pay' | 'processing' | 'paid' | 'failed';
export type ReservationCancellationPolicy = 'full_credit_over_48h' | 'no_credit_under_48h';

export interface Reservation {
    id: string;
    guideId: string;
    guideName?: string;
    pilgrimId: string;
    pilgrimName: string;
    serviceName: string;
    startDate?: string;
    endDate?: string;
    date: string;
    time: string;
    price: string | number;
    totalPriceEur?: number;
    guideNetAmountEur?: number | null;
    commissionableNetAmountEur?: number | null;
    location?: string;
    transportPickupType?: 'haram' | 'hotel' | null;
    hotelAddress?: string | null;
    hotelOver2KmByCar?: boolean | null;
    hotelDistanceKm?: number | null;
    transportExtraFeeAmount?: number;
    status: ReservationStatus;
    payoutStatus?: ReservationPayoutStatus;
    walletAmountUsed?: number;
    cardAmountPaid?: number;
    cancellationCreditAmount?: number;
    cancelledAt?: string | null;
    cancelledBy?: string | null;
    cancellationPolicyApplied?: ReservationCancellationPolicy | null;
    createdAt?: string | null;
    reassignedFromGuideId?: string | null;
    reassignedByAdminId?: string | null;
    reassignedAt?: string | null;
    reassignmentReason?: string | null;
    hoursSinceReservation?: number;
    guideStartConfirmedAt?: string | null;
    pilgrimStartConfirmedAt?: string | null;
    visitStartedAt?: string | null;
    guideEndConfirmedAt?: string | null;
    pilgrimEndConfirmedAt?: string | null;
    completedAt?: string | null;
    hasReview?: boolean;
    reviewId?: string | null;
    image?: any;
    guideAvatar?: string;
    pilgrimAvatar?: string; // Added to match API
}

interface ReservationsContextType {
    reservations: Reservation[];
    addReservation: (reservation: Omit<Reservation, 'id' | 'status'>) => Promise<void>;
    updateReservationStatus: (id: string, status: ReservationStatus) => Promise<void>;
    cancelReservationAsPilgrim: (id: string) => Promise<any>;
    confirmVisitStartAsGuide: (id: string) => Promise<any>;
    confirmVisitStartAsPilgrim: (id: string) => Promise<any>;
    confirmVisitEndAsGuide: (id: string) => Promise<any>;
    confirmVisitEndAsPilgrim: (id: string) => Promise<any>;
    getReservationsByRole: (role: 'guide' | 'pilgrim', userId: string) => Reservation[];
    isLoading: boolean;
    refreshReservations: (options?: { silent?: boolean }) => Promise<void>;
}

const ReservationsContext = createContext<ReservationsContextType | undefined>(undefined);

const parseReservationDate = (value?: string) => {
    if (!value) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
        const [day, month, year] = value.split('/').map(Number);
        const date = new Date(year, month - 1, day);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

export function ReservationsProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const hasLoadedOnceRef = useRef(false);
    const refreshInFlightRef = useRef<Promise<void> | null>(null);

    const refreshReservations = useCallback(async (options?: { silent?: boolean }) => {
        if (!user?.id) {
            setReservations([]);
            setIsLoading(false);
            hasLoadedOnceRef.current = false;
            return;
        }

        if (refreshInFlightRef.current) {
            return refreshInFlightRef.current;
        }

        const shouldShowLoader = !options?.silent && !hasLoadedOnceRef.current;
        if (shouldShowLoader) {
            setIsLoading(true);
        }

        const run = (async () => {
            try {
                const data = await getReservations();
                // Map API response to Context Reservation type if needed, but they are aligned now
                const nextReservations = data as Reservation[];
                setReservations((prev) => {
                    const isSame =
                        prev.length === nextReservations.length &&
                        prev.every((current, index) => {
                            const next = nextReservations[index];
                            if (!next) return false;
                            return (
                                current.id === next.id &&
                                current.status === next.status &&
                                current.payoutStatus === next.payoutStatus &&
                                current.guideId === next.guideId &&
                                current.pilgrimId === next.pilgrimId &&
                                current.cancelledAt === next.cancelledAt &&
                                current.completedAt === next.completedAt &&
                                current.guideStartConfirmedAt === next.guideStartConfirmedAt &&
                                current.pilgrimStartConfirmedAt === next.pilgrimStartConfirmedAt &&
                                current.guideEndConfirmedAt === next.guideEndConfirmedAt &&
                                current.pilgrimEndConfirmedAt === next.pilgrimEndConfirmedAt
                            );
                        });

                    return isSame ? prev : nextReservations;
                });
                hasLoadedOnceRef.current = true;
            } catch (error) {
                console.error("Failed to fetch reservations:", error);
            } finally {
                if (shouldShowLoader) {
                    setIsLoading(false);
                }
                refreshInFlightRef.current = null;
            }
        })();

        refreshInFlightRef.current = run;
        return run;
    }, [user?.id]);

    useEffect(() => {
        if (!user?.id) {
            setReservations([]);
            setIsLoading(false);
            hasLoadedOnceRef.current = false;
            refreshInFlightRef.current = null;
            return;
        }

        hasLoadedOnceRef.current = false;
        refreshReservations().catch((error) => {
            console.error("Failed to initialize reservations:", error);
        });
    }, [refreshReservations, user?.id]);

    const addReservation = async (newRes: Omit<Reservation, 'id' | 'status'>) => {
        try {
            await createReservation({
                guideId: newRes.guideId,
                serviceName: newRes.serviceName,
                // Parse date string or use raw if API handles it? 
                // Using simplified date handling assumption from previous code
                startDate: Date.now().toString(), // Helper for now, ideal to pass real dates
                endDate: Date.now().toString(),
                price: newRes.price,
                location: newRes.location,
                visitTime: newRes.time,
                pilgrims: [newRes.pilgrimName], // Simplification
                transportPickupType: 'haram',
                transportExtraFeeAmount: 0,
                transportWarningAcknowledged: true,
            });
            await refreshReservations();
            console.log("Reservation added to DB");
        } catch (e) {
            console.error("Error adding reservation:", e);
            throw e;
        }
    };

    const updateReservationStatus = async (id: string, status: ReservationStatus) => {
        try {
            await apiUpdateStatus(id, status);
            // Optimistic update
            setReservations(prev => prev.map(res =>
                res.id === id ? { ...res, status } : res
            ));
            // Or refresh
            // await refreshReservations(); 
        } catch (e) {
            console.error("Error updating status:", e);
            throw e;
        }
    };

    const cancelReservationAsPilgrim = async (id: string) => {
        const result = await apiCancelReservationAsPilgrim(id);
        await refreshReservations();
        return result;
    };

    const confirmVisitStartAsGuide = async (id: string) => {
        const result = await apiConfirmVisitStartAsGuide(id);
        await refreshReservations();
        return result;
    };

    const confirmVisitStartAsPilgrim = async (id: string) => {
        const result = await apiConfirmVisitStartAsPilgrim(id);
        await refreshReservations();
        return result;
    };

    const confirmVisitEndAsGuide = async (id: string) => {
        const result = await apiConfirmVisitEndAsGuide(id);
        await refreshReservations();
        return result;
    };

    const confirmVisitEndAsPilgrim = async (id: string) => {
        const result = await apiConfirmVisitEndAsPilgrim(id);
        await refreshReservations();
        return result;
    };

    const getReservationsByRole = (role: 'guide' | 'pilgrim', userId: string) => {
        if (role === 'guide') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            return reservations
                .filter(r => r.guideId === userId || r.guideId === '1')
                .filter((reservation) => {
                    if (reservation.status !== 'pending' && reservation.status !== 'confirmed') {
                        return true;
                    }

                    const reservationDate = parseReservationDate(reservation.startDate || reservation.date);
                    if (!reservationDate) return true;

                    return reservationDate >= today;
                });
        } else {
            return reservations.filter(r => r.pilgrimId === userId || r.pilgrimId === 'p1');
            // ^ Added 'p1' fallback
        }
    };

    return (
        <ReservationsContext.Provider value={{
            reservations,
            addReservation,
            updateReservationStatus,
            cancelReservationAsPilgrim,
            confirmVisitStartAsGuide,
            confirmVisitStartAsPilgrim,
            confirmVisitEndAsGuide,
            confirmVisitEndAsPilgrim,
            getReservationsByRole,
            isLoading,
            refreshReservations
        }}>
            {children}
        </ReservationsContext.Provider>
    );
}

export function useReservations() {
    const context = useContext(ReservationsContext);
    if (!context) {
        throw new Error('useReservations must be used within a ReservationsProvider');
    }
    return context;
}
