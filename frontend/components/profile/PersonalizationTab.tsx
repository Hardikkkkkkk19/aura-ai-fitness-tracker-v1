import React, { useState } from 'react';
import { 
  Sparkles, Sliders, Bell, Brain, Eye, Plus, X, 
  Settings, Save, RefreshCw, Volume2, Moon, Sun, Monitor 
} from 'lucide-react';
import { FitnessSettings, AppSettings, ProfileService } from '../../services/ProfileService';
import { useToast } from '../../context/ToastContext';

interface PersonalizationTabProps {
  userId: string;
  initialSettings: FitnessSettings;
  initialAppSettings: AppSettings;
  onSave: (updatedSettings: FitnessSettings, updatedAppSettings: AppSettings) => void;
  saving: boolean;
}

export const PersonalizationTab: React.FC<PersonalizationTabProps> = ({
  userId,
  initialSettings,
  initialAppSettings,
  onSave,
  saving
}) => {
  const { showToast } = useToast();
  
  // Local state
  const [settings, setSettings] = useState<FitnessSettings>({ ...initialSettings });
  const [appSettings, setAppSettings] = useState<AppSettings>({ ...initialAppSettings });
  const [customExercise, setCustomExercise] = useState('');

  // Handle settings property updates
  const updateSettingsField = (key: keyof FitnessSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateEmailPrefField = (key: keyof FitnessSettings['emailNotifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      emailNotifications: {
        ...prev.emailNotifications,
        [key]: value
      }
    }));
  };

  const updateAppSettingsField = (key: keyof AppSettings, value: any) => {
    setAppSettings(prev => ({ ...prev, [key]: value }));
  };

  // Preferred exercise actions
  const addExerciseTag = () => {
    if (!customExercise.trim()) return;
    if (settings.preferredExerciseTypes.includes(customExercise.trim())) {
      showToast('Exercise already preferred.', 'info');
      return;
    }
    const updated = [...settings.preferredExerciseTypes, customExercise.trim()];
    updateSettingsField('preferredExerciseTypes', updated);
    setCustomExercise('');
  };

  const removeExerciseTag = (tag: string) => {
    const updated = settings.preferredExerciseTypes.filter(t => t !== tag);
    updateSettingsField('preferredExerciseTypes', updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(settings, appSettings);
  };

  // Color presets for Accent Color selector
  const accentPresets = [
    { name: 'indigo', label: 'Indigo Core', bgClass: 'bg-indigo-600', borderClass: 'border-indigo-400' },
    { name: 'violet', label: 'Cosmic Violet', bgClass: 'bg-violet-600', borderClass: 'border-violet-400' },
    { name: 'emerald', label: 'Vanguard Emerald', bgClass: 'bg-emerald-600', borderClass: 'border-emerald-400' },
    { name: 'amber', label: 'Sun Amber', bgClass: 'bg-amber-600', borderClass: 'border-amber-400' },
    { name: 'rose', label: 'Hyper Rose', bgClass: 'bg-rose-600', borderClass: 'border-rose-400' },
    { name: 'cyan', label: 'Aero Cyan', bgClass: 'bg-cyan-600', borderClass: 'border-cyan-400' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left column: Fitness settings & AI coach */}
        <div className="space-y-8">
          
          {/* Section: Fitness Settings */}
          <div className="rounded-3xl glass-card p-6 border border-white/10 space-y-6">
            <div className="flex items-center space-x-2 border-b border-white/5 pb-3">
              <Sliders className="w-4.5 h-4.5 text-indigo-400" />
              <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider font-mono">Telemetry Configurations</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Unit system */}
              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">Unit System</label>
                <select
                  value={settings.unitSystem}
                  onChange={(e) => updateSettingsField('unitSystem', e.target.value)}
                  className="block w-full px-4 py-3 bg-[#121214]/50 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="metric">Metric (kg / cm / L)</option>
                  <option value="imperial">Imperial (lbs / inches / fl oz)</option>
                </select>
              </div>

              {/* Time format */}
              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">Time Format</label>
                <select
                  value={settings.timeFormat}
                  onChange={(e) => updateSettingsField('timeFormat', e.target.value)}
                  className="block w-full px-4 py-3 bg-[#121214]/50 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="12h">12-Hour format (AM/PM)</option>
                  <option value="24h">24-Hour format</option>
                </select>
              </div>

              {/* Language */}
              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">Interface Language</label>
                <select
                  value={settings.language}
                  onChange={(e) => updateSettingsField('language', e.target.value)}
                  className="block w-full px-4 py-3 bg-[#121214]/50 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="English">English (Global)</option>
                  <option value="Spanish">Español (LATAM)</option>
                  <option value="German">Deutsch (EU)</option>
                  <option value="French">Français</option>
                  <option value="Japanese">日本語</option>
                </select>
              </div>

              {/* Reminder Time */}
              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">Workout Reminder Time</label>
                <input
                  type="time"
                  value={settings.reminderTime}
                  onChange={(e) => updateSettingsField('reminderTime', e.target.value)}
                  className="block w-full px-4 py-3 bg-[#121214]/50 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section: AI Expert Coach Personality settings */}
          <div className="rounded-3xl glass-card p-6 border border-white/10 space-y-6">
            <div className="flex items-center space-x-2 border-b border-white/5 pb-3">
              <Brain className="w-4.5 h-4.5 text-purple-400" />
              <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider font-mono">AI Coach Intelligence Settings</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Personality selection */}
              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">Coach Personality</label>
                <select
                  value={settings.coachPersonality}
                  onChange={(e) => updateSettingsField('coachPersonality', e.target.value)}
                  className="block w-full px-4 py-3 bg-[#121214]/50 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="scientific">Scientific (Bio-metrical analysis)</option>
                  <option value="professional">Professional (Elite personal coach)</option>
                  <option value="friendly">Friendly (Encouraging gym buddy)</option>
                  <option value="military">Military (Hardcore drill instructor)</option>
                  <option value="motivational">Motivational (Daily mental booster)</option>
                  <option value="calm">Calm (Zen meditation fitness coach)</option>
                </select>
              </div>

              {/* Tone style selection */}
              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">Response Tone Style</label>
                <select
                  value={settings.coachTone}
                  onChange={(e) => updateSettingsField('coachTone', e.target.value)}
                  className="block w-full px-4 py-3 bg-[#121214]/50 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="technical">Technical (Detailed breakdown)</option>
                  <option value="strict">Strict (High standard adherence)</option>
                  <option value="nurturing">Nurturing (Kind & supportive)</option>
                  <option value="high_energy">High Energy (Pumped & ecstatic)</option>
                </select>
              </div>

              {/* Target difficulty index */}
              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">Default Workout Difficulty</label>
                <select
                  value={settings.difficultyLevel}
                  onChange={(e) => updateSettingsField('difficultyLevel', e.target.value)}
                  className="block w-full px-4 py-3 bg-[#121214]/50 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="beginner">Beginner (Basic mechanics)</option>
                  <option value="intermediate">Intermediate (Hypertrophy & load)</option>
                  <option value="advanced">Advanced (High-density split)</option>
                  <option value="elite">Elite Gladiator (Extreme tactical load)</option>
                </select>
              </div>
            </div>

            {/* Preferred Exercise tags editor */}
            <div className="space-y-3">
              <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">Preferred Exercises List</label>
              
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={customExercise}
                  onChange={(e) => setCustomExercise(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addExerciseTag())}
                  className="flex-1 px-4 py-2 bg-[#0a0a0c] border border-white/5 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="e.g. Incline Bench Press"
                />
                <button
                  type="button"
                  onClick={addExerciseTag}
                  className="bg-indigo-600 hover:bg-indigo-500 p-2 text-white rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-2">
                {settings.preferredExerciseTypes.map((exercise) => (
                  <span 
                    key={exercise} 
                    className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] text-gray-300 font-mono"
                  >
                    <span>{exercise}</span>
                    <button
                      type="button"
                      onClick={() => removeExerciseTag(exercise)}
                      className="text-gray-500 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Right column: UI / App Settings & Email parameters */}
        <div className="space-y-8">
          
          {/* Section: App styling Settings */}
          <div className="rounded-3xl glass-card p-6 border border-white/10 space-y-6">
            <div className="flex items-center space-x-2 border-b border-white/5 pb-3">
              <Settings className="w-4.5 h-4.5 text-indigo-400" />
              <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider font-mono">App Environment Controls</h3>
            </div>

            {/* Accent Color Presets */}
            <div className="space-y-3">
              <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">Accent Theme Color</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {accentPresets.map((preset) => {
                  const isSelected = appSettings.accentColor === preset.name;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => updateAppSettingsField('accentColor', preset.name)}
                      className={`flex items-center space-x-2 p-2.5 rounded-xl border text-xs text-left transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-indigo-500/10 border-indigo-500 text-white' 
                          : 'bg-[#121214]/30 border-white/5 text-gray-400 hover:border-white/10'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${preset.bgClass}`} />
                      <span className="font-mono text-[10px]">{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Toggles Block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Animation Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-white/[0.01] border border-white/5 rounded-xl">
                <div className="space-y-0.5">
                  <span className="block text-xs font-bold text-white">Layout Animations</span>
                  <span className="block text-[9px] text-gray-500 font-mono">Enable premium motion indexes</span>
                </div>
                <input
                  type="checkbox"
                  checked={appSettings.animationsEnabled}
                  onChange={(e) => updateAppSettingsField('animationsEnabled', e.target.checked)}
                  className="rounded border-white/20 bg-black text-indigo-600 focus:ring-0 w-4 h-4"
                />
              </div>

              {/* Sound toggle */}
              <div className="flex items-center justify-between p-3.5 bg-white/[0.01] border border-white/5 rounded-xl">
                <div className="space-y-0.5">
                  <span className="block text-xs font-bold text-white">Tactile Sound Alerts</span>
                  <span className="block text-[9px] text-gray-500 font-mono">Interactive countdown buzzers</span>
                </div>
                <input
                  type="checkbox"
                  checked={appSettings.notificationSounds}
                  onChange={(e) => updateAppSettingsField('notificationSounds', e.target.checked)}
                  className="rounded border-white/20 bg-black text-indigo-600 focus:ring-0 w-4 h-4"
                />
              </div>

              {/* Auto Save Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-white/[0.01] border border-white/5 rounded-xl">
                <div className="space-y-0.5">
                  <span className="block text-xs font-bold text-white">Local Auto-Save</span>
                  <span className="block text-[9px] text-gray-500 font-mono">Saves splits every 30 seconds</span>
                </div>
                <input
                  type="checkbox"
                  checked={appSettings.autoSave}
                  onChange={(e) => updateAppSettingsField('autoSave', e.target.checked)}
                  className="rounded border-white/20 bg-black text-indigo-600 focus:ring-0 w-4 h-4"
                />
              </div>

              {/* Compact Mode */}
              <div className="flex items-center justify-between p-3.5 bg-white/[0.01] border border-white/5 rounded-xl">
                <div className="space-y-0.5">
                  <span className="block text-xs font-bold text-white">Compact Grid Mode</span>
                  <span className="block text-[9px] text-gray-500 font-mono">Compress visual cards layout</span>
                </div>
                <input
                  type="checkbox"
                  checked={appSettings.compactMode}
                  onChange={(e) => updateAppSettingsField('compactMode', e.target.checked)}
                  className="rounded border-white/20 bg-black text-indigo-600 focus:ring-0 w-4 h-4"
                />
              </div>
            </div>
          </div>

          {/* Section: Email Preferences */}
          <div className="rounded-3xl glass-card p-6 border border-white/10 space-y-6">
            <div className="flex items-center space-x-2 border-b border-white/5 pb-3">
              <Bell className="w-4.5 h-4.5 text-indigo-400" />
              <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider font-mono">Telemetry Alert Rules</h3>
            </div>

            <div className="space-y-3.5">
              {[
                { key: 'workoutReminders', title: 'Workout Reminders', desc: 'Alert when active training intervals are missed' },
                { key: 'weeklyReports', title: 'Weekly Performance Reports', desc: 'Decomposed training audits delivered to inbox' },
                { key: 'monthlyReports', title: 'Monthly Bio-Telemetry Digests', desc: 'Cumulative statistics & BMI index evolution' },
                { key: 'mealReports', title: 'Aura Meal Vision Logs', desc: 'Decomposed nutritional calorie summaries' },
                { key: 'aiCoachEmails', title: 'AI Assistant Digests', desc: 'Coaching recommendations & weekly program split suggestions' },
                { key: 'achievementEmails', title: 'Achievement Congratulations', desc: 'Notification when locks are shattered and badges earned' },
                { key: 'securityEmails', title: 'Security & Access Warnings', desc: 'Immediate alert on password mutations or device additions' }
              ].map((pref) => {
                const val = settings.emailNotifications[pref.key as keyof FitnessSettings['emailNotifications']];
                return (
                  <div key={pref.key} className="flex items-start justify-between p-3 bg-white/[0.01] border border-white/5 rounded-xl">
                    <div className="space-y-0.5 max-w-[85%]">
                      <span className="block text-xs font-semibold text-white">{pref.title}</span>
                      <span className="block text-[10px] text-gray-400 font-mono">{pref.desc}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={val}
                      onChange={(e) => updateEmailPrefField(pref.key as keyof FitnessSettings['emailNotifications'], e.target.checked)}
                      className="rounded border-white/20 bg-black text-indigo-600 focus:ring-0 w-4 h-4 mt-0.5"
                    />
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6 py-3.5 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Syncing Configurations...</span>
            </>
          ) : (
            <>
              <Save className="w-4.5 h-4.5" />
              <span>Apply App Preferences</span>
            </>
          )}
        </button>
      </div>

    </form>
  );
};
