import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Save, X, Undo, ZoomIn, ZoomOut, Move, PenTool, Pipette, Palette, Eraser, PaintBucket } from 'lucide-react';

interface ManualEditorProps {
  imageUrl: string;
  onSave: (newImageUrl: string) => void;
  onCancel: () => void;
}

export const ManualEditor: React.FC<ManualEditorProps> = ({ imageUrl, onSave, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPos = useRef<{ x: number, y: number } | null>(null);
  
  // -- State --
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Tools: 'brush' | 'pan' | 'picker' | 'eraser' | 'bucket'
  const [activeTool, setActiveTool] = useState<'brush' | 'pan' | 'picker' | 'eraser' | 'bucket'>('brush');
  
  // Brush Settings
  const [color, setColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(10);
  const [opacity, setOpacity] = useState(1.0); 
  const [tolerance, setTolerance] = useState(30); // 0-255 for flood fill
  
  // History for Undo
  const [history, setHistory] = useState<ImageData[]>([]);

  // -- Initialization --
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous"; 
    img.src = imageUrl;
    img.onload = () => {
      // Set canvas to image dimensions
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw initial image
      ctx.drawImage(img, 0, 0);
      saveState(); // Save initial state
      
      // Center image in view
      if (containerRef.current) {
        const containerW = containerRef.current.clientWidth;
        const containerH = containerRef.current.clientHeight;
        const scaleW = containerW / img.width;
        const scaleH = containerH / img.height;
        const startScale = Math.min(scaleW, scaleH) * 0.9;
        
        setScale(startScale);
        setPan({
          x: (containerW - img.width * startScale) / 2,
          y: (containerH - img.height * startScale) / 2
        });
      }
    };
  }, [imageUrl]);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory(prev => {
      const newHistory = [...prev, imageData];
      if (newHistory.length > 20) newHistory.shift(); // Limit history
      return newHistory;
    });
  };

  const handleUndo = useCallback(() => {
    setHistory(prev => {
      if (prev.length <= 1) return prev;
      
      const newHistory = [...prev];
      newHistory.pop(); // Remove current state
      const previousState = newHistory[newHistory.length - 1];
      
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx && previousState) {
        ctx.putImageData(previousState, 0, 0);
      }
      return newHistory;
    });
  }, []);

  // -- Shortcuts & Scroll Zoom --
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = -e.deltaY * 0.001;
    setScale(prev => Math.max(0.1, Math.min(5, prev + delta)));
  }, []);

  // -- Drawing Logic --

  const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const x = (clientX - rect.left) / scale;
    const y = (clientY - rect.top) / scale;
    
    return { x, y };
  };

  const drawBrushTip = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();
    
    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.globalAlpha = 1.0;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = color;
      ctx.globalAlpha = opacity;
    }
    
    // Draw Round Tip
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  };

  // Helper to convert hex to rgb
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const floodFill = (startX: number, startY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    saveState(); // Undo checkpoint

    const w = canvas.width;
    const h = canvas.height;
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    
    // Target color (color we clicked on)
    const startPos = (Math.floor(startY) * w + Math.floor(startX)) * 4;
    const targetR = data[startPos];
    const targetG = data[startPos + 1];
    const targetB = data[startPos + 2];
    const targetA = data[startPos + 3];

    // Fill color
    const fillColor = hexToRgb(color);
    const fillR = fillColor.r;
    const fillG = fillColor.g;
    const fillB = fillColor.b;
    // We treat fill opacity as 100% (255) for logic simplicity in bucket mode, 
    // or we could use the opacity state. Let's use opacity state.
    const fillA = Math.round(opacity * 255);

    // If color is practically the same, abort to prevent infinite loop
    if (Math.abs(targetR - fillR) < 5 && Math.abs(targetG - fillG) < 5 && Math.abs(targetB - fillB) < 5 && Math.abs(targetA - fillA) < 5) {
      return;
    }

    const pixelStack = [[Math.floor(startX), Math.floor(startY)]];

    const matchColor = (pos: number) => {
      const r = data[pos];
      const g = data[pos + 1];
      const b = data[pos + 2];
      const a = data[pos + 3];

      // Euclidean distance check vs Tolerance
      const dist = Math.sqrt(
        (r - targetR) ** 2 +
        (g - targetG) ** 2 +
        (b - targetB) ** 2 +
        (a - targetA) ** 2
      );
      
      // Tolerance scaling (0-255 is roughly max dist range for single channel, max theoretical is ~441)
      // We map tolerance 0-100 to appropriate distance
      return dist <= tolerance * 2; 
    };

    const colorPixel = (pos: number) => {
      data[pos] = fillR;
      data[pos + 1] = fillG;
      data[pos + 2] = fillB;
      data[pos + 3] = fillA;
    };

    while (pixelStack.length) {
      const newPos = pixelStack.pop();
      if (!newPos) break;
      
      let x = newPos[0];
      let y = newPos[1];
      let pixelPos = (y * w + x) * 4;

      while (y-- >= 0 && matchColor(pixelPos)) {
        pixelPos -= w * 4;
      }
      pixelPos += w * 4;
      ++y;
      
      let reachLeft = false;
      let reachRight = false;
      
      while (y++ < h - 1 && matchColor(pixelPos)) {
        colorPixel(pixelPos);

        if (x > 0) {
          if (matchColor(pixelPos - 4)) {
            if (!reachLeft) {
              pixelStack.push([x - 1, y]);
              reachLeft = true;
            }
          } else if (reachLeft) {
            reachLeft = false;
          }
        }
        
        if (x < w - 1) {
          if (matchColor(pixelPos + 4)) {
            if (!reachRight) {
              pixelStack.push([x + 1, y]);
              reachRight = true;
            }
          } else if (reachRight) {
            reachRight = false;
          }
        }
        
        pixelPos += w * 4;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const onPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const { x, y } = getCanvasCoordinates(e);

    if (activeTool === 'pan') {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      setDragStart({ x: clientX - pan.x, y: clientY - pan.y });
    } else if (activeTool === 'bucket') {
      floodFill(x, y);
    } else if (activeTool === 'brush' || activeTool === 'eraser') {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
         drawBrushTip(ctx, x, y);
         lastPos.current = { x, y };
      }
    } else if (activeTool === 'picker') {
       const canvas = canvasRef.current;
       const ctx = canvas?.getContext('2d');
       if (ctx) {
          const p = ctx.getImageData(x, y, 1, 1).data;
          const hex = "#" + ("000000" + ((p[0] << 16) | (p[1] << 8) | p[2]).toString(16)).slice(-6);
          setColor(hex);
          setActiveTool('brush');
       }
    }
  };

  const onPointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;

    if (activeTool === 'pan') {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      setPan({ x: clientX - dragStart.x, y: clientY - dragStart.y });
    } else if (activeTool === 'brush' || activeTool === 'eraser') {
      const { x, y } = getCanvasCoordinates(e);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      
      if (ctx && lastPos.current) {
         // Interpolate Stroke
         const start = lastPos.current;
         const end = { x, y };
         const dist = Math.hypot(end.x - start.x, end.y - start.y);
         const angle = Math.atan2(end.y - start.y, end.x - start.x);
         
         // Fill gaps with brush tip stamps
         for (let i = 0; i <= dist; i += 1) {
            const cx = start.x + Math.cos(angle) * i;
            const cy = start.y + Math.sin(angle) * i;
            drawBrushTip(ctx, cx, cy);
         }
      }
      lastPos.current = { x, y };
    }
  };

  const onPointerUp = () => {
    if (isDragging && activeTool !== 'pan' && activeTool !== 'bucket') {
      saveState();
    }
    setIsDragging(false);
    lastPos.current = null;
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL('image/png'));
    }
  };

  const handleZoom = (delta: number) => {
    setScale(prev => Math.max(0.1, Math.min(5, prev + delta)));
  };

  // -- Dynamic Cursor Logic --
  const getCursorStyle = () => {
    switch (activeTool) {
      case 'pan':
        return isDragging ? 'grabbing' : 'grab';
      case 'picker':
        return 'crosshair';
      case 'bucket':
        return 'alias';
      case 'brush':
      case 'eraser':
        return 'crosshair';
      default:
        return 'default';
    }
  };

  return (
    <div className="flex h-full w-full bg-[#0c0c0e] relative overflow-hidden">
      
      {/* --- Toolbar --- */}
      <div className="w-72 bg-zinc-900/90 backdrop-blur border-r border-white/5 p-4 flex flex-col gap-6 z-20 shadow-xl overflow-y-auto">
        
        <div>
          <h3 className="text-white font-bold text-lg font-display">Hand Edit</h3>
          <p className="text-zinc-500 text-xs">Touch up inconsistencies</p>
        </div>

        <div className="flex gap-2 p-1 bg-black/40 rounded-lg flex-wrap">
          <button 
            onClick={() => setActiveTool('brush')}
            className={`flex-1 p-2 rounded-md transition-colors ${activeTool === 'brush' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            title="Round Brush"
          >
            <PenTool className="w-5 h-5 mx-auto" />
          </button>
           <button 
            onClick={() => setActiveTool('bucket')}
            className={`flex-1 p-2 rounded-md transition-colors ${activeTool === 'bucket' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            title="Paint Bucket"
          >
            <PaintBucket className="w-5 h-5 mx-auto" />
          </button>
          <button 
            onClick={() => setActiveTool('eraser')}
            className={`flex-1 p-2 rounded-md transition-colors ${activeTool === 'eraser' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            title="Eraser"
          >
            <Eraser className="w-5 h-5 mx-auto" />
          </button>
          <button 
            onClick={() => setActiveTool('picker')}
            className={`flex-1 p-2 rounded-md transition-colors ${activeTool === 'picker' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            title="Color Picker"
          >
            <Pipette className="w-5 h-5 mx-auto" />
          </button>
          <button 
            onClick={() => setActiveTool('pan')}
            className={`flex-1 p-2 rounded-md transition-colors ${activeTool === 'pan' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            title="Pan / Move"
          >
            <Move className="w-5 h-5 mx-auto" />
          </button>
        </div>

        <div className={`space-y-4 ${activeTool === 'pan' ? 'opacity-50 pointer-events-none' : ''}`}>
          
          {activeTool !== 'eraser' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 flex items-center gap-2">
                <Palette className="w-3 h-3" /> Color
              </label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-10 rounded overflow-hidden cursor-pointer border-0 p-0"
                />
                <div className="flex-1 bg-black/40 rounded px-3 flex items-center text-xs font-mono text-zinc-300 border border-white/5">
                  {color}
                </div>
              </div>
            </div>
          )}

          {activeTool === 'bucket' ? (
             <div className="space-y-2 animate-fade-in">
              <div className="flex justify-between">
                <label className="text-xs font-bold text-zinc-400">Tolerance</label>
                <span className="text-xs text-zinc-500">{tolerance}</span>
              </div>
              <input 
                type="range" min="0" max="100" value={tolerance}
                onChange={(e) => setTolerance(parseInt(e.target.value))}
                className="w-full accent-violet-500 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-[10px] text-zinc-600">Higher = Fills more similar colors</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs font-bold text-zinc-400">Size</label>
                <span className="text-xs text-zinc-500">{brushSize}px</span>
              </div>
              <input 
                type="range" min="1" max="100" value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-full accent-violet-500 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}

          {activeTool !== 'eraser' && (
            <div className="space-y-2">
               <div className="flex justify-between">
                <label className="text-xs font-bold text-zinc-400">Opacity</label>
                <span className="text-xs text-zinc-500">{Math.round(opacity * 100)}%</span>
              </div>
              <input 
                type="range" min="0.1" max="1" step="0.1" value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full accent-violet-500 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}
        </div>

        <div className="h-px bg-white/10 my-2"></div>

        <div className="space-y-4">
           <label className="text-xs font-bold text-zinc-400">Zoom Level: {Math.round(scale * 100)}%</label>
           <div className="flex gap-2">
             <button onClick={() => handleZoom(-0.1)} className="p-2 bg-zinc-800 rounded hover:bg-zinc-700 text-zinc-300">
               <ZoomOut className="w-4 h-4" />
             </button>
             <button onClick={() => handleZoom(0.1)} className="p-2 bg-zinc-800 rounded hover:bg-zinc-700 text-zinc-300">
               <ZoomIn className="w-4 h-4" />
             </button>
             <button onClick={() => setScale(1)} className="flex-1 px-3 bg-zinc-800 rounded hover:bg-zinc-700 text-xs text-zinc-300">
               Reset
             </button>
           </div>
           <p className="text-[10px] text-zinc-600 text-center">Use Mouse Wheel to Zoom</p>
        </div>
        
        <div className="flex-1"></div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={handleUndo}
            disabled={history.length <= 1}
            className="flex items-center justify-center gap-2 p-3 bg-zinc-800 rounded-xl hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold"
            title="Ctrl + Z"
          >
            <Undo className="w-4 h-4" /> Undo
          </button>
          
          <div className="flex gap-3">
            <button 
              onClick={onCancel}
              className="flex-1 p-3 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-colors text-sm font-bold flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
            <button 
              onClick={handleSave}
              className="flex-1 p-3 bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500 hover:text-white rounded-xl transition-colors text-sm font-bold flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> Save
            </button>
          </div>
        </div>

      </div>

      {/* --- Canvas Area --- */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-zinc-900/50"
        style={{ cursor: getCursorStyle() }}
        onMouseDown={onPointerDown}
        onMouseMove={onPointerMove}
        onMouseUp={onPointerUp}
        onMouseLeave={onPointerUp}
        onTouchStart={onPointerDown}
        onTouchMove={onPointerMove}
        onTouchEnd={onPointerUp}
        onWheel={handleWheel}
      >
        <div 
          style={{ 
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            width: 'fit-content',
            height: 'fit-content',
            touchAction: 'none' 
          }}
          className="shadow-2xl shadow-black"
        >
           <canvas ref={canvasRef} className="block bg-transparent" />
        </div>
        
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-xs font-mono text-zinc-400 border border-white/5 pointer-events-none">
           {activeTool === 'brush' ? 'MODE: DRAW' : activeTool === 'pan' ? 'MODE: PAN' : activeTool === 'eraser' ? 'MODE: ERASE' : activeTool === 'bucket' ? 'MODE: FILL' : 'MODE: PICK COLOR'}
        </div>
      </div>

    </div>
  );
};