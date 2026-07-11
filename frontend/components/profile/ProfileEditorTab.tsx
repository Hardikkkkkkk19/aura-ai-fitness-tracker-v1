import React, { useState, useRef } from 'react';
import { 
  User, Mail, FileText, Calendar, Scale, Activity, 
  Sparkles, Camera, Save, RefreshCw, Eye, Dumbbell, 
  Flame, Beef, Droplet, Moon, Footprints, AlertTriangle 
} from 'lucide-react';
import { UserProfile, EditableGoal, ProfileService } from '../../services/ProfileService';
import { useToast } from '../../context/ToastContext';

interface ProfileEditorTabProps {
  initialProfile: UserProfile;
  initialGoals: EditableGoal[];
  onSave: (updatedProfile: UserProfile, updatedGoals: EditableGoal[]) => void;
  saving: boolean;
}

export const ProfileEditorTab: React.FC<ProfileEditorTabProps> = ({
  initialProfile,
  initialGoals,
  onSave,
  saving
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Local state for profile details
  const [profile, setProfile] = useState<UserProfile>({ ...initialProfile });
  const [goals, setGoals] = useState<EditableGoal[]>([...initialGoals]);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Handle avatar upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorText(null);
    try {
      const base64Data = await ProfileService.handleProfilePictureUpload(file);
      setProfile(prev => ({ ...prev, avatarUrl: base64Data }));
      showToast('Profile picture loaded successfully! Saving will commit changes.', 'success');
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || 'Failed to upload profile picture.');
      showToast(err.message || 'Avatar upload error', 'error');
    }
  };

  // Profile fields changes
  const handleProfileFieldChange = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  // Goals fields changes
  const handleGoalFieldChange = (id: string, value: number) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, current: Math.min(g.target, value) } : g));
  };

  const handleGoalTargetChange = (id: string, value: number) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, target: Math.max(1, value) } : g));
  };

  // Form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);

    // Some simple validation rules
    if (!profile.fullName.trim()) {
      setErrorText("Athlete's display name is required.");
      showToast("Validation failed", "error");
      return;
    }
    if (!profile.username.trim()) {
      setErrorText("Username is required.");
      showToast("Validation failed", "error");
      return;
    }
    if (profile.height <= 50 || profile.height > 300) {
      setErrorText("Please enter a valid height (50cm - 300cm).");
      showToast("Validation failed", "error");
      return;
    }
    if (profile.weight <= 20 || profile.weight > 500) {
      setErrorText("Please enter a valid weight (20kg - 500kg).");
      showToast("Validation failed", "error");
      return;
    }

    onSave(profile, goals);
  };

  // Avatar preset URLs
  const handleResetAvatar = () => {
    setProfile(prev => ({ 
      ...prev, 
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' 
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      
      {errorText && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-bold flex items-center space-x-2">
          <AlertTriangle className="w-4.5 h-4.5" />
          <span>{errorText}</span>
        </div>
      )}

      {/* Profile Picture Header Block */}
      <div className="rounded-3xl glass-card p-6 border border-white/10 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative group">
          <img 
            src={profile.avatarUrl} 
            alt="Profile Avatar" 
            className="w-24 h-24 rounded-2xl object-cover border border-white/10 group-hover:opacity-75 transition-opacity"
            referrerPolicy="no-referrer"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl cursor-pointer"
          >
            <Camera className="w-6 h-6 text-white" />
          </button>
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        <div className="text-center sm:text-left space-y-2 flex-1">
          <h4 className="text-base font-display font-extrabold text-white">Biometric Photograph</h4>
          <p className="text-xs text-gray-400 max-w-md">
            Click photo to upload your current athletic snapshot. Recommended formats: PNG, JPG, WEBP. Max size limit: 4MB.
          </p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[10px] font-mono font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-lg transition-all cursor-pointer"
            >
              Upload Image
            </button>
            <button
              type="button"
              onClick={handleResetAvatar}
              className="text-[10px] font-mono font-bold bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white px-3.5 py-2 rounded-lg border border-white/5 transition-all cursor-pointer"
            >
              Reset to Placeholder
            </button>
          </div>
        </div>
      </div>

      {/* Core Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: General Parameters */}
        <div className="rounded-3xl glass-card p-6 border border-white/10 space-y-6">
          <div className="flex items-center space-x-2 border-b border-white/5 pb-3">
            <User className="w-4.5 h-4.5 text-indigo-400" />
            <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider font-mono">General Parameters</h3>
          </div>

          <div className="space-y-4">
            {/* Display Name */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">Display Name</label>
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) => handleProfileFieldChange('fullName', e.target.value)}
                className="block w-full px-4 py-3 bg-[#121214]/50 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Alex Rivera"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">Username</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-xs font-mono text-gray-500">@</span>
                <input
                  type="text"
                  value={profile.username}
                  onChange={(e) => handleProfileFieldChange('username', e.target.value)}
                  className="block w-full pl-8 pr-4 py-3 bg-[#121214]/50 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                  placeholder="alex_rivera"
                />
              </div>
            </div>

            {/* Email (Read Only) */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">Primary Registered Email</label>
              <div className="relative">
                <Mail className="absolute right-4 top-3.5 w-4 h-4 text-gray-600" />
                <input
                  type="email"
                  value={profile.email}
                  readOnly
                  className="block w-full px-4 py-3 bg-[#121214]/30 border border-white/[0.03] rounded-xl text-xs text-gray-500 cursor-not-allowed font-mono focus:outline-none"
                  title="Your primary account email is read-only for secure telemetry tracking."
                />
              </div>
              <span className="text-[9px] text-gray-500 font-mono mt-1.5 block">Email cannot be modified once authenticated.</span>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">Bio-Statement</label>
              <textarea
                value={profile.bio}
                onChange={(e) => handleProfileFieldChange('bio', e.target.value)}
                rows={4}
                className="block w-full px-4 py-3 bg-[#121214]/50 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed"
                placeholder="A brief brief describing your performance ambitions..."
              />
            </div>
          </div>
        </div>

        {/* Right Column: Physical & Target Parameters */}
        <div className="rounded-3xl glass-card p-6 border border-white/10 space-y-6">
          <div className="flex items-center space-x-2 border-b border-white/5 pb-3">
            <Scale className="w-4.5 h-4.5 text-purple-400" />
            <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider font-mono">Biometrics & Goals</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Gender */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">Gender Category</label>
              <select
                value={profile.gender}
                onChange={(e) => handleProfileFieldChange('gender', e.target.value)}
                className="block w-full px-4 py-3 bg-[#121214]/50 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-Binary">Non-Binary</option>
                <option value="Prefer Not to Say">Prefer Not to Say</option>
              </select>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">Date of Birth</label>
              <input
                type="date"
                value={profile.dateOfBirth}
                onChange={(e) => handleProfileFieldChange('dateOfBirth', e.target.value)}
                className="block w-full px-4 py-3 bg-[#121214]/50 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono text-gray-300"
              />
            </div>

            {/* Height */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">Height (cm)</label>
              <input
                type="number"
                value={profile.height}
                onChange={(e) => handleProfileFieldChange('height', Number(e.target.value))}
                className="block w-full px-4 py-3 bg-[#121214]/50 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
              />
            </div>

            {/* Weight */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">Current Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={profile.weight}
                onChange={(e) => handleProfileFieldChange('weight', Number(e.target.value))}
                className="block w-full px-4 py-3 bg-[#121214]/50 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
              />
            </div>

            {/* Target Weight */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">Target Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={profile.targetWeight}
                onChange={(e) => handleProfileFieldChange('targetWeight', Number(e.target.value))}
                className="block w-full px-4 py-3 bg-[#121214]/50 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
              />
            </div>

            {/* Activity Level */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">Activity Index</label>
              <select
                value={profile.activityLevel}
                onChange={(e) => handleProfileFieldChange('activityLevel', e.target.value)}
                className="block w-full px-4 py-3 bg-[#121214]/50 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="Sedentary (No workouts)">Sedentary (No workouts)</option>
                <option value="Lightly Active (1-2 workouts/week)">Lightly Active (1-2 workouts/week)</option>
                <option value="Moderately Active (3-4 workouts/week)">Moderately Active (3-4 workouts/week)</option>
                <option value="Very Active (5+ workouts/week)">Very Active (5+ workouts/week)</option>
                <option value="Extreme (Elite athlete level)">Extreme (Elite athlete level)</option>
              </select>
            </div>

            {/* Workout Style */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">Preferred Style</label>
              <select
                value={profile.preferredWorkoutStyle}
                onChange={(e) => handleProfileFieldChange('preferredWorkoutStyle', e.target.value)}
                className="block w-full px-4 py-3 bg-[#121214]/50 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="Powerlifting & HIIT">Powerlifting & HIIT</option>
                <option value="Bodyweight & Calisthenics">Bodyweight & Calisthenics</option>
                <option value="Hypertrophy (Classic bodybuilding)">Hypertrophy (Classic bodybuilding)</option>
                <option value="Yoga, Flex & Mobility">Yoga, Flex & Mobility</option>
                <option value="Hybrid Conditioning (Crossfit style)">Hybrid Conditioning (Crossfit style)</option>
              </select>
            </div>

            {/* Workout Time */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">Preferred Workout Time</label>
              <input
                type="text"
                value={profile.preferredWorkoutTime}
                onChange={(e) => handleProfileFieldChange('preferredWorkoutTime', e.target.value)}
                className="block w-full px-4 py-3 bg-[#121214]/50 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                placeholder="07:30 AM"
              />
            </div>
          </div>

          {/* Primary Fitness Goal */}
          <div>
            <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">Primary Objective</label>
            <input
              type="text"
              value={profile.fitnessGoal}
              onChange={(e) => handleProfileFieldChange('fitnessGoal', e.target.value)}
              className="block w-full px-4 py-3 bg-[#121214]/50 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="e.g. Hypertrophy & Anaerobic Power Enhancement"
            />
          </div>
        </div>

      </div>

      {/* Metric Target Values Configuration Panel */}
      <div className="rounded-3xl glass-card p-6 border border-white/10 space-y-6">
        <div className="flex items-center space-x-2 border-b border-white/5 pb-3">
          <Activity className="w-4.5 h-4.5 text-indigo-400" />
          <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider font-mono">Daily & Weekly Goal Targets</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            let Icon = Dumbbell;
            if (goal.id === 'goal_calories') Icon = Flame;
            else if (goal.id === 'goal_protein') Icon = Beef;
            else if (goal.id === 'goal_water') Icon = Droplet;
            else if (goal.id === 'goal_sleep') Icon = Moon;
            else if (goal.id === 'goal_steps') Icon = Footprints;

            return (
              <div key={goal.id} className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between space-y-4">
                <div className="flex items-center space-x-2">
                  <Icon className="w-4 h-4 text-indigo-400" />
                  <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">{goal.title}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-mono text-gray-500 uppercase mb-1">Current Progress</label>
                    <input
                      type="number"
                      step={goal.id === 'goal_water' || goal.id === 'goal_sleep' ? "0.1" : "1"}
                      value={goal.current}
                      onChange={(e) => handleGoalFieldChange(goal.id, Number(e.target.value))}
                      className="block w-full px-3 py-2 bg-[#0a0a0c] border border-white/5 rounded-lg text-xs text-white focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-gray-500 uppercase mb-1">Target Limit ({goal.unit})</label>
                    <input
                      type="number"
                      step={goal.id === 'goal_water' || goal.id === 'goal_sleep' ? "0.1" : "1"}
                      value={goal.target}
                      onChange={(e) => handleGoalTargetChange(goal.id, Number(e.target.value))}
                      className="block w-full px-3 py-2 bg-[#0a0a0c] border border-indigo-500/20 rounded-lg text-xs text-white focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6 py-3.5 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Updating Telemetry...</span>
            </>
          ) : (
            <>
              <Save className="w-4.5 h-4.5" />
              <span>Save Athletic Changes</span>
            </>
          )}
        </button>
      </div>

    </form>
  );
};
