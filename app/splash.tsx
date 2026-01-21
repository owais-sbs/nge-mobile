import { useEffect } from 'react';
import { router } from 'expo-router';

import SplashScreen from '@/components/SplashScreen';
import { storage } from '@/src/lib/storage';

const Splash = (): JSX.Element => {
  useEffect(() => {
    const checkAuthAndNavigate = async () => {
      try {
        // Check if user is already logged in
        const token = await storage.getToken();
        const user = await storage.getUser();
        
        // If user has token and user data, go directly to tabs
        if (token && user) {
          router.replace('/(tabs)');
        } else {
          // Otherwise, go through the normal flow
          router.replace('/join-community');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        // On error, go to join-community
        router.replace('/join-community');
      }
    };

    const timeout = setTimeout(() => {
      checkAuthAndNavigate();
    }, 2000); // Reduced timeout for better UX

    return () => clearTimeout(timeout);
  }, []);

  return <SplashScreen />;
};

export default Splash;


