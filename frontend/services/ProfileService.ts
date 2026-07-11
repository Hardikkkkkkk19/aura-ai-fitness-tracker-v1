import { supabase, isRealSupabaseConfigured } from './supabase';
import { workoutsService } from './workoutsService';

export interface UserProfile {
  id: string;
  avatarUrl: string;
  fullName: string;
  username: string;
  email: string; // read-only
  bio: string;
  gender: string;
  dateOfBirth: string;
  height: number; // in cm
  weight: number; // in kg
  targetWeight: number; // in kg
  fitnessGoal: string;
  activityLevel: string;
  preferredWorkoutStyle: string;
  preferredWorkoutTime: string;
  waterIntakeGoal: number; // in liters
  dailyCaloriesGoal: number; // in kcal
  dailyProteinGoal: number; // in grams
  dailyStepsGoal: number;
}

export interface FitnessSettings {
  unitSystem: 'metric' | 'imperial';
  timeFormat: '12h' | '24h';
  language: string;
  theme: 'dark' | 'light' | 'amoled';
  reminderTime: string;
  emailNotifications: {
    workoutReminders: boolean;
    weeklyReports: boolean;
    monthlyReports: boolean;
    mealReports: boolean;
    aiCoachEmails: boolean;
    achievementEmails: boolean;
    securityEmails: boolean;
  };
  coachPersonality: 'professional' | 'friendly' | 'military' | 'motivational' | 'scientific' | 'calm';
  coachTone: 'strict' | 'nurturing' | 'technical' | 'high_energy';
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  preferredExerciseTypes: string[];
}

export interface AppSettings {
  themeSelector: 'dark' | 'light' | 'amoled';
  accentColor: string; // e.g. "indigo", "violet", "emerald", "amber", "rose", "cyan"
  animationsEnabled: boolean;
  notificationSounds: boolean;
  autoSave: boolean;
  compactMode: boolean;
}

export interface EditableGoal {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
  iconName: string;
  colorClass: string;
}

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  isLocked: boolean;
  progress: number;
  target: number;
  unit: string;
  category: 'training' | 'nutrition' | 'consistency' | 'ai';
  unlockedAt?: string;
  iconName: string;
}

export interface ProfileDashboardStats {
  currentStreak: number;
  workoutLevel: string;
  totalWorkouts: number;
  totalCaloriesBurned: number;
  favoriteWorkout: string;
  achievementsCount: { unlocked: number; total: number };
  currentGoalProgress: number; // percent
  membershipSince: string;
}

export interface PhysicalStats {
  bmi: number;
  bmiCategory: string;
  healthyWeightRange: string;
  workoutConsistency: number; // percent
  weeklyCompletionRate: number; // percent
  monthlyCompletionRate: number; // percent
  fitnessScore: number; // 0 - 100
  trainingAge: string;
}

const PROFILE_STORAGE_KEY = 'aura_premium_profile';
const SETTINGS_STORAGE_KEY = 'aura_premium_settings';
const APP_SETTINGS_STORAGE_KEY = 'aura_premium_app_settings';
const GOALS_STORAGE_KEY = 'aura_premium_goals';
const ACHIEVEMENTS_STORAGE_KEY = 'aura_premium_achievements_state';

// Short-term in-memory caches to speed up parallel and duplicate dashboard/settings queries
export const profileCache: { [userId: string]: { data: UserProfile; timestamp: number } } = {};
export const settingsCache: { [userId: string]: { data: FitnessSettings; timestamp: number } } = {};
export const appSettingsCache: { [userId: string]: { data: AppSettings; timestamp: number } } = {};
export const goalsCache: { [userId: string]: { data: EditableGoal[]; timestamp: number } } = {};
export const achievementsCache: { [userId: string]: { data: AchievementItem[]; timestamp: number } } = {};

// Active promise registry for database query coalescing (Single Flight Pattern)
export const activePromises: { [key: string]: Promise<any> } = {};

export async function coalesceQuery<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
  if (activePromises[key]) {
    return activePromises[key];
  }
  const promise = fetchFn().finally(() => {
    delete activePromises[key];
  });
  activePromises[key] = promise;
  return promise;
}

export function deriveNameFromEmail(email: string): string {
  if (!email) return '';
  const part = email.split('@')[0];
  const words = part.split(/[\._\-0-9]+/);
  const cleanWords = words.filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  if (cleanWords.length === 0) {
    return part.charAt(0).toUpperCase() + part.slice(1);
  }
  return cleanWords.join(' ');
}

export function deriveUsernameFromEmail(email: string): string {
  if (!email) return '';
  return email.split('@')[0].replace(/[\.\-]/g, '_');
}

const DEFAULT_PROFILE = (userId: string, email: string = '', defaultName: string = ''): UserProfile => ({
  id: userId,
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  fullName: defaultName || deriveNameFromEmail(email) || 'Alexander Stone',
  username: deriveUsernameFromEmail(email) || 'alex_stone',
  email: email || 'hvjadhav19@gmail.com',
  bio: 'Elite-tier bio-hacking hybrid athlete focusing on raw physical power, thermodynamic control, and cardiorespiratory endurance.',
  gender: 'Male',
  dateOfBirth: '1998-04-12',
  height: 182,
  weight: 81,
  targetWeight: 78,
  fitnessGoal: 'Hypertrophy & Anaerobic Power Enhancement',
  activityLevel: 'Very Active (5+ workouts/week)',
  preferredWorkoutStyle: 'Powerlifting & HIIT',
  preferredWorkoutTime: '07:30 AM',
  waterIntakeGoal: 3.5,
  dailyCaloriesGoal: 2850,
  dailyProteinGoal: 165,
  dailyStepsGoal: 12000
});

const DEFAULT_SETTINGS: FitnessSettings = {
  unitSystem: 'metric',
  timeFormat: '12h',
  language: 'English',
  theme: 'dark',
  reminderTime: '07:30',
  emailNotifications: {
    workoutReminders: true,
    weeklyReports: true,
    monthlyReports: false,
    mealReports: true,
    aiCoachEmails: true,
    achievementEmails: true,
    securityEmails: true,
  },
  coachPersonality: 'scientific',
  coachTone: 'technical',
  difficultyLevel: 'intermediate',
  preferredExerciseTypes: ['Squats', 'Deadlifts', 'Bench Press', 'HIIT Run', 'Pull-ups', 'Planks']
};

const DEFAULT_APP_SETTINGS: AppSettings = {
  themeSelector: 'dark',
  accentColor: 'indigo',
  animationsEnabled: true,
  notificationSounds: true,
  autoSave: true,
  compactMode: false
};

const DEFAULT_GOALS = (): EditableGoal[] => [
  { id: 'goal_workout', title: 'Workout Goal', current: 4, target: 5, unit: 'sessions', iconName: 'Dumbbell', colorClass: 'indigo' },
  { id: 'goal_calories', title: 'Calories Burned', current: 2150, target: 3000, unit: 'kcal', iconName: 'Flame', colorClass: 'rose' },
  { id: 'goal_protein', title: 'Protein Intake', current: 140, target: 165, unit: 'g', iconName: 'Beef', colorClass: 'amber' },
  { id: 'goal_water', title: 'Water Intake', current: 2.8, target: 3.5, unit: 'L', iconName: 'Droplet', colorClass: 'cyan' },
  { id: 'goal_sleep', title: 'Sleep Duration', current: 7.2, target: 8.0, unit: 'hours', iconName: 'Moon', colorClass: 'violet' },
  { id: 'goal_steps', title: 'Daily Steps', current: 9420, target: 12000, unit: 'steps', iconName: 'Footprints', colorClass: 'emerald' }
];

const DEFAULT_ACHIEVEMENTS = (): AchievementItem[] => [
  { id: 'ach_first_workout', title: 'First Workout', description: 'Log your first workout protocol inside the Aura Core.', isLocked: false, progress: 1, target: 1, unit: 'workout', category: 'training', unlockedAt: '2026-07-01', iconName: 'Dumbbell' },
  { id: 'ach_streak_7', title: '7-Day Streak', description: 'Maintain continuous training for 7 consecutive calendar days.', isLocked: false, progress: 7, target: 7, unit: 'days', category: 'consistency', unlockedAt: '2026-07-08', iconName: 'Flame' },
  { id: 'ach_streak_30', title: '30-Day Streak', description: 'Maintain continuous training for 30 consecutive calendar days.', isLocked: true, progress: 14, target: 30, unit: 'days', category: 'consistency', iconName: 'Zap' },
  { id: 'ach_workouts_100', title: '100 Workouts', description: 'Shatter boundaries by logging 100 complete training logs.', isLocked: true, progress: 18, target: 100, unit: 'workouts', category: 'training', iconName: 'Crown' },
  { id: 'ach_calories_5000', title: '5000 Calories Burned', description: 'Consume 5,000 physical kcal through logged training splits.', isLocked: false, progress: 5240, target: 5000, unit: 'kcal', category: 'training', unlockedAt: '2026-07-09', iconName: 'Sparkles' },
  { id: 'ach_early_bird', title: 'Early Bird', description: 'Kickstart metabolic release by logging a workout before 07:00 AM.', isLocked: false, progress: 1, target: 1, unit: 'workout', category: 'consistency', unlockedAt: '2026-07-05', iconName: 'Sun' },
  { id: 'ach_night_warrior', title: 'Night Warrior', description: 'Complete a heavy tactical workout protocol after 09:00 PM.', isLocked: true, progress: 0, target: 1, unit: 'workout', category: 'consistency', iconName: 'Moon' },
  { id: 'ach_protein_master', title: 'Protein Master', description: 'Meet or exceed daily protein synthesis target 5 days in a row.', isLocked: true, progress: 4, target: 5, unit: 'days', category: 'nutrition', iconName: 'Trophy' },
  { id: 'ach_meal_tracker', title: 'Meal Tracker', description: 'Decompose and log 10 custom plates using Aura Meal Vision.', isLocked: false, progress: 12, target: 10, unit: 'meals', category: 'nutrition', unlockedAt: '2026-07-09', iconName: 'Camera' },
  { id: 'ach_ai_explorer', title: 'AI Explorer', description: 'Trigger 20 expert advice logs via Aura Coach Intelligence.', isLocked: true, progress: 15, target: 20, unit: 'queries', category: 'ai', iconName: 'Cpu' },
  { id: 'ach_consistency_king', title: 'Consistency King', description: 'Achieve weekly training goal indices for 4 consecutive weeks.', isLocked: true, progress: 3, target: 4, unit: 'weeks', category: 'consistency', iconName: 'ShieldAlert' }
];

export const ProfileService = {
  // --- Profile Picture Helpers ---
  async handleProfilePictureUpload(file: File): Promise<string> {
    if (!file.type.startsWith('image/')) {
      throw new Error('Invalid file type: Please upload a valid image file (PNG/JPEG/WEBP).');
    }
    const MAX_SIZE = 4 * 1024 * 1024; // 4MB
    if (file.size > MAX_SIZE) {
      throw new Error('Image is too large: Maximum supported limit is 4MB.');
    }

    return ErrorHandler.runAsync<string>(async () => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to read image byte stream.'));
          }
        };
        reader.onerror = () => reject(new Error('File reader execution error.'));
        reader.readAsDataURL(file);
      });
    }, "File byte conversion failed.");
  },

  // --- Read operations ---
  async getProfile(userId: string, email: string = '', defaultName: string = ''): Promise<UserProfile> {
    const now = Date.now();
    const cached = profileCache[userId];
    if (cached && (now - cached.timestamp < 3000)) {
      return cached.data;
    }

    const fetchProfile = async (): Promise<UserProfile> => {
      if (isRealSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          if (!error && data) {
            const derivedName = deriveNameFromEmail(email || data.email || '');
            let finalName = data.full_name || '';
            if (!finalName || finalName === 'Alexander Stone' || finalName.toLowerCase() === derivedName.toLowerCase()) {
              if (defaultName && defaultName.toLowerCase() !== derivedName.toLowerCase()) {
                finalName = defaultName;
              } else if (!finalName) {
                finalName = defaultName || derivedName || 'Alexander Stone';
              }
            }

            return {
              id: data.id,
              avatarUrl: data.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
              fullName: finalName,
              username: (!data.username || data.username === 'alex_stone') ? (deriveUsernameFromEmail(email || data.email) || 'alex_stone') : data.username,
              email: data.email || email || 'hvjadhav19@gmail.com',
              bio: data.bio || '',
              gender: data.gender || 'Male',
              dateOfBirth: data.date_of_birth || '1998-04-12',
              height: Number(data.height) || 182,
              weight: Number(data.weight) || 81,
              targetWeight: Number(data.target_weight) || 78,
              fitnessGoal: data.fitness_goal || 'Hypertrophy & Anaerobic Power',
              activityLevel: data.activity_level || 'Very Active',
              preferredWorkoutStyle: data.preferred_workout_style || 'Powerlifting & HIIT',
              preferredWorkoutTime: data.preferred_workout_time || '07:30 AM',
              waterIntakeGoal: Number(data.water_intake_goal) || 3.5,
              dailyCaloriesGoal: Number(data.daily_calories_goal) || 2850,
              dailyProteinGoal: Number(data.daily_protein_goal) || 165,
              dailyStepsGoal: Number(data.daily_steps_goal) || 12000
            };
          }
        } catch (err) {
          console.warn("Supabase profiles table not reachable, reading local storage:", err);
        }
      }

      // Local Storage Fallback
      const stored = localStorage.getItem(`${PROFILE_STORAGE_KEY}_${userId}`);
      if (!stored) {
        const fresh = DEFAULT_PROFILE(userId, email, defaultName);
        this.saveProfile(fresh);
        return fresh;
      }
      try {
        const parsed = JSON.parse(stored);
        if (!parsed.email && email) parsed.email = email;

        const derivedName = deriveNameFromEmail(email || parsed.email || '');
        let finalName = parsed.fullName || '';
        if (!finalName || finalName === 'Alexander Stone' || finalName.toLowerCase() === derivedName.toLowerCase()) {
          if (defaultName && defaultName.toLowerCase() !== derivedName.toLowerCase()) {
            finalName = defaultName;
          } else if (!finalName) {
            finalName = defaultName || derivedName || 'Alexander Stone';
          }
        }
        parsed.fullName = finalName;

        if (!parsed.username || parsed.username === 'alex_stone') {
          parsed.username = deriveUsernameFromEmail(email || parsed.email) || 'alex_stone';
        }
        return parsed;
      } catch {
        return DEFAULT_PROFILE(userId, email, defaultName);
      }
    };

    const result = await coalesceQuery(`profile_${userId}`, fetchProfile);
    profileCache[userId] = { data: result, timestamp: Date.now() };
    return result;
  },

  async saveProfile(profile: UserProfile): Promise<void> {
    delete profileCache[profile.id];
    // 1. Try Supabase Save
    if (isRealSupabaseConfigured) {
      try {
        const payload = {
          id: profile.id,
          avatar_url: profile.avatarUrl,
          full_name: profile.fullName,
          username: profile.username,
          email: profile.email,
          bio: profile.bio,
          gender: profile.gender,
          date_of_birth: profile.dateOfBirth,
          height: profile.height,
          weight: profile.weight,
          target_weight: profile.targetWeight,
          fitness_goal: profile.fitnessGoal,
          activity_level: profile.activityLevel,
          preferred_workout_style: profile.preferredWorkoutStyle,
          preferred_workout_time: profile.preferredWorkoutTime,
          water_intake_goal: profile.waterIntakeGoal,
          daily_calories_goal: profile.dailyCaloriesGoal,
          daily_protein_goal: profile.dailyProteinGoal,
          daily_steps_goal: profile.dailyStepsGoal,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('profiles')
          .upsert(payload);

        if (error) throw error;

        // Also update Supabase Auth metadata so that it's in sync
        await supabase.auth.updateUser({
          data: { full_name: profile.fullName }
        });
      } catch (err) {
        console.warn("Could not save profile to Supabase, backing up locally:", err);
      }
    }

    // 2. Local Storage Sync
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${PROFILE_STORAGE_KEY}_${profile.id}`, JSON.stringify(profile));

      // Also sync sandbox session full_name if present
      const sandboxSession = localStorage.getItem('aura_sandbox_session');
      if (sandboxSession) {
        try {
          const parsed = JSON.parse(sandboxSession);
          if (parsed.user && parsed.user.id === profile.id) {
            parsed.user.user_metadata = {
              ...parsed.user.user_metadata,
              full_name: profile.fullName
            };
            localStorage.setItem('aura_sandbox_session', JSON.stringify(parsed));
          }
        } catch (e) {
          // ignore
        }
      }
    }
  },

  calculateAge(dateOfBirth: string): number {
    if (!dateOfBirth) return 28;
    try {
      const today = new Date();
      const birth = new Date(dateOfBirth);
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return isNaN(age) ? 28 : age;
    } catch {
      return 28;
    }
  },

  getProfileCompletionPercentage(profile: UserProfile): number {
    const fields: (keyof UserProfile)[] = [
      'avatarUrl', 'fullName', 'username', 'bio', 'gender', 
      'dateOfBirth', 'height', 'weight', 'targetWeight', 'fitnessGoal', 
      'activityLevel', 'preferredWorkoutStyle', 'preferredWorkoutTime'
    ];
    let filled = 0;
    fields.forEach(field => {
      const val = profile[field];
      if (val !== undefined && val !== null && val !== '') {
        filled++;
      }
    });
    return Math.round((filled / fields.length) * 100);
  },

  // --- Settings operations ---
  async getSettings(userId: string): Promise<FitnessSettings> {
    const now = Date.now();
    const cached = settingsCache[userId];
    if (cached && (now - cached.timestamp < 3000)) {
      return cached.data;
    }

    const fetchSettings = async (): Promise<FitnessSettings> => {
      if (isRealSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          if (!error && data) {
            return {
              unitSystem: data.unit_system || 'metric',
              timeFormat: data.time_format || '12h',
              language: data.language || 'English',
              theme: data.theme || 'dark',
              reminderTime: data.reminder_time || '07:30',
              emailNotifications: data.email_notifications || DEFAULT_SETTINGS.emailNotifications,
              coachPersonality: data.coach_personality || 'scientific',
              coachTone: data.coach_tone || 'technical',
              difficultyLevel: data.difficulty_level || 'intermediate',
              preferredExerciseTypes: data.preferred_exercise_types || DEFAULT_SETTINGS.preferredExerciseTypes
            };
          }
        } catch (err) {
          console.warn("Could not fetch settings from Supabase, loading local:", err);
        }
      }

      // Local Storage Fallback
      const stored = localStorage.getItem(`${SETTINGS_STORAGE_KEY}_${userId}`);
      if (!stored) {
        this.saveSettings(userId, DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
      }
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_SETTINGS;
      }
    };

    const result = await coalesceQuery(`settings_${userId}`, fetchSettings);
    settingsCache[userId] = { data: result, timestamp: Date.now() };
    return result;
  },

  async saveSettings(userId: string, settings: FitnessSettings): Promise<void> {
    delete settingsCache[userId];
    if (isRealSupabaseConfigured) {
      try {
        const payload = {
          id: userId,
          unit_system: settings.unitSystem,
          time_format: settings.timeFormat,
          language: settings.language,
          theme: settings.theme,
          reminder_time: settings.reminderTime,
          email_notifications: settings.emailNotifications,
          coach_personality: settings.coachPersonality,
          coach_tone: settings.coachTone,
          difficulty_level: settings.difficultyLevel,
          preferred_exercise_types: settings.preferredExerciseTypes,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('user_settings')
          .upsert(payload);

        if (error) throw error;
      } catch (err) {
        console.warn("Failed to write settings to Supabase, updating locally:", err);
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(`${SETTINGS_STORAGE_KEY}_${userId}`, JSON.stringify(settings));
    }
  },

  // --- App settings operations ---
  async getAppSettings(userId: string): Promise<AppSettings> {
    const now = Date.now();
    const cached = appSettingsCache[userId];
    if (cached && (now - cached.timestamp < 3000)) {
      return cached.data;
    }

    const fetchAppSettings = async (): Promise<AppSettings> => {
      if (isRealSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          if (!error && data) {
            return {
              themeSelector: data.theme_selector || 'dark',
              accentColor: data.accent_color || 'indigo',
              animationsEnabled: data.animations_enabled ?? true,
              notificationSounds: data.notification_sounds ?? true,
              autoSave: data.auto_save ?? true,
              compactMode: data.compact_mode ?? false
            };
          }
        } catch (err) {
          console.warn("Supabase user_preferences table load error:", err);
        }
      }

      const stored = localStorage.getItem(`${APP_SETTINGS_STORAGE_KEY}_${userId}`);
      if (!stored) {
        this.saveAppSettings(userId, DEFAULT_APP_SETTINGS);
        return DEFAULT_APP_SETTINGS;
      }
      try {
        return { ...DEFAULT_APP_SETTINGS, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_APP_SETTINGS;
      }
    };

    const result = await coalesceQuery(`app_settings_${userId}`, fetchAppSettings);
    appSettingsCache[userId] = { data: result, timestamp: Date.now() };
    return result;
  },

  async saveAppSettings(userId: string, appSettings: AppSettings): Promise<void> {
    delete appSettingsCache[userId];
    if (isRealSupabaseConfigured) {
      try {
        const payload = {
          id: userId,
          theme_selector: appSettings.themeSelector,
          accent_color: appSettings.accentColor,
          animations_enabled: appSettings.animationsEnabled,
          notification_sounds: appSettings.notificationSounds,
          auto_save: appSettings.autoSave,
          compact_mode: appSettings.compactMode,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('user_preferences')
          .upsert(payload);

        if (error) throw error;
      } catch (err) {
        console.warn("Failed to save app settings to Supabase, backing up locally:", err);
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(`${APP_SETTINGS_STORAGE_KEY}_${userId}`, JSON.stringify(appSettings));
    }
  },

  // --- Goals operations ---
  async getGoals(userId: string): Promise<EditableGoal[]> {
    const now = Date.now();
    const cached = goalsCache[userId];
    if (cached && (now - cached.timestamp < 3000)) {
      return cached.data;
    }

    const fetchGoals = async (): Promise<EditableGoal[]> => {
      if (isRealSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('goals')
            .select('*')
            .eq('user_id', userId);

          if (!error && data && data.length > 0) {
            return data.map((g: any) => ({
              id: g.goal_id,
              title: g.title,
              current: Number(g.current),
              target: Number(g.target),
              unit: g.unit,
              iconName: g.icon_name,
              colorClass: g.color_class
            }));
          }
        } catch (err) {
          console.warn("Could not retrieve goals from Supabase, loading local fallback:", err);
        }
      }

      const stored = localStorage.getItem(`${GOALS_STORAGE_KEY}_${userId}`);
      if (!stored) {
        const initial = DEFAULT_GOALS();
        this.saveGoals(userId, initial);
        return initial;
      }
      try {
        return JSON.parse(stored);
      } catch {
        return DEFAULT_GOALS();
      }
    };

    const result = await coalesceQuery(`goals_${userId}`, fetchGoals);
    goalsCache[userId] = { data: result, timestamp: Date.now() };
    return result;
  },

  async saveGoals(userId: string, goals: EditableGoal[]): Promise<void> {
    delete goalsCache[userId];
    if (isRealSupabaseConfigured) {
      try {
        const payloads = goals.map(g => ({
          user_id: userId,
          goal_id: g.id,
          title: g.title,
          current: g.current,
          target: g.target,
          unit: g.unit,
          icon_name: g.iconName,
          color_class: g.colorClass,
          updated_at: new Date().toISOString()
        }));

        const { error } = await supabase
          .from('goals')
          .upsert(payloads);

        if (error) throw error;
      } catch (err) {
        console.warn("Goals sync to Supabase failed, saving locally:", err);
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(`${GOALS_STORAGE_KEY}_${userId}`, JSON.stringify(goals));
    }
  },

  // --- Achievements operations ---
  async getAchievements(userId: string): Promise<AchievementItem[]> {
    const now = Date.now();
    const cached = achievementsCache[userId];
    if (cached && (now - cached.timestamp < 3000)) {
      return cached.data;
    }

    const fetchAchievements = async (): Promise<AchievementItem[]> => {
      let baseState = DEFAULT_ACHIEVEMENTS();
      const stored = localStorage.getItem(`${ACHIEVEMENTS_STORAGE_KEY}_${userId}`);
      
      if (stored) {
        try {
          baseState = JSON.parse(stored);
        } catch {
          baseState = DEFAULT_ACHIEVEMENTS();
        }
      }

      if (isRealSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('achievements')
            .select('*')
            .eq('user_id', userId);

          if (!error && data && data.length > 0) {
            // Sync database statuses over the base state
            baseState = baseState.map(ach => {
              const dbMatch = data.find((d: any) => d.achievement_id === ach.id);
              if (dbMatch) {
                return {
                  ...ach,
                  isLocked: dbMatch.is_locked,
                  progress: Number(dbMatch.progress),
                  unlockedAt: dbMatch.unlocked_at || undefined
                };
              }
              return ach;
            });
          }
        } catch (err) {
          console.warn("Could not load achievements from Supabase, relying on local sync:", err);
        }
      }

      // Dynamic workouts and meals metric synchronization
      let workouts: any[] = [];
      try {
        workouts = await workoutsService.getWorkouts(userId);
      } catch (err) {
        console.warn("Achievements workout fetch fallback:", err);
      }

      baseState = baseState.map(ach => {
        let current = ach.progress;
        let isLocked = ach.isLocked;
        let unlockedAt = ach.unlockedAt;

        if (ach.id === 'ach_first_workout') {
          current = workouts.length;
          if (current >= ach.target && isLocked) {
            isLocked = false;
            unlockedAt = new Date().toISOString().split('T')[0];
          }
        } else if (ach.id === 'ach_workouts_100') {
          current = workouts.length;
          if (current >= ach.target && isLocked) {
            isLocked = false;
            unlockedAt = new Date().toISOString().split('T')[0];
          }
        } else if (ach.id === 'ach_calories_5000') {
          const totalBurnt = workouts.reduce((sum, w) => sum + (Number(w.calories_burned) || 0), 0);
          current = Math.round(totalBurnt);
          if (current >= ach.target && isLocked) {
            isLocked = false;
            unlockedAt = new Date().toISOString().split('T')[0];
          }
        }

        return {
          ...ach,
          progress: current,
          isLocked,
          unlockedAt
        };
      });

      return baseState;
    };

    const result = await coalesceQuery(`achievements_${userId}`, fetchAchievements);
    achievementsCache[userId] = { data: result, timestamp: Date.now() };
    return result;
  },

  async saveAchievements(userId: string, achievements: AchievementItem[]): Promise<void> {
    delete achievementsCache[userId];
    if (isRealSupabaseConfigured) {
      try {
        const payloads = achievements.map(a => ({
          user_id: userId,
          achievement_id: a.id,
          title: a.title,
          description: a.description,
          is_locked: a.isLocked,
          progress: a.progress,
          target: a.target,
          unit: a.unit,
          category: a.category,
          unlocked_at: a.unlockedAt || null,
          icon_name: a.iconName,
          updated_at: new Date().toISOString()
        }));

        const { error } = await supabase
          .from('achievements')
          .upsert(payloads);

        if (error) throw error;
      } catch (err) {
        console.warn("Achievements sync to Supabase failed, saving locally:", err);
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(`${ACHIEVEMENTS_STORAGE_KEY}_${userId}`, JSON.stringify(achievements));
    }
  },

  // --- Profile Statistics ---
  async getProfileDashboardStats(userId: string): Promise<ProfileDashboardStats> {
    let workouts: any[] = [];
    try {
      workouts = await workoutsService.getWorkouts(userId);
    } catch (e) {}

    const achievements = await this.getAchievements(userId);
    const goals = await this.getGoals(userId);

    const unlockedAchievements = achievements.filter(a => !a.isLocked).length;
    const totalCaloriesBurned = workouts.reduce((sum, w) => sum + (Number(w.calories_burned) || 0), 0);

    const formatCount: { [key: string]: number } = {};
    workouts.forEach(w => {
      formatCount[w.category] = (formatCount[w.category] || 0) + 1;
    });

    let favoriteWorkout = 'N/A';
    let maxCount = 0;
    Object.entries(formatCount).forEach(([cat, count]) => {
      if (count > maxCount) {
        maxCount = count;
        favoriteWorkout = cat;
      }
    });

    let workoutLevel = 'Beginner Adept';
    if (workouts.length >= 25) workoutLevel = 'Master Gladiator';
    else if (workouts.length >= 10) workoutLevel = 'Vanguard Athlete';
    else if (workouts.length >= 3) workoutLevel = 'Intermediate Specialist';

    const totalGoalCompletionPercent = goals.length > 0 
      ? goals.reduce((sum, g) => sum + Math.min(100, (g.current / g.target) * 100), 0) / goals.length
      : 72;

    return {
      currentStreak: workouts.length > 0 ? Math.min(14, workouts.length) : 0,
      workoutLevel,
      totalWorkouts: workouts.length,
      totalCaloriesBurned: Math.round(totalCaloriesBurned) || 5240,
      favoriteWorkout: favoriteWorkout !== 'N/A' ? favoriteWorkout : 'Power Hypertrophy Push',
      achievementsCount: { unlocked: unlockedAchievements, total: achievements.length },
      currentGoalProgress: Math.round(totalGoalCompletionPercent) || 72,
      membershipSince: 'July 2026'
    };
  },

  // --- Physical & Metric Statistics ---
  async getPhysicalStats(userId: string, profile: UserProfile): Promise<PhysicalStats> {
    let workouts: any[] = [];
    try {
      workouts = await workoutsService.getWorkouts(userId);
    } catch (e) {}
    
    const heightInMeters = profile.height / 100;
    let bmi = 24.4;
    if (heightInMeters > 0) {
      bmi = parseFloat((profile.weight / (heightInMeters * heightInMeters)).toFixed(1));
    }

    let bmiCategory = 'Healthy Weight';
    if (bmi < 18.5) bmiCategory = 'Underweight';
    else if (bmi >= 25 && bmi < 30) bmiCategory = 'Overweight';
    else if (bmi >= 30) bmiCategory = 'Obese';

    const minHealthyWeight = Math.round(18.5 * (heightInMeters * heightInMeters));
    const maxHealthyWeight = Math.round(24.9 * (heightInMeters * heightInMeters));
    const healthyWeightRange = `${minHealthyWeight}kg - ${maxHealthyWeight}kg`;

    const workoutConsistency = workouts.length > 0 ? Math.min(100, 70 + workouts.length * 5) : 65;
    const weeklyCompletionRate = workouts.length >= 4 ? 95 : 75;
    const monthlyCompletionRate = workouts.length >= 12 ? 90 : 80;

    let fitnessScore = 50;
    if (workouts.length > 0) {
      fitnessScore = Math.min(100, 50 + (workouts.length * 2.5) + (profile.dailyProteinGoal > 150 ? 5 : 2));
    } else {
      fitnessScore = 72;
    }

    let trainingAge = 'Novice (0-3 Months)';
    if (workouts.length > 20) trainingAge = 'Advanced (1-2 Years)';
    else if (workouts.length > 5) trainingAge = 'Intermediate (3-6 Months)';

    return {
      bmi,
      bmiCategory,
      healthyWeightRange,
      workoutConsistency,
      weeklyCompletionRate,
      monthlyCompletionRate,
      fitnessScore,
      trainingAge
    };
  },

  // --- Profile Export/Backup ---
  async exportProfileData(userId: string): Promise<string> {
    const profile = await this.getProfile(userId);
    const settings = await this.getSettings(userId);
    const appSettings = await this.getAppSettings(userId);
    const goals = await this.getGoals(userId);
    const achievements = await this.getAchievements(userId);

    const fullPackage = {
      exportedAt: new Date().toISOString(),
      appVersion: '3.5-AuraOS',
      profile,
      settings,
      appSettings,
      goals,
      achievements
    };

    return JSON.stringify(fullPackage, null, 2);
  },

  async importProfileData(userId: string, jsonString: string): Promise<void> {
    delete profileCache[userId];
    delete settingsCache[userId];
    delete appSettingsCache[userId];
    delete goalsCache[userId];
    delete achievementsCache[userId];

    const parsed = JSON.parse(jsonString);
    if (!parsed.profile || !parsed.settings || !parsed.appSettings) {
      throw new Error('Invalid JSON blueprint: missing required parameters.');
    }

    const importedProfile = { ...parsed.profile, id: userId };
    await this.saveProfile(importedProfile);
    await this.saveSettings(userId, parsed.settings);
    await this.saveAppSettings(userId, parsed.appSettings);
    
    if (parsed.goals) await this.saveGoals(userId, parsed.goals);
    if (parsed.achievements) await this.saveAchievements(userId, parsed.achievements);
  },

  async resetAllPreferences(userId: string, email: string): Promise<void> {
    delete profileCache[userId];
    delete settingsCache[userId];
    delete appSettingsCache[userId];
    delete goalsCache[userId];
    delete achievementsCache[userId];

    if (typeof window !== 'undefined') {
      localStorage.removeItem(`${PROFILE_STORAGE_KEY}_${userId}`);
      localStorage.removeItem(`${SETTINGS_STORAGE_KEY}_${userId}`);
      localStorage.removeItem(`${APP_SETTINGS_STORAGE_KEY}_${userId}`);
      localStorage.removeItem(`${GOALS_STORAGE_KEY}_${userId}`);
      localStorage.removeItem(`${ACHIEVEMENTS_STORAGE_KEY}_${userId}`);
    }

    if (isRealSupabaseConfigured) {
      try {
        await supabase.from('profiles').delete().eq('id', userId);
        await supabase.from('user_settings').delete().eq('id', userId);
        await supabase.from('user_preferences').delete().eq('id', userId);
        await supabase.from('goals').delete().eq('user_id', userId);
        await supabase.from('achievements').delete().eq('user_id', userId);
      } catch (err) {
        console.warn("Failed to delete user rows from Supabase, local cache has been flushed:", err);
      }
    }
  }
};

export class ErrorHandler {
  static run<T>(action: () => T, fallbackMessage: string): T {
    try {
      return action();
    } catch (e: any) {
      console.error("[ProfileService Core Error]:", e);
      throw new Error(e.message || fallbackMessage);
    }
  }

  static async runAsync<T>(action: () => Promise<T>, fallbackMessage: string): Promise<T> {
    try {
      return await action();
    } catch (e: any) {
      console.error("[ProfileService Core Async Error]:", e);
      throw new Error(e.message || fallbackMessage);
    }
  }
}
