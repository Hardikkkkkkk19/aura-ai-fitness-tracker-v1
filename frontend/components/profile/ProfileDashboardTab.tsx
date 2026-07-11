import React from 'react';
import { motion } from 'motion/react';
import { 
  Flame, Award, Dumbbell, Sparkles, Target, Calendar, 
  Heart, Scale, Shield, CheckCircle2, TrendingUp, Compass 
} from 'lucide-react';
import { UserProfile, ProfileDashboardStats, PhysicalStats, EditableGoal } from '../../services/ProfileService';

interface ProfileDashboardTabProps {
  profile: UserProfile;
  stats: ProfileDashboardStats;
  physicalStats: PhysicalStats;
  goals: EditableGoal[];
  completion: number;
  onNavigateToTab: (tab: string) => void;
}

export const ProfileDashboardTab: React.FC<ProfileDashboardTabProps> = ({
  profile,
  stats,
  physicalStats,
  goals,
  completion,
  onNavigateToTab
}) => {
  // Circular progress SVG generator helper
  const renderCircularProgress = (current: number, target: number, color: string) => {
    const radius = 34;
    const circumference = 2 * Math.PI * radius;
    const percentage = Math.min(100, Math.max(0, (current / target) * 100));
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    let strokeColor = "stroke-indigo-500";
    if (color === "rose") strokeColor = "stroke-rose-500";
    else if (color === "amber") strokeColor = "stroke-amber-500";
    else if (color === "cyan") strokeColor = "stroke-cyan-500";
    else if (color === "violet") strokeColor = "stroke-violet-500";
    else if (color === "emerald") strokeColor = "stroke-emerald-500";

    return (
      <div className="relative w-20 h-20 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r={radius}
            className="stroke-white/5 fill-none"
            strokeWidth="5"
          />
          <motion.circle
            cx="40"
            cy="40"
            r={radius}
            className={`fill-none ${strokeColor}`}
            strokeWidth="5"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-[10px] font-mono font-bold text-white">
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Profile Completion Card */}
      <div className="rounded-3xl glass-card p-6 border border-white/10 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-indigo-400 uppercase">AURA METRIC SYNCHRONIZATION</span>
            <h3 className="text-xl font-display font-extrabold text-white">Athlete Profile Completion</h3>
            <p className="text-xs text-gray-400 max-w-xl">
              Complete your bio-coefficients to unlock granular caloric targeting, specialized AI suggestions, and high-fidelity energy estimations.
            </p>
          </div>
          <div className="flex items-center space-x-4 min-w-[200px]">
            <div className="flex-1 space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-gray-400">
                <span>Completed</span>
                <span className="text-indigo-400">{completion}%</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${completion}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
            {completion < 100 && (
              <button
                onClick={() => onNavigateToTab('profile')}
                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Complete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Dashboard Cards Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider font-mono">Profile Dashboard</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Streak */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4 flex flex-col justify-between hover:border-indigo-500/20 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">Current Streak</span>
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <div className="mt-4">
              <span className="text-2xl font-display font-black text-white">{stats.currentStreak}d</span>
              <span className="block text-[9px] text-gray-500 font-mono mt-0.5">Consecutive Training</span>
            </div>
          </div>

          {/* Card 2: Workout Level */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4 flex flex-col justify-between hover:border-indigo-500/20 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">Workout Level</span>
              <Award className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-4">
              <span className="text-sm font-display font-black text-white truncate block">{stats.workoutLevel}</span>
              <span className="block text-[9px] text-gray-500 font-mono mt-0.5">Aura OS Coefficient</span>
            </div>
          </div>

          {/* Card 3: Total Workouts */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4 flex flex-col justify-between hover:border-indigo-500/20 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">Total Workouts</span>
              <Dumbbell className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-4">
              <span className="text-2xl font-display font-black text-white">{stats.totalWorkouts}</span>
              <span className="block text-[9px] text-gray-500 font-mono mt-0.5">Active Logs Saved</span>
            </div>
          </div>

          {/* Card 4: Calories Burned */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4 flex flex-col justify-between hover:border-indigo-500/20 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">Active Energy</span>
              <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
            </div>
            <div className="mt-4">
              <span className="text-2xl font-display font-black text-white">{stats.totalCaloriesBurned} kcal</span>
              <span className="block text-[9px] text-gray-500 font-mono mt-0.5">Accumulated Burn</span>
            </div>
          </div>

          {/* Card 5: Favorite Workout */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4 flex flex-col justify-between hover:border-indigo-500/20 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">Favorite Split</span>
              <Heart className="w-4 h-4 text-pink-500" />
            </div>
            <div className="mt-4">
              <span className="text-xs font-display font-black text-white truncate block">{stats.favoriteWorkout}</span>
              <span className="block text-[9px] text-gray-500 font-mono mt-0.5">Primary Focus</span>
            </div>
          </div>

          {/* Card 6: Achievements */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4 flex flex-col justify-between hover:border-indigo-500/20 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">Achievements</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-4">
              <span className="text-2xl font-display font-black text-white">{stats.achievementsCount.unlocked}/{stats.achievementsCount.total}</span>
              <span className="block text-[9px] text-gray-500 font-mono mt-0.5">Premium Badges Earned</span>
            </div>
          </div>

          {/* Card 7: Goal Progress */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4 flex flex-col justify-between hover:border-indigo-500/20 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">Weekly Goals</span>
              <Target className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-4">
              <span className="text-2xl font-display font-black text-white">{stats.currentGoalProgress}%</span>
              <span className="block text-[9px] text-gray-500 font-mono mt-0.5">Average Goal Indices</span>
            </div>
          </div>

          {/* Card 8: Membership Since */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4 flex flex-col justify-between hover:border-indigo-500/20 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">Athlete Since</span>
              <Calendar className="w-4 h-4 text-violet-400" />
            </div>
            <div className="mt-4">
              <span className="text-sm font-display font-black text-white block">{stats.membershipSince}</span>
              <span className="block text-[9px] text-gray-500 font-mono mt-0.5">Premium Registration</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom split: Detailed Stats and Circular Goals Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Statistics Column */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider font-mono">Aura Analytics Summary</h3>
          
          <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6 space-y-5">
            {/* BMI Display */}
            <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">Body Mass Index (BMI)</span>
                <span className="block text-xs text-indigo-400 font-bold">{physicalStats.bmiCategory}</span>
              </div>
              <div className="text-right">
                <span className="text-xl font-display font-black text-white">{physicalStats.bmi}</span>
                <span className="block text-[8px] text-gray-500 font-mono">kg/m²</span>
              </div>
            </div>

            {/* Healthy weight range */}
            <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">Healthy Weight Range</span>
                <span className="block text-[10px] text-gray-500 font-mono">Derived standard for {profile.height}cm</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-emerald-400">{physicalStats.healthyWeightRange}</span>
              </div>
            </div>

            {/* Workout Consistency */}
            <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">Workout Consistency</span>
                <span className="block text-[10px] text-gray-500 font-mono">Adaptive log habit index</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-mono font-bold text-white">{physicalStats.workoutConsistency}%</span>
              </div>
            </div>

            {/* Completion Rates */}
            <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">Target Completion Rate</span>
                <span className="block text-[10px] text-gray-500 font-mono">Weekly vs Monthly index</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-white">W: {physicalStats.weeklyCompletionRate}% | M: {physicalStats.monthlyCompletionRate}%</span>
              </div>
            </div>

            {/* Fitness Score */}
            <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">Aura Fitness Score</span>
                <span className="block text-[10px] text-gray-500 font-mono">Aggregate physical capacity estimate</span>
              </div>
              <div className="text-right flex items-center space-x-1 justify-end">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-sm font-mono font-extrabold text-emerald-400">{physicalStats.fitnessScore}/100</span>
              </div>
            </div>

            {/* Training Age */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">Athletic Training Age</span>
                <span className="block text-[10px] text-gray-500 font-mono">Based on logged consistency metrics</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-indigo-400">{physicalStats.trainingAge}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Circular Goals Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider font-mono">Personalized Targets</h3>
            <button
              onClick={() => onNavigateToTab('profile')}
              className="text-[10px] font-mono font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider cursor-pointer"
            >
              Adjust Goals
            </button>
          </div>

          <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {goals.map((goal) => (
                <div key={goal.id} className="flex flex-col items-center text-center p-3 rounded-xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-colors">
                  {renderCircularProgress(goal.current, goal.target, goal.colorClass)}
                  <span className="text-[10px] font-mono font-bold text-gray-400 uppercase mt-3 tracking-wider line-clamp-1">{goal.title}</span>
                  <span className="text-xs font-bold text-white mt-1">
                    {goal.current}/{goal.target} <span className="text-[9px] text-gray-500 font-mono">{goal.unit}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
