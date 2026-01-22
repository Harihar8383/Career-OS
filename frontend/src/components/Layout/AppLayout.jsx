// src/components/Layout/AppLayout.jsx
import React from 'react';
import { Sidenav } from '../Dashboard/Sidenav';

export const AppLayout = ({ children }) => {
  return (
    // Set the main wrapper to your --color-bg-dark
    <div className="flex min-h-screen bg-bg-card">
      <Sidenav />
      {/* This <main> element has the ml-64 (16rem) offset 
        to avoid being covered by the w-64 Sidenav.
        The bg-bg-dark is inherited from the parent.
      */}
      <main className="flex-1 p-4 md:p-6 overflow-auto ml-8">
        {children}
      </main>
    </div>
  );
};