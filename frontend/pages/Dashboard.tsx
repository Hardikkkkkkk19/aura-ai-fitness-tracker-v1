import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { workoutsService, Workout } from '../services/workoutsService';
import { 
  Sparkles, 
  Dumbbell, 
  Flame, 
  Zap, 
  TrendingUp, 
  Activity, 
  Calendar,
  Clock,
  ArrowRight,
  Trophy,
  Timer
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { PageTransition } from '../components/PageTransition';
import { AnimatedCounter } from '../components/AnimatedCounter';

const MOTIVATIONAL_QUOTES = [
  "The only bad workout is the one that didn't happen. Consistency wins.",
  "Progressive overload is not just about weight; it is about absolute intent and muscle tension.",
  "Consistency beats intensity every single time. Show up for your goals.",
  "Your body can stand almost anything. It's your mind that you have to convince.",
  "Success isn't always about greatness. It's about daily committed consistency.",
  "Energy flows where focus goes. Power up your athletic progression.",
  "The pain you feel today will be the strength you feel tomorrow."
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15
    }
  }
};

export const Dashboard: React.FC = () => {
  const { user, isMockMode } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [quoteIndex, setQuoteIndex] = useState(0);

  const fullName = user?.user_metadata?.full_name || 'Athlete';

  // Rotate motivational quote daily or randomly on load
  useEffect(() => {
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86400000);
    setQuoteIndex(dayOfYear % MOTIVATIONAL_QUOTES.length);
  }, []);

  // Fetch real workouts for this user
  useEffect(() => {
    let active = true;
    const fetchWorkouts = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const data = await workoutsService.getWorkouts(user.id);
        if (active) {
          setWorkouts(data);
        }
      } catch (err) {
        console.error('Error fetching dashboard workouts:', err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchWorkouts();
    return () => { active = false; };
  }, [user?.id]);

  // Calculations
  const totalWorkouts = workouts.length;
  const totalCalories = workouts.reduce((acc, curr) => acc + (curr.calories_burned || 0), 0);
  const averageDuration = totalWorkouts > 0 
    ? Math.round(workouts.reduce((acc, curr) => acc + (curr.duration || 0), 0) / totalWorkouts) 
    : 0;

  // Active Days Calculation (unique dates)
  const uniqueDates = Array.from(new Set(workouts.map(w => w.workout_date)));
  const activeDays = uniqueDates.length;

  // Calculate Streak
  const calculateStreak = (workoutList: Workout[]) => {
    if (workoutList.length === 0) return 0;
    
    const datesSet = new Set(workoutList.map(w => w.workout_date));
    const sortedDates = Array.from(datesSet).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

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
  };

  const currentStreak = calculateStreak(workouts);

  // This Week's Workouts (past 7 days)
  const getWorkoutsThisWeekCount = () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return workouts.filter(w => new Date(w.workout_date) >= sevenDaysAgo).length;
  };
  const workoutsThisWeek = getWorkoutsThisWeekCount();

  // Active volume past 7 days calculation for custom visual SVG chart
  const getWeeklyChartData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = days[d.getDay()];

      const dayWorkouts = workouts.filter(w => w.workout_date === dateStr);
      const activeMinutes = dayWorkouts.reduce((acc, curr) => acc + (curr.duration || 0), 0);
      
      // Calculate a relative volume percentage up to 90 minutes
      const volumePercent = Math.min(100, Math.round((activeMinutes / 90) * 100));

      result.push({
        day: dayLabel,
        minutes: activeMinutes,
        volume: volumePercent,
        target: 60 // standard 60-min target line
      });
    }
    return result;
  };

  const chartData = getWeeklyChartData();
  const recentWorkouts = workouts.slice(0, 4);

  // Custom current formatted date
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header bar */}
      <header className="fixed top-0 left-0 right-0 h-16 glass-panel border-b border-white/5 z-30 flex items-center justify-between px-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 p-[1px]">
            <div className="w-full h-full rounded-lg bg-[#050505] flex items-center justify-center">
              <Activity className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <span className="font-display font-bold tracking-wide text-sm">AURA ATHLETICS</span>
        </div>
        
        <div className="flex items-center space-x-4">
          {isMockMode && (
            <span className="text-[10px] uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-400/20 px-2.5 py-1 rounded-full font-bold">
              Sandbox Mode
            </span>
          )}
          <span className="text-xs text-gray-400 flex items-center space-x-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>{formattedDate}</span>
          </span>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex pt-16">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

        <main className={`flex-1 min-h-[calc(100vh-4rem)] p-6 sm:p-10 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-72'}`}>
          <PageTransition>
          
          {/* Welcome greeting header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-400">ATHLETIC OS</span>
              <h1 className="text-3xl font-display font-bold tracking-tight text-white mt-1">
                Welcome back, {fullName}
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Let's achieve athletic excellence. Track training metrics, calorie targets, and optimize progression splits.
              </p>
            </div>

            {/* Streak card banner with animated gradient border glow */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="flex items-center space-x-3 bg-gradient-to-r from-indigo-500/10 via-purple-500/15 to-indigo-500/10 bg-[length:200%_200%] animate-border-glow-flow border border-indigo-500/30 px-5 py-3 rounded-2xl shadow-xl shadow-black/20">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Zap className={`w-5 h-5 ${currentStreak > 0 ? 'animate-bounce text-orange-400' : ''}`} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider leading-none">Aura Streak</p>
                  <p className="text-sm font-display font-extrabold text-white mt-1">
                    <AnimatedCounter value={currentStreak} /> {currentStreak === 1 ? 'Day' : 'Days'} Active
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Loading Skeleton States */}
          {loading ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse" />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 h-96 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse" />
                <div className="h-96 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse" />
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* Stats Cards Row with stagger reveal animations */}
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                
                {/* Total Workouts */}
                <motion.div 
                  variants={cardVariants}
                  className="rounded-2xl glass-panel p-5 border border-white/5 relative group hover:border-indigo-500/30 transition-all shadow-lg shadow-black/20"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400">Total Sessions</span>
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 hover-rotate-icon">
                      <Dumbbell className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline justify-between">
                    <span className="text-2xl font-display font-bold text-white">
                      <AnimatedCounter value={totalWorkouts} />
                    </span>
                    <span className="text-xs text-gray-400">Completed All-Time</span>
                  </div>
                  <div className="mt-4">
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (totalWorkouts / 20) * 100)}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full bg-indigo-500 rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Calories Burned */}
                <motion.div 
                  variants={cardVariants}
                  className="rounded-2xl glass-panel p-5 border border-white/5 relative group hover:border-purple-500/30 transition-all shadow-lg shadow-black/20"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400">Active Calories</span>
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 hover-rotate-icon">
                      <Flame className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline justify-between">
                    <span className="text-2xl font-display font-bold text-white">
                      <AnimatedCounter value={totalCalories} /> <span className="text-sm font-sans font-medium text-gray-400">kcal</span>
                    </span>
                    <span className="text-xs text-gray-400">Burned Total</span>
                  </div>
                  <div className="mt-4">
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (totalCalories / 10000) * 100)}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full bg-purple-500 rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Active Days */}
                <motion.div 
                  variants={cardVariants}
                  className="rounded-2xl glass-panel p-5 border border-white/5 relative group hover:border-indigo-500/30 transition-all shadow-lg shadow-black/20"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400">Active Days</span>
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 hover-rotate-icon">
                      <Calendar className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline justify-between">
                    <span className="text-2xl font-display font-bold text-white">
                      <AnimatedCounter value={activeDays} />
                    </span>
                    <span className="text-xs text-gray-400">Unique Days Logged</span>
                  </div>
                  <div className="mt-4">
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (activeDays / 12) * 100)}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full bg-indigo-500 rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Average Duration */}
                <motion.div 
                  variants={cardVariants}
                  className="rounded-2xl glass-panel p-5 border border-white/5 relative group hover:border-sky-500/30 transition-all shadow-lg shadow-black/20"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400">Avg Session Duration</span>
                    <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 hover-rotate-icon">
                      <Timer className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline justify-between">
                    <span className="text-2xl font-display font-bold text-white">
                      <AnimatedCounter value={averageDuration} /> <span className="text-sm font-sans font-medium text-gray-400">mins</span>
                    </span>
                    <span className="text-xs text-gray-400">Per Session</span>
                  </div>
                  <div className="mt-4">
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (averageDuration / 90) * 100)}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full bg-sky-500 rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>

              </motion.div>

              {/* Core Layout split: Charts & Activity / Coaching */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Section (2 Cols): Chart and Workout Logs list */}
                <div className="lg:col-span-2 space-y-8">
                  
                  {/* Dynamic activity progression chart */}
                  <div className="rounded-2xl glass-card p-6 border border-white/10 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-base font-display font-bold text-white">Weekly Athletic Volume</h3>
                        <p className="text-xs text-gray-400 mt-1">Real training duration in minutes across the past 7 days</p>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-gray-400 font-mono">
                        <span className="flex items-center space-x-1.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-500" />
                          <span>Active Minutes</span>
                        </span>
                        <span className="flex items-center space-x-1.5">
                          <span className="w-2.5 h-[2px] bg-purple-500/60 inline-block" />
                          <span>Target (60m)</span>
                        </span>
                      </div>
                    </div>

                    {/* SVG Chart columns representing real minutes */}
                    <div className="h-64 w-full relative flex items-end justify-between px-2 pt-4 border-b border-white/5">
                      <div className="absolute inset-x-0 top-1/4 border-t border-white/[0.02] border-dashed" />
                      <div className="absolute inset-x-0 top-1/2 border-t border-white/[0.02] border-dashed" />
                      <div className="absolute inset-x-0 top-3/4 border-t border-white/[0.02] border-dashed" />

                      {chartData.map((d) => (
                        <div key={d.day} className="flex flex-col items-center flex-1 space-y-2 group">
                          <div className="h-44 w-full flex items-end justify-center space-x-1 relative">
                            {/* Hover tooltip */}
                            <div className="absolute -top-10 hidden group-hover:flex flex-col bg-zinc-950 border border-white/10 text-[10px] px-2.5 py-1 rounded-lg text-white font-mono z-20 text-center shadow-xl">
                              <span className="text-indigo-400 font-bold">{d.minutes} mins</span>
                            </div>

                            {/* Target boundary line */}
                            <div className="absolute left-1/2 right-1/2 h-[1px] bg-purple-500/50 z-10" style={{ bottom: `${d.target}%` }} />
                            
                            {/* Animated volumetric active bar */}
                            <motion.div 
                              className="w-4 sm:w-6 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg group-hover:from-indigo-400 group-hover:to-purple-400 shadow-md shadow-indigo-500/5"
                              initial={{ height: 0 }}
                              animate={{ height: d.volume > 0 ? `${d.volume}%` : '4px' }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              style={{ opacity: d.volume > 0 ? 1 : 0.1 }}
                            />
                          </div>
                          <span className="text-[11px] font-mono text-gray-500">{d.day}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent workout checklist */}
                  <div className="rounded-2xl glass-panel p-6 border border-white/5">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="text-base font-display font-bold text-white">Recent Workouts</h3>
                        <p className="text-xs text-gray-400 mt-1">This Week's Completed Activity: <span className="text-indigo-400 font-bold">{workoutsThisWeek} logged</span></p>
                      </div>
                      <Link 
                        to="/workouts" 
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-colors flex items-center space-x-1 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/10 px-3.5 py-2 rounded-xl"
                      >
                        <span>Open Training Sheets</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    {recentWorkouts.length === 0 ? (
                      <div className="p-8 text-center border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center space-y-3">
                        <div className="w-12 h-12 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-gray-400">
                          <Dumbbell className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">No workouts recorded yet</p>
                          <p className="text-xs text-gray-400 mt-0.5">Start logging your athletic workouts in the active sheet.</p>
                        </div>
                        <Link to="/workouts" className="text-xs font-bold text-indigo-400 hover:underline">
                          Log Your First Workout
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3.5">
                        {recentWorkouts.map((w) => (
                          <div 
                            key={w.id} 
                            className="flex items-center justify-between p-4 rounded-2xl bg-[#09090c]/40 border border-white/5 hover:border-white/10 hover:bg-[#0d0d12]/40 transition-all shadow-sm"
                          >
                            <div className="flex items-center space-x-4 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                                <Dumbbell className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-white truncate">{w.workout_name}</p>
                                <div className="flex items-center space-x-2 mt-0.5">
                                  <span className="text-[10px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                                    {w.category}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {w.workout_date}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-display font-extrabold text-white">{w.calories_burned} kcal</p>
                              <p className="text-xs text-gray-400 font-mono mt-0.5">{w.duration} mins</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

                {/* Right Section (1 Col): AI Coach recommendation & Motivation quote */}
                <div className="space-y-8">
                  
                  {/* Smart coaching advice panel */}
                  <div className="rounded-2xl bg-gradient-to-tr from-indigo-600/15 via-purple-500/5 to-transparent border border-indigo-500/20 p-6 relative overflow-hidden shadow-xl">
                    <div className="absolute top-3 right-3">
                      <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                    </div>
                    
                    <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-extrabold flex items-center space-x-1">
                      <span>Gemini-Grounded Coach</span>
                    </span>
                    <h4 className="text-lg font-display font-bold text-white mt-2">Active Progression Strategy</h4>
                    
                    <p className="text-xs text-gray-300 mt-3.5 leading-relaxed">
                      {workouts.length === 0 ? (
                        "Awaiting initial training metrics log. Once you log workouts, the AI Coach will analyze hypertrophic loads, calories burned, and active days targets for personalization."
                      ) : (
                        `Based on your ${totalWorkouts} logged sessions, your average session volume is ${averageDuration} minutes. Focus on progressive overload by increasing sets/reps or maintaining target calorie burns of ${Math.round(totalCalories/totalWorkouts)} kcal per session.`
                      )}
                    </p>

                    <div className="mt-6 border-t border-white/5 pt-4 flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Dynamic Live Analysis</span>
                      </div>
                      <Link to="/coach" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center space-x-1">
                        <span>Consult Coach</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>

                  {/* Dynamic Motivational Quote banner */}
                  <div className="rounded-2xl glass-panel p-6 border border-white/5 shadow-lg relative overflow-hidden group">
                    <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-colors"></div>
                    <div className="flex items-center space-x-2">
                      <Trophy className="w-4 h-4 text-indigo-400" />
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Daily Athletic Directive</h4>
                    </div>
                    <p className="text-base font-display font-semibold text-white mt-3.5 leading-relaxed italic">
                      "{MOTIVATIONAL_QUOTES[quoteIndex]}"
                    </p>
                    <p className="text-[10px] text-gray-500 mt-4 font-mono tracking-widest uppercase">— AURA ATHLETIC OS</p>
                  </div>

                </div>

              </div>

            </div>
          )}

          </PageTransition>
        </main>
      </div>
    </div>
  );
};
