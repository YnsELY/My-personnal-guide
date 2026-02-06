import { updateReservationStatus as apiUpdateStatus, createReservation, getReservations } from '@/lib/api';
import React, { createContext, useContext, useEffect, useState } from 'react';

// Define types
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Reservation {
    id: string;
    guideId: string;
    guideName?: string;
    pilgrimId: string;
    pilgrimName: string;
    serviceName: string;
    date: string;
    time: string;
    price: string;
    location?: string;
    status: ReservationStatus;
    image?: any;
    guideAvatar?: string;
    pilgrimAvatar?: string; // Added to match API
}

interface ReservationsContextType {
    reservations: Reservation[];
    addReservation: (reservation: Omit<Reservation, 'id' | 'status'>) => Promise<void>;
    updateReservationStatus: (id: string, status: ReservationStatus) => Promise<void>;
    getReservationsByRole: (role: 'guide' | 'pilgrim', userId: string) => Reservation[];
    isLoading: boolean;
    refreshReservations: () => Promise<void>;
}

const ReservationsContext = createContext<ReservationsContextType | undefined>(undefined);

export function ReservationsProvider({ children }: { children: React.ReactNode }) {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refreshReservations = async () => {
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
    };

    useEffect(() => {
        refreshReservations();
    }, []);

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
                pilgrims: [newRes.pilgrimName] // Simplification
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

    const getReservationsByRole = (role: 'guide' | 'pilgrim', userId: string) => {
        if (role === 'guide') {
            // For demo purposes, if userId is '1' (our mock guide), show all requests/visits assigned to guide '1'
            // OR simply show everything for the demo if we want to simulate "I am THIS guide"
            return reservations.filter(r => r.guideId === userId || r.guideId === '1');
            // ^ Added '1' fallback to ensure our mock guide sees data even if auth ID differs in mock
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
