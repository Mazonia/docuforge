import React, { useRef, useState } from 'react';
import { UploadCloud, FileType, CheckCircle, RefreshCw, Layers, AlignLeft, Sparkles, Plus } from 'lucide-react';

export default function FileDropzone({ template, onFileUpload, isUploading, onReset, onOpenAddPlaceholderModal }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Active template banner
  if (template) {
    return (
      <div className="rounded-2xl border p-5 transition-all shadow-xs"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)'
        }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
              <FileType className="w-6 h-6 stroke-[2]" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                  {template.filename}
                </h3>
                {template.converted_from_pdf && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'var(--color-secondary-light)', color: 'var(--color-secondary)' }}>
                    Converted from PDF
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>{formatBytes(template.filesize)}</span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <AlignLeft className="w-3.5 h-3.5" />
                  <span>{template.paragraph_count} paragraphs ({template.word_count} words)</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1 font-medium" style={{ color: 'var(--color-accent)' }}>
                  <Layers className="w-3.5 h-3.5" />
                  <span>{template.placeholders?.length || 0} Dynamic Placeholders</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 shrink-0">
            <button
              onClick={onOpenAddPlaceholderModal}
              className="btn-tactile text-xs font-semibold px-3.5 py-2 rounded-xl border flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
              style={{
                backgroundColor: 'var(--color-primary-light)',
                borderColor: 'var(--color-primary)',
                color: 'var(--color-primary)'
              }}
              title="Add a custom placeholder from exact text in the document"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Placeholder</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-tactile text-xs font-semibold px-3.5 py-2 rounded-xl border flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-subtle)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Change Template</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".docx,.pdf"
              className="hidden"
            />
          </div>

        </div>
      </div>
    );
  }

  // Dropzone empty state
  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-2xl border-2 border-dashed p-10 text-center transition-all cursor-pointer ${
        isDragOver ? 'scale-[1.01]' : ''
      }`}
      style={{
        backgroundColor: isDragOver ? 'var(--color-primary-light)' : 'var(--bg-card)',
        borderColor: isDragOver ? 'var(--color-primary)' : 'var(--border-color)'
      }}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".docx,.pdf"
        className="hidden"
      />

      <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4 transition-transform group-hover:scale-105"
        style={{
          backgroundColor: 'var(--color-primary-light)',
          color: 'var(--color-primary)'
        }}>
        {isUploading ? (
          <RefreshCw className="w-7 h-7 animate-spin" />
        ) : (
          <UploadCloud className="w-7 h-7 stroke-[2]" />
        )}
      </div>

      <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
        {isUploading ? 'Analyzing Template & Extracting Placeholders...' : 'Upload Word Document or PDF'}
      </h3>

      <p className="text-xs max-w-md mx-auto mt-1.5" style={{ color: 'var(--text-secondary)' }}>
        Drag and drop your <span className="font-semibold">.docx</span> or <span className="font-semibold">.pdf</span> template here.
        All bracketed fields like <code className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400">[Client Name]</code> will be automatically extracted.
      </p>

      <div className="mt-5 flex items-center justify-center space-x-2">
        <span className="btn-tactile text-xs font-bold px-4 py-2 rounded-xl inline-flex items-center space-x-1.5 shadow-sm"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-primary-text)'
          }}>
          <span>Browse File</span>
        </span>
      </div>
    </div>
  );
}
