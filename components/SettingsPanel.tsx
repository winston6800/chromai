import React, { useRef } from 'react';
import { Settings, ProcessedImage } from '../types';
import { Plus, X, Wand2, Layers, Zap, PenTool, Lightbulb } from 'lucide-react';
import { fileToBase64 } from '../services/geminiService';

interface SettingsPanelProps {
  settings: Settings;
  onSettingsChange: (newSettings: Settings) => void;
  selectedPage: ProcessedImage | null;
  onPageUpdate: (id: string, updates: Partial<ProcessedImage>) => void;
  disabled: boolean;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  settings, 
  onSettingsChange, 
  selectedPage,
  onPageUpdate,
  disabled 
}) => {
  const refInputRef = useRef<HTMLInputElement>(null);

  const handleModelToggle = (modelName: 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview') => {
    onSettingsChange({ ...settings, model: modelName });
  };

  const handleReferenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await fileToBase64(e.target.files[0]);
        onSettingsChange({ ...settings, referenceImage: base64 });
      } catch (err) {
        console.error("Failed to load reference image");
      }
    }
  };

  return (
    <div className="w-full h-full glass-panel flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* === Global Settings Section === */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <Layers className="w-5 h-5 text-violet-400" />
            <h3 className="font-bold text-lg">Project Settings</h3>
          </div>

          {/* Consistency Engine */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-zinc-400 flex items-center justify-between">
              <span>Consistency Reference</span>
            </label>
            
            {settings.referenceImage ? (
              <div className="relative group w-full aspect-video rounded-xl overflow-hidden border border-violet-500/30 shadow-lg shadow-black/20">
                 <img 
                  src={`data:image/png;base64,${settings.referenceImage}`} 
                  className="w-full h-full object-cover" 
                  alt="Reference" 
                 />
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => onSettingsChange({ ...settings, referenceImage: null })}
                      className="p-2 bg-red-500/80 rounded-full hover:bg-red-500 text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                 </div>
                 <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-xs text-white font-medium backdrop-blur-sm">
                   Master Reference
                 </div>
              </div>
            ) : (
              <button 
                onClick={() => refInputRef.current?.click()}
                disabled={disabled}
                className="w-full py-6 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/30 hover:border-violet-500 hover:bg-violet-500/5 transition-all flex flex-col items-center gap-2 group"
              >
                 <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                   <Plus className="w-4 h-4 text-zinc-400" />
                 </div>
                 <div className="text-center">
                   <span className="text-xs font-bold text-zinc-300">Upload Character Sheet</span>
                   <p className="text-[10px] text-zinc-500">Ensures consistent colors across pages</p>
                 </div>
              </button>
            )}
            <input 
              type="file" 
              ref={refInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleReferenceUpload}
            />
          </div>

          {/* Model Selection */}
          <div className="space-y-3">
             <label className="text-sm font-medium text-zinc-400">AI Model</label>
             <div className="flex flex-col gap-2">
               <button
                 onClick={() => handleModelToggle('gemini-2.5-flash-image')}
                 disabled={disabled}
                 className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                   settings.model === 'gemini-2.5-flash-image'
                     ? 'bg-violet-600/20 border-violet-500 shadow-md'
                     : 'bg-zinc-900/50 border-white/5 hover:bg-zinc-800'
                 }`}
               >
                 <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${settings.model === 'gemini-2.5-flash-image' ? 'bg-violet-500' : 'bg-zinc-800'}`}>
                    <Zap className="w-4 h-4 text-white" />
                 </div>
                 <div className="text-left">
                   <div className={`text-sm font-bold ${settings.model === 'gemini-2.5-flash-image' ? 'text-white' : 'text-zinc-400'}`}>Nano Banana 2.5</div>
                   <div className="text-[10px] text-zinc-500">Fast • Experimental</div>
                 </div>
               </button>

               <button
                 onClick={() => handleModelToggle('gemini-3-pro-image-preview')}
                 disabled={disabled}
                 className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                   settings.model === 'gemini-3-pro-image-preview'
                     ? 'bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 border-fuchsia-500 shadow-md'
                     : 'bg-zinc-900/50 border-white/5 hover:bg-zinc-800'
                 }`}
               >
                 <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${settings.model === 'gemini-3-pro-image-preview' ? 'bg-fuchsia-500' : 'bg-zinc-800'}`}>
                    <Wand2 className="w-4 h-4 text-white" />
                 </div>
                 <div className="text-left">
                   <div className={`text-sm font-bold ${settings.model === 'gemini-3-pro-image-preview' ? 'text-white' : 'text-zinc-400'}`}>Gemini 3 Pro</div>
                   <div className="text-[10px] text-zinc-500">Best Quality • High Detail</div>
                 </div>
               </button>
             </div>
          </div>

          {/* Global Style/Instructions */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-zinc-400">Global Style Instructions</label>
            <textarea
              value={settings.instructions}
              onChange={(e) => onSettingsChange({ ...settings, instructions: e.target.value })}
              disabled={disabled}
              placeholder="e.g. Use a retro 90s aesthetic, muted colors, and high contrast shadows. Ensure all magic effects are purple."
              className="w-full bg-zinc-900/80 border border-white/10 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none h-28"
            />
            
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex gap-3">
              <Lightbulb className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div className="text-[10px] text-blue-200 leading-tight">
                <span className="font-bold text-blue-300">Pro Tip:</span> Models might not know every character name perfectly. For best results with specific palettes (like "Yotsuba"), 
                <span className="text-white font-bold cursor-pointer hover:underline" onClick={() => refInputRef.current?.click()}> upload a Reference Image</span> of the character.
              </div>
            </div>
          </div>
        </div>

        {/* === Page Settings Section === */}
        {selectedPage && (
          <div className="space-y-4 pt-4 border-t border-white/10 animate-fade-in">
             <div className="flex items-center gap-2">
                <PenTool className="w-4 h-4 text-fuchsia-400" />
                <h3 className="font-bold text-sm text-zinc-200">Selected Page Details</h3>
             </div>
             
             <div className="space-y-2">
               <label className="text-xs text-zinc-500">Prompt / Changes for this page</label>
               <div className="relative">
                 <textarea
                   value={selectedPage.customPrompt || ''}
                   onChange={(e) => onPageUpdate(selectedPage.id, { customPrompt: e.target.value })}
                   disabled={disabled}
                   placeholder="E.g. Make the explosion blue, ensure the background is sunset..."
                   className="w-full bg-zinc-900/80 border border-fuchsia-500/30 rounded-xl p-3 pl-3 pr-8 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 resize-none h-24"
                 />
                 <Wand2 className="absolute top-3 right-3 w-3 h-3 text-fuchsia-500/50 pointer-events-none" />
               </div>
               <p className="text-[10px] text-zinc-600">
                 *Instructions here apply only to the selected page.
               </p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};