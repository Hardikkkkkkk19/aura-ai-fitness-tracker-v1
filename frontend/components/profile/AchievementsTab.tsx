import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, Lock, Unlock, Sparkles, Flame, Dumbbell, 
  Sun, Moon, Camera, Cpu, Award, Zap, Crown, ShieldAlert 
} from 'lucide-react';
import { AchievementItem } from '../../services/ProfileService';

interface AchievementsTabProps {
  achievements: AchievementItem[];
}

export const AchievementsTab: React.FC<AchievementsTabProps> = ({ achievements }) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'training' | 'nutrition' | 'consistency' | 'ai'>('all');

  const filteredAchievements = achievements.filter(ach => 
    activeCategory === 'all' ? true : ach.category === activeCategory
  );

  const totalCount = achievements.length;
  const unlockedCount = achievements.filter(a => !a.isLocked).length;
  const completionPercentage = Math.round((unlockedCount / totalCount) * 100);

  // Map icon names to lucide components
  const getIcon = (iconName: string, isLocked: boolean) => {
    const sizeClass = "w-7 h-7";
    const colorClass = isLocked ? "text-gray-600" : "text-amber-400";

    switch (iconName) {
      case 'Dumbbell': return <Dumbbell className={`${sizeClass} ${colorClass}`} />;
      case 'Flame': return <Flame className={`${sizeClass} ${colorClass}`} />;
      case 'Zap': return <Zap className={`${sizeClass} ${colorClass}`} />;
      case 'Crown': return <Crown className={`${sizeClass} ${colorClass}`} />;
      case 'Sparkles': return <Sparkles className={`${sizeClass} ${colorClass}`} />;
      case 'Sun': return <Sun className={`${sizeClass} ${colorClass}`} />;
      case 'Moon': return <Moon className={`${sizeClass} ${colorClass}`} />;
      case 'Trophy': return <Trophy className={`${sizeClass} ${colorClass}`} />;
      case 'Camera': return <Camera className={`${sizeClass} ${colorClass}`} />;
      case 'Cpu': return <Cpu className={`${sizeClass} ${colorClass}`} />;
      case 'ShieldAlert': return <ShieldAlert className={`${sizeClass} ${colorClass}`} />;
      default: return <Award className={`${sizeClass} ${colorClass}`} />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Dynamic Summary Cards */}
      <div className="rounded-3xl glass-card p-6 border border-white/10 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono font-bold tracking-widest text-amber-400 uppercase flex items-center space-x-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>AURA ACCOMPLISHMENTS CORE</span>
            </span>
            <h3 className="text-xl font-display font-extrabold text-white">Shredded Training Barriers</h3>
            <p className="text-xs text-gray-400 max-w-xl">
              Lock into physical objectives. Complete logs, scan diets, and consultation bots to unlock high-contrast accolades.
            </p>
          </div>

          <div className="flex items-center space-x-5 min-w-[200px]">
            <div className="text-center bg-white/[0.02] border border-white/5 rounded-2xl px-4 py-3 min-w-[80px]">
              <span className="block text-2xl font-display font-black text-white">{unlockedCount}</span>
              <span className="block text-[8px] text-gray-500 font-mono uppercase mt-0.5">Unlocked</span>
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-gray-400 font-mono">
                <span>Shred Rate</span>
                <span className="text-amber-400">{completionPercentage}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2.5 border-b border-white/5 pb-4">
        {[
          { key: 'all', label: 'All Badges' },
          { key: 'training', label: 'Training Splits' },
          { key: 'consistency', label: 'Consistency Streaks' },
          { key: 'nutrition', label: 'Diet & Plates' },
          { key: 'ai', label: 'Aura Intelligence' }
        ].map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeCategory === cat.key 
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400' 
                : 'bg-white/[0.01] border border-transparent text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Badges Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAchievements.map((ach) => {
          const ratio = Math.min(1, ach.progress / ach.target);
          const percent = Math.round(ratio * 100);

          return (
            <div 
              key={ach.id}
              className={`rounded-2xl p-5 border flex flex-col justify-between space-y-5 relative overflow-hidden group transition-all duration-300 ${
                ach.isLocked 
                  ? 'bg-white/[0.01] border-white/5 opacity-60 hover:opacity-85' 
                  : 'bg-[#18181b]/30 border-amber-500/20 shadow-lg shadow-amber-500/[0.01] hover:border-amber-500/40 hover:bg-[#18181b]/50'
              }`}
            >
              {/* Unlock glow layer */}
              {!ach.isLocked && (
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/[0.03] group-hover:bg-amber-500/[0.06] rounded-full blur-2xl transition-colors" />
              )}

              {/* Badge upper block */}
              <div className="flex items-start justify-between">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${
                  ach.isLocked 
                    ? 'bg-white/[0.02] border-white/5 shadow-inner' 
                    : 'bg-gradient-to-tr from-amber-500/10 to-yellow-500/5 border-amber-500/20 group-hover:scale-105 shadow-md shadow-amber-500/5'
                }`}>
                  {getIcon(ach.iconName, ach.isLocked)}
                </div>

                <div className="flex items-center space-x-1.5">
                  <span className={`text-[8px] font-mono font-black uppercase px-2.5 py-1 rounded-full border ${
                    ach.isLocked 
                      ? 'bg-zinc-900 text-gray-500 border-white/5' 
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/10'
                  }`}>
                    {ach.category}
                  </span>
                  {ach.isLocked ? (
                    <Lock className="w-3.5 h-3.5 text-gray-600" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5 text-amber-400" />
                  )}
                </div>
              </div>

              {/* Descriptions */}
              <div className="space-y-1">
                <h4 className="text-xs font-display font-extrabold text-white group-hover:text-amber-300 transition-colors">{ach.title}</h4>
                <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2">{ach.description}</p>
              </div>

              {/* Progress metrics */}
              <div className="space-y-1.5 pt-2 border-t border-white/[0.03]">
                <div className="flex justify-between text-[10px] font-mono text-gray-500 font-semibold">
                  <span>{ach.isLocked ? 'In Progress' : 'Shattered!'}</span>
                  <span>{ach.progress}/{ach.target} <span className="text-[9px] text-gray-600 font-mono">{ach.unit}</span></span>
                </div>
                
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className={`h-full rounded-full ${
                      ach.isLocked 
                        ? 'bg-gray-600' 
                        : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>

                {ach.unlockedAt && (
                  <span className="block text-[8px] text-gray-500 font-mono mt-1 text-right">
                    UNLOCKED ON {ach.unlockedAt.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
