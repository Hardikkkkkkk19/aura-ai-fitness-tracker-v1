import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../services/supabase';
import { 
  MealVisionService, 
  MealScanResult, 
  MEAL_PRESETS 
} from '../services/MealVisionService';
import { 
  ScanLine, 
  Camera, 
  Upload, 
  Sparkles, 
  Scale, 
  AlertCircle, 
  RefreshCw, 
  Trash2, 
  Search, 
  FileText, 
  Download, 
  Check, 
  X, 
  Clipboard, 
  ZoomIn, 
  ZoomOut, 
  Flame, 
  Dumbbell, 
  Calendar, 
  Sliders, 
  ChevronRight, 
  HelpCircle, 
  Activity, 
  Heart, 
  ShieldCheck, 
  ShieldAlert,
  ArrowRightLeft,
  Video
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PageTransition } from '../components/PageTransition';

export const Scanner: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [collapsed, setCollapsed] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [activeResult, setActiveResult] = useState<MealScanResult | null>(null);
  
  // Image metadata, zoom, and interactions
  const [zoom, setZoom] = useState(1.0);
  const [imageInfo, setImageInfo] = useState<{ name: string; size: string; type: string; dimensions?: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // History and comparison states
  const [history, setHistory] = useState<MealScanResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [compareTargetId, setCompareTargetId] = useState<string>('');
  const [isVisionAiConfigured, setIsVisionAiConfigured] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check if Vision AI is configured on mount
  useEffect(() => {
    const checkConfig = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token || '';
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch('/api/meal/analyze', {
          method: 'POST',
          headers,
          body: JSON.stringify({ image: '' })
        });
        if (res.status === 503) {
          const errData = await res.json();
          if (errData?.error?.includes('Vision AI is not configured')) {
            setIsVisionAiConfigured(false);
          }
        }
      } catch (err) {
        console.error("Error checking vision config:", err);
      }
    };
    checkConfig();
  }, []);

  // Load history on mount
  useEffect(() => {
    const loadHistory = async () => {
      const data = await MealVisionService.getHistory();
      setHistory(data);
    };
    loadHistory();
  }, []);

  // Sync clipboard paste events
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              handleFileProcess(file);
              showToast("Image pasted from clipboard successfully!", "success");
            }
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [imageInfo]);

  // Clean up camera stream if unmounted
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Handle standard file loading & validation
  const handleFileProcess = (file: File) => {
    // 1. Validation: Unsupported formats
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast("Unsupported file format. Please upload PNG, JPG, JPEG, or WEBP.", "error");
      return;
    }

    // 2. Validation: Max image size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast("File size exceeds 5MB limit. Please compress your image.", "error");
      return;
    }

    // 3. Validation: Duplicate upload prevention
    const formattedSize = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    if (imageInfo && imageInfo.name === file.name && imageInfo.size === formattedSize) {
      showToast("This image has already been uploaded.", "warning");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setSelectedImage(base64String);
      setZoom(1.0);
      setActiveResult(null);

      // Get image dimensions dynamically
      const img = new Image();
      img.onload = () => {
        setImageInfo({
          name: file.name,
          size: formattedSize,
          type: file.type.replace('image/', '').toUpperCase(),
          dimensions: `${img.width} x ${img.height} px`
        });
      };
      img.src = base64String;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  // Live Camera Controls
  const startCamera = async () => {
    try {
      setShowCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera stream block:", err);
      showToast("Could not access camera. Please confirm permissions or upload manually.", "error");
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setSelectedImage(dataUrl);
        setZoom(1.0);
        setActiveResult(null);
        setImageInfo({
          name: `camera_snapshot_${Date.now().toString().slice(-4)}.jpg`,
          size: "Estimated 310 KB",
          type: "JPEG",
          dimensions: `${canvas.width} x ${canvas.height} px`
        });
        stopCamera();
        showToast("Snapshot captured successfully!", "success");
      }
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  // Preset Selection helper
  const handleSelectPreset = (url: string, name: string) => {
    setSelectedImage(url);
    setZoom(1.0);
    setActiveResult(null);
    setImageInfo({
      name: `${name.toLowerCase().replace(/\s+/g, '_')}.webp`,
      size: "Preset Asset",
      type: "WEBP",
      dimensions: "600 x 400 px"
    });
  };

  // Execute AI Multi-Stage Scanning Process
  const handleAnalyzeMeal = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setCurrentStage('Uploading');

    try {
      const result = await MealVisionService.analyzeMealImage(selectedImage, (stage) => {
        setCurrentStage(stage);
      });

      setActiveResult(result);
      setIsVisionAiConfigured(true);
      // Reload history
      const freshHistory = await MealVisionService.getHistory();
      setHistory(freshHistory);

      // Auto set first previous meal as comparison benchmark if history has entries
      if (freshHistory.length > 1) {
        const nextTarget = freshHistory.find(h => h.id !== result.id);
        if (nextTarget) {
          setCompareTargetId(nextTarget.id);
        }
      }

      showToast("Aura analysis completed! Report delivered.", "success");
    } catch (err: any) {
      console.error(err);
      const errMsg = err.message || "Unable to reach the virtual analysis network. Please retry.";
      if (errMsg.includes('Vision AI is not configured')) {
        setIsVisionAiConfigured(false);
      }
      showToast(errMsg, "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Reset viewport
  const handleClearImage = () => {
    setSelectedImage(null);
    setImageInfo(null);
    setActiveResult(null);
    setZoom(1.0);
    stopCamera();
  };

  // Delete scan history
  const handleDeleteHistoryItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = await MealVisionService.deleteFromHistory(id);
    setHistory(updated);
    if (compareTargetId === id) {
      setCompareTargetId('');
    }
    showToast("Meal scan removed from record.", "success");
  };

  // Load a historic scan back as active result
  const handleRestoreHistoricScan = (scan: MealScanResult) => {
    setSelectedImage(scan.imageUrl);
    setActiveResult(scan);
    setZoom(1.0);
    setImageInfo({
      name: `historic_scan_${scan.id.slice(-4)}.jpg`,
      size: "Saved Record",
      type: "IMAGE",
      dimensions: "Archived"
    });
    // Set a benchmark target if possible
    const firstOther = history.find(h => h.id !== scan.id);
    if (firstOther) {
      setCompareTargetId(firstOther.id);
    }
    showToast(`Loaded ${scan.mealName} back to active viewport.`, "info");
  };

  // Filter historic records based on search query
  const filteredHistory = useMemo(() => {
    return history.filter(h => 
      h.mealName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.detectedFoods.some(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [history, searchQuery]);

  // Compute live meal comparisons
  const comparisonResult = useMemo(() => {
    if (!activeResult || !compareTargetId) return null;
    const target = history.find(h => h.id === compareTargetId);
    if (!target) return null;

    return {
      targetName: target.mealName,
      targetDate: target.scanDate,
      caloriesDiff: activeResult.calories - target.calories,
      proteinDiff: activeResult.protein - target.protein,
      carbsDiff: activeResult.carbs - target.carbs,
      fatDiff: activeResult.fat - target.fat,
      healthScoreDiff: activeResult.healthScore - target.healthScore
    };
  }, [activeResult, compareTargetId, history]);

  // Export PDF via clean helper
  const handleExportPdf = () => {
    if (!activeResult) return;
    MealVisionService.exportToPdf(activeResult);
    showToast("Exporting PDF nutrition report...", "success");
  };

  // Export JSON via helper
  const handleExportJson = () => {
    if (!activeResult) return;
    MealVisionService.downloadJsonReport(activeResult);
    showToast("Downloaded meal nutrition metadata payload.", "success");
  };

  // Animation helper for circular indicators
  const STAGES_LIST = [
    "Uploading",
    "Preparing Vision Context",
    "Scanning Meal",
    "Estimating Nutrition",
    "Calculating Macros",
    "Generating Health Insights",
    "Preparing Final Report"
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col">
      {/* Upper header */}
      <header className="fixed top-0 left-0 right-0 h-16 glass-panel border-b border-white/5 z-30 flex items-center justify-between px-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 p-[1px]">
            <div className="w-full h-full rounded-lg bg-[#050505] flex items-center justify-center">
              <ScanLine className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <span className="font-display font-bold text-sm tracking-wide">AURA MEAL SCANNER</span>
        </div>
        <span className="text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-400/20 px-3 py-1.5 rounded-xl font-mono">
          Vision Engine v3.5
        </span>
      </header>

      <div className="flex pt-16 flex-1">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        
        <main className={`flex-1 p-6 sm:p-10 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-72'}`}>
          <PageTransition>
            <div className="max-w-6xl mx-auto space-y-10">
            
            {/* Page Header */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-400 font-mono">
                Thermodynamic Tracking
              </span>
              <h1 className="text-3xl font-display font-bold text-white tracking-tight mt-0.5">
                AI Meal Vision Scanner
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Scan your plate with Aura Vision. We decompose ingredients, calculate macro values, and design clinical nutritional insights.
              </p>
            </div>

            {!isVisionAiConfigured && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-start space-x-3 text-amber-200 shadow-lg shadow-amber-500/5">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-400 animate-pulse" />
                <div className="text-xs space-y-1">
                  <p className="font-bold">Vision AI is not configured</p>
                  <p className="text-amber-300/80 leading-relaxed">
                    Please add your API key (<code className="bg-amber-500/20 px-1 py-0.5 rounded font-mono">VITE_GROQ_API_KEY</code> or <code className="bg-amber-500/20 px-1 py-0.5 rounded font-mono">VITE_GEMINI_API_KEY</code>) to your environment configurations to activate real-time cognitive plate analysis.
                  </p>
                </div>
              </div>
            )}

            {/* Split Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* LEFT BOX: Image Control Deck (Cols: 5) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Visual viewframe container */}
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative rounded-3xl glass-card p-5 border transition-all duration-300 min-h-[380px] flex flex-col justify-between overflow-hidden ${
                    isDragging 
                      ? 'border-indigo-500 bg-indigo-500/5 shadow-2xl shadow-indigo-500/10 scale-[1.01]' 
                      : 'border-white/10 hover:border-white/15'
                  }`}
                >
                  {/* Camera overlay stream */}
                  {showCamera ? (
                    <div className="absolute inset-0 bg-black z-10 flex flex-col justify-between p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-400 font-mono flex items-center">
                          <Video className="w-3 h-3 text-rose-400 animate-pulse mr-1.5" />
                          LIVE WEBCAM VIEWPORT
                        </span>
                        <button 
                          onClick={stopCamera}
                          className="p-1 bg-white/10 hover:bg-white/20 rounded-lg text-gray-300 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex-1 my-3 rounded-2xl overflow-hidden bg-zinc-950 border border-white/5 relative flex items-center justify-center">
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          playsInline 
                          className="w-full h-full object-cover"
                        />
                        {/* Target frame overlay */}
                        <div className="absolute inset-6 border border-dashed border-white/20 rounded-xl pointer-events-none flex items-center justify-center">
                          <div className="text-[10px] text-white/40 font-mono bg-black/60 px-3 py-1 rounded-md">
                            Align plate centered here
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-3">
                        <button
                          onClick={stopCamera}
                          className="flex-1 py-3 border border-white/10 hover:border-white/15 bg-white/5 rounded-xl text-xs font-bold text-gray-300 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={capturePhoto}
                          className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer shadow-lg shadow-indigo-600/10"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Snap Snapshot</span>
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {selectedImage ? (
                    // Image Loaded State
                    <div className="flex-1 flex flex-col justify-between h-full space-y-4">
                      
                      {/* Image Preview with Zoom */}
                      <div className="relative overflow-hidden rounded-2xl border border-white/5 aspect-video flex items-center justify-center bg-black/40">
                        <img 
                          src={selectedImage} 
                          alt="Meal viewframe" 
                          style={{ transform: `scale(${zoom})`, transition: 'transform 0.15s ease-out' }}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        
                        {/* Interactive metadata label overlays */}
                        {imageInfo && (
                          <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-md text-[9px] font-mono text-gray-300 space-y-0.5">
                            <div>File: <strong className="text-white truncate max-w-[120px] inline-block align-bottom">{imageInfo.name}</strong></div>
                            <div>Specs: <strong className="text-white">{imageInfo.type} ({imageInfo.size})</strong></div>
                            {imageInfo.dimensions && <div>Dim: <strong className="text-white">{imageInfo.dimensions}</strong></div>}
                          </div>
                        )}

                        {/* Top-right Zoom badges */}
                        <div className="absolute bottom-3 right-3 flex items-center space-x-1 bg-black/70 backdrop-blur-md border border-white/10 p-1 rounded-lg">
                          <button 
                            onClick={() => setZoom(prev => Math.max(1.0, prev - 0.25))}
                            disabled={zoom <= 1.0}
                            className="p-1 hover:bg-white/10 disabled:opacity-30 rounded-md text-gray-300 transition-colors cursor-pointer"
                            title="Zoom Out"
                          >
                            <ZoomOut className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[10px] font-mono text-white px-1.5 min-w-[40px] text-center">
                            {Math.round(zoom * 100)}%
                          </span>
                          <button 
                            onClick={() => setZoom(prev => Math.min(2.5, prev + 0.25))}
                            disabled={zoom >= 2.5}
                            className="p-1 hover:bg-white/10 disabled:opacity-30 rounded-md text-gray-300 transition-colors cursor-pointer"
                            title="Zoom In"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Control buttons below preview */}
                      <div className="space-y-3">
                        <div className="flex space-x-3">
                          <button
                            onClick={handleClearImage}
                            disabled={isAnalyzing}
                            className="flex-1 py-3 border border-white/10 hover:bg-white/5 disabled:opacity-40 rounded-xl text-xs font-bold text-gray-300 transition-colors cursor-pointer"
                          >
                            Remove / Replace
                          </button>
                          
                          {!activeResult && (
                            <button
                              onClick={handleAnalyzeMeal}
                              disabled={isAnalyzing}
                              className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 hover:shadow-lg hover:shadow-indigo-500/10 text-white font-bold text-xs tracking-wider uppercase rounded-xl cursor-pointer transition-all flex items-center justify-center space-x-2 animate-breathe-glow"
                            >
                              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                              <span>Analyze Meal</span>
                            </button>
                          )}
                        </div>

                        {activeResult && (
                          <div className="p-3 bg-[#0d0d11]/80 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                            <span className="text-gray-400 font-mono">Status: <strong className="text-emerald-400 uppercase">Analyzed</strong></span>
                            <span className="text-[10px] text-gray-500 font-mono">Id: {activeResult.id.slice(-6)}</span>
                          </div>
                        )}
                      </div>

                    </div>
                  ) : (
                    // Empty Drop/Upload View
                    <div className="flex-1 flex flex-col justify-between h-full space-y-6">
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-gray-500 group-hover:text-indigo-400 transition-all shadow-inner">
                          <Upload className="w-8 h-8" />
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-white">Upload meal snapshot</p>
                          <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                            Drag and drop file here, paste from clipboard, or use the camera feed to capture.
                          </p>
                        </div>

                        <div className="flex items-center space-x-3 pt-2">
                          <label className="inline-flex items-center space-x-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold px-4 py-3 rounded-xl cursor-pointer transition-all">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Browse files</span>
                            <input 
                              type="file" 
                              onChange={handleFileChange} 
                              accept="image/*" 
                              className="hidden" 
                              ref={fileInputRef}
                            />
                          </label>

                          <button
                            onClick={startCamera}
                            className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-3 rounded-xl cursor-pointer transition-all shadow-md shadow-indigo-600/10"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Open Camera</span>
                          </button>
                        </div>
                      </div>

                      {/* Formats info */}
                      <div className="flex items-center justify-center space-x-4 border-t border-white/[0.03] pt-4 text-[10px] text-gray-500 font-mono">
                        <span>Max 5MB</span>
                        <span>•</span>
                        <span>PNG, JPG, WEBP</span>
                        <span>•</span>
                        <span>Duplicate Prevention</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Preset Meal Picker Options */}
                <div className="glass-panel rounded-3xl p-5 border border-white/5 space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">
                    Quick Sample Presets
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {MEAL_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectPreset(p.url, p.name)}
                        disabled={isAnalyzing}
                        className={`flex items-center space-x-2.5 p-2 rounded-xl bg-white/[0.01] border hover:border-indigo-500/25 hover:bg-indigo-500/[0.02] transition-all text-left cursor-pointer group disabled:opacity-40 ${
                          selectedImage === p.url ? 'border-indigo-500/30 bg-indigo-500/[0.03]' : 'border-white/5'
                        }`}
                      >
                        <img 
                          src={p.url} 
                          alt={p.name} 
                          className="w-11 h-11 object-cover rounded-lg border border-white/5" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block font-mono">Preset #{idx + 1}</span>
                          <span className="text-xs font-semibold text-gray-300 group-hover:text-white truncate block leading-snug">{p.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ACTIVE MEAL COMPARISON COMPONENT */}
                {activeResult && history.length > 1 && (
                  <div className="glass-panel rounded-3xl p-5 border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-widest font-mono">
                          Meal Benchmark Comparison
                        </h4>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="text-gray-400 font-mono">Compare with:</span>
                        <select
                          value={compareTargetId}
                          onChange={(e) => setCompareTargetId(e.target.value)}
                          className="bg-zinc-900 border border-white/10 rounded-lg text-xs py-1 px-2 focus:outline-none focus:border-indigo-500 font-sans text-gray-300 flex-1"
                        >
                          <option value="">-- Select past meal --</option>
                          {history
                            .filter(h => h.id !== activeResult.id)
                            .map(h => (
                              <option key={h.id} value={h.id}>{h.mealName} ({h.calories} kcal)</option>
                            ))
                          }
                        </select>
                      </div>

                      {comparisonResult ? (
                        <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-white/5 divide-y divide-white/[0.04] space-y-2.5">
                          <div className="text-[10px] text-gray-400 font-mono pb-2 leading-snug">
                            Benchmarked against: <strong className="text-white">{comparisonResult.targetName}</strong> logged on {comparisonResult.targetDate}
                          </div>

                          <div className="grid grid-cols-3 gap-2 pt-2.5">
                            {/* Calories diff */}
                            <div className="text-center">
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono block">Calories</span>
                              <div className={`text-xs font-bold mt-1 flex items-center justify-center space-x-0.5 ${
                                comparisonResult.caloriesDiff > 0 ? 'text-amber-400' : 'text-emerald-400'
                              }`}>
                                <span>{comparisonResult.caloriesDiff > 0 ? '+' : ''}{comparisonResult.caloriesDiff}</span>
                                <span className="text-[9px] font-normal text-gray-500">kcal</span>
                              </div>
                            </div>

                            {/* Protein diff */}
                            <div className="text-center">
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono block">Protein</span>
                              <div className={`text-xs font-bold mt-1 ${
                                comparisonResult.proteinDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}>
                                {comparisonResult.proteinDiff >= 0 ? '+' : ''}{comparisonResult.proteinDiff}g
                              </div>
                            </div>

                            {/* Health score diff */}
                            <div className="text-center">
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono block">Health score</span>
                              <div className={`text-xs font-bold mt-1 ${
                                comparisonResult.healthScoreDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}>
                                {comparisonResult.healthScoreDiff >= 0 ? '+' : ''}{comparisonResult.healthScoreDiff} pts
                              </div>
                            </div>
                          </div>

                          <p className="text-[10px] text-gray-500 leading-relaxed pt-2">
                            {comparisonResult.healthScoreDiff >= 0 
                              ? "✓ This scanned meal holds a superior nutritional grading compared to your benchmark selection."
                              : "⚠ Your benchmark choice delivers superior micronutrient and wellness indexes."
                            }
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 border-dashed text-center text-xs text-gray-500">
                          Please select a prior meal scan above to calculate thermodynamic differences.
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>

              {/* RIGHT BOX: Scan Result & Deep Analytics dashboard (Cols: 7) */}
              <div className="lg:col-span-7">
                
                {isAnalyzing ? (
                  // Multi-Stage Scanning Timeline View
                  <div className="rounded-3xl glass-card p-8 border border-white/10 space-y-8 animate-pulse min-h-[500px] flex flex-col justify-center">
                    <div className="text-center space-y-3">
                      <div className="inline-flex w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-400/20 items-center justify-center">
                        <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
                      </div>
                      <h3 className="text-lg font-display font-bold text-white tracking-tight">
                        Aura Visual Decomposition Active
                      </h3>
                      <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                        Scanning textures, estimating thermodynamic weight coefficients, and matching recipe arrays...
                      </p>
                    </div>

                    {/* Progress timeline */}
                    <div className="max-w-xs mx-auto space-y-3">
                      {STAGES_LIST.map((stage, idx) => {
                        const currentStageIdx = STAGES_LIST.indexOf(currentStage);
                        const isDone = idx < currentStageIdx;
                        const isCurrent = idx === currentStageIdx;

                        return (
                          <div 
                            key={idx}
                            className={`flex items-center space-x-3 text-xs transition-all duration-300 ${
                              isDone ? 'text-emerald-400' : isCurrent ? 'text-indigo-400 font-semibold' : 'text-gray-600'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] font-mono ${
                              isDone 
                                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' 
                                : isCurrent
                                  ? 'bg-indigo-500/10 border-indigo-400 text-indigo-400'
                                  : 'bg-zinc-900 border-white/5 text-gray-600'
                            }`}>
                              {isDone ? <Check className="w-3 h-3" /> : idx + 1}
                            </div>
                            <span className="font-mono">{stage}</span>
                            {isCurrent && <span className="text-[8px] uppercase tracking-widest font-bold bg-indigo-500/20 px-1.5 py-0.5 rounded animate-pulse">Running</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : activeResult ? (
                  // Detailed scan result report
                  <div className="rounded-3xl glass-card p-6 border border-white/10 space-y-6 animate-fade-in">
                    
                    {/* Header Details */}
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/5 pb-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 font-mono">
                          Scanned Report Output
                        </span>
                        <h2 className="text-xl font-display font-extrabold text-white mt-0.5 tracking-tight">
                          {activeResult.mealName}
                        </h2>
                        <div className="flex items-center space-x-3 mt-1.5 text-xs text-gray-400 font-mono">
                          <span className="flex items-center">
                            <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                            {activeResult.scanDate}
                          </span>
                          <span>•</span>
                          <span>Portion Size: <strong className="text-gray-200">{activeResult.servingSize}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Download JSON data */}
                        <button
                          onClick={handleExportJson}
                          className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white border border-white/5 transition-colors cursor-pointer"
                          title="Download Report JSON Data"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        {/* Export PDF */}
                        <button
                          onClick={handleExportPdf}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 px-3.5 rounded-xl transition-all shadow shadow-indigo-600/10 flex items-center space-x-1.5 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Export PDF</span>
                        </button>
                      </div>
                    </div>

                    {/* Caloric Density & Macro Rings Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                      
                      {/* Calories badge */}
                      <div className="sm:col-span-5 p-5 rounded-2xl bg-white/[0.01] border border-white/5 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono">Estimated Heat Energy</span>
                          <h3 className="text-3xl font-display font-black text-white mt-1">
                            {activeResult.calories} <span className="text-xs font-sans font-normal text-gray-400">kcal</span>
                          </h3>
                        </div>
                        <div className="w-11 h-11 rounded-xl bg-orange-500/10 flex items-center justify-center">
                          <Flame className="w-5 h-5 text-orange-400" />
                        </div>
                      </div>

                      {/* Health score circle */}
                      <div className="sm:col-span-7 flex items-center justify-between p-4 rounded-2xl bg-zinc-950/40 border border-white/5">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono">Overall Health Index</span>
                          <p className="text-xs text-gray-400 leading-relaxed max-w-[200px]">
                            A composite score grading food freshness, glycemic levels, and micro density.
                          </p>
                        </div>
                        
                        <div className="relative flex items-center justify-center w-20 h-20">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle className="stroke-white/5" fill="transparent" strokeWidth="6" r="32" cx="40" cy="40" />
                            <circle 
                              className={`transition-all duration-1000 ease-out ${
                                activeResult.healthScore >= 80 ? 'stroke-emerald-400' : activeResult.healthScore >= 60 ? 'stroke-amber-400' : 'stroke-rose-400'
                              }`} 
                              fill="transparent" 
                              strokeWidth="6" 
                              strokeDasharray="201" 
                              strokeDashoffset={201 - (activeResult.healthScore / 100) * 201}
                              strokeLinecap="round" 
                              r="32" 
                              cx="40" 
                              cy="40" 
                            />
                          </svg>
                          <div className="absolute text-center flex flex-col items-center justify-center">
                            <span className="text-base font-display font-bold text-white">{activeResult.healthScore}</span>
                            <span className="text-[7px] text-gray-400 font-bold uppercase tracking-wider">grade</span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Macro Budgets Progress Meters */}
                    <div className="grid grid-cols-3 gap-4">
                      {/* Protein */}
                      <div className="p-4 rounded-2xl bg-indigo-500/[0.02] border border-indigo-500/10 text-center relative overflow-hidden group">
                        <div className="absolute -top-6 -right-6 w-14 h-14 bg-indigo-500/5 rounded-full blur-xl" />
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono block">Protein</span>
                        <h4 className="text-xl font-display font-extrabold text-indigo-400 mt-1">{activeResult.protein}g</h4>
                        <div className="h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                          <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${Math.min(100, (activeResult.protein / 50) * 100)}%` }} />
                        </div>
                      </div>

                      {/* Carbohydrates */}
                      <div className="p-4 rounded-2xl bg-purple-500/[0.02] border border-purple-500/10 text-center relative overflow-hidden group">
                        <div className="absolute -top-6 -right-6 w-14 h-14 bg-purple-500/5 rounded-full blur-xl" />
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono block">Carbohydrates</span>
                        <h4 className="text-xl font-display font-extrabold text-purple-400 mt-1">{activeResult.carbs}g</h4>
                        <div className="h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                          <div className="h-full bg-purple-400 rounded-full" style={{ width: `${Math.min(100, (activeResult.carbs / 80) * 100)}%` }} />
                        </div>
                      </div>

                      {/* Fats */}
                      <div className="p-4 rounded-2xl bg-sky-500/[0.02] border border-sky-500/10 text-center relative overflow-hidden group">
                        <div className="absolute -top-6 -right-6 w-14 h-14 bg-sky-500/5 rounded-full blur-xl" />
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono block">Fats</span>
                        <h4 className="text-xl font-display font-extrabold text-sky-400 mt-1">{activeResult.fat}g</h4>
                        <div className="h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                          <div className="h-full bg-sky-400 rounded-full" style={{ width: `${Math.min(100, (activeResult.fat / 35) * 100)}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Secondary nutritional parameters */}
                    <div className="p-3 bg-zinc-950/60 rounded-xl border border-white/5 grid grid-cols-3 gap-3 text-center text-xs text-gray-400 font-mono">
                      <div>Fiber: <strong className="text-gray-200">{activeResult.fiber}g</strong></div>
                      <div>Sugar: <strong className="text-gray-200">{activeResult.sugar}g</strong></div>
                      <div>Sodium: <strong className="text-gray-200">{activeResult.sodium}mg</strong></div>
                    </div>

                    {/* Multiple Food Detection Decomposition list */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono block">
                          Plate Ingredient Decomposition ({activeResult.detectedFoods.length})
                        </span>
                        <span className="text-[9px] text-gray-500 font-mono">Vision Scan accuracy rating</span>
                      </div>

                      <div className="space-y-2.5">
                        {activeResult.detectedFoods.map((food, idx) => (
                          <div 
                            key={idx}
                            className="p-3.5 rounded-xl bg-[#09090c]/80 border border-white/5 hover:border-white/10 transition-all flex items-center justify-between gap-4"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-semibold text-white block truncate">{food.name}</span>
                              <div className="flex items-center space-x-3 text-[10px] text-gray-400 font-mono mt-0.5">
                                <span className="text-indigo-400">{food.calories} kcal</span>
                                <span>•</span>
                                <span>P: {food.protein}g</span>
                                <span>•</span>
                                <span>C: {food.carbs}g</span>
                                <span>•</span>
                                <span>F: {food.fat}g</span>
                              </div>
                            </div>

                            {/* Confidence rating bar */}
                            <div className="text-right flex-shrink-0 min-w-[70px]">
                              <span className="text-[10px] text-gray-400 font-mono block">Conf: {food.confidence}%</span>
                              <div className="w-14 h-1 bg-white/10 rounded-full mt-1 overflow-hidden ml-auto">
                                <div 
                                  className={`h-full rounded-full ${
                                    food.confidence >= 95 ? 'bg-emerald-400' : food.confidence >= 80 ? 'bg-indigo-400' : 'bg-amber-400'
                                  }`} 
                                  style={{ width: `${food.confidence}%` }} 
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Insights Cards Grid */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono block">
                        Aura Intelligent Analysis Insights
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {activeResult.insights.map((ins) => (
                          <div 
                            key={ins.id}
                            className={`p-3.5 rounded-xl border flex flex-col justify-between text-xs space-y-2 ${
                              ins.type === 'success' 
                                ? 'bg-emerald-500/[0.01] border-emerald-500/10' 
                                : ins.type === 'warning'
                                  ? 'bg-amber-500/[0.01] border-amber-500/10'
                                  : ins.type === 'error'
                                    ? 'bg-rose-500/[0.01] border-rose-500/10'
                                    : 'bg-white/[0.01] border-white/5'
                            }`}
                          >
                            <div className="flex items-center space-x-1.5 font-bold uppercase tracking-wider text-[9px]">
                              {ins.type === 'success' && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                              {ins.type === 'warning' && <AlertCircle className="w-3.5 h-3.5 text-amber-400" />}
                              {ins.type === 'error' && <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />}
                              {ins.type === 'info' && <Activity className="w-3.5 h-3.5 text-indigo-400" />}
                              
                              <span className={
                                ins.type === 'success' ? 'text-emerald-400' : ins.type === 'warning' ? 'text-amber-400' : ins.type === 'error' ? 'text-rose-400' : 'text-indigo-400'
                              }>
                                {ins.title}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400 leading-normal">{ins.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Recommendations Prepared section */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono block">
                        Coach Clinical Recommendations & Alternatives
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {activeResult.recommendations.map((rec) => (
                          <div 
                            key={rec.id}
                            className="p-4 rounded-xl bg-zinc-950/60 border border-white/5 hover:border-indigo-500/10 transition-all flex flex-col justify-between"
                          >
                            <div>
                              <span className="text-[8px] font-mono font-bold uppercase tracking-widest bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-400/20">
                                {rec.tag}
                              </span>
                              <h5 className="text-xs font-bold text-white mt-2 leading-snug">{rec.title}</h5>
                              <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">{rec.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                ) : (
                  // Empty results state
                  <div className="rounded-3xl glass-card p-10 border border-white/10 flex flex-col items-center justify-center text-center min-h-[500px] space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.01] border border-white/5 flex items-center justify-center text-gray-600">
                      <ScanLine className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-display font-bold text-gray-300">Awaiting Plate Scan</h3>
                      <p className="text-xs text-gray-500 max-w-sm leading-relaxed mx-auto">
                        Provide a photo of your meal plate using manual upload or presets, then click <strong>Analyze Meal</strong> to see macronutrients and insights.
                      </p>
                    </div>
                  </div>
                )}

              </div>

            </div>

            {/* FULL-WIDTH SECTION: Searchable Scan History ledger & ledger items */}
            <div className="glass-panel rounded-3xl p-6 border border-white/5 space-y-6">
              
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-5">
                <div>
                  <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider">
                    Meal Vision Archives Logs
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Browse and review all past image scans. Select any record to load its nutrition metrics back.
                  </p>
                </div>

                {/* Search query input bar */}
                <div className="relative flex-shrink-0 min-w-[240px]">
                  <Search className="absolute left-3.5 top-[11px] w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search meal logs..."
                    className="w-full bg-[#0d0d11]/75 border border-white/10 rounded-xl pl-9.5 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-[10px] text-gray-500 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {filteredHistory.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredHistory.map((item) => {
                    const isSelected = activeResult?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleRestoreHistoricScan(item)}
                        className={`p-3.5 rounded-2xl bg-[#09090c]/40 border cursor-pointer group hover:border-indigo-500/20 hover:bg-[#09090c]/80 transition-all flex items-center justify-between gap-4 ${
                          isSelected ? 'border-indigo-500/35 bg-indigo-500/[0.02]' : 'border-white/5'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <img 
                            src={item.imageUrl} 
                            alt={item.mealName} 
                            className="w-14 h-14 object-cover rounded-lg border border-white/5" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-[8px] font-mono font-bold text-gray-500 block">{item.scanDate}</span>
                            <h4 className="text-xs font-bold text-gray-200 group-hover:text-white truncate block leading-snug mt-0.5">{item.mealName}</h4>
                            <div className="flex items-center space-x-2 text-[10px] text-indigo-400 font-mono mt-1">
                              <span>{item.calories} kcal</span>
                              <span>•</span>
                              <span className="text-emerald-400">Health: {item.healthScore}</span>
                            </div>
                          </div>
                        </div>

                        {/* Delete single scan history item */}
                        <button
                          onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                          className="p-1.5 hover:bg-rose-500/10 hover:text-rose-400 text-gray-600 rounded-lg transition-colors cursor-pointer"
                          title="Delete archived scan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl bg-white/[0.01] border border-white/5 border-dashed space-y-2">
                  <Sliders className="w-8 h-8 text-gray-600 mx-auto" />
                  <p className="text-xs text-gray-400">
                    {searchQuery ? "No search results match your criteria." : "No archived meal scans recorded yet."}
                  </p>
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
