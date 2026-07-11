import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Activity } from 'lucide-react';

interface SplashScreenProps {
  isLoadingAuth: boolean;
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ isLoadingAuth, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Progress bar animation (1.5s to reach 100)
    const duration = 1500; // 1.5 seconds minimum
    const intervalTime = 30;
    const increment = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return Math.min(prev + increment, 100);
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // When progress reaches 100 AND authentication state is resolved,
    // transition out and call onComplete.
    if (progress >= 100 && !isLoadingAuth) {
      const exitTimer = setTimeout(() => {
        setShow(false);
      }, 300); // short extra delay for visual resolution
      return () => clearTimeout(exitTimer);
    }
  }, [progress, isLoadingAuth]);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {show && (
        <motion.div
          id="global-splash"
          className="fixed inset-0 bg-[#050505] z-[9999] flex flex-col items-center justify-center overflow-hidden bg-grid-pattern"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Ambient background glows */}
          <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" style={{ animationDelay: '2s' }} />

          {/* Core Content Container */}
          <div className="relative flex flex-col items-center max-w-sm px-6 text-center space-y-8 z-10">
            
            {/* Animated Glow Logo */}
            <motion.div
              className="relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: [0.34, 1.56, 0.64, 1] }}
            >
              {/* Outer Pulsing Glow Ring */}
              <motion.div 
                className="absolute inset-0 bg-indigo-500/20 rounded-3xl blur-xl"
                animate={{ 
                  scale: [1, 1.15, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              />

              {/* Logo Box */}
              <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 border border-white/20 shadow-2xl flex items-center justify-center">
                <Activity className="w-10 h-10 text-white" />
                <motion.div
                  className="absolute top-2 right-2"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </motion.div>
              </div>
            </motion.div>

            {/* Typography */}
            <div className="space-y-2">
              <motion.h1
                className="text-2xl font-display font-extrabold text-white tracking-tight"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
              >
                Aura AI Fitness Tracker
              </motion.h1>
              
              <motion.p
                className="text-xs text-indigo-400 font-mono tracking-widest uppercase"
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
              >
                Powered by Intelligence
              </motion.p>
            </div>

            {/* Loading Action Bar */}
            <div className="w-48 space-y-3 pt-4">
              <motion.div
                className="text-[10px] font-mono text-gray-500 tracking-wider uppercase"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                Checking Secure Session...
              </motion.div>

              {/* Progress Container */}
              <div className="h-1 bg-white/5 border border-white/5 rounded-full overflow-hidden relative">
                {/* Glow tracker */}
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: "easeInOut" }}
                />
              </div>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
