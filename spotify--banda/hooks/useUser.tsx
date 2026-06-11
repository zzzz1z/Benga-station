'use client';

import { useEffect, useState, createContext, useContext, useMemo, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { UserDetails } from '@/types';
import { authedFetch } from '@/utils/api';

const supabase = createClient();

type UserContextType = {
  accessToken: string | null;
  user: User | null;
  userDetails: UserDetails | null;
  isLoading: boolean;
  refreshUserDetails: () => Promise<void>;
};

export const UserContext = createContext<UserContextType | undefined>(undefined);

export interface Props {
  [propName: string]: any;
}

export const MyUserContextProvider = (props: Props) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAccessToken(session?.access_token ?? null);
      setIsLoadingUser(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setAccessToken(session?.access_token ?? null);
        setIsLoadingUser(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserDetails = useCallback(async () => {
    if (!user) { setUserDetails(null); return; }
    setIsLoadingData(true);
    try {
      const res = await authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`);
      if (res.ok) {
        const data = await res.json();
        setUserDetails(data as UserDetails);
      }
    } finally {
      setIsLoadingData(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  const refreshUserDetails = fetchUserDetails;

  const value = useMemo(
    () => ({
      accessToken,
      user,
      userDetails,
      isLoading: isLoadingUser || isLoadingData,
      refreshUserDetails,
    }),
    [accessToken, user, userDetails, isLoadingUser, isLoadingData, refreshUserDetails]
  );

  return <UserContext.Provider value={value} {...props} />;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error(`useUser must be used within a MyUserContextProvider.`);
  }
  return context;
};