import { signIn as apiSignIn, signOut as apiSignOut, signUp as apiSignUp, getCurrentProfile, getCurrentUser } from '@/lib/api';
import React, { createContext, useContext, useEffect, useState } from 'react';

type UserRole = 'guide' | 'pilgrim';

interface AuthContextType {
    user: any | null;
    profile: any | null;
    isLoading: boolean;
    signIn: (email: string, pass: string) => Promise<void>;
    signUp: (email: string, pass: string, name: string, role: UserRole) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    isLoading: true,
    signIn: async () => { },
    signUp: async () => { },
    signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = async () => {
        try {
            const u = await getCurrentUser();
            setUser(u);
            if (u) {
                const p = await getCurrentProfile();
                setProfile(p);
            } else {
                setProfile(null);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    const signIn = async (email: string, pass: string) => {
        await apiSignIn(email, pass);
        await refreshUser();
    };

    const signUp = async (email: string, pass: string, name: string, role: UserRole) => {
        await apiSignUp(email, pass, name, role);
        await refreshUser();
    };

    const signOut = async () => {
        await apiSignOut();
        setUser(null);
        setProfile(null);
    };

    return (
        <AuthContext.Provider value={{ user, profile, isLoading, signIn, signUp, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};
