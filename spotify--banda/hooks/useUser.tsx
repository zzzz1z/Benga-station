import { useEffect, useState, createContext, useContext, useMemo } from 'react';
import {
  useUser as useSupaUser,
  useSessionContext,
  User
} from '@supabase/auth-helpers-react';

import { UserDetails } from '@/types';

type UserContextType = {
  accessToken: string | null;
  user: User | null;
  userDetails: UserDetails | null;
  isLoading: boolean;
 
};

export const UserContext = createContext<UserContextType | undefined>(
  undefined
);

export interface Props {
  [propName: string]: any;
}

export const MyUserContextProvider = (props: Props) => {
  const {
    session,
    isLoading: isLoadingUser,
    supabaseClient: supabase
  } = useSessionContext();
  const user = useSupaUser();
  const accessToken = session?.access_token ?? null;
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

  const getUserDetails = () => {
    if (!user) return null; // Make sure user is authenticated
    return supabase
      .from('users')
      .select('*')
      .eq('id', user.id) // Fetch user details for the logged-in user only
      .single(); // Ensures that only one result is returned
  };  

  useEffect(() => {
    if (user && !isLoadingData && !userDetails) {
      setIsLoadingData(true);
      Promise.allSettled([getUserDetails()]).then(
        (results) => {
          const userDetailsPromise = results[0];

          if (userDetailsPromise.status === 'fulfilled')
            setUserDetails(userDetailsPromise.value?.data as UserDetails);


          setIsLoadingData(false);
        }
      );
    } else if (!user && !isLoadingUser && !isLoadingData) {
      setUserDetails(null);
    }
  }, [user, isLoadingUser]);

  const value = useMemo(
    () => ({
      accessToken,
      user,
      userDetails,
      isLoading: isLoadingUser || isLoadingData,
    }),
    [accessToken, user, userDetails, isLoadingUser, isLoadingData]
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