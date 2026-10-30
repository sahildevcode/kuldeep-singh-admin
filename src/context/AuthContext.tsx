import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { UserProfile } from '../types';
import { adminFetch, setAdminAuthToken } from '../utils/apiClient';

interface AdminUser {
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isAdminAuthenticated: boolean;
  isAdminModalOpen: boolean;
  setIsAdminModalOpen: (open: boolean) => void;
  adminUser: AdminUser | null;
  adminLoading: boolean;
  adminAuthStep: 'credentials' | 'otp';
  pendingAdminEmail: string;
  adminError: string | null;
  setAdminError: (err: string | null) => void;
  login: (email: string, name?: string, role?: 'collector' | 'student') => void;
  logout: () => void;
  requestAdminOtp: (email: string, pass: string) => Promise<{ success: boolean; error?: string; devMode?: boolean }>;
  verifyAdminOtp: (otp: string) => Promise<{ success: boolean; error?: string }>;
  resendAdminOtp: () => Promise<{ success: boolean; error?: string; cooldownRemaining?: number }>;
  requestForgotPasswordOtp: (email: string) => Promise<{ success: boolean; error?: string; message?: string; cooldownRemaining?: number; devOtp?: string }>;
  resetAdminPasswordWithOtp: (email: string, otp: string, newPass: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  adminLogout: () => Promise<void>;
  resetAdminAuthState: () => void;
  unlockCourse: (courseId: string) => void;
  isCourseUnlocked: (courseId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getBackendBase = () => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:5000';
  }
  return 'https://kuldeep-singh-backend.vercel.app';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('kuldeep_art_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [adminLoading, setAdminLoading] = useState<boolean>(true);
  const [adminAuthStep, setAdminAuthStep] = useState<'credentials' | 'otp'>('credentials');
  const [pendingAdminEmail, setPendingAdminEmail] = useState<string>('');
  const [adminError, setAdminError] = useState<string | null>(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Validate active Admin session with the backend on page load
  const validateSession = useCallback(async () => {
    setAdminLoading(true);
    const backend = getBackendBase();
    try {
      const res = await adminFetch(`${backend}/api/admin/session`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.admin) {
          setIsAdminAuthenticated(true);
          setAdminUser(data.admin);
          setAdminError(null);
          setAdminLoading(false);
          return;
        }
      }
      // If unauthorized or failed
      setIsAdminAuthenticated(false);
      setAdminUser(null);
      setAdminAuthToken(null);
    } catch (err) {
      // Backend might be offline or sleeping on free tier
      setIsAdminAuthenticated(false);
      setAdminUser(null);
    } finally {
      setAdminLoading(false);
    }
  }, []);

  useEffect(() => {
    validateSession();
  }, [validateSession]);

  const resetAdminAuthState = () => {
    setAdminAuthStep('credentials');
    setPendingAdminEmail('');
    setAdminError(null);
  };

  /**
   * Phase 1 of Admin Login: Send email and password to receive Resend OTP
   */
  const requestAdminOtp = async (email: string, pass: string): Promise<{ success: boolean; error?: string; devMode?: boolean }> => {
    setAdminError(null);
    const backend = getBackendBase();
    try {
      const res = await fetch(`${backend}/api/admin/login-challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: pass.trim() }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        const errMsg = data.error || 'Failed to authenticate administrator credentials.';
        setAdminError(errMsg);
        return { success: false, error: errMsg };
      }

      setPendingAdminEmail(email.trim().toLowerCase());
      setAdminAuthStep('otp');
      return { success: true, devMode: data.devMode };
    } catch (err: any) {
      console.error('requestAdminOtp exception:', err);
      const errMsg = err?.message && !err.message.includes('fetch')
        ? err.message
        : 'Cannot reach backend server. Please check your network or try again.';
      setAdminError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  /**
   * Phase 2 of Admin Login: Submit 6-digit OTP
   */
  const verifyAdminOtp = async (otp: string): Promise<{ success: boolean; error?: string }> => {
    setAdminError(null);
    const backend = getBackendBase();
    try {
      const res = await fetch(`${backend}/api/admin/verify-otp`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingAdminEmail, otp: otp.trim() }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        const errMsg = data.error || 'Invalid or expired verification code.';
        setAdminError(errMsg);
        return { success: false, error: errMsg };
      }

      if (data.token) {
        setAdminAuthToken(data.token);
      }

      setIsAdminAuthenticated(true);
      setAdminUser(data.admin);
      setAdminAuthStep('credentials');
      setPendingAdminEmail('');
      setIsAdminModalOpen(false);
      return { success: true };
    } catch (err: any) {
      const errMsg = 'Error verifying code. Please try again.';
      setAdminError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  /**
   * Resend Admin OTP
   */
  const resendAdminOtp = async (): Promise<{ success: boolean; error?: string; cooldownRemaining?: number }> => {
    setAdminError(null);
    const backend = getBackendBase();
    try {
      const res = await fetch(`${backend}/api/admin/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingAdminEmail }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        const errMsg = data.error || 'Failed to resend verification code.';
        setAdminError(errMsg);
        return { success: false, error: errMsg, cooldownRemaining: data.cooldownRemaining };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'Network error while requesting code.' };
    }
  };

  /**
   * Request Password Recovery OTP
   */
  const requestForgotPasswordOtp = async (
    email: string
  ): Promise<{ success: boolean; error?: string; message?: string; cooldownRemaining?: number; devOtp?: string }> => {
    setAdminError(null);
    const backend = getBackendBase();
    try {
      const res = await fetch(`${backend}/api/admin/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        const errMsg = data.error || 'Failed to request password reset.';
        setAdminError(errMsg);
        return { success: false, error: errMsg, cooldownRemaining: data.cooldownRemaining };
      }

      return {
        success: true,
        message: data.message,
        cooldownRemaining: data.cooldownRemaining,
        devOtp: data.devOtp,
      };
    } catch (err: any) {
      const errMsg = 'Network error while requesting password reset.';
      setAdminError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  /**
   * Reset Admin Password with Verified OTP
   */
  const resetAdminPasswordWithOtp = async (
    email: string,
    otp: string,
    newPass: string
  ): Promise<{ success: boolean; error?: string; message?: string }> => {
    setAdminError(null);
    const backend = getBackendBase();
    try {
      const res = await fetch(`${backend}/api/admin/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          newPassword: newPass.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        const errMsg = data.error || 'Failed to reset password.';
        setAdminError(errMsg);
        return { success: false, error: errMsg };
      }

      return { success: true, message: data.message };
    } catch (err: any) {
      const errMsg = 'Network error while resetting password.';
      setAdminError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  /**
   * Admin Logout: Revoke session on backend and clear cookies/tokens
   */
  const adminLogout = async () => {
    const backend = getBackendBase();
    try {
      await adminFetch(`${backend}/api/admin/logout`, {
        method: 'POST',
      });
    } catch {}

    setAdminAuthToken(null);
    setIsAdminAuthenticated(false);
    setAdminUser(null);
    resetAdminAuthState();
  };

  const login = (email: string, name = 'Art Patron', role: 'collector' | 'student' = 'collector') => {
    const newUser: UserProfile = {
      id: 'usr_' + Date.now(),
      name,
      email,
      role,
      avatar:
        role === 'collector'
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop'
          : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop',
      memberSince: '2026',
      collectedCount: role === 'collector' ? 2 : 0,
      enrolledCoursesCount: role === 'student' ? 3 : 1,
    };
    setCurrentUser(newUser);
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const unlockCourse = (courseId: string) => {
    if (!currentUser) return;
    const currentList = currentUser.enrolledCourseIds || [];
    if (!currentList.includes(courseId)) {
      const updatedList = [...currentList, courseId];
      const updatedUser: UserProfile = {
        ...currentUser,
        enrolledCourseIds: updatedList,
        enrolledCoursesCount: updatedList.length,
      };
      setCurrentUser(updatedUser);
    }
  };

  const isCourseUnlocked = (courseId: string): boolean => {
    if (!currentUser) return false;
    return Boolean(currentUser.enrolledCourseIds?.includes(courseId));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isAdminAuthenticated,
        isAdminModalOpen,
        setIsAdminModalOpen,
        adminUser,
        adminLoading,
        adminAuthStep,
        pendingAdminEmail,
        adminError,
        setAdminError,
        login,
        logout,
        requestAdminOtp,
        verifyAdminOtp,
        resendAdminOtp,
        requestForgotPasswordOtp,
        resetAdminPasswordWithOtp,
        adminLogout,
        resetAdminAuthState,
        unlockCourse,
        isCourseUnlocked,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
