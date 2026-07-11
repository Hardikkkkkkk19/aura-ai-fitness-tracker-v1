import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { 
  ArrowRight, 
  Sparkles, 
  Dumbbell, 
  Utensils, 
  Zap, 
  Shield, 
  BarChart3, 
  MessageSquare, 
  ScanLine,
  Mail
} from 'lucide-react';
import { motion } from 'motion/react';

export const LandingPage: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden bg-grid-pattern">
      {/* Background Aurora / Gradient Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/5 blur-[120px] animate-pulse-slow" style={{ animationDelay: '4s' }}></div>

      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-24 md:pt-40 md:pb-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          className="text-center space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div 
            variants={itemVariants}
            className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full glass-panel border border-white/5 text-xs text-gray-300 shadow-inner shadow-white/5"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
            <span className="font-medium tracking-wide">Aura v2.5 Active</span>
            <span className="text-gray-500">•</span>
            <span className="text-indigo-400 flex items-center">
              Powered by Gemini & Groq <Sparkles className="w-3 h-3 ml-1" />
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1 
            variants={itemVariants}
            className="text-4xl sm:text-6xl lg:text-7xl font-display font-bold tracking-tight text-white max-w-5xl mx-auto leading-[1.05]"
          >
            The premium workspace for{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-600 bg-clip-text text-transparent">
              elite physical performance.
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p 
            variants={itemVariants}
            className="text-gray-400 font-sans text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed"
          >
            Track daily workouts, instantly parse macro budgets via smart meal scanning, and query your bespoke, cloud-grounded AI Expert Coach.
          </motion.p>

          {/* CTA Group */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 pt-4"
          >
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold tracking-wide text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center justify-center space-x-2 group cursor-pointer"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold tracking-wide text-gray-300 border border-white/5 hover:border-white/10 hover:text-white bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center cursor-pointer"
            >
              <span>Enter Sandbox Demo</span>
            </Link>
          </motion.div>
        </motion.div>

        {/* Dashboard 3D-like Interactive Mockup Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, type: 'spring' }}
          className="mt-20 relative rounded-3xl overflow-hidden glass-card p-1.5 border border-white/10 shadow-2xl shadow-indigo-500/5 max-w-5xl mx-auto"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-400/5 mix-blend-color-dodge rounded-2xl"></div>
          <div className="rounded-[22px] overflow-hidden bg-[#050505] border border-white/5 aspect-[16/10] flex flex-col">
            {/* Header / Tabs bar mockup */}
            <div className="h-12 border-b border-white/5 bg-[#0a0a0a] flex items-center px-4 justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/85"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/85"></span>
                <span className="w-3 h-3 rounded-full bg-indigo-500/85"></span>
              </div>
              <div className="text-[11px] font-mono tracking-wider text-gray-500">AURA WORKSPACE PANEL</div>
              <div className="w-4"></div>
            </div>
            
            {/* Content preview block */}
            <div className="flex-1 p-6 grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-6">
                <div className="h-1/3 rounded-2xl bg-white/[0.01] border border-white/5 p-5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-semibold">DAILY COMPLETED METRIC</span>
                    <h3 className="text-2xl font-display font-bold text-white mt-1">45 Min Heavy Session</h3>
                    <p className="text-xs text-gray-400 mt-1">Chest & Triceps hypertrophy completed</p>
                  </div>
                  <Dumbbell className="w-10 h-10 text-indigo-400" />
                </div>
                <div className="h-2/3 rounded-2xl bg-white/[0.01] border border-white/5 p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-semibold">AI REALTIME RECOMMENDED METRICS</span>
                    <p className="text-sm text-gray-300 mt-2 italic">"Your training volume is up 12% this week. Bump protein budget by 15g to support synthesis."</p>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5">PROTEIN: +15G</span>
                    <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5">RECOVERY: SLEEP 8H</span>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-white/[0.01] border border-white/5 p-5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-purple-400 font-semibold">MACRO SUMMARY</span>
                  <div className="space-y-4 mt-6">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs"><span className="text-gray-400">Protein</span><span className="text-white">142g / 160g</span></div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden"><div className="h-full w-[88%] bg-indigo-500 rounded-full"></div></div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs"><span className="text-gray-400">Carbs</span><span className="text-white">195g / 220g</span></div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden"><div className="h-full w-[78%] bg-purple-500 rounded-full"></div></div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs"><span className="text-gray-400">Fats</span><span className="text-white">55g / 70g</span></div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden"><div className="h-full w-[65%] bg-indigo-400 rounded-full"></div></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-2.5 rounded-xl">
                  <ScanLine className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium truncate">Scanner Ready</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/5 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">
            Engineered for physical efficiency.
          </h2>
          <p className="text-gray-400 font-sans mt-4 text-base">
            Every screen is customized to capture and map vital metrics without useless interface clutter.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="rounded-2xl glass-panel p-8 border border-white/5 hover:border-white/10 transition-all duration-300 group hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Dumbbell className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-lg font-display font-bold text-white">Elite Workout Tracking</h3>
            <p className="text-gray-400 font-sans mt-3 text-sm leading-relaxed">
              Log strength training volume, targets, and sets inside a highly clean, streamlined tracker.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="rounded-2xl glass-panel p-8 border border-white/5 hover:border-white/10 transition-all duration-300 group hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ScanLine className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-display font-bold text-white">Smart Vision Food Scanner</h3>
            <p className="text-gray-400 font-sans mt-3 text-sm leading-relaxed">
              Snap photos of your meal. The underlying Vision AI recognizes meals and accurately estimates calories and macro breakdowns.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="rounded-2xl glass-panel p-8 border border-white/5 hover:border-white/10 transition-all duration-300 group hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-lg font-display font-bold text-white">AI Coach Integration</h3>
            <p className="text-gray-400 font-sans mt-3 text-sm leading-relaxed">
              Consult a private, dedicated AI trainer focused on optimizing recovery sheets, diet programs, and workout progression.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Sandbox Callout */}
      <section id="pricing" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/5 relative z-10 text-center">
        <div className="max-w-4xl mx-auto rounded-3xl glass-card p-12 border border-white/10 relative overflow-hidden">
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px]"></div>
          <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px]"></div>
          
          <h2 className="text-3xl font-display font-bold text-white">Interactive Sandbox Preview</h2>
          <p className="text-gray-400 font-sans max-w-xl mx-auto mt-4 text-sm">
            Experience our complete premium tracking layout. Test features with zero-friction demo state or configure your private keys for full-fledged persistence.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              to="/register"
              className="px-8 py-3.5 rounded-xl font-semibold tracking-wide text-white bg-indigo-600 hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 transition-all cursor-pointer"
            >
              Sign Up Workspace
            </Link>
            <Link
              to="/login"
              className="px-8 py-3.5 rounded-xl font-semibold tracking-wide text-gray-300 hover:text-white border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all cursor-pointer"
            >
              Launch Instant Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-[#050505] text-center text-gray-500 text-xs tracking-wider">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-display font-bold text-sm text-gray-300">AURA</span>
            <span className="text-gray-600">|</span>
            <span>PREMIUM ATHLETIC PLATFORM</span>
          </div>
          <div>© {new Date().getFullYear()} Aura Inc. All privileges conserved.</div>
        </div>
      </footer>
    </div>
  );
};
