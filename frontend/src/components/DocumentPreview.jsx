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
  ChevronRight
} from 'lucide-react';

export default function DocumentPreview({ 
  template, 
  replacements, 
  activeLabel,
  onAddCustomFromSelection
}) {
  const [viewMode, setViewMode] = useState('interactive'); // 'interactive' | 'realistic'
  const [zoom, setZoom] = useState(100);
  
  // Interactive view state
  const [renderedParagraphs, setRenderedParagraphs] = useState([]);
  const [interactiveLoading, setInteractiveLoading] = useState(false);

  // Realistic view state
  const [realisticPages, setRealisticPages] = useState([]);
  const [realisticPdfUrl, setRealisticPdfUrl] = useState(null);
  const [realisticLoading, setRealisticLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  // Selected text state for adding custom placeholder
  const [selectedText, setSelectedText] = useState('');

  // 1. Fetch interactive preview on replacements change
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
            replacements: replacements || {}
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
  }, [template?.filepath, replacements]);

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
          replacements: replacements || {}
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

        {/* Center: Active Recipient Badge */}
        {activeLabel && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full truncate max-w-[150px]"
            style={{ backgroundColor: 'var(--color-secondary-light)', color: 'var(--color-secondary)' }}>
            {activeLabel}
          </span>
        )}

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
              className="p-0.5 hover:text-sky-500 transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="text-[10px] font-mono w-7 text-center" style={{ color: 'var(--text-secondary)' }}>
              {zoom}%
            </span>
            <button
              onClick={() => setZoom(prev => Math.min(140, prev + 10))}
              className="p-0.5 hover:text-sky-500 transition-colors"
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

      {/* Floating Selection Action: Add highlighted text as placeholder */}
      {selectedText && (
        <div className="bg-sky-600 text-white text-xs px-3 py-1.5 flex items-center justify-between animate-in fade-in">
          <span className="truncate max-w-[240px]">
            Selected: <code className="font-mono font-bold">"{selectedText}"</code>
          </span>
          <button
            type="button"
            onClick={() => {
              if (onAddCustomFromSelection) onAddCustomFromSelection(selectedText);
              setSelectedText('');
            }}
            className="ml-2 font-bold underline cursor-pointer hover:opacity-80"
          >
            + Add as Placeholder
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
          /* Mode 1: Interactive Live Markup Sheet */
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
        ) : (
          /* Mode 2: Realistic Word/PDF Genuine Pages */
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
