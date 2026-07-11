import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Mail, ArrowLeft, ArrowRight, Activity, Loader2, KeyRound } from 'lucide-react';
import { motion } from 'motion/react';
import { PageTransition } from '../components/PageTransition';

export const ForgotPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
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
    if (!email) {
      triggerErrorShake('Please provide an email address.');
      return;
    }

    if (!validateEmail(email)) {
      triggerErrorShake('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await resetPassword(email);
      setSuccess(true);
      showToast('Password reset link sent to your email!', 'success');
    } catch (err: any) {
      const errMsg = err.message || 'Error occurred while resetting password.';
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
            Reset password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Enter your email to receive recovery instructions
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
          <motion.div 
            className="glass-card py-8 px-6 sm:px-10 rounded-3xl border border-white/5"
            animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            {success ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 text-center"
              >
                <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <KeyRound className="w-6 h-6 text-indigo-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">Recovery Link Transmitted</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    We've dispatched a secure link to <span className="text-indigo-400 font-semibold">{email}</span>. Click on the link to establish a new password for your workspace.
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    to="/login"
                    className="w-full flex justify-center items-center space-x-2 py-3 px-4 border border-white/10 hover:border-white/20 rounded-xl text-sm font-semibold text-gray-300 bg-white/5 transition-all hover:bg-white/10"
                  >
                    <ArrowLeft className="w-4 h-4 text-gray-400" />
                    <span>Return to Login</span>
                  </Link>
                </div>
              </motion.div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-medium">
                    {error}
                  </div>
                )}

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
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="block w-full pl-10 pr-4 py-3 bg-[#121214]/50 border border-white/5 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full flex justify-center items-center space-x-2 py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold tracking-wide text-white transition-all duration-300 cursor-pointer overflow-hidden relative ${
                      loading 
                        ? 'bg-indigo-900/60 text-indigo-300 scale-98 pointer-events-none' 
                        : 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10'
                    }`}
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-300" />
                        <span>Sending Recovery Link...</span>
                      </div>
                    ) : (
                      <>
                        <span>Send Recovery Link</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <Link
                    to="/login"
                    className="w-full flex justify-center items-center space-x-2 py-3 px-4 border border-white/5 hover:border-white/10 rounded-xl text-xs font-bold text-gray-400 transition-all hover:text-white"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </Link>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};
