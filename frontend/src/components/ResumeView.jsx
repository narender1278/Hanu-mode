import { useRef, useState } from 'react';
import { Download, FileText, Printer, RotateCcw } from 'lucide-react';
import useSupabaseUserData from '../useSupabaseUserData';

export default function ResumeView({ userId }) {
  const resumeStore = useSupabaseUserData(userId, '', 'resume_html', '');
  const previewRef = useRef(null);
  const [showEditor, setShowEditor] = useState(true);

  const downloadHtml = () => {
    const blob = new Blob([resumeStore.data || ''], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'narender-resume.html';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const printResume = () => {
    previewRef.current?.contentWindow?.focus();
    previewRef.current?.contentWindow?.print();
  };

  if (resumeStore.loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading your resume from Supabase...</div>;
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white shadow-lg sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-white/10 p-3 text-blue-200"><FileText className="h-5 w-5" /></span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">Private resume workspace</p>
            <h2 className="mt-1 text-2xl font-bold">Resume editor</h2>
            <p className="mt-1 text-sm text-slate-300">Edit your HTML; changes sync to your Supabase account.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowEditor((visible) => !visible)}
            className="rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
          >
            {showEditor ? 'Hide editor' : 'Edit HTML'}
          </button>
          <button
            type="button"
            onClick={downloadHtml}
            disabled={!resumeStore.data}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-900 transition hover:bg-blue-50 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Download HTML
          </button>
          <button
            type="button"
            onClick={printResume}
            disabled={!resumeStore.data}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-400 disabled:opacity-50"
          >
            <Printer className="h-4 w-4" />
            Print / Save PDF
          </button>
        </div>
      </section>

      {resumeStore.error && (
        <div role="alert" className="flex flex-col gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between">
          <span>{resumeStore.error}</span>
          <button type="button" onClick={resumeStore.reload} className="self-start rounded-lg bg-rose-700 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-800 sm:self-auto">
            Retry
          </button>
        </div>
      )}

      <div className={`grid gap-5 ${showEditor ? 'xl:grid-cols-2' : 'grid-cols-1'}`}>
        {showEditor && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">HTML source</h3>
                <p className="mt-0.5 text-xs text-slate-500">Edits are saved to Supabase automatically.</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Synced
              </span>
            </div>
            <textarea
              aria-label="Resume HTML source"
              spellCheck="false"
              value={resumeStore.data || ''}
              onChange={(event) => resumeStore.setData(event.target.value)}
              placeholder="Paste your complete HTML resume here..."
              className="min-h-[65vh] w-full resize-y bg-slate-950 p-4 font-mono text-xs leading-5 text-slate-100 outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            />
          </section>
        )}

        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Live preview</h3>
              <p className="mt-0.5 text-xs text-slate-500">Preview is isolated from the app.</p>
            </div>
            <span className="text-xs text-slate-400">A4 / print layout</span>
          </div>
          {resumeStore.data ? (
            <iframe
              ref={previewRef}
              title="Resume preview"
              srcDoc={resumeStore.data}
              sandbox="allow-same-origin"
              className="h-[75vh] w-full bg-slate-100"
            />
          ) : (
            <div className="flex min-h-[65vh] flex-col items-center justify-center px-6 text-center">
              <FileText className="h-10 w-10 text-slate-300" />
              <h4 className="mt-3 font-semibold text-slate-700">No resume HTML saved yet</h4>
              <p className="mt-1 max-w-md text-sm text-slate-500">Paste your complete HTML in the editor. It will save to your account and appear here.</p>
              {!showEditor && (
                <button type="button" onClick={() => setShowEditor(true)} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                  <RotateCcw className="h-4 w-4" />
                  Open editor
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
