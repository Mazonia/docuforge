import React, { useState, useEffect } from 'react';
import { X, Plus, Search, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

export default function AddPlaceholderModal({ isOpen, onClose, onAdd, templatePath }) {
  const [targetText, setTargetText] = useState('');
  const [label, setLabel] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);

  useEffect(() => {
    if (!targetText.trim() || !templatePath) {
      setSearchResult(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const resp = await fetch('/api/check-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: templatePath,
            query: targetText.trim()
          })
        });
        if (resp.ok) {
          const data = await resp.json();
          setSearchResult(data);
        }
      } catch (err) {
        console.error("Search text error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [targetText, templatePath]);

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!targetText.trim()) return;
    const finalLabel = label.trim() || targetText.trim();
    onAdd({
      raw: targetText.trim(),
      key: finalLabel,
      label: finalLabel,
      type: fieldType,
      is_clause: false,
      is_conditional: false,
      is_custom: true,
      options: [],
      occurrences: searchResult?.count || 1,
      snippets: searchResult?.snippets || [],
      suggested: ''
    });
    setTargetText('');
    setLabel('');
    setSearchResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      
      <div className="rounded-2xl border w-full max-w-lg overflow-hidden shadow-2xl transition-all animate-in zoom-in-95 duration-200"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)'
        }}>
        
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl"
              style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                Add Custom Placeholder
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Target any existing word or sentence in the document to make it dynamically replaceable.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Exact Word or Sentence in Document
            </label>
            <div className="relative">
              <input
                type="text"
                value={targetText}
                onChange={(e) => setTargetText(e.target.value)}
                placeholder="e.g. Nova Vanguard or Sector 4 Outpost"
                className="w-full text-xs px-3.5 py-2.5 pr-8 rounded-xl border focus:outline-none transition-all font-mono"
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
                autoFocus
              />
              {isSearching && (
                <div className="absolute right-3 top-3">
                  <div className="w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)' }}></div>
                </div>
              )}
            </div>

            {/* Validation Feedback */}
            {searchResult && (
              <div className="mt-2 text-xs flex items-center space-x-1.5">
                {searchResult.found ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--color-secondary)' }} />
                    <span style={{ color: 'var(--color-secondary)' }}>
                      Found {searchResult.count} {searchResult.count === 1 ? 'occurrence' : 'occurrences'} in document.
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-amber-500">
                      Text not found in document. Make sure case and spelling match.
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Field Label / Identifier
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Platform Name or Office Location"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none transition-all"
              style={{
                backgroundColor: 'var(--bg-subtle)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Field Type
            </label>
            <select
              value={fieldType}
              onChange={(e) => setFieldType(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none transition-all"
              style={{
                backgroundColor: 'var(--bg-subtle)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="text">Text / Name</option>
              <option value="number">Number / Fee</option>
              <option value="date">Date</option>
            </select>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t flex items-center justify-end space-x-2.5"
          style={{
            backgroundColor: 'var(--bg-subtle)',
            borderColor: 'var(--border-color)'
          }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-tactile text-xs font-medium px-4 py-2 rounded-xl border transition-all"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)'
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!targetText.trim() || (searchResult && !searchResult.found)}
            onClick={handleAdd}
            className="btn-tactile text-xs font-semibold px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: '#FFFFFF'
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add to Placeholders</span>
          </button>
        </div>

      </div>

    </div>
  );
}

