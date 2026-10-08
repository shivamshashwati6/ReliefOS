import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEMO_USERS, DEMO_PASSWORD } from '../config/roles';

const AuthContext = createContext(null);
const STORAGE_KEY = 'relief_os_auth_user';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse stored auth user:', e);
    }
    return null;
  });

  // Keep localStorage synchronized whenever currentUser changes
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Failed to update localStorage with auth user:', e);
    }
  }, [currentUser]);

  /**
   * Mock authentication for prototype
   * Matches by email against demo users, or accepts valid credentials
   */
  const login = (email, password) => {
    const trimmedEmail = (email || '').trim().toLowerCase();
    const trimmedPassword = (password || '').trim();

    if (!trimmedEmail || !trimmedPassword) {
      return {
        success: false,
        error: 'Please enter both email and password.'
      };
    }

    // Match demo user by email
    const matchedUser = DEMO_USERS.find(
      (u) => u.email.toLowerCase() === trimmedEmail
    );

    if (!matchedUser) {
      return {
        success: false,
        error: 'User not found. Please use a demo account or select one below.'
      };
    }

    // For prototype demo login, allow DEMO_PASSWORD or 'demo123' or 'demo' or any non-empty password
    setCurrentUser(matchedUser);
    return {
      success: true,
      user: matchedUser
    };
  };

  /**
   * Quick 1-click Demo Login helper
   */
  const loginAsDemoUser = (userIdentifier) => {
    const targetUser = DEMO_USERS.find((u) => 
      u.id === userIdentifier || 
      u.email.toLowerCase() === userIdentifier.toLowerCase() ||
      (u.department && u.department.toLowerCase() === userIdentifier.toLowerCase()) ||
      u.role.toLowerCase() === userIdentifier.toLowerCase()
    );

    if (targetUser) {
      setCurrentUser(targetUser);
      return { success: true, user: targetUser };
    }

    return { success: false, error: 'Demo user not recognized.' };
  };

  /**
   * Log out and clear state
   */
  const logout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Error clearing auth storage:', e);
    }
  };

  const isAuthenticated = Boolean(currentUser);
  const role = currentUser?.role || null;
  const department = currentUser?.department || null;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        department,
        isAuthenticated,
        login,
        loginAsDemoUser,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
