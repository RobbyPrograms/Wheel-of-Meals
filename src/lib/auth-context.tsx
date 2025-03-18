'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { autoSetupDatabase } from './auto-setup';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error refreshing session:', error);
        setSession(null);
        setUser(null);
        return;
      }
      
      setSession(data.session);
      setUser(data.session?.user ?? null);
      
      if (data.session?.user) {
        console.log('User authenticated:', data.session.user.id);
        try {
          await autoSetupDatabase();
        } catch (err) {
          console.error('Error setting up database:', err);
        }
      } else {
        console.log('No authenticated user');
      }
    } catch (err) {
      console.error('Unexpected error refreshing session:', err);
      setSession(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        // Get initial session
        await refreshSession();
        
        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event: AuthChangeEvent, session) => {
            console.log('Auth state changed:', event);
            if (!mounted) return;

            setSession(session);
            setUser(session?.user ?? null);
            
            if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
              try {
                await autoSetupDatabase();
              } catch (err) {
                console.error('Error setting up database:', err);
              }
            }
            
            setLoading(false);
          }
        );

        if (mounted) {
          setInitialized(true);
          setLoading(false);
        }

        return () => {
          mounted = false;
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error('Error initializing auth:', err);
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('Sign in error:', error);
        return { error };
      }
      
      console.log('Sign in successful:', data.user?.id);
      await refreshSession();
      return { error: null };
    } catch (err: any) {
      console.error('Unexpected sign in error:', err);
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    setLoading(true);
    try {
      console.log('Starting signup process...', { email, username });
      
      // Basic validation
      if (!email || !password || !username) {
        console.error('Missing required fields');
        return { error: new Error('Email, password, and username are required') };
      }

      if (username.length < 3 || username.length > 24) {
        console.error('Invalid username length');
        return { error: new Error('Username must be between 3 and 24 characters') };
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        console.error('Invalid username format');
        return { error: new Error('Username can only contain letters, numbers, and underscores') };
      }

      // First, check if the username is available
      const { data: existingUsers, error: searchError } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('username', username)
        .limit(1);

      if (searchError) {
        console.error('Error checking username availability:', searchError);
        return { error: new Error('Error checking username availability') };
      }

      if (existingUsers && existingUsers.length > 0) {
        console.error('Username already taken');
        return { error: new Error('Username already taken') };
      }

      console.log('Username is available, proceeding with signup...');

      // Sign up the user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (signUpError) {
        console.error('Signup error:', signUpError);
        return { error: signUpError };
      }

      if (!signUpData?.user) {
        console.error('No user data returned');
        return { error: new Error('No user data returned from signup') };
      }

      console.log('Signup successful, user created:', signUpData.user.id);

      // Wait briefly for the trigger to execute
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify profile creation
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', signUpData.user.id)
        .single();

      if (profileError || !profile) {
        console.error('Error verifying profile creation:', profileError);
        // Profile creation might have failed, but user is created
        // You might want to handle this case differently
      } else {
        console.log('Profile created successfully:', profile);
      }

      // Set session if available
      if (signUpData.session) {
        console.log('Setting session...');
        setSession(signUpData.session);
        setUser(signUpData.user);
      } else {
        console.log('No session available, email confirmation may be required');
      }

      return { error: null };
    } catch (err) {
      console.error('Unexpected error in signUp:', err);
      return { error: err instanceof Error ? err : new Error('An unexpected error occurred') };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    session,
    user,
    loading: loading || !initialized,
    signIn,
    signUp,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 