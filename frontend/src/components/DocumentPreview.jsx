import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  FileText, 
  ZoomIn, 
  ZoomOut, 
  CheckCircle, 
  Sparkles, 
  Printer, 
  Layers, 
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  BookmarkCheck,
  PlusCircle
} from 'lucide-react';

export default function DocumentPreview({ 
  template, 
  replacements, 
  activeLabel,
  hiddenClauses = [],
  signatureDataUrl = null,
  pageBudget = 2,
  onPageBudgetChange,
  onAddCustomFromSelection
}) {
  const [viewMode, setViewMode] = useState('interactive'); // 'interactive' | 'raw' | 'realistic'
  const [zoom, setZoom] = useState(100);
  
  // Interactive view state (with user replacements)
  const [renderedParagraphs, setRenderedParagraphs] = useState([]);
  const [interactiveLoading, setInteractiveLoading] = useState(false);

  // Raw / Original template view state (unmodified before any replacements)
  const [rawParagraphs, setRawParagraphs] = useState([]);
  const [rawLoading, setRawLoading] = useState(false);

  // Realistic view state
  const [realisticPages, setRealisticPages] = useState([]);
  const [realisticPdfUrl, setRealisticPdfUrl] = useState(null);
  const [realisticLoading, setRealisticLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  // Selected text state for adding custom placeholder
  const [selectedText, setSelectedText] = useState('');

  // 1. Fetch interactive preview on replacements, hiddenClauses or signatureDataUrl change
  useEffect(() => {
    if (!template?.filepath) {
      setRenderedParagraphs([]);
      return;
    }

    let isMounted = true;
    const fetchPreview = async () => {
      setInteractiveLoading(true);
      try {
        const resp = await fetch('/api/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            template_path: template.filepath,
            replacements: replacements || {},
            hidden_clauses: hiddenClauses,
            signature_data_url: signatureDataUrl
          })
        });
        const data = await resp.json();
        if (isMounted && data.elements) {
          setRenderedParagraphs(data.elements);
        }
      } catch (err) {
        console.error("Failed to load interactive preview:", err);
      } finally {
        if (isMounted) setInteractiveLoading(false);
      }
    };

    fetchPreview();
    return () => { isMounted = false; };
  }, [template?.filepath, replacements, hiddenClauses, signatureDataUrl]);

  // 2. Fetch raw template preview (original unmodified document)
  useEffect(() => {
    if (!template?.filepath) {
      setRawParagraphs([]);
      return;
    }

    let isMounted = true;
    const fetchRawPreview = async () => {
      setRawLoading(true);
      try {
        const resp = await fetch('/api/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            template_path: template.filepath,
            replacements: {},
            hidden_clauses: [],
            signature_data_url: null
          })
        });
        const data = await resp.json();
        if (isMounted && data.elements) {
          setRawParagraphs(data.elements);
        }
      } catch (err) {
        console.error("Failed to load raw template preview:", err);
      } finally {
        if (isMounted) setRawLoading(false);
      }
    };

    fetchRawPreview();
    return () => { isMounted = false; };
  }, [template?.filepath]);

  // 2. Fetch realistic preview
  const fetchRealisticPreview = async () => {
    if (!template?.filepath) return;
    setRealisticLoading(true);
    try {
      const resp = await fetch('/api/preview/render-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_path: template.filepath,
          replacements: replacements || {},
          hidden_clauses: hiddenClauses,
          signature_data_url: signatureDataUrl
        })
      });
      const data = await resp.json();
      if (data.success && data.pages) {
        setRealisticPages(data.pages);
        setRealisticPdfUrl(data.pdf_url);
        setCurrentPage(0);
      }
    } catch (err) {
      console.error("Realistic preview error:", err);
    } finally {
      setRealisticLoading(false);
    }
  };

  // Trigger realistic preview when switching to realistic mode
  useEffect(() => {
    if (viewMode === 'realistic' && realisticPages.length === 0) {
      fetchRealisticPreview();
    }
  }, [viewMode]);

  const handleTextSelection = () => {
    const sel = window.getSelection();
    const text = sel ? sel.toString().trim() : '';
    if (text && text.length > 1 && text.length < 80) {
      setSelectedText(text);
    } else {
      setSelectedText('');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isOverBudget = pageBudget > 0 && realisticPages.length > pageBudget;

  if (!template) {
    return (
      <div className="rounded-2xl border p-12 text-center flex flex-col items-center justify-center h-full min-h-[450px]"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)'
        }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
          style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
          <FileText className="w-6 h-6 stroke-[1.8]" />
        </div>
        <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          No Document Selected
        </h4>
        <p className="text-xs max-w-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          Upload a Word (.docx) or PDF template to see a real-time live preview with dynamic placeholders.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border flex flex-col h-full overflow-hidden shadow-sm"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-color)'
      }}>
      
      {/* Preview Header & View Mode Switcher */}
      <div className="p-3 border-b flex flex-wrap items-center justify-between gap-2 shrink-0"
        style={{
          backgroundColor: 'var(--bg-subtle)',
          borderColor: 'var(--border-color)'
        }}>
        
        {/* Left: View Mode Pills */}
        <div className="flex items-center space-x-1 p-0.5 rounded-lg border"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <button
            type="button"
            onClick={() => setViewMode('interactive')}
            className={`btn-tactile text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              viewMode === 'interactive' ? 'shadow-xs' : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: viewMode === 'interactive' ? 'var(--color-primary)' : 'transparent',
              color: viewMode === 'interactive' ? '#FFFFFF' : 'var(--text-primary)'
            }}
          >
            Live Markup
          </button>

          <button
            type="button"
            onClick={() => setViewMode('raw')}
            className={`btn-tactile text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              viewMode === 'raw' ? 'shadow-xs' : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: viewMode === 'raw' ? 'var(--color-primary)' : 'transparent',
              color: viewMode === 'raw' ? '#FFFFFF' : 'var(--text-primary)'
            }}
          >
            Raw Template
          </button>

          <button
            type="button"
            onClick={() => setViewMode('realistic')}
            className={`btn-tactile text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              viewMode === 'realistic' ? 'shadow-xs' : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: viewMode === 'realistic' ? 'var(--color-primary)' : 'transparent',
              color: viewMode === 'realistic' ? '#FFFFFF' : 'var(--text-primary)'
            }}
          >
            Realistic Word / PDF
          </button>
        </div>

        {/* Center: Page Budget Guard & Active Recipient Badge */}
        <div className="flex items-center gap-2">
          {viewMode === 'realistic' && realisticPages.length > 0 && (
            <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
              isOverBudget 
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-400' 
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
            }`}>
              {isOverBudget ? <AlertTriangle size={12} /> : <BookmarkCheck size={12} />}
              <span>
                Page Budget: {realisticPages.length} / {pageBudget || '∞'} {isOverBudget && '(Budget Exceeded!)'}
              </span>
            </div>
          )}

          {activeLabel && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full truncate max-w-[150px]"
              style={{ backgroundColor: 'var(--color-secondary-light)', color: 'var(--color-secondary)' }}>
              {activeLabel}
            </span>
          )}
        </div>

        {/* Right: Controls */}
        <div className="flex items-center space-x-1.5">
          {viewMode === 'realistic' && (
            <button
              onClick={fetchRealisticPreview}
              disabled={realisticLoading}
              className="p-1 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              style={{ borderColor: 'var(--border-color)' }}
              title="Refresh realistic Word/PDF preview"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${realisticLoading ? 'animate-spin' : ''}`} style={{ color: 'var(--color-primary)' }} />
            </button>
          )}

          {/* Zoom controls */}
          <div className="flex items-center space-x-1 border rounded-lg px-1.5 py-0.5"
            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
            <button
              onClick={() => setZoom(prev => Math.max(60, prev - 10))}
              className="p-0.5 hover:text-[var(--color-primary)] transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="text-[10px] font-mono w-7 text-center" style={{ color: 'var(--text-secondary)' }}>
              {zoom}%
            </span>
            <button
              onClick={() => setZoom(prev => Math.min(140, prev + 10))}
              className="p-0.5 hover:text-[var(--color-primary)] transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>

          {/* Print preview */}
          <button
            onClick={handlePrint}
            className="p-1 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            style={{ borderColor: 'var(--border-color)' }}
            title="Print or Save as PDF via browser"
          >
            <Printer className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
      </div>

      {/* Floating Selection Action: Visual Point-and-Click Placeholder Tagging */}
      {selectedText && (
        <div 
          className="text-xs px-4 py-2 flex items-center justify-between animate-fadeIn shadow-md border-b"
          style={{ 
            backgroundColor: '#00CED1', 
            color: '#021013',
            borderColor: '#00CED1'
          }}
        >
          <div className="flex items-center gap-2 truncate max-w-[280px]">
            <Sparkles size={14} className="shrink-0" />
            <span className="truncate">
              Selected text: <strong>"{selectedText}"</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (onAddCustomFromSelection) onAddCustomFromSelection(selectedText);
              setSelectedText('');
            }}
            className="font-bold flex items-center gap-1.5 px-3 py-1 bg-slate-950 text-white rounded-lg hover:bg-slate-900 transition-transform active:scale-95 cursor-pointer text-[11px]"
          >
            <PlusCircle size={13} className="text-[#00CED1]" />
            Turn into Placeholder
          </button>
        </div>
      )}

      {/* Document Sheet Display */}
      <div 
        onMouseUp={handleTextSelection}
        className="flex-1 overflow-y-auto p-4 md:p-6"
        style={{ backgroundColor: 'var(--bg-main)' }}
      >
        {viewMode === 'interactive' ? (
          /* Mode 1: Interactive Live Markup Sheet (With User Replacements) */
          <div
            className="mx-auto rounded-xl border p-8 md:p-12 transition-transform shadow-md"
            style={{
              maxWidth: '750px',
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
              minHeight: '850px'
            }}
          >
            {interactiveLoading ? (
              <div className="flex items-center justify-center py-20 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Sparkles className="w-4 h-4 animate-spin mr-2" />
                <span>Updating live preview...</span>
              </div>
            ) : renderedParagraphs.length === 0 ? (
              <div className="text-center py-20 text-xs" style={{ color: 'var(--text-muted)' }}>
                No paragraphs extracted.
              </div>
            ) : (
              <div className="space-y-3.5 text-xs md:text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {renderedParagraphs.map((item, idx) => {
                  if (item.is_heading) {
                    return (
                      <h3
                        key={idx}
                        className="font-bold text-base md:text-lg pt-3 pb-1 border-b"
                        style={{
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-primary)'
                        }}
                        dangerouslySetInnerHTML={{ __html: item.rendered_html }}
                      />
                    );
                  }

                  return (
                    <p
                      key={idx}
                      className="leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: item.rendered_html }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        ) : viewMode === 'raw' ? (
          /* Mode 2: Raw / Original Template View (Unmodified source document) */
          <div
            className="mx-auto rounded-xl border p-8 md:p-12 transition-transform shadow-md"
            style={{
              maxWidth: '750px',
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
              minHeight: '850px'
            }}
          >
            <div className="mb-4 pb-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-xs font-bold text-slate-200">Original Template Source View</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                Unmodified brackets intact
              </span>
            </div>

            {rawLoading ? (
              <div className="flex items-center justify-center py-20 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Sparkles className="w-4 h-4 animate-spin mr-2" />
                <span>Loading original template...</span>
              </div>
            ) : rawParagraphs.length === 0 ? (
              <div className="text-center py-20 text-xs" style={{ color: 'var(--text-muted)' }}>
                No template text found.
              </div>
            ) : (
              <div className="space-y-3.5 text-xs md:text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {rawParagraphs.map((item, idx) => {
                  if (item.is_heading) {
                    return (
                      <h3
                        key={idx}
                        className="font-bold text-base md:text-lg pt-3 pb-1 border-b"
                        style={{
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-primary)'
                        }}
                        dangerouslySetInnerHTML={{ __html: item.rendered_html }}
                      />
                    );
                  }

                  return (
                    <p
                      key={idx}
                      className="leading-relaxed font-sans"
                      dangerouslySetInnerHTML={{ __html: item.rendered_html }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Mode 3: Realistic Word/PDF Genuine Pages */
          <div className="flex flex-col items-center space-y-6">
            {realisticLoading ? (
              <div className="py-24 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: 'var(--color-primary)' }} />
                <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Rendering Authentic Word Document Pages...
                </p>
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  Converting with Microsoft Word COM engine for pixel-perfect pagination.
                </p>
              </div>
            ) : realisticPages.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Click below to generate realistic print preview.
                </p>
                <button
                  onClick={fetchRealisticPreview}
                  className="btn-tactile mt-3 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs"
                  style={{ backgroundColor: 'var(--color-primary)', color: '#FFFFFF' }}
                >
                  Render Realistic Document View
                </button>
              </div>
            ) : (
              <>
                {/* Page Navigation */}
                <div className="flex items-center space-x-3 text-xs">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                    disabled={currentPage === 0}
                    className="p-1 rounded border disabled:opacity-30"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    Page {currentPage + 1} of {realisticPages.length}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(realisticPages.length - 1, prev + 1))}
                    disabled={currentPage >= realisticPages.length - 1}
                    className="p-1 rounded border disabled:opacity-30"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {realisticPdfUrl && (
                    <a
                      href={realisticPdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-3 text-[11px] font-semibold flex items-center space-x-1 underline"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open Full PDF</span>
                    </a>
                  )}
                </div>

                {/* Rendered Page Image */}
                <div
                  className="rounded-lg shadow-2xl border overflow-hidden bg-white transition-transform"
                  style={{
                    maxWidth: '850px',
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: 'top center'
                  }}
                >
                  <img
                    src={realisticPages[currentPage]}
                    alt={`Document Page ${currentPage + 1}`}
                    className="w-full h-auto block select-none"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
