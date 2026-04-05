import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  loginWithFirebase,
  logoutFromFirebase,
  onFirebaseAuthChange,
  registerWithFirebase,
} from '../services/firebaseData.js';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe = () => {};

    try {
      unsubscribe = onFirebaseAuthChange((nextUser) => {
        if (!isMounted) return;
        setUser(nextUser);
        setLoading(false);
      });
    } catch (error) {
      console.error('Firebase auth initialization failed', error);
      setLoading(false);
    }

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const nextUser = await loginWithFirebase(email, password);
    setUser(nextUser);
    return nextUser;
  };

  const register = async (payload) => {
    const nextUser = await registerWithFirebase(payload);
    setUser(nextUser);
    return nextUser;
  };

  const logout = async () => {
    await logoutFromFirebase();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
