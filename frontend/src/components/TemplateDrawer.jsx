import React from "react";
import { FolderGit2, FileText, CheckCircle2, ChevronRight, X, Sparkles } from "lucide-react";

export default function TemplateDrawer({
  isOpen,
  onClose,
  samples,
  currentTemplatePath,
  onSelectTemplate,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full shadow-2xl flex flex-col animate-slideLeft">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#00CED1]/15 text-[#00CED1] flex items-center justify-center">
              <FolderGit2 size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Template Workspace Drawer</h3>
              <p className="text-xs text-slate-400">Switch templates while retaining your client matrix</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Preset & Bundled Templates
            </h4>
            <div className="space-y-2">
              {(samples || []).map((sample, idx) => {
                const isSelected = currentTemplatePath === sample.filepath || currentTemplatePath === sample.path;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      onSelectTemplate(sample);
                      onClose();
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? "bg-[#00CED1]/10 border-[#00CED1]/60 text-slate-100"
                        : "bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-[#00CED1] text-slate-950 font-bold" : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs truncate flex items-center gap-1.5">
                          {sample.filename || sample.name}
                          {isSelected && (
                            <span className="text-[10px] bg-[#00CED1]/20 text-[#00CED1] px-1.5 py-0.5 rounded font-bold">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {(sample.size ? (sample.size / 1024).toFixed(1) + " KB" : "Ready")} • Space Ranger Proposal
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      size={16}
                      className={`text-slate-500 group-hover:text-[#00CED1] transition-transform group-hover:translate-x-0.5 shrink-0 ${
                        isSelected ? "text-[#00CED1]" : ""
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-start gap-2.5">
              <Sparkles size={16} className="text-[#00CED1] shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300">
                <span className="font-bold text-slate-100">Multi-Template Recipient Retention:</span> Any client rows, formula definitions, and signatures entered in your current session will automatically adapt when switching templates.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
}

