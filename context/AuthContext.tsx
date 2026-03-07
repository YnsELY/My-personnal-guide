import { type AvatarPresetId } from '@/lib/avatar';
import { getCurrentProfile, getCurrentUser, getGuideApprovalInfo, signIn as apiSignIn, signOut as apiSignOut, signUp as apiSignUp, updateCurrentProfileAvatar } from '@/lib/api';
import React, { createContext, useContext, useEffect, useState } from 'react';

type SignUpRole = 'guide' | 'pilgrim';
type GuideApprovalStatus = 'pending_review' | 'approved' | 'rejected';

interface AuthContextType {
    user: any | null;
    profile: any | null;
    isLoading: boolean;
    guideApprovalStatus: GuideApprovalStatus;
    isGuideApproved: boolean;
    signIn: (email: string, pass: string) => Promise<void>;
    signUp: (email: string, pass: string, name: string, role: SignUpRole, gender: 'male' | 'female', dob: string, language: 'fr' | 'ar') => Promise<void>;
    updateProfileAvatar: (presetId: AvatarPresetId) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    isLoading: true,
    guideApprovalStatus: 'pending_review',
    isGuideApproved: true,
    signIn: async () => { },
    signUp: async () => { },
    updateProfileAvatar: async () => { },
    signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [guideApprovalStatus, setGuideApprovalStatus] = useState<GuideApprovalStatus>('pending_review');
    const [isGuideApproved, setIsGuideApproved] = useState(true);

    const refreshUser = async (options?: { throwOnSuspended?: boolean }) => {
        try {
            const u = await getCurrentUser();
            setUser(u);
            if (u) {
                const p = await getCurrentProfile();
                const metadataRole = u.user_metadata?.role as SignUpRole | 'admin' | undefined;
                const effectiveRole = p?.role || metadataRole;
                if (p?.account_status === 'suspended') {
                    await apiSignOut();
                    setUser(null);
                    setProfile(null);
                    setGuideApprovalStatus('pending_review');
                    setIsGuideApproved(false);
                    if (options?.throwOnSuspended) {
                        throw new Error("Votre compte a été suspendu. Contactez le support.");
                    }
                    return;
                }

                // Fallback profile when DB profile is not immediately available after signup.
                setProfile(
                    p || {
                        id: u.id,
                        email: u.email,
                        full_name: u.user_metadata?.full_name || 'Guide',
                        role: effectiveRole || 'pilgrim',
                        account_status: 'active',
                    }
                );

                if (effectiveRole === 'guide') {
                    const approval = await getGuideApprovalInfo(u.id);
                    setGuideApprovalStatus(approval.status);
                    setIsGuideApproved(approval.isApproved);
                } else {
                    setGuideApprovalStatus('approved');
                    setIsGuideApproved(true);
                }
            } else {
                setProfile(null);
                setGuideApprovalStatus('pending_review');
                setIsGuideApproved(true);
            }
        } catch (e: any) {
            console.error("AuthContext initialization error:", e);
            // Don't crash the app, just stay logged out
            setUser(null);
            setProfile(null);
            setGuideApprovalStatus('pending_review');
            setIsGuideApproved(true);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    const signIn = async (email: string, pass: string) => {
        await apiSignIn(email, pass);
        await refreshUser({ throwOnSuspended: true });
    };

    const signUp = async (email: string, pass: string, name: string, role: SignUpRole, gender: 'male' | 'female', dob: string, language: 'fr' | 'ar') => {
        await apiSignUp(email, pass, name, role, gender, dob, language);
        await refreshUser();
    };

    const updateProfileAvatar = async (presetId: AvatarPresetId) => {
        const updated = await updateCurrentProfileAvatar(presetId);
        setProfile((prev: any) => {
            if (!prev) return prev;
            return {
                ...prev,
                avatar_url: updated?.avatar_url || prev.avatar_url,
            };
        });
    };

    const signOut = async () => {
        await apiSignOut();
        setUser(null);
        setProfile(null);
        setGuideApprovalStatus('pending_review');
        setIsGuideApproved(true);
    };

    return (
        <AuthContext.Provider value={{ user, profile, isLoading, guideApprovalStatus, isGuideApproved, signIn, signUp, updateProfileAvatar, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};
