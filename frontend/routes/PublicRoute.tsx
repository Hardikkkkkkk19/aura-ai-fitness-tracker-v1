import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Animated Aurora backgrounds */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-[100px] animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '3s' }}></div>
        
        <div className="relative flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 p-[1px] flex items-center justify-center shadow-lg shadow-indigo-500/10 animate-pulse">
            <div className="w-full h-full rounded-2xl bg-[#050505] flex items-center justify-center">
              <span className="font-display font-bold text-2xl bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">A</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
            <span className="font-sans text-xs tracking-wider text-gray-400">INITIALIZING SECURE SESSION...</span>
          </div>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
