import React from 'react';
import { Palette, Github } from 'lucide-react';

type Route = 'home' | 'pricing';

interface HeaderProps {
  onNavigate?: (route: Route) => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, route: Route) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(route);
      window.location.hash = route === 'pricing' ? '#pricing' : '';
    } else {
      window.location.hash = route === 'pricing' ? '#pricing' : '';
    }
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate('home');
      window.location.hash = '';
    } else {
      window.location.hash = '';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <a 
          href="#" 
          onClick={handleLogoClick}
          className="flex items-center gap-3 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Palette className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold font-display tracking-tight text-white">
            Chroma<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Manga</span>
          </span>
        </a>
        
        <nav className="flex items-center gap-6">
          <a 
            href="#" 
            onClick={(e) => handleNavClick(e, 'home')}
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Gallery
          </a>
          <a 
            href="#pricing" 
            onClick={(e) => handleNavClick(e, 'pricing')}
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Pricing
          </a>
          <div className="h-4 w-px bg-white/10"></div>
          <a 
            href="https://github.com/google/genai" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            <Github className="w-4 h-4" />
            <span>SDK</span>
          </a>
        </nav>
      </div>
    </header>
  );
};