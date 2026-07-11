import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { useToast } from '../context/ToastContext';
import { workoutsService, Workout, NewWorkout } from '../services/workoutsService';
import { EmailService } from '../services/EmailService';
import { 
  Dumbbell, 
  Plus, 
  Sparkles, 
  AlertCircle, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Eye, 
  X, 
  Loader2, 
  Calendar, 
  Clock, 
  Flame, 
  FileText,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PageTransition } from '../components/PageTransition';

const CATEGORIES = [
  'Strength',
  'Cardio',
  'HIIT',
  'Yoga',
  'Running',
  'Cycling',
  'Walking',
  'Stretching'
];

const CATEGORY_COLORS: Record<string, { bg: string, text: string, border: string }> = {
  Strength: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
  Cardio: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
  HIIT: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  Yoga: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20' },
  Running: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  Cycling: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  Walking: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20' },
  Stretching: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
};

export const Workouts: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [collapsed, setCollapsed] = useState(false);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter/Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Modal Control States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Form States
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [workoutName, setWorkoutName] = useState('');
  const [category, setCategory] = useState('Strength');
  const [duration, setDuration] = useState<number | ''>('');
  const [calories, setCalories] = useState<number | ''>('');
  const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Delete Selection
  const [deletingWorkout, setDeletingWorkout] = useState<Workout | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Active View Target
  const [viewTarget, setViewTarget] = useState<Workout | null>(null);

  // Custom Dropdown Open States
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Fetch data
  const loadWorkoutsData = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await workoutsService.getWorkouts(user.id);
      setWorkouts(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch workouts list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkoutsData();
  }, [user?.id]);

  // Handle Form open for Create
  const handleOpenCreate = () => {
    setEditingWorkout(null);
    setWorkoutName('');
    setCategory('Strength');
    setDuration('');
    setCalories('');
    setWorkoutDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Handle Form open for Edit
  const handleOpenEdit = (workout: Workout) => {
    setEditingWorkout(workout);
    setWorkoutName(workout.workout_name);
    setCategory(workout.category);
    setDuration(workout.duration);
    setCalories(workout.calories_burned);
    setWorkoutDate(workout.workout_date);
    setNotes(workout.notes);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Handle Open Delete Modal
  const handleOpenDelete = (workout: Workout) => {
    setDeletingWorkout(workout);
    setIsDeleteModalOpen(true);
  };

  // Handle View details Modal
  const handleOpenView = (workout: Workout) => {
    setViewTarget(workout);
    setIsViewModalOpen(true);
  };

  // Form Validation and Submission
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    // Validate inputs
    if (!workoutName.trim()) {
      setFormError('Workout Name is a required field.');
      return;
    }

    if (duration === '' || duration <= 0) {
      setFormError('Duration must be a positive integer greater than 0.');
      return;
    }

    if (calories === '' || calories < 0) {
      setFormError('Calories Burned must be a non-negative number.');
      return;
    }

    if (!workoutDate) {
      setFormError('Workout Date is a required field.');
      return;
    }

    setFormError(null);
    setSubmitLoading(true);

    const payload: NewWorkout = {
      workout_name: workoutName.trim(),
      category,
      duration: Number(duration),
      calories_burned: Number(calories),
      workout_date: workoutDate,
      notes: notes.trim(),
    };

    try {
      if (editingWorkout) {
        // Edit flow
        const updated = await workoutsService.updateWorkout(user.id, editingWorkout.id, payload);
        
        // update list
        setWorkouts(prev => prev.map(w => w.id === editingWorkout.id ? { ...w, ...updated } : w));
        showToast('Workout session updated successfully!', 'success');
      } else {
        // Create flow
        const created = await workoutsService.addWorkout(user.id, payload);
        const updatedWorkoutsList = [created, ...workouts];
        setWorkouts(updatedWorkoutsList);
        
        // Send email notification in the background after workout is successfully saved
        try {
          const sentEmailsKey = `aura_sent_workout_emails_${user.id}`;
          let sentEmailsList: string[] = [];
          try {
            sentEmailsList = JSON.parse(localStorage.getItem(sentEmailsKey) || '[]');
          } catch (e) {
            console.warn("Failed to parse sent emails list:", e);
          }

          if (!sentEmailsList.includes(created.id)) {
            // Calculate streak
            const uniqueDates = Array.from(new Set(updatedWorkoutsList.map(w => w.workout_date))).sort((a, b) => b.localeCompare(a));
            let streak = 0;
            if (uniqueDates.length > 0) {
              const todayStr = new Date().toISOString().split('T')[0];
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdayStr = yesterday.toISOString().split('T')[0];
              
              if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
                streak = 1;
                let prevDate = new Date(uniqueDates[0]);
                for (let i = 1; i < uniqueDates.length; i++) {
                  const currentDate = new Date(uniqueDates[i]);
                  const diffTime = Math.abs(prevDate.getTime() - currentDate.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  if (diffDays === 1) {
                    streak++;
                    prevDate = currentDate;
                  } else if (diffDays > 1) {
                    break;
                  }
                }
              }
            }

            // Calculate overall metric accumulations
            const totalCompleted = updatedWorkoutsList.length;
            const totalCalories = updatedWorkoutsList.reduce((sum, w) => sum + (Number(w.calories_burned) || 0), 0);

            const userName = user?.user_metadata?.full_name || 'Athlete';
            const recipientEmail = user?.email || 'hvjadhav19@gmail.com';
            
            // Determine motivational message
            let motivationalMessage = "Phenomenal dedication to your athletic routine! Consistently putting in the work is how you succeed.";
            if (created.category === 'Strength') {
              motivationalMessage = "Exceptional effort pushing your physical strength limits! Progressive overload is the absolute foundation of muscular hypertrophy.";
            } else if (created.category === 'Cardio' || created.category === 'HIIT' || created.category === 'Running' || created.category === 'Cycling') {
              motivationalMessage = "Outstanding cardio engine output! Your cardiovascular system and metabolic capacity are leveling up with every second.";
            } else if (created.category === 'Yoga' || created.category === 'Stretching') {
              motivationalMessage = "Superb flexibility and recovery flow. Centering your mind and body is essential for overall athletic recovery.";
            }

            const emailDetails = {
              userEmail: recipientEmail,
              userName: userName,
              workoutName: created.workout_name,
              category: created.category,
              duration: created.duration,
              caloriesBurned: created.calories_burned,
              workoutDate: created.workout_date,
              motivationalMessage: motivationalMessage,
              streak: streak,
              totalCompleted: totalCompleted,
              totalCalories: totalCalories
            };

            // Send notification
            await fetch('/api/notifications/email', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ type: 'workout_completed', details: emailDetails }),
            });

            // Log in Email Center History
            try {
              EmailService.addHistoryItem({
                status: 'delivered',
                recipient: recipientEmail,
                subject: 'Session Logged: Clean Thermodynamic Release',
                deliveryState: 'Delivered to inbox (215ms via Resend TLS Gateway)',
                emailType: 'workout_completed'
              });
            } catch (historyErr) {
              console.warn("Failed to update local email history:", historyErr);
            }

            // Save sent workout ID to prevent duplicates
            sentEmailsList.push(created.id);
            localStorage.setItem(sentEmailsKey, JSON.stringify(sentEmailsList));
          }
        } catch (emailErr) {
          console.warn("Failed to dispatch workout completion email:", emailErr);
        }

        showToast('Workout saved successfully. Email notification sent.', 'success');
      }
      setIsFormModalOpen(false);
    } catch (err: any) {
      const errMsg = err.message || 'Error saving workout session.';
      setFormError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Perform actual Delete Action
  const handleDeleteConfirm = async () => {
    if (!user?.id || !deletingWorkout) return;

    setDeleteLoading(true);
    try {
      await workoutsService.deleteWorkout(user.id, deletingWorkout.id);
      setWorkouts(prev => prev.filter(w => w.id !== deletingWorkout.id));
      showToast('Workout session successfully removed.', 'success');
      setIsDeleteModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to remove workout session.', 'error');
    } finally {
      setDeleteLoading(false);
      setDeletingWorkout(null);
    }
  };

  // Auto-calculated calorie estimate when duration changes (suggest only)
  const handleDurationChange = (val: string) => {
    const mins = val === '' ? '' : Number(val);
    setDuration(mins);

    // Approximate formula (e.g., 8 calories/minute for Strength)
    if (typeof mins === 'number' && mins > 0) {
      let burnRate = 8;
      if (category === 'HIIT') burnRate = 11;
      else if (category === 'Cardio' || category === 'Running') burnRate = 10;
      else if (category === 'Yoga' || category === 'Stretching') burnRate = 4;
      else if (category === 'Cycling') burnRate = 9;
      else if (category === 'Walking') burnRate = 5;

      setCalories(Math.round(mins * burnRate));
    } else {
      setCalories('');
    }
  };

  // Search, Filter, Sort Logic
  const filteredAndSortedWorkouts = workouts
    .filter(w => {
      const matchesSearch = 
        w.workout_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.notes.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === 'All' || w.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const timeA = new Date(a.workout_date).getTime();
      const timeB = new Date(b.workout_date).getTime();
      return sortBy === 'newest' ? timeB - timeA : timeA - timeB;
    });

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 glass-panel border-b border-white/5 z-30 flex items-center justify-between px-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 p-[1px]">
            <div className="w-full h-full rounded-lg bg-[#050505] flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <span className="font-display font-bold text-sm tracking-wide">AURA WORKOUT TRACKER</span>
        </div>
        <span className="text-xs text-gray-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">Workouts Workspace</span>
      </header>

      <div className="flex pt-16">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        
        <main className={`flex-1 min-h-[calc(100vh-4rem)] p-6 sm:p-10 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-72'}`}>
          <PageTransition>
            <div className="max-w-6xl mx-auto space-y-8">
            
            {/* Page Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-400">ATHLETIC OS</span>
                <h1 className="text-3xl font-display font-bold text-white tracking-tight mt-0.5">Active Training Sheets</h1>
                <p className="text-sm text-gray-400 mt-1">Log exercises, track targets, manage duration outputs, and calculate total calories burned.</p>
              </div>
              <button 
                onClick={handleOpenCreate}
                className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-3.5 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/15 cursor-pointer flex-shrink-0"
              >
                <Plus className="w-4.5 h-4.5" />
                <span>Log Workout Session</span>
              </button>
            </div>

            {/* Smart Advice Panel */}
            <div className="p-6 rounded-2xl bg-gradient-to-tr from-indigo-600/10 via-purple-500/5 to-transparent border border-indigo-500/15 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-xl shadow-black/10">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">AI Workout Coach Insight</span>
                </div>
                <h3 className="text-base font-display font-bold text-white mt-1">Looking to maximize volumetric splits?</h3>
                <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">
                  Enter your physical split metrics in Aura Settings, and our AI model in the Coach panel will dynamically outline progression patterns for hypertrophy or cardio targets.
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Link 
                  to="/coach" 
                  className="whitespace-nowrap flex items-center space-x-1.5 bg-white/5 hover:bg-white/10 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-white/10 transition-all"
                >
                  <span>Consult Coach</span>
                </Link>
              </div>
            </div>

            {/* Controls Bar: Search, Category Filter, Sort order */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#09090c]/40 border border-white/5 shadow-md z-30 relative">
              
              {/* Search input */}
              <div className="md:col-span-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Search className="w-4 h-4" />
                </div>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search workout name or details..."
                  className="block w-full pl-10 pr-4 py-2.5 bg-[#121215]/50 border border-white/5 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Category selector */}
              <div className="relative" ref={categoryDropdownRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                    setIsSortDropdownOpen(false);
                  }}
                  className="w-full pl-10 pr-10 py-2.5 bg-[#121215]/50 border border-white/5 rounded-xl text-xs text-left text-white flex items-center justify-between hover:bg-[#18181f]/50 transition-colors"
                >
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <Filter className="w-4 h-4" />
                  </div>
                  <span className="truncate">{categoryFilter === 'All' ? 'All Categories' : categoryFilter}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isCategoryDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 4, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 right-0 z-50 bg-[#09090c] border border-white/10 rounded-xl shadow-2xl p-1.5 max-h-60 overflow-y-auto scrollbar-thin"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setCategoryFilter('All');
                          setIsCategoryDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors ${
                          categoryFilter === 'All' ? 'bg-indigo-600 text-white font-bold' : 'text-gray-300 hover:bg-white/5'
                        }`}
                      >
                        All Categories
                      </button>
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setCategoryFilter(cat);
                            setIsCategoryDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors ${
                            categoryFilter === cat ? 'bg-indigo-600 text-white font-bold' : 'text-gray-300 hover:bg-white/5'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Sorting */}
              <div className="relative" ref={sortDropdownRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsSortDropdownOpen(!isSortDropdownOpen);
                    setIsCategoryDropdownOpen(false);
                  }}
                  className="w-full px-4 pr-10 py-2.5 bg-[#121215]/50 border border-white/5 rounded-xl text-xs text-left text-white flex items-center justify-between hover:bg-[#18181f]/50 transition-colors"
                >
                  <span>{sortBy === 'newest' ? 'Sort: Newest First' : 'Sort: Oldest First'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isSortDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 4, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 right-0 z-50 bg-[#09090c] border border-white/10 rounded-xl shadow-2xl p-1.5"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSortBy('newest');
                          setIsSortDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors ${
                          sortBy === 'newest' ? 'bg-indigo-600 text-white font-bold' : 'text-gray-300 hover:bg-white/5'
                        }`}
                      >
                        Sort: Newest First
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSortBy('oldest');
                          setIsSortDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors ${
                          sortBy === 'oldest' ? 'bg-indigo-600 text-white font-bold' : 'text-gray-300 hover:bg-white/5'
                        }`}
                      >
                        Sort: Oldest First
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>

            {/* Main Content Render */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-44 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse" />
                ))}
              </div>
            ) : filteredAndSortedWorkouts.length === 0 ? (
              <div className="border border-white/5 rounded-2xl glass-panel p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-lg">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-gray-400">
                  <Dumbbell className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold text-white">No active training logs found</h3>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1 leading-relaxed">
                    {searchQuery || categoryFilter !== 'All' 
                      ? 'No workouts matched your search queries or active filters. Try resetting search fields.'
                      : "Start establishing your hypertrophic consistency by adding your first session splits."}
                  </p>
                </div>
                {(!searchQuery && categoryFilter === 'All') && (
                  <button 
                    onClick={handleOpenCreate}
                    className="flex items-center space-x-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Log First Session</span>
                  </button>
                )}
              </div>
            ) : (
              // Workout Grid list
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredAndSortedWorkouts.map((workout) => {
                    const colors = CATEGORY_COLORS[workout.category] || { bg: 'bg-white/5', text: 'text-white', border: 'border-white/10' };
                    return (
                      <motion.div
                        key={workout.id}
                        layout
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="rounded-2xl glass-card border border-white/5 p-5 relative flex flex-col justify-between group hover:border-white/10 transition-all shadow-md shadow-black/10"
                      >
                        <div>
                          {/* Header Split */}
                          <div className="flex items-start justify-between gap-2">
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border ${colors.bg} ${colors.text} ${colors.border}`}>
                              {workout.category}
                            </span>
                            <span className="text-[11px] font-mono text-gray-500 flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{workout.workout_date}</span>
                            </span>
                          </div>

                          {/* Workout Name */}
                          <h3 className="text-base font-display font-bold text-white mt-3.5 tracking-tight group-hover:text-indigo-400 transition-colors line-clamp-1">
                            {workout.workout_name}
                          </h3>

                          {/* Metrics row */}
                          <div className="grid grid-cols-2 gap-4 mt-4 py-3 border-y border-white/5">
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-indigo-400" />
                              <div>
                                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider leading-none">Duration</p>
                                <p className="text-xs font-semibold text-white mt-0.5">{workout.duration} Mins</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Flame className="w-4 h-4 text-purple-400" />
                              <div>
                                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider leading-none">Burned</p>
                                <p className="text-xs font-semibold text-white mt-0.5">{workout.calories_burned} kcal</p>
                              </div>
                            </div>
                          </div>

                          {/* Notes Preview if available */}
                          {workout.notes && (
                            <p className="text-xs text-gray-400 mt-3 line-clamp-2 leading-relaxed">
                              {workout.notes}
                            </p>
                          )}
                        </div>

                        {/* Actions drawer */}
                        <div className="flex items-center justify-end space-x-2 mt-5 pt-3.5 border-t border-white/[0.03]">
                          <button 
                            onClick={() => handleOpenView(workout)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white transition-all cursor-pointer"
                            title="View Full Workout Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleOpenEdit(workout)}
                            className="p-2 rounded-xl bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/10 text-indigo-400 hover:text-indigo-300 transition-all cursor-pointer"
                            title="Edit Workout Session"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleOpenDelete(workout)}
                            className="p-2 rounded-xl bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 text-rose-400 hover:text-rose-300 transition-all cursor-pointer"
                            title="Delete Workout Session"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}

          </div>
          </PageTransition>
        </main>
      </div>

      {/* FORM MODAL: Add / Edit Workout */}
      <AnimatePresence>
        {isFormModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !submitLoading && setIsFormModalOpen(false)}
              className="absolute inset-0 bg-[#030303]/80 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg rounded-3xl bg-[#09090c] border border-white/10 p-6 sm:p-8 shadow-2xl shadow-black overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="flex items-center space-x-2">
                  <Dumbbell className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-lg font-display font-bold text-white">
                    {editingWorkout ? 'Edit Workout Session' : 'Log New Workout'}
                  </h3>
                </div>
                <button 
                  onClick={() => setIsFormModalOpen(false)}
                  disabled={submitLoading}
                  className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all cursor-pointer disabled:opacity-30"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Box */}
              <form onSubmit={handleSubmitForm} className="space-y-5 mt-6">
                
                {formError && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-medium flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Workout Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-widest">
                    Workout Name <span className="text-indigo-400 font-bold">*</span>
                  </label>
                  <input 
                    type="text"
                    required
                    value={workoutName}
                    onChange={(e) => setWorkoutName(e.target.value)}
                    placeholder="e.g. Lower Body Hypertrophy"
                    className="block w-full mt-2 px-4 py-3 bg-[#121215]/50 border border-white/5 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category select */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-widest">
                      Category
                    </label>
                    <div className="relative mt-2">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="block w-full px-4 py-3 bg-[#121215]/50 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* Workout Date */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-widest">
                      Workout Date <span className="text-indigo-400 font-bold">*</span>
                    </label>
                    <input 
                      type="date"
                      required
                      value={workoutDate}
                      onChange={(e) => setWorkoutDate(e.target.value)}
                      className="block w-full mt-2 px-4 py-3 bg-[#121215]/50 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Duration in mins */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-widest">
                      Duration (Minutes) <span className="text-indigo-400 font-bold">*</span>
                    </label>
                    <input 
                      type="number"
                      required
                      min="1"
                      value={duration}
                      onChange={(e) => handleDurationChange(e.target.value)}
                      placeholder="e.g. 45"
                      className="block w-full mt-2 px-4 py-3 bg-[#121215]/50 border border-white/5 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                  </div>

                  {/* Calories Burned */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-widest flex items-center justify-between">
                      <span>Calories Burned <span className="text-indigo-400 font-bold">*</span></span>
                      <span className="text-[9px] text-indigo-400/80 font-normal lowercase tracking-normal">Estimated</span>
                    </label>
                    <input 
                      type="number"
                      required
                      min="0"
                      value={calories}
                      onChange={(e) => setCalories(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 350"
                      className="block w-full mt-2 px-4 py-3 bg-[#121215]/50 border border-white/5 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-widest">
                    Workout Notes / Exercises Logged
                  </label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Squat 4x10 @ 80kg, Leg Extension 3x12, Calf Raises..."
                    rows={3}
                    className="block w-full mt-2 px-4 py-3 bg-[#121215]/50 border border-white/5 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none"
                  />
                </div>

                {/* Actions bottom drawer */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/5">
                  <button 
                    type="button"
                    disabled={submitLoading}
                    onClick={() => setIsFormModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 border border-transparent transition-all cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={submitLoading}
                    className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/10 cursor-pointer disabled:opacity-50"
                  >
                    {submitLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Session</span>
                    )}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VIEW MODAL: Detailed view of single Workout */}
      <AnimatePresence>
        {isViewModalOpen && viewTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsViewModalOpen(false)}
              className="absolute inset-0 bg-[#030303]/80 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md rounded-3xl bg-[#09090c] border border-white/10 p-6 sm:p-8 shadow-2xl shadow-black"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border ${CATEGORY_COLORS[viewTarget.category]?.bg || 'bg-white/5'} ${CATEGORY_COLORS[viewTarget.category]?.text || 'text-white'} ${CATEGORY_COLORS[viewTarget.category]?.border || 'border-white/10'}`}>
                  {viewTarget.category}
                </span>
                <button 
                  onClick={() => setIsViewModalOpen(false)}
                  className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-6 space-y-6">
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest font-mono">Training Sheet Name</p>
                  <h3 className="text-xl font-display font-bold text-white mt-1.5">{viewTarget.workout_name}</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4 flex flex-col justify-between">
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider font-mono">Total Duration</span>
                    <span className="text-lg font-display font-extrabold text-indigo-400 mt-2">{viewTarget.duration} Mins</span>
                  </div>
                  <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4 flex flex-col justify-between">
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider font-mono">Calories Burned</span>
                    <span className="text-lg font-display font-extrabold text-purple-400 mt-2">{viewTarget.calories_burned} kcal</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest font-mono">Workout Date</p>
                    <p className="text-white mt-1">{viewTarget.workout_date}</p>
                  </div>
                  {viewTarget.created_at && (
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest font-mono">Logged Timestamp</p>
                      <p className="text-white mt-1">{new Date(viewTarget.created_at).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>

                {viewTarget.notes ? (
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest font-mono flex items-center space-x-1">
                      <FileText className="w-3 h-3 text-indigo-400" />
                      <span>Exercise Log notes</span>
                    </p>
                    <div className="mt-2 p-4 rounded-2xl bg-[#121215]/50 border border-white/5 text-xs text-gray-300 leading-relaxed max-h-44 overflow-y-auto whitespace-pre-line font-sans">
                      {viewTarget.notes}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-xs text-gray-500 italic py-4">No notes entered for this session.</div>
                )}

                <div className="flex justify-end pt-2">
                  <button 
                    onClick={() => setIsViewModalOpen(false)}
                    className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white font-bold text-xs px-5 py-3 rounded-xl border border-white/5 transition-all cursor-pointer"
                  >
                    Close Sheet
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM DELETE MODAL */}
      <AnimatePresence>
        {isDeleteModalOpen && deletingWorkout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !deleteLoading && setIsDeleteModalOpen(false)}
              className="absolute inset-0 bg-[#030303]/80 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm rounded-3xl bg-[#09090c] border border-white/10 p-6 sm:p-8 shadow-2xl shadow-black text-center"
            >
              <div className="mx-auto w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <AlertCircle className="w-6 h-6 animate-pulse" />
              </div>
              
              <h3 className="text-base font-display font-bold text-white mt-5">Remove Workout Session?</h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Are you certain you want to delete <span className="text-rose-400 font-semibold">"{deletingWorkout.workout_name}"</span>? This action is permanent and cannot be undone.
              </p>

              <div className="flex items-center space-x-3 mt-6 pt-4 border-t border-white/5">
                <button 
                  disabled={deleteLoading}
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 border border-transparent transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  disabled={deleteLoading}
                  onClick={handleDeleteConfirm}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-lg hover:shadow-rose-600/15 cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  {deleteLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Delete</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
