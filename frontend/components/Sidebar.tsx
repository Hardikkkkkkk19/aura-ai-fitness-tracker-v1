import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  LayoutDashboard, 
  Dumbbell, 
  Utensils, 
  MessageSquareQuote, 
  ScanLine, 
  BarChart3, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  Award,
  Mail
} from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await logout();
      showToast('Signed out of Aura Athletic OS successfully.', 'success');
      navigate('/');
    } catch (err: any) {
      showToast(err.message || 'Error occurred during sign out.', 'error');
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Workout Tracker', path: '/workouts', icon: Dumbbell },
    { name: 'Nutrition Tracker', path: '/nutrition', icon: Utensils },
    { name: 'AI Expert Coach', path: '/coach', icon: MessageSquareQuote, highlight: true },
    { name: 'Meal Macro Scanner', path: '/scanner', icon: ScanLine },
    { name: 'Analytics Board', path: '/analytics', icon: BarChart3 },
    { name: 'Email Center', path: '/email-center', icon: Mail },
    { name: 'Settings & Profile', path: '/settings', icon: Settings }
  ];

  const fullName = user?.user_metadata?.full_name || 'Aura User';
  const userInitials = fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside 
      className={`fixed top-0 bottom-0 left-0 z-40 bg-[#0a0a0a] border-r border-white/5 transition-all duration-300 flex flex-col justify-between pt-20 pb-6 ${collapsed ? 'w-20' : 'w-72'}`}
    >
      {/* Collapse Trigger Button */}
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-[21px] -right-[12px] w-6 h-6 rounded-full bg-[#121214] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer hover:bg-zinc-800 transition-all z-50 shadow"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Navigation menu list */}
      <div className="px-3 space-y-1.5 flex-1 mt-4">
        {navItems.map((item) => (
          <motion.div
            key={item.path}
            whileHover={{ scale: 1.02, x: 2 }}
            whileTap={{ scale: 0.98 }}
            className="w-full relative"
          >
            <NavLink
              to={item.path}
              className={({ isActive }) => 
                `relative group flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer overflow-hidden ${
                  isActive 
                    ? 'text-white font-semibold' 
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.03] border border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Sliding active background */}
                  {isActive && (
                    <motion.div 
                      layoutId="activeBackground"
                      className="absolute inset-0 rounded-xl bg-white/5 shadow-inner shadow-white/5 border border-white/5 z-0"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}

                  {/* Active gradient glow bar */}
                  {isActive && (
                    <motion.div 
                      layoutId="activeBar"
                      className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-md bg-gradient-to-b from-indigo-500 to-indigo-600 z-10"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  
                  <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors z-10 ${
                    isActive 
                      ? 'text-indigo-400' 
                      : 'text-gray-400 group-hover:text-gray-200'
                  } ${item.highlight && !isActive ? 'text-indigo-400 animate-pulse' : ''}`} />

                  {!collapsed && (
                    <span className="ml-3.5 tracking-wide flex-1 flex items-center justify-between z-10">
                      <span>{item.name}</span>
                      {item.highlight && (
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded-md border border-indigo-400/20">
                          Smart
                        </span>
                      )}
                    </span>
                  )}

                  {/* Tooltip on collapse */}
                  {collapsed && (
                    <div className="absolute left-16 hidden group-hover:block glass-panel px-3 py-1.5 rounded-lg text-xs whitespace-nowrap z-50 shadow-xl">
                      {item.name}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          </motion.div>
        ))}
      </div>

      {/* User Session Profile Box */}
      <div className="px-3 border-t border-white/5 pt-4">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3.5'} p-2.5 rounded-2xl bg-white/[0.02] border border-white/5`}>
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-400 p-[1px]">
              <div className="w-full h-full rounded-xl bg-[#121214] flex items-center justify-center font-display font-semibold text-sm text-gray-200">
                {userInitials}
              </div>
            </div>
            {/* Status dot */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-indigo-500 border-2 border-[#050505]" />
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-200 truncate">{fullName}</p>
              <div className="flex items-center space-x-1 mt-0.5">
                <Award className="w-3 h-3 text-indigo-400" />
                <span className="text-[10px] text-gray-400 truncate">Standard Plan</span>
              </div>
            </div>
          )}
        </div>

        {/* Signout Trigger */}
        <button
          onClick={handleSignOut}
          className={`w-full flex items-center mt-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-rose-400 hover:bg-rose-500/5 transition-all cursor-pointer group ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="ml-3.5 tracking-wide">Sign Out Workspace</span>}
          {collapsed && (
            <div className="absolute left-16 hidden group-hover:block glass-panel px-3 py-1.5 rounded-lg text-xs text-rose-400 whitespace-nowrap z-50">
              Sign Out
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
