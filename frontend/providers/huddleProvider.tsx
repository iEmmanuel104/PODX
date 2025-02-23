import React, { ReactNode } from 'react';
import { HuddleProvider } from '@huddle01/react';

interface HuddleProviderProps {
  children: ReactNode;
}

export default function CustomHuddleProvider({ children }: HuddleProviderProps) {
  return <HuddleProvider>{children}</HuddleProvider>;
}