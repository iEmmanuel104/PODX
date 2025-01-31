// app/pod/(simple)/layout.tsx
'use client';
import React from 'react';
import type { ReactNode } from 'react';

function SimpleLayout({ children }: { children: ReactNode }) {
    return <div className="w-full h-full">{children}</div>;
}

export default SimpleLayout;
