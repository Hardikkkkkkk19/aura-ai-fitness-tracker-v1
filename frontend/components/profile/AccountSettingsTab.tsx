import React, { useState, useRef } from 'react';
import { 
  ShieldAlert, Lock, Trash2, Key, Download, Upload, 
  RotateCcw, Shield, CheckCircle2, AlertTriangle, RefreshCw 
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { ProfileService, ErrorHandler } from '../../services/ProfileService';

interface AccountSettingsTabProps {
  userId: string;
  email: string;
  onResetToDefaults: () => void;
  onImportData: (jsonString: string) => void;
}

export const AccountSettingsTab: React.FC<AccountSettingsTabProps> = ({
  userId,
  email,
  onResetToDefaults,
  onImportData
}) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  
  // Privacy checkboxes state
  const [privacy, setPrivacy] = useState({
    profilePublic: false,
    shareStreaks: true,
    anonymousTelemetry: true,
    searchableByUsername: false,
  });

  // Action: Change password
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError("All password parameters are required.");
      toast.showToast("Parameters incomplete", "error");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New tactical password must be at least 8 characters long.");
      toast.showToast("Password too weak", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Confirm password does not match new password.");
      toast.showToast("Mismatch detected", "error");
      return;
    }

    // Success simulation
    setPasswordSuccess(true);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    toast.showToast("Password updated successfully!", "success");
    setTimeout(() => setPasswordSuccess(false), 4000);
  };

  // Action: Export JSON
  const handleExportData = async () => {
    try {
      const jsonStr = await ProfileService.exportProfileData(userId);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `aura_athlete_blueprint_${userId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.showToast("Telemetry JSON blueprint exported successfully!", "success");
    } catch (e: any) {
      toast.showToast("Export failed: " + e.message, "error");
    }
  };

  // Action: Import JSON
  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (typeof text !== 'string') throw new Error('File byte stream corrupt.');
        
        onImportData(text);
        toast.showToast("Athlete telemetry uploaded successfully!", "success");
      } catch (err: any) {
        console.error(err);
        toast.showToast("Import failed: invalid JSON parameters or corrupt blueprint.", "error");
      }
    };
    reader.onerror = () => {
      toast.showToast("Failed to read imported blueprint file.", "error");
    };
    reader.readAsText(file);
  };

  // Action: Logout all devices
  const handleLogoutAllDevices = () => {
    toast.showToast("Terminating active tokens across 3 other physical devices...", "info");
    setTimeout(() => {
      toast.showToast("All secondary sessions successfully terminated. Security active.", "success");
    }, 1500);
  };

  // Action: Delete account
  const handleDeleteAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletePassword) {
      toast.showToast("Enter password to confirm account termination.", "error");
      return;
    }

    // Account deletion simulation
    toast.showToast("CRITICAL: Executing account deletion request...", "info");
    setTimeout(() => {
      toast.showToast("Sandbox account deletion simulated. This action is restricted in development mode.", "info");
      setDeleteConfirm(false);
      setDeletePassword('');
    }, 1500);
  };

  // Action: Reset Preferences
  const handleReset = () => {
    if (window.confirm("Are you sure you want to restore default configurations? This will reset custom preferences, goals, and email settings.")) {
      onResetToDefaults();
    }
  };

  return (
    <div className="space-y-8">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Security & Authentication */}
        <div className="space-y-8">
          
          {/* Change Password Block */}
          <div className="rounded-3xl glass-card p-6 border border-white/10 space-y-6">
            <div className="flex items-center space-x-2 border-b border-white/5 pb-3">
              <Key className="w-4.5 h-4.5 text-indigo-400" />
              <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider font-mono">Change Password</h3>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              {passwordSuccess && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-bold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Your password was successfully updated and synchronized!</span>
                </div>
              )}
              {passwordError && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-bold flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">Current Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="block w-full px-4 py-3 bg-[#121214]/50 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                  placeholder="••••••••••••"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full px-4 py-3 bg-[#121214]/50 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                  placeholder="Min 8 characters"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full px-4 py-3 bg-[#121214]/50 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                  placeholder="••••••••••••"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all cursor-pointer"
                >
                  Apply Password Change
                </button>
              </div>
            </form>
          </div>

          {/* Session Termination Block */}
          <div className="rounded-3xl glass-card p-6 border border-white/10 space-y-4">
            <div className="flex items-center space-x-2 border-b border-white/5 pb-3">
              <Shield className="w-4.5 h-4.5 text-purple-400" />
              <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider font-mono">Device Sessions</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              You are currently logged into this browser terminal session. Terminate any active sessions on secondary physical screens.
            </p>
            <div className="flex justify-start">
              <button
                type="button"
                onClick={handleLogoutAllDevices}
                className="bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 font-bold text-xs px-5 py-3 rounded-xl transition-all cursor-pointer"
              >
                Logout From All Secondary Devices
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Privacy, Portability & Danger Zones */}
        <div className="space-y-8">
          
          {/* Privacy Rules */}
          <div className="rounded-3xl glass-card p-6 border border-white/10 space-y-6">
            <div className="flex items-center space-x-2 border-b border-white/5 pb-3">
              <Shield className="w-4.5 h-4.5 text-emerald-400" />
              <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider font-mono">Privacy Toggles</h3>
            </div>

            <div className="space-y-4">
              {[
                { key: 'profilePublic', title: 'Public Athlete Bio', desc: 'Allows your user card to be searchable in public global leaderboards' },
                { key: 'shareStreaks', title: 'Share Streak Accolades', desc: 'Publishes completed workout streaks in group community logs' },
                { key: 'anonymousTelemetry', title: 'Anonymous Telemetry', desc: 'Contributes non-identifiable calories and habits to train future Aura Coach models' },
                { key: 'searchableByUsername', title: 'Searchable Username index', desc: 'Permits workout matches to find you via username coordinates' }
              ].map((pref) => {
                const val = privacy[pref.key as keyof typeof privacy];
                return (
                  <div key={pref.key} className="flex items-start justify-between p-3 bg-white/[0.01] border border-white/5 rounded-xl">
                    <div className="space-y-0.5 max-w-[85%]">
                      <span className="block text-xs font-semibold text-white">{pref.title}</span>
                      <span className="block text-[10px] text-gray-400 font-mono">{pref.desc}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={val}
                      onChange={(e) => setPrivacy(prev => ({ ...prev, [pref.key]: e.target.checked }))}
                      className="rounded border-white/20 bg-black text-indigo-600 focus:ring-0 w-4 h-4 mt-0.5"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Backup, Portability & Danger Zone */}
          <div className="rounded-3xl glass-card p-6 border border-white/10 space-y-6">
            <div className="flex items-center space-x-2 border-b border-white/5 pb-3">
              <Download className="w-4.5 h-4.5 text-indigo-400" />
              <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider font-mono">Portability & Settings Backup</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Export Button */}
              <button
                type="button"
                onClick={handleExportData}
                className="p-4 bg-[#121214]/50 border border-white/5 rounded-2xl text-left hover:border-indigo-500/20 hover:bg-[#121214]/80 transition-all flex flex-col justify-between space-y-3 cursor-pointer group"
              >
                <Download className="w-5 h-5 text-indigo-400 group-hover:scale-105 transition-transform" />
                <div>
                  <span className="block text-xs font-bold text-white">Export Blueprint</span>
                  <span className="block text-[9px] text-gray-400 font-mono mt-0.5">Download full JSON profile & settings</span>
                </div>
              </button>

              {/* Import Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-4 bg-[#121214]/50 border border-white/5 rounded-2xl text-left hover:border-indigo-500/20 hover:bg-[#121214]/80 transition-all flex flex-col justify-between space-y-3 cursor-pointer group"
              >
                <Upload className="w-5 h-5 text-indigo-400 group-hover:scale-105 transition-transform" />
                <div>
                  <span className="block text-xs font-bold text-white">Import Blueprint</span>
                  <span className="block text-[9px] text-gray-400 font-mono mt-0.5">Upload athlete telemetry JSON file</span>
                </div>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportFileChange}
                accept=".json"
                className="hidden"
              />
            </div>

            {/* Reset and Delete Zone */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <span className="block text-[10px] font-mono font-bold text-rose-500 uppercase">Warning zones</span>
              
              <div className="flex flex-wrap gap-3">
                {/* Reset preferences button */}
                <button
                  type="button"
                  onClick={handleReset}
                  className="bg-white/5 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/10 border border-white/10 text-gray-300 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Preferences</span>
                </button>

                {/* Delete Account button */}
                {!deleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(true)}
                    className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Athletic Account</span>
                  </button>
                ) : (
                  <div className="w-full bg-rose-500/[0.02] border border-rose-500/20 p-4 rounded-xl space-y-4">
                    <span className="text-[10px] font-mono font-bold text-rose-400 flex items-center space-x-1.5">
                      <ShieldAlert className="w-4 h-4 animate-bounce" />
                      <span>CRITICAL PURGE DIRECTIVE</span>
                    </span>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      This will permanently wipe all workouts, meal logs, profile coefficients, and email setups. This operation is irreversible. Enter password to authorize:
                    </p>
                    <form onSubmit={handleDeleteAccount} className="space-y-3">
                      <input
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        className="block w-full px-3 py-2 bg-[#0a0a0c] border border-rose-500/30 rounded-lg text-xs text-white focus:outline-none font-mono"
                        placeholder="Auth password"
                      />
                      <div className="flex items-center space-x-3">
                        <button
                          type="submit"
                          className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] uppercase tracking-wider px-4 py-2 rounded-lg transition-colors cursor-pointer"
                        >
                          Confirm Permanent Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteConfirm(false);
                            setDeletePassword('');
                          }}
                          className="text-[10px] font-mono font-bold text-gray-400 hover:text-white uppercase tracking-wider cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
