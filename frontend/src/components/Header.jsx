import React from 'react';
import { FileText, Sun, Moon, FolderOpen, Sparkles, HelpCircle } from 'lucide-react';

export default function Header({ isDark, setIsDark, onOpenFolder, onLoadSample, isSampleLoading, onOpenAbout }) {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md border-b transition-colors"
      style={{
        backgroundColor: isDark ? 'rgba(11, 15, 23, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        borderColor: 'var(--border-color)'
      }}>
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs"
            style={{ backgroundColor: 'var(--color-primary)', color: '#FFFFFF' }}>
            <FileText className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight" style={{ color: 'var(--text-primary)' }}>
                DocuForge Studio
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                v1.0 Pro
              </span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Template Engine & Multi-Client Batch Studio
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          
          {/* Quick Load Sample */}
          <button
            onClick={onLoadSample}
            disabled={isSampleLoading}
            className="btn-tactile text-xs font-semibold px-3.5 py-2 rounded-xl border flex items-center space-x-2 shadow-xs transition-all cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)'
            }}
            title="Load desktop sample: Aseda Host Business Proposal Letter.docx"
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--color-secondary)' }} />
            <span>{isSampleLoading ? 'Loading Sample...' : 'Load Desktop Sample'}</span>
          </button>

          {/* Open Output Folder */}
          <button
            onClick={onOpenFolder}
            className="btn-tactile text-xs font-medium px-3.5 py-2 rounded-xl border flex items-center space-x-2 transition-all cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)'
            }}
            title="Open generated documents folder in Windows File Explorer"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Output Folder</span>
          </button>

          {/* About DocuForge & FAQ */}
          <button
            onClick={onOpenAbout}
            className="btn-tactile text-xs font-semibold px-3 py-2 rounded-xl border flex items-center space-x-1.5 transition-all cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              color: 'var(--color-primary)'
            }}
            title="Learn about DocuForge architecture, features, and AEO/GEO FAQ"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden md:inline">About & FAQ</span>
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            aria-label="Toggle dark and light theme"
            className="btn-tactile p-2 rounded-xl border transition-all cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)'
            }}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

        </div>
      </div>
    </header>
  );
}
