import React, { useState } from "react";
import { Mail, Send, CheckCircle2, AlertCircle, X, Shield, Lock, Settings } from "lucide-react";

export default function EmailDispatchModal({
  isOpen,
  onClose,
  records,
  onSendEmail,
}) {
  const [smtpHost, setSmtpHost] = useState(localStorage.getItem("docuforge_smtp_host") || "smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState(localStorage.getItem("docuforge_smtp_port") || "587");
  const [smtpUser, setSmtpUser] = useState(localStorage.getItem("docuforge_smtp_user") || "");
  const [smtpPass, setSmtpPass] = useState(localStorage.getItem("docuforge_smtp_pass") || "");
  const [fromEmail, setFromEmail] = useState(localStorage.getItem("docuforge_from_email") || "");

  const [subjectTemplate, setSubjectTemplate] = useState("Your Document from DocuForge: [Business Name]");
  const [bodyTemplate, setBodyTemplate] = useState(
    "Dear [Client Name],\n\nPlease find attached your official document generated via DocuForge.\n\nWarm regards,\nManagement"
  );

  const [sendingIndex, setSendingIndex] = useState(-1);
  const [statusLog, setStatusLog] = useState([]);
  const [isSending, setIsSending] = useState(false);

  // Filter records that have generated PDF paths
  const eligibleRecords = (records || []).filter((r) => r.pdf_path || r.pdf);

  const saveSettings = () => {
    localStorage.setItem("docuforge_smtp_host", smtpHost);
    localStorage.setItem("docuforge_smtp_port", smtpPort);
    localStorage.setItem("docuforge_smtp_user", smtpUser);
    localStorage.setItem("docuforge_smtp_pass", smtpPass);
    localStorage.setItem("docuforge_from_email", fromEmail);
  };

  const handleStartDispatch = async () => {
    saveSettings();
    setIsSending(true);
    setStatusLog([]);

    for (let i = 0; i < eligibleRecords.length; i++) {
      const rec = eligibleRecords[i];
      setSendingIndex(i);

      // Find recipient email
      let toEmail = "";
      for (const [k, v] of Object.entries(rec.replacements || {})) {
        if (k.toLowerCase().includes("email") && v && v.includes("@")) {
          toEmail = v.trim();
          break;
        }
      }

      if (!toEmail) {
        setStatusLog((prev) => [
          ...prev,
          { id: rec.id, label: rec.label, success: false, msg: "Skipped: No valid email address found in replacements." },
        ]);
        continue;
      }

      // Interpolate subject and body
      let subject = subjectTemplate;
      let body = bodyTemplate;
      for (const [k, v] of Object.entries(rec.replacements || {})) {
        subject = subject.replaceAll(`[${k}]`, String(v || ""));
        body = body.replaceAll(`[${k}]`, String(v || ""));
      }

      const pdfTarget = rec.pdf_path || rec.pdf;
      if (!pdfTarget) {
        setStatusLog((prev) => [
          ...prev,
          { id: rec.id, label: rec.label, success: false, msg: "Skipped: Document PDF not yet generated." },
        ]);
        continue;
      }

      try {
        const res = await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            smtp_host: smtpHost,
            smtp_port: parseInt(smtpPort, 10),
            smtp_user: smtpUser,
            smtp_pass: smtpPass,
            from_email: fromEmail || smtpUser,
            to_email: toEmail,
            subject: subject,
            body: body,
            attachment_path: pdfTarget,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setStatusLog((prev) => [
            ...prev,
            { id: rec.id, label: rec.label, to: toEmail, success: true, msg: "Sent successfully." },
          ]);
        } else {
          setStatusLog((prev) => [
            ...prev,
            { id: rec.id, label: rec.label, to: toEmail, success: false, msg: data.detail || "Dispatch failed." },
          ]);
        }
      } catch (err) {
        setStatusLog((prev) => [
          ...prev,
          { id: rec.id, label: rec.label, to: toEmail, success: false, msg: err.message },
        ]);
      }
    }

    setSendingIndex(-1);
    setIsSending(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#00CED1]/15 text-[#00CED1] flex items-center justify-center">
              <Mail size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Review & Send via SMTP</h3>
              <p className="text-xs text-slate-400">Dispatch generated PDFs directly to client inboxes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* SMTP Config */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Settings size={13} className="text-[#00CED1]" /> SMTP Configuration
              </span>
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Lock size={11} /> Stored locally in your browser
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 mb-1 block">SMTP Host</label>
                <input
                  type="text"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  placeholder="e.g. smtp.gmail.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:border-[#00CED1] outline-none"
                />
              </div>
              <div>
                <label className="text-slate-400 mb-1 block">Port</label>
                <input
                  type="number"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  placeholder="587 or 465"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:border-[#00CED1] outline-none"
                />
              </div>
              <div>
                <label className="text-slate-400 mb-1 block">Username / Email</label>
                <input
                  type="text"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:border-[#00CED1] outline-none"
                />
              </div>
              <div>
                <label className="text-slate-400 mb-1 block">App Password</label>
                <input
                  type="password"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:border-[#00CED1] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Email Template */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">
                Subject Line <span className="text-[11px] text-slate-500 font-normal">(supports [Placeholders])</span>
              </label>
              <input
                type="text"
                value={subjectTemplate}
                onChange={(e) => setSubjectTemplate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-[#00CED1] outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">
                Message Body <span className="text-[11px] text-slate-500 font-normal">(supports [Placeholders])</span>
              </label>
              <textarea
                rows={4}
                value={bodyTemplate}
                onChange={(e) => setBodyTemplate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:border-[#00CED1] outline-none font-sans"
              />
            </div>
          </div>

          {/* Dispatch Queue Status */}
          <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300">
                Queue Status: {eligibleRecords.length} document{eligibleRecords.length !== 1 ? "s" : ""} ready
              </span>
              {isSending && (
                <span className="text-xs text-[#00CED1] animate-pulse">
                  Dispatching {sendingIndex + 1} of {eligibleRecords.length}...
                </span>
              )}
            </div>

            {statusLog.length > 0 && (
              <div className="max-h-36 overflow-y-auto space-y-1.5 text-xs pr-1">
                {statusLog.map((log, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      log.success ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                    }`}
                  >
                    <span className="font-medium truncate max-w-xs">{log.label} ({log.to || "no email"})</span>
                    <span className="text-[11px]">{log.msg}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-t border-slate-800">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Shield size={12} className="text-[#00CED1]" /> Zero cloud dependency — direct client-to-server dispatch
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStartDispatch}
              disabled={isSending || eligibleRecords.length === 0}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#00CED1] text-slate-950 hover:bg-[#00CED1]/90 flex items-center gap-1.5 shadow-lg shadow-[#00CED1]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={14} /> {isSending ? "Sending..." : `Send All (${eligibleRecords.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

