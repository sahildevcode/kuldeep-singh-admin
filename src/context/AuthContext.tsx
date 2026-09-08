import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile } from '../types';

interface AuthContextType {
  currentUser: UserProfile | null;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isAdminAuthenticated: boolean;
  isAdminModalOpen: boolean;
  setIsAdminModalOpen: (open: boolean) => void;
  login: (email: string, name?: string, role?: 'collector' | 'student') => void;
  logout: () => void;
  adminLogin: (email: string, pass: string) => boolean;
  adminLogout: () => void;
  quickDemoLogin: (role: 'collector' | 'student') => void;
  unlockCourse: (courseId: string) => void;
  isCourseUnlocked: (courseId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('kuldeep_art_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('kuldeep_admin_session') === 'true';
    } catch {
      return false;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('kuldeep_art_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('kuldeep_art_user');
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

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

  const quickDemoLogin = (role: 'collector' | 'student') => {
    if (role === 'collector') {
      login('collector@kuldeepsingh.art', 'Countess Vivienne', 'collector');
    } else {
      login('student@kuldeepsingh.art', 'Leo Montoya', 'student');
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const adminLogin = (email: string, pass: string): boolean => {
    const cleanEmail = email.trim().toLowerCase();
    // Default admin credentials: admin@kuldeepsingh.art / kuldeep2026
    if (
      (cleanEmail === 'admin@kuldeepsingh.art' || cleanEmail === 'kuldeep@art.com' || cleanEmail === 'admin') &&
      (pass === 'kuldeep2026' || pass === 'admin123')
    ) {
      setIsAdminAuthenticated(true);
      try {
        localStorage.setItem('kuldeep_admin_session', 'true');
      } catch (e) {
        console.error(e);
      }
      setIsAdminModalOpen(false);
      return true;
    }
    return false;
  };

  const adminLogout = () => {
    setIsAdminAuthenticated(false);
    try {
      localStorage.removeItem('kuldeep_admin_session');
    } catch (e) {
      console.error(e);
    }
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
        login,
        logout,
        adminLogin,
        adminLogout,
        quickDemoLogin,
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
