import { Edit3, Loader2, Sparkles, Tag, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { fetchApi } from '../lib/api';

export interface AnnotationData {
  id?: string;
  targetType: 'topic' | 'note' | 'pdf_page' | 'text_selection' | 'answer' | 'lecture';
  targetId: string;
  contentReference: string;
  selectedText?: string;
  pageNumber?: number;
  userNote: string;
  tags?: string[];
  color?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function AnnotationModal({
  isOpen,
  onClose,
  initialData,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialData: {
    id?: string;
    targetType: AnnotationData['targetType'];
    targetId: string;
    contentReference: string;
    selectedText?: string;
    pageNumber?: number;
    userNote?: string;
    tags?: string[];
    color?: string;
  };
  onSaved?: (annotation: AnnotationData) => void;
}) {
  const [noteText, setNoteText] = useState(initialData.userNote || '');
  const [tagsInput, setTagsInput] = useState(initialData.tags?.join(', ') || '');
  const [selectedColor, setSelectedColor] = useState(initialData.color || 'amber');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNoteText(initialData.userNote || '');
      setTagsInput(initialData.tags?.join(', ') || '');
      setSelectedColor(initialData.color || 'amber');
      setErrorMsg('');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) {
      setErrorMsg('Please enter your annotation note.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const parsedTags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const payload = {
      targetType: initialData.targetType,
      targetId: initialData.targetId,
      contentReference: initialData.contentReference,
      selectedText: initialData.selectedText,
      pageNumber: initialData.pageNumber,
      userNote: noteText.trim(),
      tags: parsedTags,
      color: selectedColor,
    };

    try {
      let saved: AnnotationData;
      if (initialData.id) {
        // Update existing
        const res = await fetchApi('/api/annotations', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: initialData.id, ...payload }),
        });
        saved = res.annotation;
      } else {
        // Create new
        const res = await fetchApi('/api/annotations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        saved = res.annotation;
      }

      if (onSaved) onSaved(saved);
      onClose();
    } catch {
      // Offline fallback to local storage
      const localId = initialData.id || `anno-${Date.now()}`;
      const fallbackObj: AnnotationData = {
        ...payload,
        id: localId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      try {
        const stored = localStorage.getItem('cognora_local_annotations');
        const list = stored ? (JSON.parse(stored) as AnnotationData[]) : [];
        const nextList = initialData.id
          ? list.map(a => (a.id === initialData.id ? fallbackObj : a))
          : [fallbackObj, ...list];
        localStorage.setItem('cognora_local_annotations', JSON.stringify(nextList));
      } catch {}

      if (onSaved) onSaved(fallbackObj);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const colors = [
    { id: 'amber', bg: 'bg-amber-100 border-amber-300 text-amber-900', label: 'Important Note' },
    { id: 'blue', bg: 'bg-blue-100 border-blue-300 text-blue-900', label: 'Concept Review' },
    { id: 'emerald', bg: 'bg-emerald-100 border-emerald-300 text-emerald-900', label: 'Exam Formula' },
    { id: 'purple', bg: 'bg-purple-100 border-purple-300 text-purple-900', label: 'Viva Reminder' },
    { id: 'rose', bg: 'bg-rose-100 border-rose-300 text-rose-900', label: 'Doubt to Clarify' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-white dark:bg-[#161720] border border-[#e3e6ed] dark:border-[#262936] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="px-6 py-4 border-b border-[#e3e6ed] dark:border-[#262936] bg-[#f8f9fc] dark:bg-[#12131b] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-[#121217] dark:text-[#f0f2f7] uppercase tracking-wider">
                {initialData.id ? 'Edit Personal Annotation' : 'Add Personal Annotation'}
              </h3>
              <p className="text-[10px] text-[#8c8fa1] truncate max-w-xs">{initialData.contentReference}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8c8fa1] hover:text-[#121217] dark:hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs font-sans">
          {initialData.selectedText && (
            <div className="p-3 bg-[#f8f9fc] dark:bg-[#12131b] border-l-4 border-amber-500 rounded-r-xl space-y-1">
              <span className="text-[10px] font-mono text-[#8c8fa1] uppercase font-bold">
                Selected Text Reference {initialData.pageNumber ? `(Page ${initialData.pageNumber})` : ''}:
              </span>
              <p className="text-[11px] text-[#4f5367] dark:text-[#b8bcd2] italic line-clamp-3">
                &ldquo;{initialData.selectedText}&rdquo;
              </p>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-mono font-bold text-[#6b6f82] dark:text-[#8c8fa1] uppercase mb-1.5">
              Personal Study Note / Explanation:
            </label>
            <textarea
              required
              rows={4}
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Write your personal intuition, revision reminder, exam trap note, or formula derivation here..."
              className="w-full bg-[#f8f9fc] dark:bg-[#12131b] border border-[#e3e6ed] dark:border-[#262936] rounded-2xl p-3.5 text-xs text-[#121217] dark:text-[#f0f2f7] outline-none focus:border-[#4f75f2] leading-relaxed resize-none shadow-xs font-sans"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold text-[#6b6f82] dark:text-[#8c8fa1] uppercase mb-1.5">
              Tag Category:
            </label>
            <div className="flex flex-wrap gap-2">
              {colors.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedColor(c.id)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                    selectedColor === c.id
                      ? `${c.bg} ring-2 ring-offset-1 ring-amber-500`
                      : 'bg-white dark:bg-[#161720] border-[#e3e6ed] dark:border-[#262936] text-[#6b6f82] dark:text-[#8c8fa1]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold text-[#6b6f82] dark:text-[#8c8fa1] uppercase mb-1.5">
              Custom Tags (comma-separated):
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="e.g. IAE-2, 10-Marks, High Yield, Formula"
              className="w-full bg-[#f8f9fc] dark:bg-[#12131b] border border-[#e3e6ed] dark:border-[#262936] rounded-xl px-3.5 py-2 text-xs text-[#121217] dark:text-[#f0f2f7] outline-none focus:border-[#4f75f2] shadow-xs"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">{errorMsg}</p>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e3e6ed] dark:border-[#262936]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#6b6f82] dark:text-[#8c8fa1] hover:bg-[#f8f9fc] dark:hover:bg-[#12131b] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[#4f75f2] hover:bg-[#385dd8] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-200" />}
              <span>{initialData.id ? 'Save Changes' : 'Attach Note'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

