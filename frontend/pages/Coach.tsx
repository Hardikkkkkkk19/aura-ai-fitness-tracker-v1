import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { useToast } from '../context/ToastContext';
import { workoutsService, Workout } from '../services/workoutsService';
import { 
  aiCoachService, 
  ChatMessage, 
  ChatSession, 
  UserFitnessProfile, 
  StructuredWorkoutPlan 
} from '../services/aiCoachService';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  ArrowRight, 
  Brain, 
  ShieldAlert, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  RotateCcw, 
  AlertCircle, 
  Database, 
  ChevronLeft, 
  Menu, 
  Activity, 
  Flame, 
  Clock, 
  Calendar, 
  Dumbbell, 
  Zap, 
  Target, 
  HelpCircle, 
  Eye, 
  RefreshCw,
  X,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PageTransition } from '../components/PageTransition';

export const Coach: React.FC = () => {
  const { user, isMockMode } = useAuth();
  const { showToast } = useToast();

  const [collapsed, setCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true); // Left chat history drawer state
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Chat sessions state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [promptInput, setPromptInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [lastError, setLastError] = useState<{ type: string; message: string } | null>(null);

  // Prompt Builder & Payload Context States
  const [injectProfile, setInjectProfile] = useState(true);
  const [showPayloadModal, setShowPayloadModal] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  
  // Interactive Exercises completed checkbox state
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load workouts to construct the live fitness profile context
  useEffect(() => {
    const fetchWorkouts = async () => {
      if (!user?.id) return;
      try {
        setLoadingStats(true);
        const data = await workoutsService.getWorkouts(user.id);
        setWorkouts(data);
      } catch (err: any) {
        console.error('Failed to load profile context workouts:', err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchWorkouts();
  }, [user?.id]);

  // Derive User Fitness Profile
  const fitnessProfile = useMemo<UserFitnessProfile>(() => {
    const defaultProfile: UserFitnessProfile = {
      userName: user?.user_metadata?.full_name || 'Athlete',
      currentStreak: 0,
      weeklyGoalWorkouts: 4,
      weeklyGoalCompleted: 0,
      totalCaloriesBurned: 0,
      averageDuration: 0,
      favoriteCategory: 'Strength',
      lastWorkoutName: 'None logged yet',
      recentActivity: []
    };

    if (workouts.length === 0) return defaultProfile;

    // 1. Current Streak
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
    }

    if (streak > 0) {
      while (true) {
        const checkStr = checkDate.toISOString().split('T')[0];
        if (datesSet.has(checkStr)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // 2. Weekly Goals (workouts from Monday)
    const getStartOfWeek = () => {
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff));
      monday.setHours(0,0,0,0);
      return monday;
    };
    const startOfWeek = getStartOfWeek();
    const thisWeekWorkouts = workouts.filter(w => new Date(w.workout_date) >= startOfWeek);
    const weeklyGoalCompleted = thisWeekWorkouts.length;

    // Load goals from local storage or set default (4)
    let weeklyGoalWorkouts = 4;
    const savedGoals = localStorage.getItem(`aura_goals_${user?.id}`);
    if (savedGoals) {
      try {
        const parsed = JSON.parse(savedGoals);
        weeklyGoalWorkouts = parsed.weeklyWorkouts || 4;
      } catch (e) {}
    }

    // 3. Stats totals
    const totalCaloriesBurned = workouts.reduce((acc, curr) => acc + (curr.calories_burned || 0), 0);
    const totalDuration = workouts.reduce((acc, curr) => acc + (curr.duration || 0), 0);
    const averageDuration = Math.round(totalDuration / workouts.length);

    // 4. Favorite Category
    const categoryCounts: Record<string, number> = {};
    workouts.forEach(w => {
      categoryCounts[w.category] = (categoryCounts[w.category] || 0) + 1;
    });
    let favoriteCategory = 'Strength';
    let maxCount = 0;
    Object.keys(categoryCounts).forEach(cat => {
      if (categoryCounts[cat] > maxCount) {
        maxCount = categoryCounts[cat];
        favoriteCategory = cat;
      }
    });

    // 5. Last Workout & Recent 3
    const lastWorkoutName = workouts[0]?.workout_name || 'None logged yet';
    const recentActivity = workouts.slice(0, 3).map(w => `${w.workout_name} (${w.category} - ${w.workout_date})`);

    return {
      userName: user?.user_metadata?.full_name || 'Athlete',
      currentStreak: streak,
      weeklyGoalWorkouts,
      weeklyGoalCompleted,
      totalCaloriesBurned,
      averageDuration,
      favoriteCategory,
      lastWorkoutName,
      recentActivity
    };
  }, [workouts, user]);

  // Load chat sessions from local storage on mount
  useEffect(() => {
    if (!user?.id) return;
    const savedSessions = localStorage.getItem(`aura_chat_sessions_${user.id}`);
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        if (parsed.length > 0) {
          setSessions(parsed);
          setActiveSessionId(parsed[0].id);
        } else {
          // Initialize first session
          createNewSession();
        }
      } catch (e) {
        console.error('Failed to parse chat sessions', e);
        createNewSession();
      }
    } else {
      createNewSession();
    }
  }, [user?.id]);

  // Save chat sessions to local storage whenever they change
  const saveSessions = (updated: ChatSession[]) => {
    if (!user?.id) return;
    setSessions(updated);
    localStorage.setItem(`aura_chat_sessions_${user.id}`, JSON.stringify(updated));
  };

  // Create a new session
  const createNewSession = () => {
    const newSessionId = 'session_' + Date.now();
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'New Coaching Session',
      messages: [
        {
          id: 'welcome_' + Date.now(),
          role: 'assistant',
          content: `Hello ${user?.user_metadata?.full_name || 'Athlete'}! I am Aura, your elite AI performance coach.

Ask me to build custom hypertrophy routines, audit your nutrition split, or map out fat loss strategies tailored to your metrics.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ],
      createdAt: new Date().toISOString()
    };

    const updated = [newSession, ...sessions];
    saveSessions(updated);
    setActiveSessionId(newSessionId);
    setLastError(null);
  };

  // Get active session
  const activeSession = useMemo(() => {
    return sessions.find(s => s.id === activeSessionId);
  }, [sessions, activeSessionId]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, sendingMessage]);

  // Clear active conversation
  const handleClearSession = () => {
    if (!activeSessionId) return;
    const updated = sessions.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          title: 'Cleared Session',
          messages: [
            {
              id: 'cleared_' + Date.now(),
              role: 'assistant',
              content: 'Conversation history cleared. Ask me anything to start fresh!',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]
        };
      }
      return s;
    });
    saveSessions(updated);
    setLastError(null);
    showToast('Active conversation cleared.', 'success');
  };

  // Delete specific session
  const handleDeleteSession = (sid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = sessions.filter(s => s.id !== sid);
    if (filtered.length === 0) {
      saveSessions([]);
      createNewSession();
    } else {
      saveSessions(filtered);
      if (activeSessionId === sid) {
        setActiveSessionId(filtered[0].id);
      }
    }
    showToast('Coaching conversation deleted.', 'success');
  };

  // Copy message to clipboard
  const handleCopyMessage = (msgId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(msgId);
    showToast('Copied to clipboard!', 'success');
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Send prompt handler
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || sendingMessage || !activeSessionId) return;

    setLastError(null);

    // Create user message
    const userMsg: ChatMessage = {
      id: 'user_' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Update session state with User Message
    const currentSession = sessions.find(s => s.id === activeSessionId);
    if (!currentSession) return;

    const previousMessages = currentSession.messages;
    const updatedMessages = [...previousMessages, userMsg];

    // Set first message as Title if session is default name
    let sessionTitle = currentSession.title;
    if (sessionTitle === 'New Coaching Session') {
      sessionTitle = text.slice(0, 30) + (text.length > 30 ? '...' : '');
    }

    const updatedSessionsTemp = sessions.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          title: sessionTitle,
          messages: updatedMessages
        };
      }
      return s;
    });
    saveSessions(updatedSessionsTemp);
    setPromptInput('');
    setSendingMessage(true);

    try {
      // Fetch response using custom service with or without profile inject
      const profileToInject = injectProfile ? fitnessProfile : undefined;
      const historyPayload = previousMessages.map(m => ({ role: m.role, content: m.content }));

      let responseText = '';
      let workoutPlan: StructuredWorkoutPlan | undefined = undefined;

      // Check offline mode or use sandbox fallback if mock mode
      if (isMockMode) {
        // High quality dynamic sandbox simulation
        await new Promise(r => setTimeout(r, 1200)); // typing effect delay
        const result = aiCoachService.generateSandboxResponse(text, fitnessProfile);
        responseText = result.text;
        workoutPlan = result.workoutPlan;
      } else {
        // Send to actual Express backend endpoint
        const result = await aiCoachService.askCoach(text, historyPayload, profileToInject);
        responseText = result.text;
        workoutPlan = result.workoutPlan;
      }

      // Add assistant message to active session
      const assistantMsg: ChatMessage = {
        id: 'assistant_' + Date.now(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        workoutPlan
      };

      const finalSessions = sessions.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: [...s.messages, assistantMsg]
          };
        }
        return s;
      });
      saveSessions(finalSessions);

    } catch (err: any) {
      console.error('Coaching chat failure:', err);
      
      const errType = err.type || 'network';
      const errMsg = err.message || 'Apologies, I encountered a connection issue. Please retry.';
      
      setLastError({ type: errType, message: errMsg });

      const errorMsg: ChatMessage = {
        id: 'err_' + Date.now(),
        role: 'assistant',
        content: errMsg,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
        errorType: errType
      };

      const finalSessions = sessions.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: [...s.messages, errorMsg]
          };
        }
        return s;
      });
      saveSessions(finalSessions);
    } finally {
      setSendingMessage(false);
    }
  };

  // Clear all sessions
  const handleClearAllSessions = () => {
    if (window.confirm('Are you sure you want to permanently delete all coaching conversations?')) {
      saveSessions([]);
      createNewSession();
      showToast('All conversation sessions permanently cleared.', 'success');
    }
  };

  // Re-submit / Retry last user message
  const handleRetryLastMessage = () => {
    if (!activeSession || activeSession.messages.length === 0) return;
    
    // Find last user message
    const userMsgs = activeSession.messages.filter(m => m.role === 'user');
    if (userMsgs.length === 0) return;

    const lastUserMsg = userMsgs[userMsgs.length - 1];

    // Remove any trailing assistant errors from conversation
    const cleanedMessages = [...activeSession.messages];
    while (cleanedMessages.length > 0 && cleanedMessages[cleanedMessages.length - 1].role === 'assistant') {
      cleanedMessages.pop();
    }

    const updated = sessions.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          messages: cleanedMessages
        };
      }
      return s;
    });
    saveSessions(updated);

    // Re-trigger send
    handleSendMessage(lastUserMsg.content);
  };

  // Quick prompt cards
  const suggestedPrompts = [
    { title: "Today's Split", desc: "Create today's workout plan", prompt: "Create a highly structured workout plan for my training session today." },
    { title: "Fat Loss Focus", desc: "Suggest a fat loss workout", prompt: "Suggest a high-density fat loss metabolic conditioning workout." },
    { title: "Gain Hypertrophy", desc: "Suggest a muscle gain workout", prompt: "Suggest an elite hypertrophy muscle gain routine focusing on mechanical tension." },
    { title: "Beginner Routine", desc: "Generate a beginner routine", prompt: "Generate a complete beginner-friendly fitness routine with core compound movements." },
    { title: "Active Recovery", desc: "Recommend a recovery workout", prompt: "Recommend an active recovery and joint mobility workout program." },
    { title: "Macro Estimator", desc: "How many calories should I eat?", prompt: "How many calories should I eat daily to optimize muscle retention and lean performance?" },
    { title: "Progress Audit", desc: "Analyze my recent progress", prompt: "Analyze my recent workout log history and give me progress optimization recommendations." },
    { title: "Rise & Grind", desc: "Give motivation for today's workout", prompt: "Give me deep mental motivation and a punchy athletic quote for today's session." }
  ];

  // Markdown Custom Parser (regex tables and lines)
  const RenderMarkdown: React.FC<{ text: string }> = ({ text }) => {
    const lines = text.split('\n');
    let inTable = false;
    let tableRows: string[][] = [];
    const renderedElements: React.ReactNode[] = [];

    const parseLineStyles = (lineText: string) => {
      const parts: React.ReactNode[] = [];
      const boldSplit = lineText.split('**');
      
      boldSplit.forEach((part, i) => {
        if (i % 2 === 1) {
          const italicSplit = part.split('*');
          const boldPart: React.ReactNode[] = [];
          italicSplit.forEach((itPart, j) => {
            if (j % 2 === 1) {
              boldPart.push(<em key={`em-${i}-${j}`} className="italic text-indigo-300">{itPart}</em>);
            } else {
              boldPart.push(itPart);
            }
          });
          parts.push(<strong key={`strong-${i}`} className="font-extrabold text-white">{boldPart}</strong>);
        } else {
          const italicSplit = part.split('*');
          italicSplit.forEach((itPart, j) => {
            if (j % 2 === 1) {
              parts.push(<em key={`em-plain-${i}-${j}`} className="italic text-gray-200">{itPart}</em>);
            } else {
              parts.push(itPart);
            }
          });
        }
      });
      return parts.length > 0 ? parts : lineText;
    };

    const flushTable = (index: number) => {
      if (tableRows.length === 0) return;
      const hasHeader = tableRows[1] && tableRows[1].some(col => col.includes('---') || col.includes(':---'));
      const rowsToRender = hasHeader ? tableRows.filter((_, idx) => idx !== 1) : tableRows;
      
      renderedElements.push(
        <div key={`table-wrapper-${index}`} className="overflow-x-auto my-4 rounded-xl border border-white/5 bg-zinc-950/60 backdrop-blur-md">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-gray-300">
                {rowsToRender[0]?.map((col, colIdx) => (
                  <th key={`th-${colIdx}`} className="px-4 py-3 font-semibold uppercase tracking-wider text-[10px] text-gray-400 font-mono">
                    {parseLineStyles(col.trim())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {rowsToRender.slice(1).map((row, rowIdx) => (
                <tr key={`tr-${rowIdx}`} className="hover:bg-white/[0.01] text-gray-300">
                  {row.map((col, colIdx) => (
                    <td key={`td-${rowIdx}-${colIdx}`} className="px-4 py-2.5 font-mono">
                      {parseLineStyles(col.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        inTable = true;
        const cols = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx !== 0 && idx !== arr.length - 1);
        tableRows.push(cols);
        continue;
      } else if (inTable) {
        flushTable(i);
      }

      if (line.startsWith('### ')) {
        renderedElements.push(
          <h4 key={`h3-${i}`} className="text-sm font-display font-bold text-indigo-400 mt-4 mb-2 uppercase tracking-wider">
            {parseLineStyles(line.replace('### ', ''))}
          </h4>
        );
      } else if (line.startsWith('## ')) {
        renderedElements.push(
          <h3 key={`h2-${i}`} className="text-base font-display font-bold text-white mt-5 mb-2 tracking-tight">
            {parseLineStyles(line.replace('## ', ''))}
          </h3>
        );
      } else if (line.startsWith('# ')) {
        renderedElements.push(
          <h2 key={`h1-${i}`} className="text-lg font-display font-bold text-white mt-6 mb-3 border-b border-white/5 pb-1">
            {parseLineStyles(line.replace('# ', ''))}
          </h2>
        );
      } else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const cleanLine = line.trim().replace(/^[-*]\s+/, '');
        renderedElements.push(
          <li key={`li-${i}`} className="ml-5 list-disc text-gray-300 text-xs py-1.5 leading-relaxed">
            {parseLineStyles(cleanLine)}
          </li>
        );
      } else if (/^\d+\.\s+/.test(line.trim())) {
        const cleanLine = line.trim().replace(/^\d+\.\s+/, '');
        renderedElements.push(
          <li key={`ol-${i}`} className="ml-5 list-decimal text-gray-300 text-xs py-1.5 leading-relaxed">
            {parseLineStyles(cleanLine)}
          </li>
        );
      } else if (!line.trim()) {
        renderedElements.push(<div key={`br-${i}`} className="h-2" />);
      } else {
        renderedElements.push(
          <p key={`p-${i}`} className="text-xs text-gray-300 leading-relaxed py-1">
            {parseLineStyles(line)}
          </p>
        );
      }
    }

    if (inTable) {
      flushTable(lines.length);
    }

    return <div className="space-y-1">{renderedElements}</div>;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col overflow-hidden">
      
      {/* Header bar */}
      <header className="fixed top-0 left-0 right-0 h-16 glass-panel border-b border-white/5 z-30 flex items-center justify-between px-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 p-[1px]">
            <div className="w-full h-full rounded-lg bg-[#050505] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <span className="font-display font-bold text-sm tracking-wide">AURA INTELLIGENT COACH</span>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white bg-white/5 border border-white/10 rounded-xl"
            title="Toggle Sessions History"
          >
            <Menu className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl flex items-center space-x-1.5 font-semibold">
            <Brain className="w-3.5 h-3.5 text-indigo-400" />
            <span>Athletic Brain</span>
          </span>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 pt-16 h-screen overflow-hidden">
        
        {/* Core App Sidebar Navigation */}
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

        {/* ChatGPT Style Sessions Panel (Middle Left sidebar) */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="glass-panel border-r border-white/5 flex flex-col justify-between flex-shrink-0 z-20 h-full overflow-hidden"
            >
              <div className="flex flex-col flex-1 p-4 overflow-hidden">
                <button
                  onClick={createNewSession}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-md shadow-indigo-600/10 cursor-pointer mb-4 animate-breathe-glow"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Coaching Chat</span>
                </button>

                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold px-1.5 mb-2 block">
                  Chat Sessions ({sessions.length})
                </span>

                {/* Session Scroll Container */}
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                  {sessions.map((s) => {
                    const isActive = s.id === activeSessionId;
                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          setActiveSessionId(s.id);
                          setLastError(null);
                        }}
                        className={`w-full text-left p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between group ${
                          isActive 
                            ? 'bg-indigo-500/10 border border-indigo-500/20 text-white' 
                            : 'bg-white/[0.01] hover:bg-white/5 border border-transparent text-gray-400 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 overflow-hidden flex-1">
                          <Bot className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                          <span className="text-xs font-semibold truncate block pr-2">{s.title}</span>
                        </div>
                        <button
                          onClick={(e) => handleDeleteSession(s.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 transition-all text-gray-500"
                          title="Delete Session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom sidebar actions */}
              <div className="p-4 border-t border-white/5 bg-zinc-950/45">
                <button
                  onClick={handleClearAllSessions}
                  className="w-full bg-white/5 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 text-gray-400 border border-white/10 font-bold text-xs py-3 rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400/80" />
                  <span>Clear All History</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Active Coaching Room Container */}
        <PageTransition className="flex-1 flex flex-col h-full overflow-hidden bg-[#07070a]/30">
          
          {/* Smart UI Quick Insights - Always at the top for real-time status */}
          <div className="border-b border-white/5 bg-[#0a0a0d]/60 px-6 py-3 flex-shrink-0 flex items-center justify-between overflow-x-auto gap-4 scrollbar-none">
            <div className="flex items-center space-x-4">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider font-mono">Live Insight Matrix:</span>
              
              <div className="flex items-center space-x-6 text-[11px] font-mono whitespace-nowrap text-gray-400">
                <span className="flex items-center">
                  <Zap className="w-3.5 h-3.5 text-amber-400 mr-1.5" />
                  Streak: <strong className="text-white ml-1">{fitnessProfile.currentStreak}d</strong>
                </span>
                <span className="flex items-center">
                  <Target className="w-3.5 h-3.5 text-indigo-400 mr-1.5" />
                  Goal: <strong className="text-white ml-1">{fitnessProfile.weeklyGoalCompleted}/{fitnessProfile.weeklyGoalWorkouts}</strong>
                </span>
                <span className="flex items-center">
                  <Flame className="w-3.5 h-3.5 text-rose-400 mr-1.5" />
                  Burnt: <strong className="text-white ml-1">{fitnessProfile.totalCaloriesBurned} kcal</strong>
                </span>
                <span className="flex items-center max-w-[200px] truncate">
                  <Clock className="w-3.5 h-3.5 text-orange-400 mr-1.5" />
                  Last: <strong className="text-white ml-1">{fitnessProfile.lastWorkoutName}</strong>
                </span>
                <span className="flex items-center">
                  <Dumbbell className="w-3.5 h-3.5 text-teal-400 mr-1.5" />
                  Focus: <strong className="text-white ml-1">{fitnessProfile.favoriteCategory}</strong>
                </span>
              </div>
            </div>

            {/* AI Prompt Builder Context Toggle Badge */}
            <div className="flex items-center space-x-2 ml-auto">
              <button
                onClick={() => setInjectProfile(!injectProfile)}
                className={`text-[10px] font-mono font-bold px-3 py-1.5 rounded-full border transition-all flex items-center space-x-1.5 ${
                  injectProfile 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                    : 'bg-white/5 text-gray-500 border-white/10'
                }`}
                title="When active, your live fitness logs are injected to personalize the AI answers"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${injectProfile ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
                <span>{injectProfile ? 'Live Context Active' : 'Profile Off'}</span>
              </button>

              <button
                onClick={() => setShowPayloadModal(true)}
                className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg border border-white/10 transition-colors"
                title="View Structured Prompt Payload Context"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Active Chat Scroll Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
            
            {/* If messages are empty or only the welcome message, show beautiful welcome grid */}
            {activeSession && activeSession.messages.length <= 1 && (
              <div className="max-w-2xl mx-auto py-10 space-y-8">
                
                {/* Branding Hero Banner */}
                <div className="text-center space-y-3">
                  <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 p-[1px] shadow-2xl shadow-indigo-600/15">
                    <div className="w-full h-full rounded-2xl bg-[#09090c] flex items-center justify-center">
                      <Sparkles className="w-7 h-7 text-indigo-400" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-display font-extrabold tracking-tight text-white mt-4">Aura Coaching Terminal</h2>
                  <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                    Powered by state-of-the-art grounded athletic logic. Engage with bespoke muscle, macro, and recovery strategies.
                  </p>
                </div>

                {/* Suggested Prompt Cards Grid */}
                <div className="space-y-4">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono font-bold block text-center">
                    Select a Suggested Prompt Card to Begin
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {suggestedPrompts.map((card, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(card.prompt)}
                        className="text-left p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/35 hover:bg-indigo-500/[0.02] transition-all duration-300 cursor-pointer group flex flex-col justify-between"
                      >
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block font-mono">{card.title}</span>
                          <p className="text-xs font-semibold text-gray-200 mt-1 leading-snug">{card.desc}</p>
                        </div>
                        <div className="flex items-center justify-between mt-3.5 pt-2 border-t border-white/[0.03] w-full">
                          <span className="text-[9px] text-gray-500 font-mono">Ask Aura Expert Coach</span>
                          <ArrowRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* Chat message listing */}
            {activeSession && activeSession.messages.map((msg) => {
              const isAssistant = msg.role === 'assistant';
              const isErr = msg.isError;

              return (
                <div 
                  key={msg.id} 
                  className={`flex items-start space-x-4 max-w-4xl mx-auto ${
                    !isAssistant ? 'justify-end space-x-reverse' : ''
                  }`}
                >
                  
                  {/* Avatar Icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    !isAssistant 
                      ? 'bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md' 
                      : isErr
                        ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                        : 'bg-indigo-500/10 border border-indigo-400/20 text-indigo-400'
                  }`}>
                    {!isAssistant ? (
                      <User className="w-4.5 h-4.5" />
                    ) : isErr ? (
                      <ShieldAlert className="w-4.5 h-4.5 text-rose-400" />
                    ) : (
                      <Bot className="w-4.5 h-4.5" />
                    )}
                  </div>

                  {/* Message Bubble Panel */}
                  <div className="flex flex-col space-y-1.5 max-w-[85%]">
                    
                    <div className={`rounded-2xl px-5 py-4 text-xs relative group ${
                      !isAssistant 
                        ? 'bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-600/5' 
                        : isErr
                          ? 'bg-rose-500/[0.03] border border-rose-500/20 text-rose-400'
                          : 'bg-white/[0.02] border border-white/5 text-gray-300 shadow-xl'
                    }`}>
                      
                      {/* Copy Response Button overlay */}
                      {isAssistant && !isErr && (
                        <button
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          className="absolute right-3.5 top-3.5 p-1.5 rounded-lg bg-[#0e0e11]/80 hover:bg-[#121216] text-gray-500 hover:text-white border border-white/5 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                          title="Copy text content"
                        >
                          {copiedMessageId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}

                      {/* Content Renderer */}
                      {isAssistant ? (
                        <RenderMarkdown text={msg.content} />
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      )}

                      {/* Timestamps and Meta indicators */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/[0.03] text-[9px] text-gray-500 font-mono">
                        <span>{msg.timestamp}</span>
                        {isAssistant && !isErr && (
                          <span className="text-indigo-400/80 font-bold tracking-widest uppercase">AURA ENGINE V2</span>
                        )}
                      </div>
                    </div>

                    {/* DYNAMIC WORKOUT PLAN CARD RENDERER */}
                    {isAssistant && msg.workoutPlan && (
                      <div className="rounded-2xl bg-zinc-950/75 border border-indigo-500/20 p-5 mt-3 shadow-2xl relative overflow-hidden group">
                        
                        {/* Glowing backdrop circle */}
                        <div className="absolute -top-10 -right-10 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/15 transition-all" />

                        {/* Card Header splits */}
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-4 border-b border-white/5 pb-3">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 font-mono">Generated Program split</span>
                            <h4 className="text-sm font-display font-bold text-white mt-1">{msg.workoutPlan.title}</h4>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* Difficulty badge */}
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full font-mono ${
                              msg.workoutPlan.difficulty === 'Beginner' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : msg.workoutPlan.difficulty === 'Intermediate'
                                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {msg.workoutPlan.difficulty}
                            </span>

                            {/* Calories Badge */}
                            <span className="text-[9px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2.5 py-1 rounded-full font-mono">
                              ~{msg.workoutPlan.estimatedCalories} kcal
                            </span>
                          </div>
                        </div>

                        {/* Warm up box */}
                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 mb-4 text-[11px] leading-relaxed">
                          <span className="font-bold text-indigo-400 uppercase tracking-widest text-[9px] block font-mono">Dynamic Warm-up routine</span>
                          <p className="text-gray-300 mt-1">{msg.workoutPlan.warmUp}</p>
                        </div>

                        {/* Exercises list items with checkboxes */}
                        <div className="space-y-2.5">
                          <span className="font-bold text-gray-400 uppercase tracking-widest text-[9px] block font-mono">Prescribed Exercises & split</span>
                          
                          {msg.workoutPlan.exercises.map((ex, exIdx) => {
                            const completedKey = `${msg.id}_ex_${exIdx}`;
                            const isDone = !!completedExercises[completedKey];
                            
                            return (
                              <div 
                                key={exIdx}
                                onClick={() => setCompletedExercises(prev => ({ ...prev, [completedKey]: !isDone }))}
                                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                                  isDone 
                                    ? 'bg-emerald-500/[0.03] border-emerald-500/30 text-gray-400' 
                                    : 'bg-zinc-900/50 border-white/5 text-white hover:border-indigo-500/20'
                                }`}
                              >
                                <div className="flex items-center space-x-3 overflow-hidden">
                                  {/* Checkbox trigger */}
                                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all flex-shrink-0 ${
                                    isDone 
                                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' 
                                      : 'border-white/20 bg-zinc-950/40'
                                  }`}>
                                    {isDone && <Check className="w-3.5 h-3.5" />}
                                  </div>
                                  
                                  <div className="truncate">
                                    <span className={`text-xs font-semibold block ${isDone ? 'line-through text-gray-500' : ''}`}>{ex.name}</span>
                                  </div>
                                </div>

                                {/* Set parameters metadata */}
                                <div className="flex items-center space-x-3 text-[10px] font-mono text-gray-400 flex-shrink-0 pl-2">
                                  <span className="bg-white/5 px-1.5 py-0.5 rounded border border-white/5"><strong className="text-white">{ex.sets}</strong> Sets</span>
                                  <span className="bg-white/5 px-1.5 py-0.5 rounded border border-white/5"><strong className="text-white">{ex.reps}</strong></span>
                                  <span className="bg-white/5 px-1.5 py-0.5 rounded border border-white/5">Rest: <strong className="text-indigo-400">{ex.rest}</strong></span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Interactive Clear/Retry Error Action Panel */}
                    {isAssistant && isErr && (
                      <div className="flex items-center space-x-2.5 mt-2.5 pl-1.5">
                        <button
                          onClick={handleRetryLastMessage}
                          className="flex items-center space-x-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Retry connection</span>
                        </button>
                        <button
                          onClick={handleClearSession}
                          className="text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-wider font-mono cursor-pointer"
                        >
                          Clear Conversation
                        </button>
                      </div>
                    )}

                  </div>
                </div>
              );
            })}

            {/* Simulated typing dot animations */}
            {sendingMessage && (
              <div className="flex items-start space-x-4 max-w-4xl mx-auto">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center flex-shrink-0 text-indigo-400">
                  <Bot className="w-4.5 h-4.5 animate-pulse" />
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Chat Form Area */}
          <div className="p-6 border-t border-white/5 bg-[#08080b]/80 relative flex-shrink-0">
            <div className="max-w-4xl mx-auto">
              
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(promptInput);
                }} 
                className="relative flex items-center"
              >
                <input
                  type="text"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  disabled={sendingMessage}
                  placeholder="Inquire: 'Propose a Push-day hyperbolic barbell progression'... "
                  className="w-full bg-[#0d0d11]/75 border border-white/10 rounded-2xl pl-5 pr-14 py-4.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all font-sans"
                />

                <button
                  type="submit"
                  disabled={sendingMessage || !promptInput.trim()}
                  className="absolute right-3 top-[10px] w-11 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-indigo-600/10"
                >
                  <Send className="w-4.5 h-4.5" />
                </button>
              </form>

              {/* Disclaimer line */}
              <div className="flex items-center justify-between mt-3 text-[10px] text-gray-500 font-mono">
                <span className="flex items-center">
                  <Brain className="w-3.5 h-3.5 text-indigo-500/70 mr-1.5" />
                  Structured request compiles live context.
                </span>
                <span className="hidden sm:inline">Always maintain safe cardiovascular form splits.</span>
              </div>

            </div>
          </div>

        </PageTransition>

      </div>

      {/* VIEW PROMPT PAYLOAD CONTEXT MODAL */}
      <AnimatePresence>
        {showPayloadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000]/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b0b0e] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <Database className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h3 className="text-base font-display font-bold text-white">AI Coach Context Profile Payload</h3>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">Assembled automatically from Supabase Table: workout</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPayloadModal(false)}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
                <p className="text-xs text-gray-400 leading-relaxed">
                  Below is the structured athlete profile payload generated dynamically by the <strong>AI Prompt Builder</strong>. 
                  When <strong>Live Context</strong> is enabled, this is prepended to your prompts to secure hyper-targeted fitness counseling.
                </p>

                <pre className="p-4 rounded-2xl bg-black/45 border border-white/5 text-xs text-indigo-300 font-mono overflow-x-auto select-all whitespace-pre-wrap leading-relaxed">
{JSON.stringify({
  athlete_name: fitnessProfile.userName,
  current_streak_days: fitnessProfile.currentStreak,
  weekly_goal: {
    workouts_target: fitnessProfile.weeklyGoalWorkouts,
    workouts_completed: fitnessProfile.weeklyGoalCompleted,
    progress_percentage: `${Math.round((fitnessProfile.weeklyGoalCompleted / fitnessProfile.weeklyGoalWorkouts) * 100)}%`
  },
  cumulative_calories_burned: fitnessProfile.totalCaloriesBurned,
  average_session_duration_mins: fitnessProfile.averageDuration,
  favorite_category_focus: fitnessProfile.favoriteCategory,
  last_completed_session: fitnessProfile.lastWorkoutName,
  recent_activity_logs: fitnessProfile.recentActivity
}, null, 2)}
                </pre>
              </div>

              <div className="p-6 border-t border-white/5 bg-[#070709] flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      JSON.stringify({
                        athlete_name: fitnessProfile.userName,
                        current_streak_days: fitnessProfile.currentStreak,
                        weekly_goal: {
                          workouts_target: fitnessProfile.weeklyGoalWorkouts,
                          workouts_completed: fitnessProfile.weeklyGoalCompleted
                        },
                        cumulative_calories_burned: fitnessProfile.totalCaloriesBurned,
                        average_session_duration_mins: fitnessProfile.averageDuration,
                        favorite_category_focus: fitnessProfile.favoriteCategory,
                        last_completed_session: fitnessProfile.lastWorkoutName,
                        recent_activity_logs: fitnessProfile.recentActivity
                      }, null, 2)
                    );
                    showToast('Payload schema copied!', 'success');
                  }}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <Copy className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Copy Schema</span>
                </button>
                <button
                  onClick={() => setShowPayloadModal(false)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Close payload preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
