// src/components/Layout/AppLayout.jsx
import React from 'react';
import { Sidenav } from '../Dashboard/Sidenav';

export const AppLayout = ({ children }) => {
  return (
    // Set the main wrapper to your --color-bg-dark
    <div className="flex min-h-screen bg-[#0A0A0A]">
      <Sidenav />
      <main className="flex-1 ml-64 p-10 min-h-screen">
        {children}
      </main>
    </div>
  );
};