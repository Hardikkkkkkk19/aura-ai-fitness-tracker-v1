import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { useToast } from '../context/ToastContext';
import { workoutsService, Workout } from '../services/workoutsService';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  ArrowRight, 
  Award, 
  Flame, 
  Clock, 
  Dumbbell, 
  Download, 
  Sparkles, 
  Target, 
  Edit3, 
  Trophy, 
  Zap, 
  Activity, 
  FileText, 
  ChevronDown, 
  X,
  Plus,
  Loader2,
  CalendarDays
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PageTransition } from '../components/PageTransition';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area, 
  Legend,
  CartesianGrid
} from 'recharts';

type FilterPeriod = 'today' | '7days' | '30days' | 'thisMonth' | 'thisYear' | 'allTime';

interface Goals {
  weeklyWorkouts: number;
  weeklyCalories: number;
  weeklyMinutes: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  Strength: '#6366f1',   // indigo
  Cardio: '#f43f5e',     // rose
  HIIT: '#f97316',       // orange
  Yoga: '#14b8a6',       // teal
  Running: '#10b981',    // emerald
  Cycling: '#06b6d4',    // cyan
  Walking: '#0ea5e9',    // sky
  Stretching: '#8b5cf6'   // violet
};

export const Analytics: React.FC = () => {
  const { user, isMockMode } = useAuth();
  const { showToast } = useToast();

  const [collapsed, setCollapsed] = useState(false);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Goals
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('30days');
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  
  // Goals State (User customized)
  const [goals, setGoals] = useState<Goals>({
    weeklyWorkouts: 4,
    weeklyCalories: 2000,
    weeklyMinutes: 150
  });

  // Goal Form Fields
  const [tempWeeklyWorkouts, setTempWeeklyWorkouts] = useState<number>(4);
  const [tempWeeklyCalories, setTempWeeklyCalories] = useState<number>(2000);
  const [tempWeeklyMinutes, setTempWeeklyMinutes] = useState<number>(150);

  // Load User Workouts and customized Goals
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        // Load workouts from 'workout' table
        const data = await workoutsService.getWorkouts(user.id);
        setWorkouts(data);

        // Load goals from local storage
        const savedGoals = localStorage.getItem(`aura_goals_${user.id}`);
        if (savedGoals) {
          const parsed = JSON.parse(savedGoals);
          setGoals(parsed);
          setTempWeeklyWorkouts(parsed.weeklyWorkouts);
          setTempWeeklyCalories(parsed.weeklyCalories);
          setTempWeeklyMinutes(parsed.weeklyMinutes);
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to load workouts for analytics board.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [user?.id]);

  // Handle goals customization submission
  const handleSaveGoals = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    if (tempWeeklyWorkouts <= 0 || tempWeeklyCalories <= 0 || tempWeeklyMinutes <= 0) {
      showToast('All targets must be positive numbers greater than 0.', 'error');
      return;
    }

    const updatedGoals = {
      weeklyWorkouts: Number(tempWeeklyWorkouts),
      weeklyCalories: Number(tempWeeklyCalories),
      weeklyMinutes: Number(tempWeeklyMinutes)
    };

    setGoals(updatedGoals);
    localStorage.setItem(`aura_goals_${user.id}`, JSON.stringify(updatedGoals));
    showToast('Your customized fitness goals have been updated!', 'success');
    setIsGoalsModalOpen(false);
  };

  // Open Goals Modal and preset temp fields
  const handleOpenGoalsModal = () => {
    setTempWeeklyWorkouts(goals.weeklyWorkouts);
    setTempWeeklyCalories(goals.weeklyCalories);
    setTempWeeklyMinutes(goals.weeklyMinutes);
    setIsGoalsModalOpen(true);
  };

  // Filter Helper
  const filteredWorkouts = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    const todayStr = new Date().toISOString().split('T')[0];
    
    return workouts.filter(w => {
      const workoutDate = new Date(w.workout_date);
      const diffTime = today.getTime() - workoutDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      switch (filterPeriod) {
        case 'today':
          return w.workout_date === todayStr;
        case '7days':
          return diffDays >= 0 && diffDays < 7;
        case '30days':
          return diffDays >= 0 && diffDays < 30;
        case 'thisMonth': {
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          return workoutDate.getMonth() === currentMonth && workoutDate.getFullYear() === currentYear;
        }
        case 'thisYear': {
          const currentYear = new Date().getFullYear();
          return workoutDate.getFullYear() === currentYear;
        }
        case 'allTime':
        default:
          return true;
      }
    });
  }, [workouts, filterPeriod]);

  // Streak Calculation across ALL time for consistency
  const currentStreak = useMemo(() => {
    if (workouts.length === 0) return 0;
    
    const datesSet = new Set(workouts.map(w => w.workout_date));
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let streak = 0;
    let checkDate = new Date();

    if (datesSet.has(todayStr)) {
      streak = 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (datesSet.has(yesterdayStr)) {
      streak = 1;
      checkDate.setDate(checkDate.getDate() - 2);
    } else {
      return 0;
    }

    while (true) {
      const checkStr = checkDate.toISOString().split('T')[0];
      if (datesSet.has(checkStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [workouts]);

  // Current Calendar Week workouts (starting from Monday)
  const getStartOfWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const thisWeekWorkouts = useMemo(() => {
    const startOfWeek = getStartOfWeek();
    return workouts.filter(w => new Date(w.workout_date) >= startOfWeek);
  }, [workouts]);

  // Calculations for Weekly Progress Bars
  const thisWeekWorkoutsCount = thisWeekWorkouts.length;
  const thisWeekCaloriesSum = thisWeekWorkouts.reduce((acc, curr) => acc + (curr.calories_burned || 0), 0);
  const thisWeekMinutesSum = thisWeekWorkouts.reduce((acc, curr) => acc + (curr.duration || 0), 0);

  const workoutsProgressPercent = Math.min(100, Math.round((thisWeekWorkoutsCount / goals.weeklyWorkouts) * 100));
  const caloriesProgressPercent = Math.min(100, Math.round((thisWeekCaloriesSum / goals.weeklyCalories) * 100));
  const minutesProgressPercent = Math.min(100, Math.round((thisWeekMinutesSum / goals.weeklyMinutes) * 100));

  const averageWeeklyProgress = Math.round((workoutsProgressPercent + caloriesProgressPercent + minutesProgressPercent) / 3);

  // Stats cards computations on FILTERED dataset
  const totalWorkouts = filteredWorkouts.length;
  const totalCalories = filteredWorkouts.reduce((acc, curr) => acc + (curr.calories_burned || 0), 0);
  const totalMinutes = filteredWorkouts.reduce((acc, curr) => acc + (curr.duration || 0), 0);
  const averageDuration = totalWorkouts > 0 ? Math.round(totalMinutes / totalWorkouts) : 0;
  
  const activeDays = useMemo(() => {
    const uniqueDates = new Set(filteredWorkouts.map(w => w.workout_date));
    return uniqueDates.size;
  }, [filteredWorkouts]);

  const longestWorkout = useMemo(() => {
    if (filteredWorkouts.length === 0) return 0;
    return Math.max(...filteredWorkouts.map(w => w.duration));
  }, [filteredWorkouts]);

  // ALL-TIME Personal Records calculations
  const personalRecords = useMemo(() => {
    if (workouts.length === 0) return null;

    // 1. Longest Workout
    const longest = workouts.reduce((prev, current) => (prev.duration > current.duration) ? prev : current, workouts[0]);

    // 2. Highest Calories Burned
    const highestCal = workouts.reduce((prev, current) => (prev.calories_burned > current.calories_burned) ? prev : current, workouts[0]);

    // 3. Favorite Category
    const categoryCounts: Record<string, number> = {};
    workouts.forEach(w => {
      categoryCounts[w.category] = (categoryCounts[w.category] || 0) + 1;
    });
    
    let favCat = 'Strength';
    let maxCatCount = 0;
    Object.keys(categoryCounts).forEach(cat => {
      if (categoryCounts[cat] > maxCatCount) {
        maxCatCount = categoryCounts[cat];
        favCat = cat;
      }
    });

    // 4. Most Active Week (grouped by calendar year-week)
    const getYearWeek = (dateVal: string) => {
      const d = new Date(dateVal);
      const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
      const pastDaysOfYear = (d.getTime() - firstDayOfYear.getTime()) / 86400000;
      const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      return `${d.getFullYear()}-W${weekNum}`;
    };

    const weekGroups: Record<string, number> = {};
    workouts.forEach(w => {
      const wkKey = getYearWeek(w.workout_date);
      weekGroups[wkKey] = (weekGroups[wkKey] || 0) + 1;
    });

    let mostActiveWk = 'N/A';
    let maxWeekCount = 0;
    Object.keys(weekGroups).forEach(wk => {
      if (weekGroups[wk] > maxWeekCount) {
        maxWeekCount = weekGroups[wk];
        mostActiveWk = wk;
      }
    });

    return {
      longest,
      highestCal,
      favCategory: favCat,
      favCategoryCount: maxCatCount,
      mostActiveWeek: mostActiveWk !== 'N/A' ? mostActiveWk.replace('-W', ', Week ') : 'N/A',
      mostActiveWeekCount: maxWeekCount
    };
  }, [workouts]);

  // Export Workouts Data to CSV helper
  const handleExportCSV = () => {
    if (workouts.length === 0) {
      showToast('No logged workouts to export.', 'error');
      return;
    }

    const headers = ['Workout ID', 'Workout Name', 'Category', 'Duration (Minutes)', 'Calories Burned (kcal)', 'Workout Date', 'Notes', 'Created At'];
    const rows = workouts.map(w => [
      w.id,
      `"${w.workout_name.replace(/"/g, '""')}"`,
      w.category,
      w.duration,
      w.calories_burned,
      w.workout_date,
      `"${(w.notes || '').replace(/"/g, '""')}"`,
      w.created_at || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `Aura_Workout_History_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Aura fitness log history successfully exported as CSV.', 'success');
  };

  // --- CHART DATA GENERATION ---

  // 1. Weekly Workout Bar Chart data (specific last 7 dates)
  const weeklyWorkoutBarData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = days[d.getDay()];

      const matches = workouts.filter(w => w.workout_date === dateStr);
      const minutes = matches.reduce((acc, curr) => acc + (curr.duration || 0), 0);
      const count = matches.length;

      result.push({
        day: label,
        date: dateStr,
        Minutes: minutes,
        Sessions: count
      });
    }
    return result;
  }, [workouts]);

  // 2. Monthly Calories Line Chart data (Jan-Dec for active year)
  const monthlyCaloriesLineData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();

    return months.map((month, index) => {
      const matches = workouts.filter(w => {
        const d = new Date(w.workout_date);
        return d.getMonth() === index && d.getFullYear() === currentYear;
      });
      const calories = matches.reduce((acc, curr) => acc + (curr.calories_burned || 0), 0);
      return {
        name: month,
        Calories: calories
      };
    });
  }, [workouts]);

  // 3. Category Pie Chart (Breakdown based on active filter)
  const categoryPieData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredWorkouts.forEach(w => {
      counts[w.category] = (counts[w.category] || 0) + 1;
    });

    return Object.keys(counts).map(cat => ({
      name: cat,
      value: counts[cat]
    })).sort((a, b) => b.value - a.value);
  }, [filteredWorkouts]);

  // 4. Duration Trend (chronological line/area showing session duration)
  const durationTrendData = useMemo(() => {
    // Sort oldest first
    const sorted = [...filteredWorkouts].sort((a, b) => new Date(a.workout_date).getTime() - new Date(b.workout_date).getTime());
    
    // Group by date to keep points legible
    const grouped: Record<string, number> = {};
    sorted.forEach(w => {
      grouped[w.workout_date] = (grouped[w.workout_date] || 0) + w.duration;
    });

    return Object.keys(grouped).slice(-15).map(dateStr => ({
      name: dateStr.slice(5), // e.g. "07-10"
      Duration: grouped[dateStr]
    }));
  }, [filteredWorkouts]);

  // 5. Workout Frequency Chart (sessions by Day of the Week aggregated inside active filter)
  const workoutFrequencyData = useMemo(() => {
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = [0, 0, 0, 0, 0, 0, 0];

    filteredWorkouts.forEach(w => {
      const d = new Date(w.workout_date);
      counts[d.getDay()]++;
    });

    return dayLabels.map((day, index) => ({
      name: day,
      Workouts: counts[index]
    }));
  }, [filteredWorkouts]);

  // Custom tooltips for Recharts elements
  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-950/95 border border-white/10 p-3 rounded-2xl shadow-2xl backdrop-blur-md">
          <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest font-bold">{label}</p>
          <p className="text-xs font-display font-extrabold text-indigo-400 mt-1.5">
            {payload[0].name}: <span className="text-white font-mono">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header bar */}
      <header className="fixed top-0 left-0 right-0 h-16 glass-panel border-b border-white/5 z-30 flex items-center justify-between px-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 p-[1px]">
            <div className="w-full h-full rounded-lg bg-[#050505] flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <span className="font-display font-bold text-sm tracking-wide">AURA METRIC ENGINE</span>
        </div>
        <div className="flex items-center space-x-3">
          {isMockMode && (
            <span className="text-[9px] uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-400/20 px-2.5 py-1 rounded-full font-bold">
              Sandbox Mode
            </span>
          )}
          <span className="text-xs text-gray-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">Advanced Analytics</span>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex pt-16">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        
        <main className={`flex-1 min-h-[calc(100vh-4rem)] p-6 sm:p-10 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-72'}`}>
          <PageTransition>
            <div className="max-w-6xl mx-auto space-y-8">
            
            {/* Page Title & Controls Row */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-400">PHASE 4 DEPLOYED</span>
                <h1 className="text-3xl font-display font-bold text-white tracking-tight mt-0.5">Advanced Performance Board</h1>
                <p className="text-sm text-gray-400 mt-1">Review aggregated workout trends, analyze training splits, and monitor weekly goals.</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                {/* CSV Export Button */}
                <button 
                  onClick={handleExportCSV}
                  className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs px-4 py-3 rounded-xl transition-all cursor-pointer"
                  title="Export entire workout history to CSV"
                >
                  <Download className="w-4 h-4 text-indigo-400" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Interval Filters Tabs bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-2 rounded-2xl bg-[#09090c]/40 border border-white/5">
              <div className="flex flex-wrap items-center gap-1.5">
                {(['today', '7days', '30days', 'thisMonth', 'thisYear', 'allTime'] as FilterPeriod[]).map((period) => {
                  const labels: Record<FilterPeriod, string> = {
                    today: 'Today',
                    '7days': 'Last 7 Days',
                    '30days': 'Last 30 Days',
                    thisMonth: 'This Month',
                    thisYear: 'This Year',
                    allTime: 'All Time'
                  };
                  return (
                    <button
                      key={period}
                      onClick={() => setFilterPeriod(period)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        filterPeriod === period
                          ? 'bg-indigo-600 text-white shadow-lg'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {labels[period]}
                    </button>
                  );
                })}
              </div>
              
              <div className="text-[11px] text-gray-400 font-mono px-3.5 flex items-center space-x-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-indigo-400" />
                <span>Range: {filteredWorkouts.length} Workouts Loaded</span>
              </div>
            </div>

            {/* Loading skeletons or statistics dashboard */}
            {loading ? (
              <div className="space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} className="h-28 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse" />
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="h-80 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse" />
                  <div className="h-80 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse" />
                </div>
              </div>
            ) : (
              <div className="space-y-8">

                {/* BENTO STATISTICS SUMMARY CARDS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  
                  {/* Total Sessions */}
                  <div className="rounded-2xl glass-card p-5 border border-white/5 hover:border-indigo-500/25 transition-all shadow-md relative group">
                    <div className="absolute top-3 right-3 text-indigo-400/20 group-hover:text-indigo-400/40 transition-colors">
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold block leading-none">Total Sessions</span>
                    <span className="text-2xl sm:text-3xl font-display font-extrabold text-white block mt-3">{totalWorkouts}</span>
                    <p className="text-[10px] text-gray-500 font-medium mt-2 leading-none">In active filtered view</p>
                  </div>

                  {/* Active Calories Burned */}
                  <div className="rounded-2xl glass-card p-5 border border-white/5 hover:border-rose-500/25 transition-all shadow-md relative group">
                    <div className="absolute top-3 right-3 text-rose-400/20 group-hover:text-rose-400/40 transition-colors">
                      <Flame className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold block leading-none">Energy Burn</span>
                    <span className="text-2xl sm:text-3xl font-display font-extrabold text-rose-400 block mt-3">
                      {totalCalories} <span className="text-xs font-sans font-medium text-gray-400">kcal</span>
                    </span>
                    <p className="text-[10px] text-gray-500 font-medium mt-2 leading-none">Total calories expended</p>
                  </div>

                  {/* Total Duration Minutes */}
                  <div className="rounded-2xl glass-card p-5 border border-white/5 hover:border-orange-500/25 transition-all shadow-md relative group">
                    <div className="absolute top-3 right-3 text-orange-400/20 group-hover:text-orange-400/40 transition-colors">
                      <Clock className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold block leading-none">Total Minutes</span>
                    <span className="text-2xl sm:text-3xl font-display font-extrabold text-orange-400 block mt-3">
                      {totalMinutes} <span className="text-xs font-sans font-medium text-gray-400">mins</span>
                    </span>
                    <p className="text-[10px] text-gray-500 font-medium mt-2 leading-none">Total training volume</p>
                  </div>

                  {/* Average Duration */}
                  <div className="rounded-2xl glass-card p-5 border border-white/5 hover:border-sky-500/25 transition-all shadow-md relative group">
                    <div className="absolute top-3 right-3 text-sky-400/20 group-hover:text-sky-400/40 transition-colors">
                      <Activity className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold block leading-none">Avg Session Length</span>
                    <span className="text-2xl sm:text-3xl font-display font-extrabold text-sky-400 block mt-3">
                      {averageDuration} <span className="text-xs font-sans font-medium text-gray-400">mins</span>
                    </span>
                    <p className="text-[10px] text-gray-500 font-medium mt-2 leading-none">Mean minutes per sheet</p>
                  </div>

                  {/* Unique Active Days */}
                  <div className="rounded-2xl glass-card p-5 border border-white/5 hover:border-teal-500/25 transition-all shadow-md relative group">
                    <div className="absolute top-3 right-3 text-teal-400/20 group-hover:text-teal-400/40 transition-colors">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold block leading-none">Active Days</span>
                    <span className="text-2xl sm:text-3xl font-display font-extrabold text-teal-400 block mt-3">{activeDays}</span>
                    <p className="text-[10px] text-gray-500 font-medium mt-2 leading-none">Unique calendar dates logged</p>
                  </div>

                  {/* Longest Workout duration */}
                  <div className="rounded-2xl glass-card p-5 border border-white/5 hover:border-violet-500/25 transition-all shadow-md relative group">
                    <div className="absolute top-3 right-3 text-violet-400/20 group-hover:text-violet-400/40 transition-colors">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold block leading-none">Longest Workout</span>
                    <span className="text-2xl sm:text-3xl font-display font-extrabold text-violet-400 block mt-3">
                      {longestWorkout} <span className="text-xs font-sans font-medium text-gray-400">mins</span>
                    </span>
                    <p className="text-[10px] text-gray-500 font-medium mt-2 leading-none">Max single-session duration</p>
                  </div>

                  {/* Active Streak */}
                  <div className="rounded-2xl glass-card p-5 border border-white/5 hover:border-amber-500/25 transition-all shadow-md relative group">
                    <div className="absolute top-3 right-3 text-amber-400/20 group-hover:text-amber-400/40 transition-colors">
                      <Zap className={`w-5 h-5 ${currentStreak > 0 ? 'text-orange-400 animate-bounce' : ''}`} />
                    </div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold block leading-none">Current Streak</span>
                    <span className="text-2xl sm:text-3xl font-display font-extrabold text-amber-400 block mt-3">
                      {currentStreak} <span className="text-xs font-sans font-medium text-gray-400">days</span>
                    </span>
                    <p className="text-[10px] text-gray-500 font-medium mt-2 leading-none">Consecutive training consistency</p>
                  </div>

                  {/* Goals index */}
                  <div className="rounded-2xl glass-card p-5 border border-white/5 hover:border-emerald-500/25 transition-all shadow-md relative group">
                    <div className="absolute top-3 right-3 text-emerald-400/20 group-hover:text-emerald-400/40 transition-colors">
                      <Target className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold block leading-none">Weekly Goals Match</span>
                    <span className="text-2xl sm:text-3xl font-display font-extrabold text-emerald-400 block mt-3">{averageWeeklyProgress}%</span>
                    <p className="text-[10px] text-gray-500 font-medium mt-2 leading-none">Average target completion</p>
                  </div>

                </div>

                {/* TWO COLUMN INTERACTIVE CHARTS PART 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* Weekly Workout Bar Chart */}
                  <div className="rounded-3xl glass-card p-6 border border-white/10 relative overflow-hidden shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-base font-display font-bold text-white">Weekly Workout Session Minutes</h3>
                        <p className="text-xs text-gray-400 mt-1">Session volume logged over the past 7 days</p>
                      </div>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyWorkoutBarData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <XAxis dataKey="day" stroke="#52525b" fontSize={11} tickLine={false} />
                          <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip content={renderCustomTooltip} cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }} />
                          <Bar dataKey="Minutes" fill="url(#indigoGrad)" radius={[6, 6, 0, 0]} barSize={24} />
                          <defs>
                            <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#818cf8" />
                              <stop offset="100%" stopColor="#4f46e5" />
                            </linearGradient>
                          </defs>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Monthly Calories Line Chart */}
                  <div className="rounded-3xl glass-card p-6 border border-white/10 relative overflow-hidden shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-base font-display font-bold text-white">Monthly Calorie Expenditure Trend</h3>
                        <p className="text-xs text-gray-400 mt-1">Calories burned (kcal) month-by-month for the current year</p>
                      </div>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyCaloriesLineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <XAxis dataKey="name" stroke="#52525b" fontSize={11} tickLine={false} />
                          <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip content={renderCustomTooltip} />
                          <Area type="monotone" dataKey="Calories" stroke="#f43f5e" fill="url(#roseGrad)" strokeWidth={2} />
                          <defs>
                            <linearGradient id="roseGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.2} />
                              <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>

                {/* THREE COLUMN DETAILS AND INTERACTIVE CHARTS PART 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Category breakdown (Pie Chart) */}
                  <div className="rounded-3xl glass-card p-6 border border-white/10 shadow-xl flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-display font-bold text-white">Workout Category Distribution</h3>
                      <p className="text-xs text-gray-400 mt-1">Breakdown of training split types</p>
                      
                      <div className="h-44 w-full relative mt-4 flex items-center justify-center">
                        {categoryPieData.length === 0 ? (
                          <div className="text-xs text-gray-500 italic">No workouts to distribute</div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={categoryPieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={48}
                                outerRadius={68}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {categoryPieData.map((entry) => (
                                  <Cell key={`cell-${entry.name}`} fill={CATEGORY_COLORS[entry.name] || '#8b5cf6'} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(v: any) => [`${v} workouts`, 'Count']} />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                        <div className="absolute flex flex-col items-center justify-center text-center">
                          <span className="text-lg font-display font-extrabold text-white">{totalWorkouts}</span>
                          <span className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold leading-none">Total Logs</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 mt-4 text-[11px] max-h-36 overflow-y-auto pr-1">
                      {categoryPieData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-gray-400 py-1 border-b border-white/[0.03] last:border-0">
                          <span className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[item.name] }} />
                            <span className="text-white font-medium">{item.name}</span>
                          </span>
                          <span className="font-mono text-gray-500">
                            {item.value} ({Math.round((item.value / totalWorkouts) * 100)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Duration Timeline Trend Chart */}
                  <div className="rounded-3xl glass-card p-6 border border-white/10 shadow-xl flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-display font-bold text-white">Workout Duration Trend</h3>
                      <p className="text-xs text-gray-400 mt-1">Chronological length of the last 15 training splits</p>
                    </div>
                    <div className="h-44 w-full mt-4">
                      {durationTrendData.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-xs text-gray-500 italic">Awaiting workout splits</div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={durationTrendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                            <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} />
                            <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip formatter={(v: any) => [`${v} minutes`, 'Duration']} />
                            <Area type="monotone" dataKey="Duration" stroke="#8b5cf6" fill="url(#violetGrad)" strokeWidth={2} />
                            <defs>
                              <linearGradient id="violetGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.15} />
                                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-4 leading-relaxed font-mono">
                      Shows daily volume growth progression to avoid overtraining fatigue splits.
                    </p>
                  </div>

                  {/* Day of Week Frequency Bar Chart */}
                  <div className="rounded-3xl glass-card p-6 border border-white/10 shadow-xl flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-display font-bold text-white">Weekly Workout Frequency</h3>
                      <p className="text-xs text-gray-400 mt-1">Training consistency aggregated by day of the week</p>
                    </div>
                    <div className="h-44 w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={workoutFrequencyData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                          <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} />
                          <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                          <Tooltip formatter={(v: any) => [`${v} workouts`, 'Logged']} />
                          <Bar dataKey="Workouts" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={16} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-4 leading-relaxed font-mono">
                      Identifies weekly rest patterns. Highly optimized frequency tracking splits.
                    </p>
                  </div>

                </div>

                {/* EDITABLE GOALS TARGET PANEL & PERSONAL RECORDS SECTION */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* EDITABLE FITNESS GOALS CARD (COVERS GOALS REQ) */}
                  <div className="rounded-3xl glass-card p-6 border border-white/10 shadow-xl flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Target className="w-5 h-5 text-indigo-400" />
                          <h3 className="text-base font-display font-bold text-white">Weekly Targets</h3>
                        </div>
                        <button 
                          onClick={handleOpenGoalsModal}
                          className="flex items-center space-x-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Customize Goals</span>
                        </button>
                      </div>

                      <p className="text-xs text-gray-400 leading-relaxed">
                        Metrics compiled from workouts logged this week (starting Monday) against your customizable targets.
                      </p>

                      {/* Goal Bars */}
                      <div className="space-y-4 pt-2">
                        
                        {/* Weekly Workouts Goal */}
                        <div>
                          <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
                            <span>Workouts Target</span>
                            <span className="text-white font-semibold">
                              {thisWeekWorkoutsCount} <span className="text-gray-500">/ {goals.weeklyWorkouts} sessions</span>
                            </span>
                          </div>
                          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden mt-1.5">
                            <div 
                              className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                              style={{ width: `${workoutsProgressPercent}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-mono text-indigo-400 mt-1 block font-bold leading-none">{workoutsProgressPercent}% Completed</span>
                        </div>

                        {/* Weekly Calories Goal */}
                        <div>
                          <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
                            <span>Active Calories Burned Target</span>
                            <span className="text-white font-semibold">
                              {thisWeekCaloriesSum} <span className="text-gray-500">/ {goals.weeklyCalories} kcal</span>
                            </span>
                          </div>
                          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden mt-1.5">
                            <div 
                              className="h-full bg-rose-500 rounded-full transition-all duration-500" 
                              style={{ width: `${caloriesProgressPercent}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-mono text-rose-400 mt-1 block font-bold leading-none">{caloriesProgressPercent}% Completed</span>
                        </div>

                        {/* Weekly Minutes Goal */}
                        <div>
                          <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
                            <span>Total Training Minutes Target</span>
                            <span className="text-white font-semibold">
                              {thisWeekMinutesSum} <span className="text-gray-500">/ {goals.weeklyMinutes} mins</span>
                            </span>
                          </div>
                          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden mt-1.5">
                            <div 
                              className="h-full bg-orange-500 rounded-full transition-all duration-500" 
                              style={{ width: `${minutesProgressPercent}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-mono text-orange-400 mt-1 block font-bold leading-none">{minutesProgressPercent}% Completed</span>
                        </div>

                      </div>
                    </div>
                  </div>

                  {/* PERSONAL RECORDS PANEL (COVERS PERSONAL RECORDS REQ) */}
                  <div className="lg:col-span-2 rounded-3xl glass-card p-6 border border-white/10 shadow-xl">
                    <div className="flex items-center space-x-2 mb-4">
                      <Trophy className="w-5 h-5 text-indigo-400" />
                      <h3 className="text-base font-display font-bold text-white">All-Time Personal Records</h3>
                    </div>

                    {!personalRecords ? (
                      <div className="text-center py-8 text-xs text-gray-500 italic">
                        No workouts logged to calculate achievements. Start logging to establish limits!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        
                        {/* Record 1: Longest Duration */}
                        <div className="p-4 rounded-2xl bg-[#09090c]/40 border border-white/5 flex items-start space-x-3.5">
                          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0 mt-0.5">
                            <Clock className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">Longest Workout Session</span>
                            <span className="text-base font-display font-bold text-white block mt-1">{personalRecords.longest.duration} Minutes</span>
                            <p className="text-[11px] text-indigo-400/80 truncate mt-0.5 max-w-[200px]" title={personalRecords.longest.workout_name}>
                              {personalRecords.longest.workout_name}
                            </p>
                            <span className="text-[10px] text-gray-500 block font-mono mt-0.5">{personalRecords.longest.workout_date}</span>
                          </div>
                        </div>

                        {/* Record 2: Max Calories */}
                        <div className="p-4 rounded-2xl bg-[#09090c]/40 border border-white/5 flex items-start space-x-3.5">
                          <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 flex-shrink-0 mt-0.5">
                            <Flame className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">Highest Calories Burned</span>
                            <span className="text-base font-display font-bold text-white block mt-1">{personalRecords.highestCal.calories_burned} kcal</span>
                            <p className="text-[11px] text-rose-400/80 truncate mt-0.5 max-w-[200px]" title={personalRecords.highestCal.workout_name}>
                              {personalRecords.highestCal.workout_name}
                            </p>
                            <span className="text-[10px] text-gray-500 block font-mono mt-0.5">{personalRecords.highestCal.workout_date}</span>
                          </div>
                        </div>

                        {/* Record 3: Favorite Category */}
                        <div className="p-4 rounded-2xl bg-[#09090c]/40 border border-white/5 flex items-start space-x-3.5">
                          <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 flex-shrink-0 mt-0.5">
                            <Dumbbell className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">Favorite Training Category</span>
                            <span className="text-base font-display font-bold text-teal-400 block mt-1">{personalRecords.favCategory}</span>
                            <p className="text-xs text-white font-medium mt-0.5">
                              Logged <span className="font-mono font-bold">{personalRecords.favCategoryCount}</span> sessions
                            </p>
                            <span className="text-[10px] text-gray-500 block mt-0.5">Primary athletic focus split</span>
                          </div>
                        </div>

                        {/* Record 4: Most Active Week */}
                        <div className="p-4 rounded-2xl bg-[#09090c]/40 border border-white/5 flex items-start space-x-3.5">
                          <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 flex-shrink-0 mt-0.5">
                            <Award className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">Most Active Training Week</span>
                            <span className="text-base font-display font-bold text-white block mt-1">{personalRecords.mostActiveWeek}</span>
                            <p className="text-xs text-orange-400 font-medium mt-0.5">
                              Completed <span className="font-mono font-bold">{personalRecords.mostActiveWeekCount}</span> sessions
                            </p>
                            <span className="text-[10px] text-gray-500 block mt-0.5">Peak weekly hypertrophy volume</span>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>

                </div>

                {/* ACTIVITY TIMELINE LIST TABLE (COVERS TIMELINE REQ) */}
                <div className="rounded-3xl glass-card p-6 border border-white/10 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-base font-display font-bold text-white">Filtered Activity Timeline</h3>
                      <p className="text-xs text-gray-400 mt-1">Listing workouts inside your active range filter selection</p>
                    </div>
                  </div>

                  {filteredWorkouts.length === 0 ? (
                    <div className="p-12 border border-dashed border-white/5 rounded-2xl text-center text-xs text-gray-500 italic">
                      No workouts tracked within this time limit. Adjust filter period above.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 text-gray-400 font-bold uppercase tracking-wider text-[10px] font-mono">
                            <th className="pb-3 pl-4">Workout Name</th>
                            <th className="pb-3">Category</th>
                            <th className="pb-3">Duration</th>
                            <th className="pb-3">Calories</th>
                            <th className="pb-3 pr-4">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                          {filteredWorkouts.slice(0, 10).map((w) => (
                            <tr key={w.id} className="hover:bg-white/[0.01] transition-all text-gray-200">
                              <td className="py-3.5 pl-4 font-semibold text-white max-w-[200px] truncate">{w.workout_name}</td>
                              <td className="py-3.5">
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border text-xs ${
                                  w.category === 'Strength' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                  w.category === 'Cardio' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                  w.category === 'HIIT' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                  w.category === 'Yoga' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' :
                                  w.category === 'Running' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                  'bg-violet-500/10 text-violet-400 border-violet-500/20'
                                }`}>
                                  {w.category}
                                </span>
                              </td>
                              <td className="py-3.5 font-mono">{w.duration} mins</td>
                              <td className="py-3.5 font-mono text-rose-400">{w.calories_burned} kcal</td>
                              <td className="py-3.5 pr-4 font-mono text-gray-400">{w.workout_date}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {filteredWorkouts.length > 10 && (
                        <div className="text-center pt-3 border-t border-white/[0.03] text-[10px] text-gray-500 font-mono">
                          Showing first 10 rows. Total {filteredWorkouts.length} matches inside active range filter.
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>
          </PageTransition>
        </main>
      </div>

      {/* CUSTOMIZE GOALS MODAL */}
      <AnimatePresence>
        {isGoalsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGoalsModalOpen(false)}
              className="absolute inset-0 bg-[#030303]/80 backdrop-blur-sm"
            />

            {/* Modal Container */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm rounded-3xl bg-[#09090c] border border-white/10 p-6 sm:p-8 shadow-2xl shadow-black overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-lg font-display font-bold text-white">Customize Weekly Targets</h3>
                </div>
                <button 
                  onClick={() => setIsGoalsModalOpen(false)}
                  className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveGoals} className="space-y-5 mt-6">
                
                {/* Workouts count Goal */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-widest leading-none">
                    Weekly Workouts (Sessions)
                  </label>
                  <input 
                    type="number"
                    required
                    min="1"
                    value={tempWeeklyWorkouts}
                    onChange={(e) => setTempWeeklyWorkouts(Number(e.target.value))}
                    className="block w-full mt-2.5 px-4 py-3 bg-[#121215]/50 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>

                {/* Calories count Goal */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-widest leading-none">
                    Weekly Calorie Target (kcal)
                  </label>
                  <input 
                    type="number"
                    required
                    min="100"
                    value={tempWeeklyCalories}
                    onChange={(e) => setTempWeeklyCalories(Number(e.target.value))}
                    className="block w-full mt-2.5 px-4 py-3 bg-[#121215]/50 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>

                {/* Minutes count Goal */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-widest leading-none">
                    Weekly Minutes Target
                  </label>
                  <input 
                    type="number"
                    required
                    min="10"
                    value={tempWeeklyMinutes}
                    onChange={(e) => setTempWeeklyMinutes(Number(e.target.value))}
                    className="block w-full mt-2.5 px-4 py-3 bg-[#121215]/50 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>

                {/* Actions bottom */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/5">
                  <button 
                    type="button"
                    onClick={() => setIsGoalsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/10 cursor-pointer"
                  >
                    Save Targets
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
