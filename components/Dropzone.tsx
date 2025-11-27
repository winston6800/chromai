import React, { useRef, useState } from 'react';
import { UploadCloud, FileWarning } from 'lucide-react';
import { ACCEPTED_TYPES, MAX_FILE_SIZE_MB } from '../constants';

interface DropzoneProps {
  onFilesSelect: (files: File[]) => void;
  compact?: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFilesSelect, compact = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndPass = (fileList: FileList) => {
    setError(null);
    const validFiles: File[] = [];
    
    Array.from(fileList).forEach(file => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Some files were skipped (invalid type). Use PNG, JPG, or WEBP.");
        return;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(`Some files were skipped (too large > ${MAX_FILE_SIZE_MB}MB).`);
        return;
      }
      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      onFilesSelect(validFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndPass(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndPass(e.target.files);
    }
  };

  if (compact) {
    return (
       <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full h-32 rounded-xl border-2 border-dashed border-zinc-700 hover:border-violet-500 hover:bg-violet-500/5 transition-all flex flex-col items-center justify-center gap-2 group"
       >
         <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleChange} 
            className="hidden" 
            multiple
            accept={ACCEPTED_TYPES.join(',')}
          />
         <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform">
            <UploadCloud className="w-5 h-5 text-zinc-400 group-hover:text-white" />
         </div>
         <span className="text-xs font-medium text-zinc-500 group-hover:text-zinc-300">Add Pages</span>
       </button>
    );
  }

  return (
    <div 
      className={`relative group w-full max-w-2xl mx-auto h-80 rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden ${
        isDragging 
          ? 'border-violet-500 bg-violet-500/10 scale-[1.02]' 
          : 'border-zinc-700 bg-zinc-900/30 hover:border-zinc-500 hover:bg-zinc-800/50'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleChange} 
        className="hidden" 
        multiple
        accept={ACCEPTED_TYPES.join(',')}
      />
      
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="z-10 flex flex-col items-center gap-4 text-center px-4">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
          isDragging ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/40' : 'bg-zinc-800 text-zinc-400 group-hover:scale-110 group-hover:text-white'
        }`}>
          {error ? <FileWarning className="w-8 h-8 text-red-400" /> : <UploadCloud className="w-8 h-8" />}
        </div>
        
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-white font-display">
            {isDragging ? 'Drop pages here!' : 'Upload Manga Pages'}
          </h3>
          <p className="text-zinc-400 text-sm">
            Upload a single page or a whole chapter
          </p>
        </div>

        <div className="flex gap-2 mt-2">
          <span className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-500 border border-zinc-700">PNG</span>
          <span className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-500 border border-zinc-700">JPG</span>
          <span className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-500 border border-zinc-700">WEBP</span>
        </div>

        {error && (
          <div className="mt-4 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm animate-pulse">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
