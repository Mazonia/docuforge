import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Layers, 
  Sparkles, 
  ShieldCheck, 
  Sliders, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  HelpCircle, 
  Code,
  Zap,
  Cpu
} from 'lucide-react';

const GithubIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export default function AboutModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'features' | 'faq' | 'tech'

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl max-h-[90vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)'
        }}
      >
        {/* Header */}
        <div 
          className="px-6 py-4 border-b flex items-center justify-between shrink-0"
          style={{
            backgroundColor: 'var(--bg-subtle)',
            borderColor: 'var(--border-color)'
          }}
        >
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: '#FFFFFF'
              }}
            >
              <FileText className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  About DocuForge Studio
                </h3>
                <span 
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                  style={{
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)'
                  }}
                >
                  v1.0 Pro
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                High-fidelity Word & PDF automated templating and batch generation engine.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href="https://github.com/Mazonia/docuforge"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-tactile p-2 rounded-xl border flex items-center space-x-1.5 text-xs font-semibold hover:opacity-90 transition-opacity"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-secondary)'
              }}
              title="View source on GitHub"
            >
              <GithubIcon className="w-4 h-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>

            <button
              onClick={onClose}
              className="p-2 rounded-xl border hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div 
          className="flex border-b px-6 space-x-1 shrink-0 overflow-x-auto text-xs font-semibold"
          style={{
            backgroundColor: 'var(--bg-subtle)',
            borderColor: 'var(--border-color)'
          }}
        >
          {[
            { id: 'overview', label: 'Overview & Mission', icon: Sparkles },
            { id: 'features', label: 'Key Capabilities', icon: Zap },
            { id: 'faq', label: 'Frequently Asked Questions', icon: HelpCircle },
            { id: 'tech', label: 'Architecture & Tech Stack', icon: Code },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-3.5 border-b-2 flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive ? 'opacity-100 font-bold' : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
                  borderColor: isActive ? 'var(--color-primary)' : 'transparent'
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <section className="space-y-3">
                <h4 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  The Problem: Fragile Mail Merge & Broken Document Formatting
                </h4>
                <p>
                  Modern businesses draft dozens of tailored client proposals, vendor agreements, legal contracts, and quote letters every week. 
                  Traditionally, teams either spend grueling hours manually editing Word documents or struggle with legacy Mail Merge tools that break formatting, 
                  mangle styles, and produce messy PDFs with shifted letterheads and overflowing pages.
                </p>
                <p>
                  <strong style={{ color: 'var(--text-primary)' }}>DocuForge Studio</strong> was engineered by Mazonia to solve this permanently. 
                  It provides a modern, high-fidelity document generation workstation that scans templates for bracketed variables, lets you populate single or bulk client matrices, 
                  and generates 100% genuine Word (.docx) and PDF documents with zero layout drift.
                </p>
              </section>

              {/* 3 Step Workflow */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div 
                  className="p-4 rounded-xl border space-y-2"
                  style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: 'var(--color-primary)', color: '#FFFFFF' }}>
                    1
                  </div>
                  <h5 className="font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                    Scan & Detect
                  </h5>
                  <p className="text-xs leading-normal">
                    Upload any DOCX or PDF template. DocuForge automatically detects bracket placeholders (e.g. <code className="font-mono text-[11px] font-bold">[Business Name]</code>) and conditional clauses.
                  </p>
                </div>

                <div 
                  className="p-4 rounded-xl border space-y-2"
                  style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: 'var(--color-secondary)', color: '#FFFFFF' }}>
                    2
                  </div>
                  <h5 className="font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                    Populate or Batch
                  </h5>
                  <p className="text-xs leading-normal">
                    Fill individual client details via ergonomic forms or generate for 50+ clients simultaneously using the multi-client matrix grid or CSV import.
                  </p>
                </div>

                <div 
                  className="p-4 rounded-xl border space-y-2"
                  style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: 'var(--color-accent)', color: '#FFFFFF' }}>
                    3
                  </div>
                  <h5 className="font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                    Export with Zero Shift
                  </h5>
                  <p className="text-xs leading-normal">
                    Export pixel-perfect DOCX and PDF documents using Microsoft Word COM automation. Anchored letterheads, margins, and 2-page layouts are strictly preserved.
                  </p>
                </div>
              </div>

              {/* Design Philosophy */}
              <div 
                className="p-4 rounded-xl border flex items-start space-x-3"
                style={{ backgroundColor: 'var(--color-primary-light)', borderColor: 'var(--color-primary)' }}
              >
                <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
                <div className="text-xs space-y-1">
                  <span className="font-bold" style={{ color: 'var(--color-primary)' }}>
                    Design Philosophy: Executive Ergonomics (No AI Slop)
                  </span>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    DocuForge rejects garish purple and indigo gradients. It is built on a human-centered executive palette featuring Cerulean Blue, Emerald Jade, and Ochre Amber across tailored Dark and Light themes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KEY CAPABILITIES */}
          {activeTab === 'features' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border space-y-2" style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <h5 className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>
                    Run-Safe XML Substitution
                  </h5>
                </div>
                <p className="text-xs">
                  Microsoft Word often fragments words and brackets across arbitrary run boundaries (<code>&lt;w:r&gt;</code>). DocuForge calculates character offsets across run splits, preserving original fonts, weights, colors, and line spacing without breaking Word formatting.
                </p>
              </div>

              <div className="p-4 rounded-xl border space-y-2" style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <h5 className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>
                    Margin & Letterhead Preservation
                  </h5>
                </div>
                <p className="text-xs">
                  Eliminates artificial header and footer injection. Anchored header drawings, company logos, and top margins stay in their exact pixel positions, preventing documents from spilling onto unexpected extra pages.
                </p>
              </div>

              <div className="p-4 rounded-xl border space-y-2" style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <h5 className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>
                    Conditional Clause Engine
                  </h5>
                </div>
                <p className="text-xs">
                  Automatically detects option clauses (e.g. <code>[is free / carries a setup fee of GHS [amount]]</code>) and presents quick dropdown selectors alongside freeform editing for complex business terms.
                </p>
              </div>

              <div className="p-4 rounded-xl border space-y-2" style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <h5 className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>
                    Multi-Client Batch Matrix & CSV
                  </h5>
                </div>
                <p className="text-xs">
                  Populate recipient rows in a responsive, flexible spreadsheet matrix. Import existing customer lists from CSV, download customized batch ZIP bundles, and generate individual DOCX and PDF copies in seconds.
                </p>
              </div>

              <div className="p-4 rounded-xl border space-y-2" style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <h5 className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>
                    Dual Live & Realistic PDF Previews
                  </h5>
                </div>
                <p className="text-xs">
                  Toggle between real-time interactive HTML markup preview and rasterized 150 DPI Word-generated pages to verify exact pagination and typography before downloading.
                </p>
              </div>

              <div className="p-4 rounded-xl border space-y-2" style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <h5 className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>
                    Custom Text / Sentence Anchors
                  </h5>
                </div>
                <p className="text-xs">
                  Add new variables on the fly by highlighting or typing any exact word or sentence in your template—no need to manually edit brackets into the original source file.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: FREQUENTLY ASKED QUESTIONS */}
          {activeTab === 'faq' && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg border text-xs" style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Frequently Asked Questions:</span> Answers to common questions regarding Word templating, OpenXML run safety, batch production, and format fidelity.
              </div>

              <dl className="space-y-4 text-xs">
                <div className="p-3 rounded-xl border space-y-1.5" style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}>
                  <dt className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                    What is DocuForge Studio?
                  </dt>
                  <dd className="leading-relaxed">
                    DocuForge Studio is a high-performance document automation engine that transforms Microsoft Word (.docx) and PDF templates into dynamic, batch-producible business documents. It extracts bracketed placeholders, provides a tabular data matrix for client records, and exports customized DOCX and native PDF files with zero layout distortion.
                  </dd>
                </div>

                <div className="p-3 rounded-xl border space-y-1.5" style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}>
                  <dt className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                    How does DocuForge avoid the "Word font-breaking" problem of legacy Mail Merge?
                  </dt>
                  <dd className="leading-relaxed">
                    In standard DOCX files, words and brackets are frequently divided into multiple XML runs (<code>&lt;w:r&gt;</code>) when spellcheck or formatting changes occur. Naive string replacement corrupts or misses these tokens. DocuForge computes token character spans across the paragraph's run collection, substituting content in-place while keeping existing XML styles, fonts, and colors intact.
                  </dd>
                </div>

                <div className="p-3 rounded-xl border space-y-1.5" style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}>
                  <dt className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                    Why does DocuForge preserve letterheads and margins where other tools shift lines down?
                  </dt>
                  <dd className="leading-relaxed">
                    Most Python DOCX libraries implicitly create blank header and footer XML parts when accessing section attributes. This causes Microsoft Word to insert default 0.5-inch margins, shifting floating letterheads and pushing content onto unexpected extra pages. DocuForge performs safe relationship checks before touching headers/footers, preserving exact original page geometry.
                  </dd>
                </div>

                <div className="p-3 rounded-xl border space-y-1.5" style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}>
                  <dt className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                    Can I use PDF files as templates in DocuForge?
                  </dt>
                  <dd className="leading-relaxed">
                    Yes. When an uploaded template is a PDF, DocuForge uses PyMuPDF layout analysis to extract text blocks, headings, and placeholder tags into an editable DOCX format, allowing you to customize and re-export to both DOCX and PDF seamlessly.
                  </dd>
                </div>

                <div className="p-3 rounded-xl border space-y-1.5" style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}>
                  <dt className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                    Is DocuForge suitable for high-volume batch generation?
                  </dt>
                  <dd className="leading-relaxed">
                    Yes. The Multi-Client Tabular Grid lets you specify unique terms for tens or hundreds of recipients, import client lists from CSV spreadsheets, and export all generated files into a neatly organized ZIP archive.
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {/* TAB 4: ARCHITECTURE & TECH STACK */}
          {activeTab === 'tech' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border space-y-3" style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}>
                  <div className="flex items-center space-x-2">
                    <Cpu className="w-4 h-4 text-sky-500" />
                    <h5 className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>
                      Backend Engine
                    </h5>
                  </div>
                  <ul className="text-xs space-y-1.5">
                    <li>• <strong>FastAPI (Python 3.12)</strong>: High-speed asynchronous REST API.</li>
                    <li>• <strong>python-docx</strong>: OpenXML parsing and AST manipulation.</li>
                    <li>• <strong>win32com (Word COM)</strong>: Native Microsoft Word engine for 100% faithful PDF rasterization.</li>
                    <li>• <strong>PyMuPDF (fitz)</strong>: Ultra-fast vector rendering of preview pages.</li>
                    <li>• <strong>Pydantic v2</strong>: Strongly typed data validation for batch requests.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl border space-y-3" style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}>
                  <div className="flex items-center space-x-2">
                    <Sliders className="w-4 h-4 text-emerald-500" />
                    <h5 className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>
                      Frontend Interface
                    </h5>
                  </div>
                  <ul className="text-xs space-y-1.5">
                    <li>• <strong>React 18 & Vite</strong>: Instant reactive state management.</li>
                    <li>• <strong>Tailwind CSS</strong>: High-density executive design system.</li>
                    <li>• <strong>Lucide Icons</strong>: Clean, lightweight iconset.</li>
                    <li>• <strong>Color System</strong>: Vibrant Dark Turquoise (#00CED1), Forest Jade (#059669), Ochre Amber (#D97706).</li>
                    <li>• <strong>Dual Theme Engine</strong>: Persistent Dark & Light modes.</li>
                  </ul>
                </div>
              </div>

              {/* GitHub Link Card */}
              <div 
                className="p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}
              >
                <div>
                  <h6 className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>
                    Open Source Repository
                  </h6>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Contribute, inspect source code, or report issues on GitHub.
                  </p>
                </div>
                <a
                  href="https://github.com/Mazonia/docuforge"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-tactile px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-xs"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: '#FFFFFF'
                  }}
                >
                  <GithubIcon className="w-4 h-4" />
                  <span>GitHub Repository</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div 
          className="px-6 py-3 border-t flex items-center justify-between text-xs shrink-0"
          style={{
            backgroundColor: 'var(--bg-subtle)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-muted)'
          }}
        >
          <span>DocuForge Studio &copy; {new Date().getFullYear()} Mazonia. Built with native Word COM & Run-Safe XML.</span>
          <button
            onClick={onClose}
            className="btn-tactile px-3.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer"
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
