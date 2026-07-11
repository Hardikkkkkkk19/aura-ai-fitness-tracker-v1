import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Animated Aurora backgrounds */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
        
        <div className="relative flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-500 p-[1px] flex items-center justify-center shadow-lg shadow-blue-500/10 animate-pulse">
            <div className="w-full h-full rounded-2xl bg-[#09090b] flex items-center justify-center">
              <span className="font-display font-bold text-2xl bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">A</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            <span className="font-sans text-sm tracking-wider text-gray-400">LOADING AURA WORKSPACE...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
