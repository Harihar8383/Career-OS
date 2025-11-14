// src/components/Layout/AppLayout.jsx
import React from 'react';
import { Sidenav } from '../Dashboard/Sidenav';

export const AppLayout = ({ children }) => {
  return (
    // Use bg-bg-card for the main content area, sidenav has bg-bg-dark
    <div className="flex min-h-screen bg-bg-card">
      <Sidenav />
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
};