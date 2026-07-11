import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Menu, X, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/5 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 p-[1px] flex items-center justify-center transition-transform group-hover:scale-105 duration-300 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full rounded-xl bg-[#050505] flex items-center justify-center">
                <Activity className="w-5 h-5 text-indigo-400 group-hover:text-violet-400 transition-colors" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg tracking-wide bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">AURA</span>
              <span className="font-sans text-[9px] text-indigo-400 tracking-widest uppercase font-semibold">AI COACHED</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-sm font-medium text-gray-400 hover:text-white transition-colors duration-200">Features</a>
            <a href="#ai-coach" className="text-sm font-medium text-gray-400 hover:text-white transition-colors duration-200">AI Engine</a>
            <a href="#pricing" className="text-sm font-medium text-gray-400 hover:text-white transition-colors duration-200">Pricing</a>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/dashboard" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                  Go to Workspace
                </Link>
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold tracking-wide border border-white/10 hover:border-white/20 text-gray-400 hover:text-white transition-all cursor-pointer bg-white/5 hover:bg-white/10"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="relative group overflow-hidden px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20"
                >
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  <span className="text-white">Start Free Trial</span>
                  <ArrowRight className="w-3.5 h-3.5 text-white transition-transform group-hover:translate-x-1" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 focus:outline-none transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-white/5 bg-[#050505]/95 backdrop-blur-xl"
          >
            <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                Features
              </a>
              <a
                href="#ai-coach"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                AI Engine
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                Pricing
              </a>
              <div className="pt-4 border-t border-white/5 flex flex-col space-y-3 px-3">
                {user ? (
                  <>
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-center py-2.5 rounded-xl font-medium text-white bg-white/5"
                    >
                      Workspace Dashboard
                    </Link>
                    <button
                      onClick={() => { logout(); navigate('/'); setMobileMenuOpen(false); }}
                      className="py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-center py-2.5 rounded-xl text-gray-400 hover:text-white"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-center py-2.5 rounded-xl text-white font-bold bg-gradient-to-r from-indigo-600 to-indigo-500"
                    >
                      Start Free Trial
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
