import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Mail, Lock, User, ArrowRight, Activity, Sparkles, Loader2, Info, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { PageTransition } from '../components/PageTransition';

export const RegisterPage: React.FC = () => {
  const { signUp } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const triggerErrorShake = (msg: string) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const validateEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      triggerErrorShake('Please enter your full name.');
      return;
    }

    if (!email) {
      triggerErrorShake('Please enter an email address.');
      return;
    }

    if (!validateEmail(email)) {
      triggerErrorShake('Please enter a valid email address.');
      return;
    }

    if (!password) {
      triggerErrorShake('Please enter a password.');
      return;
    }

    if (password.length < 6) {
      triggerErrorShake('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, fullName);
      setSuccess(true);
      showToast('Welcome to Aura! Your account has been initialized.', 'success');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1200);
    } catch (err: any) {
      const errMsg = err.message || 'Registration failed. Please try again.';
      triggerErrorShake(errMsg);
      showToast(errMsg, 'error');
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#050505] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden bg-grid-pattern">
        {/* Background radial blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-[100px] animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '3s' }}></div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
          <Link to="/" className="flex items-center justify-center space-x-2.5 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 p-[1px] flex items-center justify-center shadow-xl shadow-indigo-500/10 group-hover:scale-105 transition-all">
              <div className="w-full h-full rounded-2xl bg-[#050505] flex items-center justify-center">
                <Activity className="w-5 h-5 text-indigo-400 group-hover:text-violet-400 transition-colors" />
              </div>
            </div>
            <div>
              <span className="font-display font-bold text-2xl tracking-wide bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">AURA</span>
              <p className="font-sans text-[9px] text-indigo-400 tracking-widest uppercase font-semibold">ATHLETIC OS</p>
            </div>
          </Link>
          <h2 className="mt-8 text-center text-3xl font-display font-extrabold text-white tracking-tight">
            Create performance account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Or{' '}
            <Link to="/login" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
              sign into your existing workspace
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
          <motion.div 
            className="glass-card py-8 px-6 sm:px-10 rounded-3xl border border-white/5"
            animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-medium">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="fullName" className="block text-xs font-semibold text-gray-300 uppercase tracking-widest">
                  Full Name
                </label>
                <div className="mt-2.5 relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Rivera"
                    className="block w-full pl-10 pr-4 py-3 bg-[#121214]/50 border border-white/5 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-gray-300 uppercase tracking-widest">
                  Email Address
                </label>
                <div className="mt-2.5 relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="block w-full pl-10 pr-4 py-3 bg-[#121214]/50 border border-white/5 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-gray-300 uppercase tracking-widest">
                  Password
                </label>
                <div className="mt-2.5 relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-4 py-3 bg-[#121214]/50 border border-white/5 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 text-[11px] text-gray-400">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                <span>You will immediately receive full Premium access.</span>
              </div>

              <div className="relative pt-1">
                <button
                  type="submit"
                  disabled={loading || success}
                  className={`w-full flex justify-center items-center space-x-2 py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold tracking-wide text-white transition-all duration-300 cursor-pointer overflow-hidden relative ${
                    success 
                      ? 'bg-emerald-600 shadow-lg shadow-emerald-500/25' 
                      : loading 
                        ? 'bg-indigo-900/60 text-indigo-300 scale-98 pointer-events-none' 
                        : 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10'
                  }`}
                >
                  {success ? (
                    <motion.div 
                      className="flex items-center space-x-2"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      <CheckCircle className="w-5 h-5 text-white" />
                      <span>Creating Account...</span>
                    </motion.div>
                  ) : loading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-300" />
                      <span>Initializing Workspace...</span>
                    </div>
                  ) : (
                    <>
                      <span>Create Free Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {loading && !success && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5 overflow-hidden rounded-b-xl">
                    <motion.div 
                      className="h-full bg-indigo-500"
                      initial={{ left: '-100%', width: '100%', position: 'absolute' }}
                      animate={{ left: '100%' }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                )}
              </div>
            </form>

            {/* Database Setup Hint */}
            <div className="mt-6 flex items-start space-x-2.5 text-[10px] text-gray-500 border-t border-white/5 pt-4">
              <Info className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                Real-time synchronization ensures your workouts and nutrient analytics remain durable across all devices.
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};
