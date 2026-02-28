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
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

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
    price: string;
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
    cancellationPolicyApplied?: ReservationCancellationPolicy | null;
    guideStartConfirmedAt?: string | null;
    pilgrimStartConfirmedAt?: string | null;
    visitStartedAt?: string | null;
    guideEndConfirmedAt?: string | null;
    pilgrimEndConfirmedAt?: string | null;
    completedAt?: string | null;
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
    refreshReservations: () => Promise<void>;
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

    const refreshReservations = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getReservations();
            // Map API response to Context Reservation type if needed, but they are aligned now
            setReservations(data as Reservation[]);
        } catch (error) {
            console.error("Failed to fetch reservations:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshReservations();
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
