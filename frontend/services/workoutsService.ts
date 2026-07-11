import { supabase, isRealSupabaseConfigured } from './supabase';

export interface Workout {
  id: string;
  user_id: string;
  workout_name: string;
  category: string;
  duration: number;
  calories_burned: number;
  workout_date: string;
  notes: string;
  created_at?: string;
}

export type NewWorkout = Omit<Workout, 'id' | 'created_at' | 'user_id'>;

const WORKOUTS_STORAGE_KEY = 'aura_workouts_local_store';

// Helper to load mock workouts from local storage
const getLocalWorkouts = (userId: string): Workout[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(`${WORKOUTS_STORAGE_KEY}_${userId}`);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn("Failed to load local workouts:", e);
  }
  
  // Return some initial sample workouts if the user is completely fresh
  const samples: Workout[] = [
    {
      id: 'mock-w-1',
      user_id: userId,
      workout_name: 'Power Hypertrophy Push Split',
      category: 'Strength',
      duration: 55,
      calories_burned: 420,
      workout_date: new Date(Date.now() - 24 * 3600 * 1000).toISOString().split('T')[0], // yesterday
      notes: 'Focused on progressive overload on bench press. Sets of 4x8 at 85% 1RM.',
      created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'mock-w-2',
      user_id: userId,
      workout_name: 'Anaerobic HIIT Conditioning',
      category: 'Cardio',
      duration: 35,
      calories_burned: 480,
      workout_date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString().split('T')[0], // 3 days ago
      notes: 'Assault bike sprints and kettlebell complexes. High intensity, heart rate spiked to 178 bpm.',
      created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'mock-w-3',
      user_id: userId,
      workout_name: 'Posterior Chain Pull Focus',
      category: 'Strength',
      duration: 60,
      calories_burned: 450,
      workout_date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split('T')[0], // 5 days ago
      notes: 'Heavy deadlifts 5x5. Barbell rows and pull-ups.',
      created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
    }
  ];
  try {
    localStorage.setItem(`${WORKOUTS_STORAGE_KEY}_${userId}`, JSON.stringify(samples));
  } catch {}
  return samples;
};

const saveLocalWorkouts = (userId: string, workouts: Workout[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${WORKOUTS_STORAGE_KEY}_${userId}`, JSON.stringify(workouts));
  } catch (e) {
    console.warn("Failed to write local workouts:", e);
  }
};

export const workoutsMemoryCache: { [userId: string]: { data: Workout[]; timestamp: number } } = {};

export const workoutsActivePromises: { [key: string]: Promise<any> } = {};

export async function coalesceWorkoutsQuery<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
  if (workoutsActivePromises[key]) {
    return workoutsActivePromises[key];
  }
  const promise = fetchFn().finally(() => {
    delete workoutsActivePromises[key];
  });
  workoutsActivePromises[key] = promise;
  return promise;
}

export const workoutsService = {
  async getWorkouts(userId: string): Promise<Workout[]> {
    const now = Date.now();
    const cached = workoutsMemoryCache[userId];
    if (cached && (now - cached.timestamp < 3000)) {
      return cached.data;
    }

    const fetchWorkoutsList = async (): Promise<Workout[]> => {
      if (isRealSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('workout')
            .select('*')
            .eq('user_id', userId)
            .order('workout_date', { ascending: false });

          if (error) {
            console.warn('Supabase getWorkouts error, returning local workouts instead:', error);
          } else if (data) {
            const parsed = data.map((w: any) => ({
              id: String(w.id),
              user_id: w.user_id,
              workout_name: w.workout_name,
              category: w.category,
              duration: Number(w.duration),
              calories_burned: Number(w.calories_burned),
              workout_date: w.workout_date,
              notes: w.notes || '',
              created_at: w.created_at,
            }));
            // Sync cache locally
            saveLocalWorkouts(userId, parsed);
            return parsed;
          }
        } catch (e) {
          console.warn('Supabase getWorkouts fetch error, using local storage cache:', e);
        }
      }

      // Local sandbox mode or fetch error fallback
      return getLocalWorkouts(userId);
    };

    const result = await coalesceWorkoutsQuery(`workouts_${userId}`, fetchWorkoutsList);
    workoutsMemoryCache[userId] = { data: result, timestamp: Date.now() };
    return result;
  },

  async addWorkout(userId: string, workout: NewWorkout): Promise<Workout> {
    delete workoutsMemoryCache[userId];
    const payload = {
      user_id: userId,
      workout_name: workout.workout_name,
      category: workout.category,
      duration: Number(workout.duration),
      calories_burned: Number(workout.calories_burned),
      workout_date: workout.workout_date,
      notes: workout.notes || '',
    };

    if (isRealSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('workout')
          .insert([payload])
          .select();

        if (error) {
          console.warn('Supabase addWorkout error, caching locally:', error);
        } else if (data && data.length > 0) {
          const w = data[0];
          const newWorkoutObj: Workout = {
            id: String(w.id),
            user_id: w.user_id,
            workout_name: w.workout_name,
            category: w.category,
            duration: Number(w.duration),
            calories_burned: Number(w.calories_burned),
            workout_date: w.workout_date,
            notes: w.notes || '',
            created_at: w.created_at,
          };
          
          // Sync with local cache
          const local = getLocalWorkouts(userId);
          saveLocalWorkouts(userId, [newWorkoutObj, ...local]);
          return newWorkoutObj;
        }
      } catch (e) {
        console.warn('Supabase addWorkout failed to execute. Proceeding with local sandbox mode:', e);
      }
    }

    // Sandbox fallback
    const newId = 'local-w-' + Math.random().toString(36).substr(2, 9);
    const newWorkoutObj: Workout = {
      id: newId,
      user_id: userId,
      workout_name: workout.workout_name,
      category: workout.category,
      duration: Number(workout.duration),
      calories_burned: Number(workout.calories_burned),
      workout_date: workout.workout_date,
      notes: workout.notes || '',
      created_at: new Date().toISOString()
    };

    const local = getLocalWorkouts(userId);
    saveLocalWorkouts(userId, [newWorkoutObj, ...local]);
    return newWorkoutObj;
  },

  async updateWorkout(userId: string, workoutId: string, workout: Partial<NewWorkout>): Promise<Workout> {
    delete workoutsMemoryCache[userId];
    const payload: any = {
      workout_name: workout.workout_name,
      category: workout.category,
      duration: workout.duration !== undefined ? Number(workout.duration) : undefined,
      calories_burned: workout.calories_burned !== undefined ? Number(workout.calories_burned) : undefined,
      workout_date: workout.workout_date,
      notes: workout.notes,
    };

    // Remove undefined fields
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });

    if (isRealSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('workout')
          .update(payload)
          .eq('id', workoutId)
          .eq('user_id', userId)
          .select();

        if (error) {
          console.warn('Supabase updateWorkout error, falling back locally:', error);
        } else if (data && data.length > 0) {
          const w = data[0];
          const updatedWorkoutObj: Workout = {
            id: String(w.id),
            user_id: w.user_id,
            workout_name: w.workout_name,
            category: w.category,
            duration: Number(w.duration),
            calories_burned: Number(w.calories_burned),
            workout_date: w.workout_date,
            notes: w.notes || '',
            created_at: w.created_at,
          };
          
          // Sync with local cache
          const local = getLocalWorkouts(userId);
          const index = local.findIndex(item => item.id === workoutId);
          if (index !== -1) {
            local[index] = updatedWorkoutObj;
            saveLocalWorkouts(userId, local);
          }
          return updatedWorkoutObj;
        }
      } catch (e) {
        console.warn('Supabase updateWorkout exception, editing locally:', e);
      }
    }

    // Sandbox fallback
    const local = getLocalWorkouts(userId);
    const index = local.findIndex(item => item.id === workoutId);
    if (index === -1) {
      throw new Error('Workout not found in local sandbox storage');
    }

    const current = local[index];
    const updatedWorkoutObj: Workout = {
      ...current,
      workout_name: workout.workout_name !== undefined ? workout.workout_name : current.workout_name,
      category: workout.category !== undefined ? workout.category : current.category,
      duration: workout.duration !== undefined ? Number(workout.duration) : current.duration,
      calories_burned: workout.calories_burned !== undefined ? Number(workout.calories_burned) : current.calories_burned,
      workout_date: workout.workout_date !== undefined ? workout.workout_date : current.workout_date,
      notes: workout.notes !== undefined ? (workout.notes || '') : current.notes,
    };

    local[index] = updatedWorkoutObj;
    saveLocalWorkouts(userId, local);
    return updatedWorkoutObj;
  },

  async deleteWorkout(userId: string, workoutId: string): Promise<void> {
    delete workoutsMemoryCache[userId];
    if (isRealSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('workout')
          .delete()
          .eq('id', workoutId)
          .eq('user_id', userId);

        if (error) {
          console.warn('Supabase deleteWorkout error, performing local delete only:', error);
        }
      } catch (e) {
        console.warn('Supabase deleteWorkout exception:', e);
      }
    }

    // Sync with local cache
    const local = getLocalWorkouts(userId);
    const filtered = local.filter(item => item.id !== workoutId);
    saveLocalWorkouts(userId, filtered);
  }
};
