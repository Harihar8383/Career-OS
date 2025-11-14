// src/components/Dashboard/Sidenav.jsx
import React from 'react';
import { UserButton } from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, User, Target, BrainCircuit, Bot } from 'lucide-react';

// Re-usable NavItem component
const NavItem = ({ icon, label, path }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname === path;

  return (
    <button
      onClick={() => navigate(path)}
      className={`
        flex items-center w-full h-12 px-4 rounded-lg transition-colors
        ${isActive
          ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
          : 'text-text-secondary hover:bg-white/10 hover:text-text-primary'
        }
      `}
    >
      {React.createElement(icon, { className: "w-5 h-5 mr-3" })}
      <span className="font-medium text-sm">{label}</span>
    </button>
  );
};

export const Sidenav = () => {
  return (
    <nav className="fixed top-0 left-0 h-full w-64 bg-bg-dark border-r border-white/10 p-5 flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-10 pl-2">
        <div className="font-normal text-text-primary text-xl tracking-[1.76px] uppercase">
          CareerOS
        </div>
        <div className="font-extralight text-text-secondary text-2xl tracking-[2.42px] flex items-center">
          ®
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col space-y-3">
        {/* We'll create these pages in the next steps */}
        <NavItem icon={User} label="My Profile" path="/dashboard" />
        <NavItem icon={Target} label="JD Matcher" path="/dashboard/matcher" />
        <NavItem icon={BrainCircuit} label="Job Hunter Agent" path="/dashboard/hunter" />
        
        {/* Example of a disabled item for the future */}
        <NavItem icon={Bot} label="Mentor AI (Soon)" path="#" /> 
      </div>
      
      {/* User Button at bottom */}
      <div className="mt-auto">
        <div className="p-2 bg-black/20 rounded-lg">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </nav>
  );
};