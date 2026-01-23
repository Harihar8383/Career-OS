// src/components/Dashboard/Sidenav.jsx
import React from 'react';
import { UserButton } from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Target, BrainCircuit, Bot } from 'lucide-react';

// Re-usable NavItem component
const NavItem = ({ icon, label, path }) => {
  const navigate = useNavigate();
  const location = useLocation();
  // Enhanced active logic
  const isActive = path === '/dashboard'
    ? location.pathname === path
    : location.pathname.startsWith(path);

  return (
    <button
      onClick={() => navigate(path)}
      className={`
        flex items-center w-full h-11 px-4 rounded-xl transition-all duration-300
        group relative overflow-hidden
        ${isActive
          ? 'text-white bg-gradient-to-r from-blue-600/20 to-blue-600/5 border border-blue-500/20'
          : 'text-gray-400 hover:text-white hover:bg-white/5'
        }
      `}
    >
      {/* Active Indicator Line */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-500 rounded-tr-full rounded-br-full shadow-[0_0_10px_rgba(41,52,255,0.5)]" />
      )}

      <div className={`mr-3 ${isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-blue-400'} transition-colors duration-300`}>
        {React.createElement(icon, { size: 20 })}
      </div>
      <span className="font-normal text-sm z-10">{label}</span>

      {/* Hover glow effect for inactive items */}
      {!isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
    </button>
  );
};

export const Sidenav = () => {
  return (
    <nav className="fixed top-0 left-0 h-full w-64 bg-[#0A0A0A]/80 backdrop-blur-xl border-r border-white/5 p-5 flex flex-col z-40">
      {/* Logo */}
      <div className="mb-10 pl-2">
        <div className="group flex flex-col cursor-default">
          <div className="flex items-baseline gap-1 relative">
            <h1 className="font-clash-display font-medium text-2xl text-white tracking-wide">
              CAREER
              <span className="relative ml-0.5">
                <span className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
                <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-[#2934FF] to-[#A855F7]">
                  OS
                </span>
              </span>
            </h1>
            <div className="h-1.5 w-1.5 rounded-full bg-[#A855F7] shadow-[0_0_10px_#A855F7] animate-pulse" />
          </div>
          <p className="text-[10px] text-gray-500 font-medium tracking-[0.2em] uppercase mt-1 group-hover:text-blue-400 transition-colors">
            One-Stop Career Solution
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col space-y-2">
        <NavItem icon={User} label="My Profile" path="/dashboard" />
        <NavItem icon={Target} label="JD Matcher" path="/dashboard/matcher" />
        <NavItem icon={BrainCircuit} label="Job Hunter Agent" path="/dashboard/hunter" />
        <NavItem icon={Bot} label="AI Mentor" path="/dashboard/mentor" />
      </div>

      {/* User Button at bottom */}
      <div className="mt-auto">
        <div className="p-3 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="scale-110">
              <UserButton afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9 border-2 border-white/10",
                    userButtonPopoverCard: "bg-[#18181B] border border-white/10 text-white",
                    userButtonPopoverActionButton: "hover:bg-white/5 text-white",
                    userButtonPopoverActionButtonText: "text-white",
                    userButtonPopoverFooter: "hidden"
                  }
                }}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-white">My Account</span>
              <span className="text-[10px] text-gray-500">Manage Profile</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};