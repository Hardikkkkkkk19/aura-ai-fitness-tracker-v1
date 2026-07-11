import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  EmailService, 
  EMAIL_TEMPLATES, 
  NotificationSettings, 
  EmailHistoryItem, 
  TemplatePreview 
} from '../services/EmailService';
import { 
  Mail, 
  Settings, 
  Clock, 
  Send, 
  History, 
  Eye, 
  Check, 
  X, 
  AlertTriangle, 
  Search, 
  Trash2, 
  Info, 
  Globe,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
  Sliders,
  Bell,
  RefreshCw,
  Copy,
  WifiOff,
  UserCheck,
  FileText,
  MailCheck,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PageTransition } from '../components/PageTransition';

export const EmailCenter: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [collapsed, setCollapsed] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>(EmailService.getSettings());
  const [history, setHistory] = useState<EmailHistoryItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('welcome');
  const [previewTab, setPreviewTab] = useState<'visual' | 'code'>('visual');
  
  // Test sandbox inputs
  const [recipientEmail, setRecipientEmail] = useState<string>(user?.email || 'hvjadhav19@gmail.com');
  const [sendLoading, setSendLoading] = useState<boolean>(false);
  const [sendResult, setSendResult] = useState<'none' | 'success' | 'failed'>('none');
  const [simulationMode, setSimulationMode] = useState<'none' | 'offline' | 'timeout' | 'rate_limit' | 'failed'>('none');

  // History filtering & searching
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Load configuration on mount
  useEffect(() => {
    setSettings(EmailService.getSettings());
    setHistory(EmailService.getHistory());
  }, []);

  // Sync settings helper
  const handleToggleSetting = (key: keyof Omit<NotificationSettings, 'reminderTime' | 'timezone' | 'scheduleType'>) => {
    const updated = {
      ...settings,
      [key]: !settings[key]
    };
    setSettings(updated);
    EmailService.saveSettings(updated);
    showToast(`Category updated in local database successfully!`, "success");
  };

  const handleUpdateSchedule = (key: 'reminderTime' | 'timezone' | 'scheduleType', value: string) => {
    const updated = {
      ...settings,
      [key]: value
    };
    setSettings(updated);
    EmailService.saveSettings(updated);
    showToast(`Schedule cron updated to ${key === 'reminderTime' ? value : value.slice(0, 15)}...`, "info");
  };

  // Retrieve rendered HTML
  const currentHtml = useMemo(() => {
    return EmailService.generateHtmlTemplate(
      selectedTemplate, 
      user?.user_metadata?.full_name || 'Alexander Stone'
    );
  }, [selectedTemplate, user]);

  // Copy HTML string
  const handleCopyHtml = () => {
    navigator.clipboard.writeText(currentHtml);
    showToast("Aura branding HTML template copied to clipboard!", "success");
  };

  // Trigger test sandbox dispatch
  const handleTriggerSend = async () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      showToast("Please enter a valid recipient email address.", "error");
      return;
    }

    setSendLoading(true);
    setSendResult('none');

    try {
      const response = await EmailService.sendEmailViaBackend(
        recipientEmail,
        selectedTemplate,
        simulationMode
      );

      if (response.success) {
        setSendResult('success');
        showToast("Email sandbox payload dispatched perfectly!", "success");
      }
    } catch (err: any) {
      setSendResult('failed');
      const errType = err.type || 'error';
      if (errType === 'offline') {
        showToast("Error [Offline]: Device offline. Failed to reach SMTP relay.", "error");
      } else if (errType === 'timeout') {
        showToast("Error [Timeout]: Gateway failed to acknowledge in time.", "error");
      } else if (errType === 'rate_limit') {
        showToast("Error [Rate Limit]: Too many sandbox checks. Rate limited (429).", "warning");
      } else {
        showToast(err.message || "Email handshaking error.", "error");
      }
    } finally {
      setSendLoading(false);
      setHistory(EmailService.getHistory()); // reload logs
    }
  };

  // Clean historical logs
  const handleClearAllHistory = () => {
    EmailService.clearHistory();
    setHistory([]);
    showToast("Dispatched records purged.", "info");
  };

  // Filter history logs based on search inputs
  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const matchesSearch = 
        item.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.deliveryState.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesType = typeFilter === 'all' || item.emailType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [history, searchQuery, statusFilter, typeFilter]);

  // Load details from history back to preview
  const handlePreviewFromHistory = (type: string) => {
    setSelectedTemplate(type);
    showToast(`Loaded ${EMAIL_TEMPLATES.find(t => t.id === type)?.name} preview.`, "info");
  };

  const getCategoryIconColor = (category: string) => {
    switch(category) {
      case 'reminders': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'reports': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'meals': return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      case 'coach': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      default: return 'text-indigo-400 bg-indigo-500/10 border-indigo-400/20';
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col">
      {/* Upper header */}
      <header className="fixed top-0 left-0 right-0 h-16 glass-panel border-b border-white/5 z-30 flex items-center justify-between px-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 p-[1px]">
            <div className="w-full h-full rounded-lg bg-[#050505] flex items-center justify-center">
              <Mail className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <span className="font-display font-bold text-sm tracking-wide">AURA EMAIL AUTOMATION</span>
        </div>
        <span className="text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-400/20 px-3 py-1.5 rounded-xl font-mono">
          SMTP Dispatcher Active
        </span>
      </header>

      <div className="flex pt-16 flex-1">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        
        <main className={`flex-1 p-6 sm:p-10 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-72'}`}>
          <PageTransition>
            <div className="max-w-6xl mx-auto space-y-10">
            
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-400 font-mono">
                  Autonomous Communication Systems
                </span>
                <h1 className="text-3xl font-display font-bold text-white tracking-tight mt-0.5">
                  Aura Smart Email Center
                </h1>
                <p className="text-sm text-gray-400 mt-1 max-w-2xl">
                  Automate custom training schedules, milestone achievements, and visual nutrition reports using Aura high-performance email triggers. Fully prepared for Resend SDK connectivity.
                </p>
              </div>

              {/* Status indicator pill */}
              <div className="self-start md:self-auto flex items-center space-x-2.5 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <div className="text-xs font-mono">
                  <span className="text-gray-400">Target Core:</span> <strong className="text-white">/api/email/*</strong>
                </div>
              </div>
            </div>

            {/* UPPER DECKS: Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* LEFT DECK (Cols: 5): Settings & Scheduling */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* 1. Notification Categories Panel */}
                <div className="rounded-3xl glass-card p-6 border border-white/10 space-y-5">
                  <div className="flex items-center space-x-3 pb-2 border-b border-white/5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Bell className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Notification Subscriptions</h3>
                      <p className="text-[11px] text-gray-500">Enable or disable specific automated email models.</p>
                    </div>
                  </div>

                  {/* Toggle switches list */}
                  <div className="space-y-3.5">
                    
                    {/* Workout Reminders */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all">
                      <div>
                        <span className="text-xs font-semibold text-gray-200 block">Workout Reminders</span>
                        <span className="text-[10px] text-gray-500 block leading-snug mt-0.5">Scheduled workout notifications</span>
                      </div>
                      <button
                        onClick={() => handleToggleSetting('workoutReminders')}
                        className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                          settings.workoutReminders ? 'bg-indigo-600' : 'bg-zinc-800'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                          settings.workoutReminders ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {/* Weekly Progress Reports */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all">
                      <div>
                        <span className="text-xs font-semibold text-gray-200 block">Weekly Progress Digest</span>
                        <span className="text-[10px] text-gray-500 block leading-snug mt-0.5">Physical telemetry metrics log</span>
                      </div>
                      <button
                        onClick={() => handleToggleSetting('weeklyReports')}
                        className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                          settings.weeklyReports ? 'bg-indigo-600' : 'bg-zinc-800'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                          settings.weeklyReports ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {/* Monthly Macrocycle Audit */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all">
                      <div>
                        <span className="text-xs font-semibold text-gray-200 block">Monthly Macrocycle Audit</span>
                        <span className="text-[10px] text-gray-500 block leading-snug mt-0.5">Long-term physical composition</span>
                      </div>
                      <button
                        onClick={() => handleToggleSetting('monthlyReports')}
                        className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                          settings.monthlyReports ? 'bg-indigo-600' : 'bg-zinc-800'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                          settings.monthlyReports ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {/* Meal Scan Reports */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all">
                      <div>
                        <span className="text-xs font-semibold text-gray-200 block">Meal Macro Scan Reports</span>
                        <span className="text-[10px] text-gray-500 block leading-snug mt-0.5">Plate Vision decomposition summary</span>
                      </div>
                      <button
                        onClick={() => handleToggleSetting('mealReports')}
                        className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                          settings.mealReports ? 'bg-indigo-600' : 'bg-zinc-800'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                          settings.mealReports ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {/* AI Coach Interactions */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all">
                      <div>
                        <span className="text-xs font-semibold text-gray-200 block">AI Expert Coach Emails</span>
                        <span className="text-[10px] text-gray-500 block leading-snug mt-0.5">Biometric tips & recommendations</span>
                      </div>
                      <button
                        onClick={() => handleToggleSetting('aiCoachEmails')}
                        className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                          settings.aiCoachEmails ? 'bg-indigo-600' : 'bg-zinc-800'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                          settings.aiCoachEmails ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {/* Achievements */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all">
                      <div>
                        <span className="text-xs font-semibold text-gray-200 block">Goal & Streak Milestones</span>
                        <span className="text-[10px] text-gray-500 block leading-snug mt-0.5">Personal achievements & records</span>
                      </div>
                      <button
                        onClick={() => handleToggleSetting('achievementEmails')}
                        className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                          settings.achievementEmails ? 'bg-indigo-600' : 'bg-zinc-800'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                          settings.achievementEmails ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {/* Account Security */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all">
                      <div>
                        <span className="text-xs font-semibold text-gray-200 block">Workspace Security Alerts</span>
                        <span className="text-[10px] text-gray-500 block leading-snug mt-0.5">Critical security & credential audits</span>
                      </div>
                      <button
                        onClick={() => handleToggleSetting('securityEmails')}
                        className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                          settings.securityEmails ? 'bg-indigo-600' : 'bg-zinc-800'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                          settings.securityEmails ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                  </div>
                </div>

                {/* 2. Schedule Manager Panel */}
                <div className="rounded-3xl glass-card p-6 border border-white/10 space-y-4">
                  <div className="flex items-center space-x-3 pb-2 border-b border-white/5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Clock className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Automated Cron Scheduler</h3>
                      <p className="text-[11px] text-gray-500">Configure delivery recurrence parameters.</p>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    
                    {/* Timezone Selection */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono block">Timezone Profile</label>
                      <div className="relative">
                        <select
                          value={settings.timezone}
                          onChange={(e) => handleUpdateSchedule('timezone', e.target.value)}
                          className="w-full bg-[#0a0a0c] border border-white/10 hover:border-white/20 rounded-xl text-xs py-2.5 px-3 focus:outline-none focus:border-indigo-500 font-sans text-gray-300 transition-colors"
                        >
                          <option value="America/New_York">UTC-05:00 (Eastern Time)</option>
                          <option value="America/Chicago">UTC-06:00 (Central Time)</option>
                          <option value="America/Denver">UTC-07:00 (Mountain Time)</option>
                          <option value="America/Los_Angeles">UTC-08:00 (Pacific Time)</option>
                          <option value="UTC">UTC+00:00 (Coordinated Universal)</option>
                          <option value="Europe/London">UTC+01:00 (Greenwich Mean / British Time)</option>
                          <option value="Asia/Kolkata">UTC+05:30 (Indian Standard Time)</option>
                          <option value="Asia/Singapore">UTC+08:00 (Singapore Standard Time)</option>
                        </select>
                        <Globe className="w-4 h-4 text-gray-500 absolute right-3 top-3 pointer-events-none" />
                      </div>
                    </div>

                    {/* Schedule Mode Selector */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono block">Schedule Protocol</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['daily', 'weekly', 'monthly'] as const).map((type) => (
                          <button
                            key={type}
                            onClick={() => handleUpdateSchedule('scheduleType', type)}
                            className={`py-2 px-3 rounded-xl border text-center text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                              settings.scheduleType === type 
                                ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400 font-bold' 
                                : 'bg-white/[0.01] border-white/5 hover:border-white/10 text-gray-400 hover:text-white'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Reminder Time */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono block">Custom Dispatch Time</label>
                      <div className="relative">
                        <input
                          type="time"
                          value={settings.reminderTime}
                          onChange={(e) => handleUpdateSchedule('reminderTime', e.target.value)}
                          className="w-full bg-[#0a0a0c] border border-white/10 hover:border-white/20 rounded-xl text-xs py-2.5 px-3 focus:outline-none focus:border-indigo-500 font-mono text-gray-300 transition-colors"
                        />
                        <Clock className="w-4 h-4 text-gray-500 absolute right-3 top-3 pointer-events-none" />
                      </div>
                    </div>

                  </div>
                </div>

              </div>

              {/* RIGHT DECK (Cols: 7): Template Browser & Previewer */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Email Template Selector */}
                <div className="rounded-3xl glass-card p-6 border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Template Library</h3>
                      <p className="text-[11px] text-gray-500">Select an email style below to visualize live layout renders.</p>
                    </div>
                    <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg">
                      10 Built-In Layouts
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto pr-2 scrollbar-thin">
                    {EMAIL_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.id}
                        onClick={() => setSelectedTemplate(tpl.id)}
                        className={`p-3 rounded-2xl border transition-all text-left flex items-start space-x-3 cursor-pointer group ${
                          selectedTemplate === tpl.id 
                            ? 'border-indigo-500 bg-indigo-500/[0.03] shadow-md shadow-indigo-500/5' 
                            : 'border-white/5 bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.02]'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5 ${getCategoryIconColor(tpl.category)}`}>
                          <Mail className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className={`text-xs font-bold block transition-colors ${selectedTemplate === tpl.id ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                            {tpl.name}
                          </span>
                          <span className="text-[10px] text-gray-500 block truncate mt-0.5">{tpl.description}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Output Viewframe */}
                <div className="rounded-3xl glass-card border border-white/10 overflow-hidden flex flex-col min-h-[500px]">
                  
                  {/* Viewframe Header tabs */}
                  <div className="bg-[#0e0e11] border-b border-white/5 p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-2">
                      <Eye className="w-4.5 h-4.5 text-indigo-400" />
                      <span className="text-xs font-bold uppercase tracking-wider font-mono text-white">Live Layout Renderer</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="bg-zinc-900 rounded-xl p-1 flex space-x-1 border border-white/5">
                        <button
                          onClick={() => setPreviewTab('visual')}
                          className={`text-[10px] font-semibold px-2.5 py-1.5 rounded-lg uppercase tracking-wider transition-colors cursor-pointer ${
                            previewTab === 'visual' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Render Visual
                        </button>
                        <button
                          onClick={() => setPreviewTab('code')}
                          className={`text-[10px] font-semibold px-2.5 py-1.5 rounded-lg uppercase tracking-wider transition-colors cursor-pointer ${
                            previewTab === 'code' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Source Code
                        </button>
                      </div>

                      <button
                        onClick={handleCopyHtml}
                        className="p-1.5 hover:bg-white/5 border border-white/5 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer"
                        title="Copy HTML to Clipboard"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Render Area */}
                  <div className="flex-1 bg-black p-4 relative flex flex-col min-h-[380px]">
                    {previewTab === 'visual' ? (
                      <iframe
                        ref={iframeRef}
                        title="Email responsive frame"
                        srcDoc={currentHtml}
                        className="w-full flex-1 border-0 rounded-2xl bg-[#050505]"
                      />
                    ) : (
                      <div className="flex-1 overflow-auto rounded-2xl border border-white/5 bg-[#070709] p-4 text-xs font-mono text-gray-400 leading-relaxed scrollbar-thin max-h-[420px]">
                        <pre className="whitespace-pre-wrap select-all">{currentHtml}</pre>
                      </div>
                    )}
                  </div>

                  {/* Sandbox Dispatch Deck */}
                  <div className="bg-[#0e0e11] border-t border-white/5 p-5 space-y-4">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">SMTP Dispatch Sandbox</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
                      
                      {/* Recipient Input */}
                      <div className="md:col-span-5 relative">
                        <input
                          type="email"
                          placeholder="Recipient address..."
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                          className="w-full bg-[#050506] border border-white/10 rounded-xl text-xs py-2.5 pl-3 pr-8 focus:outline-none focus:border-indigo-500 font-sans text-white transition-colors"
                        />
                        <span className="absolute right-3 top-3 text-[10px] text-gray-500 font-mono">To</span>
                      </div>

                      {/* Simulation Condition selector */}
                      <div className="md:col-span-4 relative">
                        <select
                          value={simulationMode}
                          onChange={(e: any) => setSimulationMode(e.target.value)}
                          className="w-full bg-[#050506] border border-white/10 rounded-xl text-xs py-2.5 px-3 focus:outline-none focus:border-indigo-500 font-sans text-gray-300 transition-colors"
                        >
                          <option value="none">✓ Clean Dispatch</option>
                          <option value="offline">⚠ Simulated Offline</option>
                          <option value="timeout">⚠ Simulated Timeout</option>
                          <option value="rate_limit">⚠ Simulated Rate Limit</option>
                          <option value="failed">⚠ Simulated SMTP Error</option>
                        </select>
                      </div>

                      {/* Dispatched Trigger */}
                      <button
                        onClick={handleTriggerSend}
                        disabled={sendLoading}
                        className="md:col-span-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer transition-all flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/10"
                      >
                        {sendLoading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Send Test</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Result Alerts */}
                    <AnimatePresence mode="wait">
                      {sendResult === 'success' && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center space-x-2"
                        >
                          <Check className="w-4 h-4" />
                          <span>Success! Layout successfully dispatched to SMTP virtual relay pipeline.</span>
                        </motion.div>
                      )}

                      {sendResult === 'failed' && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center space-x-2"
                        >
                          <X className="w-4 h-4" />
                          <span>Dispatched Failed: Transaction aborted due to chosen simulation state.</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>
                </div>

              </div>

            </div>

            {/* LOWER DECK: Email Activity log history (Full row width) */}
            <div className="rounded-3xl glass-card p-6 border border-white/10 space-y-6">
              
              {/* Table header operations */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-white/5">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <History className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">SMTP Dispatch Logs</h3>
                    <p className="text-[11px] text-gray-500">Real-time status tracking of automated mail triggers.</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleClearAllHistory}
                    disabled={history.length === 0}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-rose-500/10 hover:bg-rose-500/5 text-rose-400 text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear logs</span>
                  </button>
                </div>
              </div>

              {/* Filters Box */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                {/* Search query */}
                <div className="sm:col-span-6 relative">
                  <input
                    type="text"
                    placeholder="Search logs by recipient, subject or relay state..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#09090c] border border-white/10 rounded-xl text-xs py-2.5 pl-9 pr-4 focus:outline-none focus:border-indigo-500 font-sans text-white transition-colors"
                  />
                  <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                </div>

                {/* Status selector */}
                <div className="sm:col-span-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-[#09090c] border border-white/10 rounded-xl text-xs py-2.5 px-3 focus:outline-none focus:border-indigo-500 font-sans text-gray-300 transition-colors"
                  >
                    <option value="all">Filter: All Statuses</option>
                    <option value="delivered">✓ Delivered</option>
                    <option value="failed">✗ Failed</option>
                    <option value="sending">⏱ Sending</option>
                  </select>
                </div>

                {/* Type selector */}
                <div className="sm:col-span-3">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full bg-[#09090c] border border-white/10 rounded-xl text-xs py-2.5 px-3 focus:outline-none focus:border-indigo-500 font-sans text-gray-300 transition-colors"
                  >
                    <option value="all">Filter: All Templates</option>
                    {EMAIL_TEMPLATES.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Table rendering logs */}
              {filteredHistory.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-white/5 bg-[#040405]">
                  <table className="w-full border-collapse text-left text-xs text-gray-400">
                    <thead>
                      <tr className="bg-[#0b0b0e] border-b border-white/5 font-mono text-[10px] text-gray-500 uppercase tracking-wider">
                        <th className="py-3.5 px-4 font-semibold">Status</th>
                        <th className="py-3.5 px-4 font-semibold">Recipient</th>
                        <th className="py-3.5 px-4 font-semibold">Subject Matter</th>
                        <th className="py-3.5 px-4 font-semibold">Sent Timestamp</th>
                        <th className="py-3.5 px-4 font-semibold">Delivery State Detail</th>
                        <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                      {filteredHistory.map((item) => (
                        <tr 
                          key={item.id} 
                          className="hover:bg-white/[0.01] transition-colors"
                        >
                          {/* Status badge */}
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase border ${
                              item.status === 'delivered' 
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                : item.status === 'failed'
                                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'delivered' ? 'bg-emerald-400' : item.status === 'failed' ? 'bg-rose-400' : 'bg-amber-400'}`} />
                              <span>{item.status}</span>
                            </span>
                          </td>

                          {/* Recipient email */}
                          <td className="py-3.5 px-4 font-semibold text-gray-200">
                            {item.recipient}
                          </td>

                          {/* Subject */}
                          <td className="py-3.5 px-4 max-w-xs truncate text-gray-300">
                            {item.subject}
                          </td>

                          {/* Sent date */}
                          <td className="py-3.5 px-4 font-mono text-[11px] text-gray-400">
                            {item.sentDate}
                          </td>

                          {/* Gateway delivery logs */}
                          <td className="py-3.5 px-4 max-w-xs truncate font-mono text-[10px] text-gray-500">
                            {item.deliveryState}
                          </td>

                          {/* Action button to load preview */}
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handlePreviewFromHistory(item.emailType)}
                              className="inline-flex items-center space-x-1 py-1 px-2.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 text-indigo-400 hover:text-white text-[10px] font-semibold transition-all cursor-pointer"
                              title="Preview Layout Render"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Preview</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 rounded-2xl border border-white/5 border-dashed text-center text-xs text-gray-500 flex flex-col items-center justify-center space-y-3">
                  <MailCheck className="w-8 h-8 text-gray-600" />
                  <p>No transactions match your currently selected filters.</p>
                </div>
              )}

            </div>

          </div>
          </PageTransition>
        </main>
      </div>
    </div>
  );
};
