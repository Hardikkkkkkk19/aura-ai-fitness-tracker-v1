import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  ProfileService, UserProfile, FitnessSettings, AppSettings, 
  EditableGoal, AchievementItem, ProfileDashboardStats, PhysicalStats 
} from '../services/ProfileService';
import { 
  Settings as SettingsIcon, User, Sparkles, Trophy, Sliders, Shield, 
  CheckCircle2, RefreshCw, AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PageTransition } from '../components/PageTransition';

const ProfileDashboardTab = lazy(() => import('../components/profile/ProfileDashboardTab').then(m => ({ default: m.ProfileDashboardTab })));
const ProfileEditorTab = lazy(() => import('../components/profile/ProfileEditorTab').then(m => ({ default: m.ProfileEditorTab })));
const PersonalizationTab = lazy(() => import('../components/profile/PersonalizationTab').then(m => ({ default: m.PersonalizationTab })));
const AchievementsTab = lazy(() => import('../components/profile/AchievementsTab').then(m => ({ default: m.AchievementsTab })));
const AccountSettingsTab = lazy(() => import('../components/profile/AccountSettingsTab').then(m => ({ default: m.AccountSettingsTab })));

export const Settings: React.FC = () => {
  const { user, updateUserMetadata } = useAuth();
  const { showToast } = useToast();
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'settings' | 'achievements' | 'account'>('dashboard');
  
  // Loading & Saving States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Profile data states - Hydrate immediately from cache/localStorage to support instant render
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (typeof window === 'undefined') return null;
    const sandboxSession = localStorage.getItem('aura_sandbox_session');
    let uid = '';
    if (sandboxSession) {
      try { uid = JSON.parse(sandboxSession).user?.id || ''; } catch (_) {}
    }
    if (!uid) return null;
    const stored = localStorage.getItem(`aura_premium_profile_${uid}`);
    if (stored) {
      try { return JSON.parse(stored); } catch (_) {}
    }
    return null;
  });

  const [fitnessSettings, setFitnessSettings] = useState<FitnessSettings | null>(() => {
    if (typeof window === 'undefined') return null;
    const sandboxSession = localStorage.getItem('aura_sandbox_session');
    let uid = '';
    if (sandboxSession) {
      try { uid = JSON.parse(sandboxSession).user?.id || ''; } catch (_) {}
    }
    if (!uid) return null;
    const stored = localStorage.getItem(`aura_premium_settings_${uid}`);
    if (stored) {
      try { return JSON.parse(stored); } catch (_) {}
    }
    return null;
  });

  const [appSettings, setAppSettings] = useState<AppSettings | null>(() => {
    if (typeof window === 'undefined') return null;
    const sandboxSession = localStorage.getItem('aura_sandbox_session');
    let uid = '';
    if (sandboxSession) {
      try { uid = JSON.parse(sandboxSession).user?.id || ''; } catch (_) {}
    }
    if (!uid) return null;
    const stored = localStorage.getItem(`aura_premium_app_settings_${uid}`);
    if (stored) {
      try { return JSON.parse(stored); } catch (_) {}
    }
    return null;
  });

  const [goals, setGoals] = useState<EditableGoal[]>(() => {
    if (typeof window === 'undefined') return [];
    const sandboxSession = localStorage.getItem('aura_sandbox_session');
    let uid = '';
    if (sandboxSession) {
      try { uid = JSON.parse(sandboxSession).user?.id || ''; } catch (_) {}
    }
    if (!uid) return [];
    const stored = localStorage.getItem(`aura_premium_goals_${uid}`);
    if (stored) {
      try { return JSON.parse(stored); } catch (_) {}
    }
    return [];
  });

  const [achievements, setAchievements] = useState<AchievementItem[]>(() => {
    if (typeof window === 'undefined') return [];
    const sandboxSession = localStorage.getItem('aura_sandbox_session');
    let uid = '';
    if (sandboxSession) {
      try { uid = JSON.parse(sandboxSession).user?.id || ''; } catch (_) {}
    }
    if (!uid) return [];
    const stored = localStorage.getItem(`aura_premium_achievements_state_${uid}`);
    if (stored) {
      try { return JSON.parse(stored); } catch (_) {}
    }
    return [];
  });

  // Computed states
  const [completionPercentage, setCompletionPercentage] = useState(() => {
    if (profile) {
      return ProfileService.getProfileCompletionPercentage(profile);
    }
    return 0;
  });
  const [dashboardStats, setDashboardStats] = useState<ProfileDashboardStats | null>(null);
  const [physicalStats, setPhysicalStats] = useState<PhysicalStats | null>(null);

  // Load all profile variables on mount / user change
  useEffect(() => {
    if (user?.id) {
      // Synchronous hydration update if user.id is resolved and has values
      const storedProfile = localStorage.getItem(`aura_premium_profile_${user.id}`);
      const storedSettings = localStorage.getItem(`aura_premium_settings_${user.id}`);
      const storedAppSettings = localStorage.getItem(`aura_premium_app_settings_${user.id}`);
      const storedGoals = localStorage.getItem(`aura_premium_goals_${user.id}`);
      const storedAchievements = localStorage.getItem(`aura_premium_achievements_state_${user.id}`);

      let loadedProfile: UserProfile | null = null;
      if (storedProfile) {
        try {
          loadedProfile = JSON.parse(storedProfile);
          setProfile(loadedProfile);
        } catch (_) {}
      }
      if (storedSettings) {
        try { setFitnessSettings(JSON.parse(storedSettings)); } catch (_) {}
      }
      if (storedAppSettings) {
        try { setAppSettings(JSON.parse(storedAppSettings)); } catch (_) {}
      }
      if (storedGoals) {
        try { setGoals(JSON.parse(storedGoals)); } catch (_) {}
      }
      if (storedAchievements) {
        try { setAchievements(JSON.parse(storedAchievements)); } catch (_) {}
      }

      if (loadedProfile) {
        setCompletionPercentage(ProfileService.getProfileCompletionPercentage(loadedProfile));
      }

      // Skip the blocking fullscreen spinner if we have cached profile data
      if (loadedProfile) {
        setLoading(false);
      }

      loadProfileData(user.id, user.email || '', !loadedProfile);
    }
  }, [user]);

  const loadProfileData = async (userId: string, email: string, showBlockingLoader = true) => {
    try {
      if (showBlockingLoader) {
        setLoading(true);
      }
      const defaultName = user?.user_metadata?.full_name || '';

      // Fetch all independent components in parallel
      const [
        userProfile,
        userSettings,
        userAppSettings,
        userGoals,
        userAchievements
      ] = await Promise.all([
        ProfileService.getProfile(userId, email, defaultName),
        ProfileService.getSettings(userId),
        ProfileService.getAppSettings(userId),
        ProfileService.getGoals(userId),
        ProfileService.getAchievements(userId)
      ]);

      setProfile(userProfile);
      setFitnessSettings(userSettings);
      setAppSettings(userAppSettings);
      setGoals(userGoals);
      setAchievements(userAchievements);

      // Fetch estimations and stats concurrently
      const comp = ProfileService.getProfileCompletionPercentage(userProfile);
      const [dStats, pStats] = await Promise.all([
        ProfileService.getProfileDashboardStats(userId),
        ProfileService.getPhysicalStats(userId, userProfile)
      ]);

      setCompletionPercentage(comp);
      setDashboardStats(dStats);
      setPhysicalStats(pStats);
    } catch (e: any) {
      console.error("Failed to load user athlete profiles:", e);
      showToast("Telemetry download error. Restoring defaults.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Action handler: Save profile details and goals
  const handleSaveProfileAndGoals = async (updatedProfile: UserProfile, updatedGoals: EditableGoal[]) => {
    if (!user?.id) return;
    setSaving(true);
    setSavedSuccess(false);

    try {
      // Small simulated buffer for save feedback
      await new Promise((resolve) => setTimeout(resolve, 800));

      await ProfileService.saveProfile(updatedProfile);
      await ProfileService.saveGoals(user.id, updatedGoals);

      if (updateUserMetadata) {
        updateUserMetadata({ full_name: updatedProfile.fullName });
      }

      setProfile(updatedProfile);
      setGoals(updatedGoals);

      // Re-calculate dependents
      const comp = ProfileService.getProfileCompletionPercentage(updatedProfile);
      const dStats = await ProfileService.getProfileDashboardStats(user.id);
      const pStats = await ProfileService.getPhysicalStats(user.id, updatedProfile);

      setCompletionPercentage(comp);
      setDashboardStats(dStats);
      setPhysicalStats(pStats);

      // Sync and show success indicators
      setSavedSuccess(true);
      showToast("Biometric parameters successfully synchronized!", "success");
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (e: any) {
      console.error(e);
      showToast("Sync failed: unable to commit telemetry variables.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Action handler: Save settings and app settings
  const handleSaveSettings = async (updatedSettings: FitnessSettings, updatedAppSettings: AppSettings) => {
    if (!user?.id) return;
    setSaving(true);
    setSavedSuccess(false);

    try {
      await new Promise((resolve) => setTimeout(resolve, 600));

      await ProfileService.saveSettings(user.id, updatedSettings);
      await ProfileService.saveAppSettings(user.id, updatedAppSettings);

      setFitnessSettings(updatedSettings);
      setAppSettings(updatedAppSettings);

      setSavedSuccess(true);
      showToast("Application parameters successfully updated!", "success");
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (e: any) {
      console.error(e);
      showToast("Failed to apply app configurations.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Action handler: Reset preferences to default values
  const handleResetToDefaults = async () => {
    if (!user?.id) return;
    try {
      await ProfileService.resetAllPreferences(user.id, user.email || '');
      await loadProfileData(user.id, user.email || '');
      showToast("Default configurations successfully restored.", "success");
    } catch (e: any) {
      showToast("Failed to purge custom variables.", "error");
    }
  };

  // Action handler: Import profile package JSON
  const handleImportBlueprint = async (jsonString: string) => {
    if (!user?.id) return;
    try {
      await ProfileService.importProfileData(user.id, jsonString);
      await loadProfileData(user.id, user.email || '');
      showToast("Biometric parameters successfully uploaded!", "success");
    } catch (e: any) {
      showToast("Import error: " + e.message, "error");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-white text-center">
        <div className="space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-display font-black">Authentication Shield</h2>
          <p className="text-xs text-gray-400">Please authenticate to load high-fidelity athletic configurations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Top Header bar */}
      <header className="fixed top-0 left-0 right-0 h-16 glass-panel border-b border-white/5 z-30 flex items-center justify-between px-6">
        <div className="flex items-center space-x-2">
          <SettingsIcon className="w-5 h-5 text-indigo-400" />
          <span className="font-display font-bold text-sm tracking-wide">AURA CONFIGURATION</span>
        </div>
        <span className="text-xs text-gray-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl font-mono">
          PROFILE & SETTINGS CENTER
        </span>
      </header>

      <div className="flex pt-16">
        {/* Navigation Sidebar */}
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        
        {/* Main Work Area */}
        <main className={`flex-1 min-h-[calc(100vh-4rem)] p-6 sm:p-10 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-72'}`}>
          <PageTransition>
            <div className="max-w-5xl mx-auto space-y-8">
            
            {/* Header / Intro section with Athlete Photo summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/5">
              <div className="flex items-center space-x-4">
                {profile && (
                  <img 
                    src={profile.avatarUrl} 
                    alt="Athlete Avatar" 
                    className="w-16 h-16 rounded-2xl object-cover border border-white/10 shadow-lg"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-400">Aura Os Coefficient center</span>
                  <h1 className="text-2xl font-display font-extrabold text-white tracking-tight">
                    {profile ? profile.fullName : 'Alexander Rivera'}
                  </h1>
                  <p className="text-xs text-gray-400">
                    Configure physical height, age parameters, targets and weight metrics for exact coefficient estimations.
                  </p>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center space-x-2.5 bg-white/[0.01] border border-white/5 rounded-2xl p-3 px-4.5 font-mono text-[10px] text-gray-400 self-start sm:self-center">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>TELEMETRY ONLINE</span>
              </div>
            </div>

            {/* Tab selection rails */}
            <div className="flex items-center space-x-1 border-b border-white/5 overflow-x-auto scrollbar-none pb-px">
              {[
                { id: 'dashboard', label: 'Overview', icon: SettingsIcon },
                { id: 'profile', label: 'Profile & Targets', icon: User },
                { id: 'settings', label: 'App Customization', icon: Sliders },
                { id: 'achievements', label: 'Achievements Vault', icon: Trophy },
                { id: 'account', label: 'Security & Backup', icon: Shield }
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 px-5 py-3.5 text-xs font-bold transition-all relative border-b-2 cursor-pointer whitespace-nowrap ${
                      isActive 
                        ? 'border-indigo-500 text-white font-black' 
                        : 'border-transparent text-gray-400 hover:text-white hover:bg-white/[0.01]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Sync notifications banners */}
            {savedSuccess && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-bold flex items-center space-x-2.5">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
                <span>Athlete coefficients and parameters successfully synchronized locally!</span>
              </div>
            )}

            {/* Active Tab contents with beautiful transitions */}
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-4">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                <span className="text-xs text-gray-500 font-mono">Downloading biometric profiles...</span>
              </div>
            ) : (
              <div className="py-2">
                <Suspense fallback={
                  <div className="py-20 flex flex-col items-center justify-center space-y-4">
                    <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                    <span className="text-xs text-gray-500 font-mono">Initializing virtual tab coefficients...</span>
                  </div>
                }>
                  <AnimatePresence mode="wait">
                    {activeTab === 'dashboard' && profile && dashboardStats && physicalStats && (
                      <motion.div
                        key="dashboard"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ProfileDashboardTab 
                          profile={profile}
                          stats={dashboardStats}
                          physicalStats={physicalStats}
                          goals={goals}
                          completion={completionPercentage}
                          onNavigateToTab={(tab: any) => setActiveTab(tab)}
                        />
                      </motion.div>
                    )}

                    {activeTab === 'profile' && profile && (
                      <motion.div
                        key="profile"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ProfileEditorTab 
                          initialProfile={profile}
                          initialGoals={goals}
                          onSave={handleSaveProfileAndGoals}
                          saving={saving}
                        />
                      </motion.div>
                    )}

                    {activeTab === 'settings' && fitnessSettings && appSettings && (
                      <motion.div
                        key="settings"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <PersonalizationTab 
                          userId={user.id}
                          initialSettings={fitnessSettings}
                          initialAppSettings={appSettings}
                          onSave={handleSaveSettings}
                          saving={saving}
                        />
                      </motion.div>
                    )}

                    {activeTab === 'achievements' && (
                      <motion.div
                        key="achievements"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <AchievementsTab achievements={achievements} />
                      </motion.div>
                    )}

                    {activeTab === 'account' && (
                      <motion.div
                        key="account"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <AccountSettingsTab 
                          userId={user.id}
                          email={user.email || ''}
                          onResetToDefaults={handleResetToDefaults}
                          onImportData={handleImportBlueprint}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Suspense>
              </div>
            )}

          </div>
          </PageTransition>
        </main>
      </div>
    </div>
  );
};

