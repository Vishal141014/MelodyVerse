"use client";
import { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen';

interface RootLayoutWrapperProps {
  children: React.ReactNode;
}

const RootLayoutWrapper: React.FC<RootLayoutWrapperProps> = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  // Set mounted to true on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Only show splash screen on client side
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <>
      <SplashScreen />
      {children}
    </>
  );
};

export default RootLayoutWrapper; 