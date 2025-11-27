
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Dropzone } from './components/Dropzone';
import { SettingsPanel } from './components/SettingsPanel';
import { ComparisonSlider } from './components/ComparisonSlider';
import { ManualEditor } from './components/ManualEditor'; // Import new component
import { ProcessedImage, Settings } from './types';
import { colorizeMangaPage, fileToBase64 } from './services/geminiService';
import { Loader2, Sparkles, AlertCircle, Layout, Trash2, CheckCircle2, Lock, Key, X, Edit3 } from 'lucide-react';

const App: React.FC = () => {
  // === API Key Gating State ===
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [isCheckingKey, setIsCheckingKey] = useState<boolean>(true);
  const [bypassAuth, setBypassAuth] = useState<boolean>(false);

  // === App State ===
  const [pages, setPages] = useState<ProcessedImage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<Settings>({
    model: 'gemini-3-pro-image-preview', // Default to better model for "sexy" results
    instructions: '',
    referenceImage: null
  });
  
  const [processingTime, setProcessingTime] = useState(0);
  const [isEditing, setIsEditing] = useState(false); // Track editing mode

  const selectedPage = pages.find(p => p.id === selectedPageId) || null;
  const isProcessing = pages.some(p => p.status === 'processing');

  // === Check API Key on Mount ===
  useEffect(() => {
    const checkKey = async () => {
      setIsCheckingKey(true);
      try {
        if (window.aistudio && window.aistudio.hasSelectedApiKey) {
          const has = await window.aistudio.hasSelectedApiKey();
          setHasApiKey(has);
        } else {
          // Fallback for environments without the wrapper (e.g. local dev), assume provided via env
          setHasApiKey(true);
        }
      } catch (e) {
        console.error("Error checking API key:", e);
        setHasApiKey(false);
      } finally {
        setIsCheckingKey(false);
      }
    };
    checkKey();
  }, []);

  const handleConnectKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      await window.aistudio.openSelectKey();
      // Assume success to proceed, handle potential failure in API call later
      setHasApiKey(true);
    }
  };

  useEffect(() => {
    let interval: number;
    if (isProcessing) {
      const start = Date.now();
      interval = window.setInterval(() => {
        setProcessingTime(((Date.now() - start) / 1000));
      }, 100);
    } else {
      setProcessingTime(0);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  // Reset editing mode when switching pages
  useEffect(() => {
    setIsEditing(false);
  }, [selectedPageId]);

  const handleFilesSelect = async (files: File[]) => {
    try {
      const newPages: ProcessedImage[] = [];
      
      for (const file of files) {
        const base64 = await fileToBase64(file);
        newPages.push({
          id: crypto.randomUUID(),
          originalUrl: `data:${file.type};base64,${base64}`,
          colorizedUrl: null,
          status: 'idle',
          customPrompt: ''
        });
      }

      setPages(prev => [...prev, ...newPages]);
      if (!selectedPageId && newPages.length > 0) {
        setSelectedPageId(newPages[0].id);
      }
    } catch (e) {
      console.error("File reading error", e);
      alert("Failed to read one or more files.");
    }
  };

  const updatePage = (id: string, updates: Partial<ProcessedImage>) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const processPage = async (pageId: string) => {
    const pageToProcess = pages.find(p => p.id === pageId);
    if (!pageToProcess) return;

    // Update status to processing
    updatePage(pageId, { status: 'processing', error: undefined });
    setIsEditing(false);

    try {
      const base64Data = pageToProcess.originalUrl.split(',')[1];
      const mimeType = pageToProcess.originalUrl.split(';')[0].split(':')[1];

      const colorizedBase64 = await colorizeMangaPage({
        imageBase64: base64Data,
        mimeType,
        settings,
        specificPrompt: pageToProcess.customPrompt // Use the specific page prompt
      });

      updatePage(pageId, { 
        status: 'completed', 
        colorizedUrl: colorizedBase64 
      });

    } catch (error: any) {
      const errorMessage = error.message || "Failed.";
      
      // If error is 403 or permission denied or entity not found, force re-selection of key
      if (
        errorMessage.includes("403") || 
        errorMessage.includes("PERMISSION_DENIED") || 
        errorMessage.includes("Requested entity was not found")
      ) {
         updatePage(pageId, { status: 'idle', error: "API Key Permission Error. Please reconnect." });
         setHasApiKey(false);
         setBypassAuth(false); // Reset bypass so lock screen appears
         return;
      }

      updatePage(pageId, { 
        status: 'error', 
        error: errorMessage
      });
    }
  };

  const handleProcessSelected = () => {
    if (selectedPageId) processPage(selectedPageId);
  };

  const handleDeletePage = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setPages(prev => {
      const newPages = prev.filter(p => p.id !== id);
      if (selectedPageId === id) {
        setSelectedPageId(newPages.length > 0 ? newPages[0].id : null);
      }
      return newPages;
    });
  };

  const handleManualSave = (newImageUrl: string) => {
    if (selectedPageId) {
      updatePage(selectedPageId, { colorizedUrl: newImageUrl });
      setIsEditing(false);
    }
  };

  // === RENDER: API KEY LOCK SCREEN ===
  if (isCheckingKey) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  if (!hasApiKey && !bypassAuth) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col relative overflow-hidden">
        <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
        <Header />
        
        <div className="flex-1 flex flex-col items-center justify-center p-6 z-10">
          <div className="max-w-md w-full glass-panel p-8 rounded-2xl border border-white/10 shadow-2xl flex flex-col items-center text-center space-y-6 relative">
            
            <button 
              onClick={() => {
                setSettings(prev => ({ ...prev, model: 'gemini-2.5-flash-image' }));
                setBypassAuth(true);
              }}
              className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center ring-1 ring-violet-500/50 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
              <Lock className="w-8 h-8 text-violet-400" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold font-display text-white">Unlock Studio Access</h1>
              <p className="text-zinc-400 text-sm leading-relaxed">
                ChromaManga uses the professional 
                <span className="text-fuchsia-400 font-bold mx-1">Gemini 3 Pro</span> 
                model for high-fidelity colorization. To continue, please connect a billing-enabled API Key.
              </p>
            </div>

            <button 
              onClick={handleConnectKey}
              className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-xl shadow-lg shadow-violet-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Key className="w-4 h-4" />
              Connect API Key
            </button>

            <div className="pt-2">
              <button 
                onClick={() => {
                  setSettings(prev => ({ ...prev, model: 'gemini-2.5-flash-image' }));
                  setBypassAuth(true);
                }}
                className="text-xs text-zinc-500 hover:text-violet-300 underline underline-offset-4 transition-colors"
              >
                Or continue with Nano Banana 2.5 (Free)
              </button>
            </div>

            <p className="text-[10px] text-zinc-600">
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="hover:text-zinc-400 underline decoration-zinc-700">
                Learn about Gemini API billing
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // === RENDER: MAIN APP ===
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-violet-500/30 overflow-hidden flex flex-col">
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      
      <Header />

      <div className="flex-1 flex pt-16 h-screen overflow-hidden">
        
        {/* Left Sidebar: Film Strip (Hidden when Editing to give space) */}
        {!isEditing && pages.length > 0 && (
          <aside className="w-64 bg-black/40 border-r border-white/5 flex flex-col h-full z-10 glass-panel">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="font-bold text-sm text-zinc-400 flex items-center gap-2">
                <Layout className="w-4 h-4" />
                STORY BOARD
              </h2>
              <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-500">{pages.length}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {pages.map((page, index) => (
                <div 
                  key={page.id}
                  onClick={() => setSelectedPageId(page.id)}
                  className={`relative group rounded-xl p-2 border transition-all cursor-pointer ${
                    selectedPageId === page.id 
                      ? 'bg-violet-500/10 border-violet-500/50' 
                      : 'bg-zinc-900/50 border-transparent hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-[10px] font-mono text-zinc-600 pt-1">{(index + 1).toString().padStart(2, '0')}</span>
                    <div className="relative w-16 h-20 bg-black rounded-lg overflow-hidden shrink-0 border border-white/5">
                      <img 
                        src={page.colorizedUrl || page.originalUrl} 
                        className={`w-full h-full object-cover transition-opacity ${page.status === 'processing' ? 'opacity-50' : 'opacity-100'}`}
                        alt={`Page ${index + 1}`}
                      />
                      {page.status === 'processing' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                        </div>
                      )}
                      {page.status === 'completed' && (
                        <div className="absolute bottom-1 right-1 bg-green-500 rounded-full p-0.5">
                          <CheckCircle2 className="w-2 h-2 text-white" />
                        </div>
                      )}
                      {page.status === 'error' && (
                        <div className="absolute bottom-1 right-1 bg-red-500 rounded-full p-0.5">
                          <AlertCircle className="w-2 h-2 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between h-20 py-1">
                      <p className="text-xs font-medium text-zinc-300 truncate">Page {index + 1}</p>
                      <p className="text-[10px] text-zinc-500 capitalize">{page.status}</p>
                      <button 
                        onClick={(e) => handleDeletePage(e, page.id)}
                        className="self-end p-1.5 hover:bg-red-500/20 rounded text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="pt-2">
                 <Dropzone onFilesSelect={handleFilesSelect} compact />
              </div>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 relative flex flex-col h-full overflow-hidden">
          
          {pages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-900/30 border border-violet-500/30 text-violet-300 text-xs font-bold uppercase tracking-wider mb-6">
                 <Sparkles className="w-3 h-3" />
                 <span>Consistent AI Colorization</span>
               </div>
               <h1 className="text-4xl lg:text-6xl font-bold font-display tracking-tight leading-tight text-center mb-6">
                 Studio Mode <br />
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-white">
                   Activated
                 </span>
               </h1>
               <p className="text-lg text-zinc-400 max-w-xl text-center mb-12">
                 Upload your manga chapters. Use the consistency engine to keep character colors uniform across all panels.
               </p>
               <Dropzone onFilesSelect={handleFilesSelect} />
            </div>
          ) : (
            isEditing && selectedPage && selectedPage.colorizedUrl ? (
              // === MANUAL EDITOR MODE ===
              <div className="flex-1 flex flex-col h-full overflow-hidden relative animate-fade-in">
                 <ManualEditor 
                    imageUrl={selectedPage.colorizedUrl} 
                    onSave={handleManualSave}
                    onCancel={() => setIsEditing(false)}
                 />
              </div>
            ) : (
              // === STANDARD VIEWER MODE ===
              <div className="flex-1 flex flex-col p-6 h-full overflow-hidden relative">
                
                {/* Toolbar */}
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                   <div>
                     <h2 className="text-2xl font-bold font-display">Editor</h2>
                     <p className="text-xs text-zinc-500 font-mono">
                       {selectedPageId ? `ID: ${selectedPageId.split('-')[0]}...` : 'Select a page'}
                     </p>
                   </div>
                   
                   {selectedPage && selectedPage.status !== 'processing' && (
                     <div className="flex gap-3">
                       {selectedPage.status === 'completed' && selectedPage.colorizedUrl && (
                         <button
                           onClick={() => setIsEditing(true)}
                           className="px-4 py-2 bg-zinc-800 text-zinc-200 font-bold text-sm rounded-lg hover:bg-zinc-700 transition-all flex items-center gap-2 border border-white/5"
                         >
                           <Edit3 className="w-4 h-4" />
                           Hand Edit
                         </button>
                       )}
                       
                       <button
                         onClick={handleProcessSelected}
                         className="group relative px-6 py-2 bg-white text-black font-bold text-sm rounded-lg shadow-lg shadow-violet-500/10 hover:shadow-violet-500/20 hover:scale-105 active:scale-95 transition-all overflow-hidden"
                       >
                         <div className="absolute inset-0 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 opacity-0 group-hover:opacity-20 transition-opacity animate-gradient-x"></div>
                         <span className="relative flex items-center gap-2">
                           <Sparkles className="w-4 h-4 text-violet-600" />
                           {selectedPage.status === 'completed' ? 'Regenerate' : 'Colorize Page'}
                         </span>
                       </button>
                     </div>
                   )}
                </div>

                {/* Canvas Area */}
                <div className="flex-1 relative rounded-2xl overflow-hidden bg-[#0c0c0e] border border-white/5 shadow-2xl flex items-center justify-center">
                   {selectedPage ? (
                      <div className="w-full h-full p-4 flex items-center justify-center relative">
                         {selectedPage.status === 'processing' && (
                            <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                               <div className="relative w-20 h-20 mb-6">
                                 <div className="absolute inset-0 border-4 border-violet-500/20 rounded-full"></div>
                                 <div className="absolute inset-0 border-t-4 border-violet-500 rounded-full animate-spin"></div>
                                 <div className="absolute inset-0 flex items-center justify-center">
                                   <span className="text-xs font-mono text-violet-300">{processingTime.toFixed(0)}s</span>
                                 </div>
                               </div>
                               <p className="text-white font-medium animate-pulse">Analyzing Ink & Shadows...</p>
                            </div>
                         )}

                         {selectedPage.status === 'completed' && selectedPage.colorizedUrl ? (
                           <ComparisonSlider 
                             beforeImage={selectedPage.originalUrl}
                             afterImage={selectedPage.colorizedUrl}
                             onReset={() => {}} // No-op in list mode, just regenerate
                           />
                         ) : (
                           <img 
                             src={selectedPage.originalUrl} 
                             className="max-w-full max-h-full object-contain shadow-2xl" 
                             alt="Original"
                           />
                         )}
                         
                         {selectedPage.status === 'error' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                               <div className="bg-zinc-900 p-6 rounded-2xl border border-red-500/30 max-w-md text-center">
                                 <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
                                 <h3 className="text-lg font-bold text-white mb-2">Error Processing Page</h3>
                                 <p className="text-sm text-zinc-400">{selectedPage.error}</p>
                               </div>
                            </div>
                         )}
                      </div>
                   ) : (
                     <div className="text-zinc-500 flex flex-col items-center gap-4">
                       <Layout className="w-12 h-12 opacity-20" />
                       <p>Select a page from the storyboard</p>
                     </div>
                   )}
                </div>

              </div>
            )
          )}
        </main>

        {/* Right Settings Panel (Hidden when editing to maximize space) */}
        {!isEditing && pages.length > 0 && (
          <aside className="w-80 border-l border-white/5 h-full z-10 bg-black/40 backdrop-blur-xl">
             <SettingsPanel 
               settings={settings} 
               onSettingsChange={setSettings} 
               selectedPage={selectedPage}
               onPageUpdate={updatePage}
               disabled={isProcessing}
             />
          </aside>
        )}

      </div>
    </div>
  );
};

export default App;
