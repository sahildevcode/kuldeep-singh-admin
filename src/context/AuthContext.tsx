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
  requestAdminOtp: (email: string, pass: string) => Promise<{ success: boolean; error?: string; devMode?: boolean; devOtp?: string }>;
  verifyAdminOtp: (otp: string) => Promise<{ success: boolean; error?: string }>;
  resendAdminOtp: () => Promise<{ success: boolean; error?: string; cooldownRemaining?: number; devMode?: boolean; devOtp?: string }>;
  requestForgotPasswordOtp: (email: string) => Promise<{ success: boolean; error?: string; message?: string; cooldownRemaining?: number; devOtp?: string }>;
  resetAdminPasswordWithOtp: (email: string, otp: string, newPass: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  adminLogout: () => Promise<void>;
  resetAdminAuthState: () => void;
  unlockCourse: (courseId: string) => void;
  isCourseUnlocked: (courseId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const getBackendUrls = (): string[] => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return [
        'http://localhost:5000',
        'http://127.0.0.1:5000',
        'https://kuldeep-singh-backend.vercel.app',
      ];
    }
  }
  return [
    'https://kuldeep-singh-backend.vercel.app',
    'http://localhost:5000'
  ];
};

const executeAuthApi = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: any; networkError?: boolean }> => {
  const urls = getBackendUrls();

  for (const base of urls) {
    try {
      const res = await adminFetch(`${base}${endpoint}`, options);
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, data };
    } catch {
      // try next backend url candidate
    }
  }

  return { ok: false, status: 0, data: null, networkError: true };
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
    try {
      const { ok, data } = await executeAuthApi('/api/admin/session');
      if (ok && data?.success && data?.admin) {
        setIsAdminAuthenticated(true);
        setAdminUser(data.admin);
        setAdminError(null);
        setAdminLoading(false);
        return;
      }
      // If unauthorized or failed
      setIsAdminAuthenticated(false);
      setAdminUser(null);
      setAdminAuthToken(null);
    } catch (err) {
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
  const requestAdminOtp = async (email: string, pass: string): Promise<{ success: boolean; error?: string; devMode?: boolean; devOtp?: string }> => {
    setAdminError(null);
    const { ok, data, networkError } = await executeAuthApi('/api/admin/login-challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password: pass.trim() }),
    });

    if (networkError) {
      const errMsg = 'Cannot reach backend server. Please check your network or try again.';
      setAdminError(errMsg);
      return { success: false, error: errMsg };
    }

    if (!ok || !data?.success) {
      const errMsg = data?.error || 'Failed to authenticate administrator credentials.';
      setAdminError(errMsg);
      return { success: false, error: errMsg };
    }

    setPendingAdminEmail(email.trim().toLowerCase());
    setAdminAuthStep('otp');
    return { success: true, devMode: data.devMode, devOtp: data.devOtp };
  };

  /**
   * Phase 2 of Admin Login: Submit 6-digit OTP
   */
  const verifyAdminOtp = async (otp: string): Promise<{ success: boolean; error?: string }> => {
    setAdminError(null);
    const { ok, data, networkError } = await executeAuthApi('/api/admin/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: pendingAdminEmail, otp: otp.trim() }),
    });

    if (networkError) {
      const errMsg = 'Cannot reach backend server. Please check your network or try again.';
      setAdminError(errMsg);
      return { success: false, error: errMsg };
    }

    if (!ok || !data?.success) {
      const errMsg = data?.error || 'Invalid or expired verification code.';
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
  };

  /**
   * Resend Admin OTP
   */
  const resendAdminOtp = async (): Promise<{ success: boolean; error?: string; cooldownRemaining?: number; devMode?: boolean; devOtp?: string }> => {
    setAdminError(null);
    const { ok, data, networkError } = await executeAuthApi('/api/admin/resend-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: pendingAdminEmail }),
    });

    if (networkError || !ok || !data?.success) {
      const errMsg = data?.error || 'Failed to resend verification code.';
      setAdminError(errMsg);
      return { success: false, error: errMsg, cooldownRemaining: data?.cooldownRemaining };
    }

    return { success: true, devMode: data?.devMode, devOtp: data?.devOtp };
  };

  /**
   * Request Password Recovery OTP
   */
  const requestForgotPasswordOtp = async (
    email: string
  ): Promise<{ success: boolean; error?: string; message?: string; cooldownRemaining?: number; devOtp?: string }> => {
    setAdminError(null);
    const { ok, data, networkError } = await executeAuthApi('/api/admin/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });

    if (networkError || !ok || !data?.success) {
      const errMsg = data?.error || 'Failed to request password reset.';
      setAdminError(errMsg);
      return { success: false, error: errMsg, cooldownRemaining: data?.cooldownRemaining };
    }

    return {
      success: true,
      message: data.message,
      cooldownRemaining: data.cooldownRemaining,
      devOtp: data.devOtp,
    };
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
    const { ok, data, networkError } = await executeAuthApi('/api/admin/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword: newPass.trim(),
      }),
    });

    if (networkError || !ok || !data?.success) {
      const errMsg = data?.error || 'Failed to reset password.';
      setAdminError(errMsg);
      return { success: false, error: errMsg };
    }

    return { success: true, message: data.message };
  };

  /**
   * Admin Logout: Revoke session on backend and clear cookies/tokens
   */
  const adminLogout = async () => {
    try {
      await executeAuthApi('/api/admin/logout', {
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
