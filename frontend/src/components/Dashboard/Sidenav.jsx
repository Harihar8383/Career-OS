// src/components/Dashboard/Sidenav.jsx
import React from 'react';
import { UserButton } from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Target, BrainCircuit, Bot } from 'lucide-react';

// Re-usable NavItem component
const NavItem = ({ icon, label, path }) => {
  const navigate = useNavigate();
  const location = useLocation();
  // Enhanced active logic: exact match for root '/dashboard', startsWith for sub-routes
  const isActive = path === '/dashboard'
    ? location.pathname === path
    : location.pathname.startsWith(path);

  return (
    <button
      onClick={() => navigate(path)}
      className={`
        flex items-center w-full h-11 px-4 rounded-lg transition-all
        group
        ${isActive
          // ACTIVE: Use your --color-primary
          ? 'bg-blue-500/10 text-blue-400'
          // INACTIVE: Use your --color-text-secondary for muted text
          : 'text-text-secondary hover:bg-border-primary hover:text-text-primary'
        }
      `}
    >
      {React.createElement(icon, { className: "w-5 h-5 mr-3 transition-colors" })}
      <span className="font-medium text-sm">{label}</span>
    </button>
  );
};

export const Sidenav = () => {
  return (
    // 1. Use --color-bg-card for the sidebar, --color-border-primary for the border
    <nav className="fixed top-0 left-0 h-full w-64 bg-bg-card border-r border-border-primary p-5 flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-10 pl-2">
        {/* 2. Use --color-text-primary and --color-text-secondary */}
        <div className="font-medium text-text-primary text-xl tracking-[1.76px] uppercase">
          CareerOS
        </div>
        <div className="font-extralight text-text-secondary text-2xl tracking-[2.42px] flex items-center">
          ®
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col space-y-3">
        {/* These NavItems will now use the new styles */}
        <NavItem icon={User} label="My Profile" path="/dashboard" />
        <NavItem icon={Target} label="JD Matcher" path="/dashboard/matcher" />
        <NavItem icon={BrainCircuit} label="Job Hunter Agent" path="/dashboard/hunter" />

        {/* Disabled item (no 'path' prop makes it inactive) */}
        <NavItem icon={Bot} label="Mentor AI (Soon)" path="#" />
      </div>

      {/* User Button at bottom */}
      <div className="mt-auto">
        {/* 3. Use a themed background for the UserButton wrapper */}
        <div className="p-2 bg-syntask rounded-lg border border-border-primary">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </nav>
  );
};