import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronsLeftRight, Download, RefreshCw } from 'lucide-react';

interface ComparisonSliderProps {
  beforeImage: string;
  afterImage: string;
  onReset: () => void;
}

export const ComparisonSlider: React.FC<ComparisonSliderProps> = ({ beforeImage, afterImage, onReset }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percentage = (x / rect.width) * 100;
      setSliderPosition(percentage);
    }
  }, []);

  const onMouseDown = () => setIsDragging(true);
  const onTouchStart = () => setIsDragging(true);

  useEffect(() => {
    const onMouseUp = () => setIsDragging(false);
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) handleMove(e.clientX);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging) handleMove(e.touches[0].clientX);
    };

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onMouseUp);
    };
  }, [isDragging, handleMove]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = afterImage;
    link.download = `chromamanga-colorized-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full h-full flex flex-col gap-6 animate-fade-in">
      {/* Viewer */}
      <div 
        ref={containerRef}
        className="relative w-full h-[600px] rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 group select-none cursor-ew-resize"
        onMouseDown={(e) => {
          setIsDragging(true);
          handleMove(e.clientX);
        }}
        onTouchStart={(e) => {
          setIsDragging(true);
          handleMove(e.touches[0].clientX);
        }}
      >
        {/* After Image (Background) */}
        <img 
          src={afterImage} 
          alt="Colorized" 
          className="absolute top-0 left-0 w-full h-full object-contain bg-[#121212]" 
        />

        {/* Before Image (Clipped) */}
        <div 
          className="absolute top-0 left-0 w-full h-full overflow-hidden bg-[#121212]"
          style={{ width: `${sliderPosition}%` }}
        >
          <img 
            src={beforeImage} 
            alt="Original" 
            className="absolute top-0 left-0 max-w-none h-full object-contain"
            style={{ width: containerRef.current?.offsetWidth }} 
            // Note: In a real production app, use explicit dimensions to ensure alignment
            // For now, object-contain helps but aspect ratios must match perfectly.
          />
        </div>

        {/* Slider Handle */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10 flex items-center justify-center group-hover:bg-violet-400 transition-colors"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="w-8 h-8 -ml-3.5 bg-white rounded-full shadow-lg flex items-center justify-center transform group-hover:scale-110 transition-transform">
            <ChevronsLeftRight className="w-4 h-4 text-black" />
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10 pointer-events-none">
          ORIGINAL
        </div>
        <div className="absolute top-4 right-4 bg-violet-600/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10 pointer-events-none">
          COLORIZED
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <button 
          onClick={onReset}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-all hover:scale-105 active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
          Try Another
        </button>
        <button 
          onClick={handleDownload}
          className="flex items-center gap-2 px-8 py-3 rounded-xl bg-white text-black font-bold hover:bg-violet-200 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-white/10"
        >
          <Download className="w-4 h-4" />
          Download Result
        </button>
      </div>
    </div>
  );
};