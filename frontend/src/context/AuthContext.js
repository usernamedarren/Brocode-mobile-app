import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../config/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load saved session on app start
    loadSavedSession();
  }, []);

  const loadSavedSession = async () => {
    try {
      const savedToken = await AsyncStorage.getItem('authToken');
      const savedUser = await AsyncStorage.getItem('user');
      
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      const response = await api.login(email, password);
      
      if (response.token) {
        // Ensure user object has id (use email as fallback identifier)
        const userWithId = {
          ...response.user,
          id: response.user.id || response.user.email,
        };
        
        // Update state immediately for faster UI response
        setToken(response.token);
        setUser(userWithId);
        
        // Save to AsyncStorage in parallel (non-blocking)
        Promise.all([
          AsyncStorage.setItem('authToken', response.token),
          AsyncStorage.setItem('user', JSON.stringify(userWithId))
        ]).catch(err => console.error('Error saving session:', err));
        
        return { data: response, error: null };
      }
      
      return { data: null, error: { message: 'Invalid response from server' } };
    } catch (error) {
      return { data: null, error: { message: error.message } };
    }
  };

  const signUp = async (email, password, userData) => {
    try {
      const response = await api.register(
        userData.name,
        email,
        userData.phone,
        password
      );
      
      // After successful registration, automatically sign in
      if (response.message === 'User registered successfully') {
        return await signIn(email, password);
      }
      
      return { data: response, error: null };
    } catch (error) {
      return { data: null, error: { message: error.message } };
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      setToken(null);
      setUser(null);
      return { error: null };
    } catch (error) {
      return { error: { message: error.message } };
    }
  };

  const value = {
    user,
    token,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
