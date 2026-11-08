import React from 'react';
import { 
  Sparkles, 
  Rocket, 
  ScanLine, 
  Layers, 
  ShieldCheck, 
  Table, 
  Eye, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  FileText,
  FileCheck2,
  Cpu
} from 'lucide-react';

export default function WelcomeFeatures({ onLoadDemo, isDemoLoading }) {
  return (
    <div className="space-y-8 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Demo Template Quick-Launch Card */}
      <div 
        className="rounded-2xl border p-5 md:p-6 transition-all shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)'
        }}
      >
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none opacity-20"
          style={{ backgroundColor: '#00CED1' }}></div>

        <div className="flex items-start space-x-4 relative z-10">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
            style={{ 
              backgroundColor: 'var(--color-primary-light)', 
              color: 'var(--color-primary)' 
            }}
          >
            <Rocket className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span 
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ 
                  backgroundColor: 'var(--color-primary-light)', 
                  color: 'var(--color-primary)' 
                }}
              >
                Interactive Demo
              </span>
              <h4 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                Nova Vanguard Space Ranger Contract
              </h4>
            </div>
            <p className="text-xs mt-1 max-w-2xl leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Test DocuForge instantly with our fictional deep-space mission proposal template. Features 11 dynamic bracket placeholders, nested conditional warp fuel clauses, and pre-configured multi-client vanguard squadron records.
            </p>
          </div>
        </div>

        <button
          onClick={onLoadDemo}
          disabled={isDemoLoading}
          className="btn-tactile text-xs font-bold px-4 py-2.5 rounded-xl border flex items-center space-x-2 shrink-0 shadow-xs transition-all cursor-pointer relative z-10"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-primary-text)',
            borderColor: 'var(--color-primary)'
          }}
          title="Load the Nova Vanguard Space Ranger demo template"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isDemoLoading ? 'Loading Demo...' : 'Load Space Ranger Demo'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Feature Capabilities Grid */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }}></div>
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Core Capabilities & Technology
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Card 1 */}
          <div 
            className="rounded-2xl border p-5 space-y-2.5 transition-all shadow-xs hover:border-[var(--color-primary)]"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs"
              style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
            >
              <ScanLine className="w-5 h-5 stroke-[2]" />
            </div>
            <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              Smart Bracket Scanner
            </h4>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Recursively parses Word documents and PDFs to detect <code className="font-mono text-[11px] font-bold">[Placeholders]</code>, amounts, dates, and slash-separated conditional option clauses automatically.
            </p>
          </div>

          {/* Card 2 */}
          <div 
            className="rounded-2xl border p-5 space-y-2.5 transition-all shadow-xs hover:border-[var(--color-primary)]"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs"
              style={{ backgroundColor: 'var(--color-secondary-light)', color: 'var(--color-secondary)' }}
            >
              <Layers className="w-5 h-5 stroke-[2]" />
            </div>
            <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              Run-Safe OpenXML AST
            </h4>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Word often splits words and brackets across arbitrary <code className="font-mono text-[11px] font-bold">&lt;w:r&gt;</code> run tags. DocuForge maps character spans in-place, preserving original fonts, sizes, colors, and line spacing.
            </p>
          </div>

          {/* Card 3 */}
          <div 
            className="rounded-2xl border p-5 space-y-2.5 transition-all shadow-xs hover:border-[var(--color-primary)]"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs"
              style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
            >
              <ShieldCheck className="w-5 h-5 stroke-[2]" />
            </div>
            <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              Zero-Shift Margin Safety
            </h4>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Safely inspects document relationship tables to prevent artificial header margins. Anchored letterheads, company logos, and 2-page documents never shift down into unintended blank pages.
            </p>
          </div>

          {/* Card 4 */}
          <div 
            className="rounded-2xl border p-5 space-y-2.5 transition-all shadow-xs hover:border-[var(--color-primary)]"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs"
              style={{ backgroundColor: 'var(--color-secondary-light)', color: 'var(--color-secondary)' }}
            >
              <Table className="w-5 h-5 stroke-[2]" />
            </div>
            <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              Multi-Client Batch Matrix
            </h4>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Populate recipient data across a responsive spreadsheet grid. Import customer lists from CSV, copy-paste directly from Excel, and generate 100+ documents packaged into a tidy ZIP archive.
            </p>
          </div>

          {/* Card 5 */}
          <div 
            className="rounded-2xl border p-5 space-y-2.5 transition-all shadow-xs hover:border-[var(--color-primary)]"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs"
              style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
            >
              <Eye className="w-5 h-5 stroke-[2]" />
            </div>
            <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              Dual Live & Word COM Previews
            </h4>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Switch seamlessly between real-time reactive HTML markup preview and authentic 150 DPI Word COM rasterized pages with full inline browser viewing.
            </p>
          </div>

          {/* Card 6 */}
          <div 
            className="rounded-2xl border p-5 space-y-2.5 transition-all shadow-xs hover:border-[var(--color-primary)]"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs"
              style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent)' }}
            >
              <Lock className="w-5 h-5 stroke-[2]" />
            </div>
            <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              100% Offline & Private
            </h4>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              No cloud AI tokens, no external telemetry, and no data leaving your machine. All parsing, document editing, and PDF exports run strictly on your local machine.
            </p>
          </div>

          {/* Card 7 */}
          <div 
            className="rounded-2xl border p-5 space-y-2.5 transition-all shadow-xs hover:border-[var(--color-primary)]"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs"
              style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
            >
              <ShieldCheck className="w-5 h-5 stroke-[2]" />
            </div>
            <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              Digital Signatures & SMTP Dispatch
            </h4>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Draw or upload signature stamps that embed cleanly into Word tables and PDF pages, then review and dispatch personalized documents directly to client inboxes via local SMTP.
            </p>
          </div>

          {/* Card 8 */}
          <div 
            className="rounded-2xl border p-5 space-y-2.5 transition-all shadow-xs hover:border-[var(--color-primary)]"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs"
              style={{ backgroundColor: 'var(--color-secondary-light)', color: 'var(--color-secondary)' }}
            >
              <FileCheck2 className="w-5 h-5 stroke-[2]" />
            </div>
            <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              Formulas & Page Budget Guard
            </h4>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Click to calculate arithmetic and financial fields across all rows. Real-time page budget guard alerts you whenever text inputs overflow beyond your target page budget.
            </p>
          </div>

        </div>
      </div>

      {/* 3-Step Visual Workflow */}
      <div 
        className="rounded-2xl border p-6 space-y-4"
        style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }}></div>
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            How DocuForge Works
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border space-y-2" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
              Step 1
            </span>
            <h5 className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>
              Drop Your Word or PDF Template
            </h5>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Upload any existing proposal, quote, or agreement. Bracket fields like <code>[Client Name]</code> and pricing terms are extracted in milliseconds.
            </p>
          </div>

          <div className="p-4 rounded-xl border space-y-2" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: 'var(--color-secondary-light)', color: 'var(--color-secondary)' }}>
              Step 2
            </span>
            <h5 className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>
              Fill Single Form or Batch Grid
            </h5>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Customize values using quick dropdowns, add custom text anchors, or import a spreadsheet of clients via CSV.
            </p>
          </div>

          <div className="p-4 rounded-xl border space-y-2" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent)' }}>
              Step 3
            </span>
            <h5 className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>
              Export Pixel-Perfect DOCX & PDF
            </h5>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              One-click export renders authentic Microsoft Word PDFs with zero letterhead drift and packaged ZIP archives for batch runs.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

