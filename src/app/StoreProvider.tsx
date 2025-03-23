"use client";
import React, { ReactNode } from 'react';

interface StoreProviderProps {
  children: ReactNode;
}

// This component serves as a client boundary for the Zustand store
export default function StoreProvider({ children }: StoreProviderProps) {
  // Since we're not actually doing any hydration in this case,
  // we just use this component as a client boundary wrapper
  return <>{children}</>;
} 