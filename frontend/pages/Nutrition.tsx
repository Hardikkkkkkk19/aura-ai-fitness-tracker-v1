import React, { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Utensils, Plus, Sparkles, Scale } from 'lucide-react';
import { PageTransition } from '../components/PageTransition';

export const Nutrition: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="fixed top-0 left-0 right-0 h-16 glass-panel border-b border-white/5 z-30 flex items-center justify-between px-6">
        <span className="font-display font-bold text-sm tracking-wide">AURA NUTRITION & CALORIE LOG</span>
        <span className="text-xs text-gray-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">Nutrition Workspace</span>
      </header>

      <div className="flex pt-16">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        
        <main className={`flex-1 min-h-[calc(100vh-4rem)] p-6 sm:p-10 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-72'}`}>
          <PageTransition>
            <div className="max-w-4xl">
              <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-400">Phase 3 Preview</span>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-1 mb-8">
                <div>
                  <h1 className="text-3xl font-display font-bold text-white tracking-tight">Dietary Balance Sheets</h1>
                  <p className="text-sm text-gray-400 mt-1">Track daily calorie ingestion, targets, macro deficits, and hydration.</p>
                </div>
                <button className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/10 cursor-pointer">
                  <Plus className="w-4 h-4" />
                  <span>Log Food Log</span>
                </button>
              </div>

              {/* Smart food advice banner */}
              <div className="mb-8 p-6 rounded-2xl bg-gradient-to-tr from-indigo-600/15 via-purple-500/5 to-transparent border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Vision Meal Scanner</span>
                  </div>
                  <h3 className="text-base font-display font-bold text-white mt-1">Want instant calorie calculations?</h3>
                  <p className="text-xs text-gray-400 max-w-xl">Take a screenshot or upload an image of your plate in the Meal Scanner panel to automatically estimate protein, carbs and fats.</p>
                </div>
                <button className="flex-shrink-0 flex items-center space-x-2 bg-white/5 hover:bg-white/10 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-white/10 transition-all cursor-pointer">
                  <span>Try Food Scanner</span>
                </button>
              </div>

              {/* Placeholder nutrition records card representation */}
              <div className="border border-white/5 rounded-2xl glass-panel p-8 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-gray-400">
                  <Utensils className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold text-white">No nutrition logs found for today</h3>
                  <p className="text-sm text-gray-400 max-w-md mx-auto mt-1">
                    In future phases, you can add custom foods, log your meals into Breakfast, Lunch and Dinner, calculate hydration metrics, and set macro balance budgets.
                  </p>
                </div>
              </div>
            </div>
          </PageTransition>
        </main>
      </div>
    </div>
  );
};
