import { Bookmark, Check, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { fetchApi } from '../lib/api';

export interface BookmarkPayload {
  itemType?: 'subject' | 'module' | 'topic' | 'note' | 'resource' | 'pyq' | 'flashcard' | 'answer' | string;
  resourceType?: string;
  resourceId?: string;
  title: string;
  targetUrl?: string;
  description?: string;
  subjectId?: string;
  subjectName?: string;
  moduleNumber?: string;
  moduleName?: string;
  topicTitle?: string;
  metadata?: Record<string, unknown>;
}

export interface BookmarkButtonProps {
  item?: BookmarkPayload;
  title?: string;
  targetUrl?: string;
  resourceType?: string;
  resourceId?: string;
  itemType?: string;
  description?: string;
  subjectId?: string;
  subjectName?: string;
  moduleNumber?: string;
  moduleName?: string;
  topicTitle?: string;
  metadata?: Record<string, unknown>;
  className?: string;
  iconOnly?: boolean;
}

export function BookmarkButton(props: BookmarkButtonProps) {
  const { className = '', iconOnly = false } = props;

  // Resolve fields from either props.item or direct props
  const targetUrl = props.item?.targetUrl || props.targetUrl || window.location.pathname;
  const title = props.item?.title || props.title || 'Saved Bookmark';
  const itemType = props.item?.itemType || props.item?.resourceType || props.resourceType || props.itemType || 'resource';
  const resourceId = props.item?.resourceId || props.resourceId || targetUrl;
  const description = props.item?.description || props.description;
  const subjectId = props.item?.subjectId || props.subjectId;
  const subjectName = props.item?.subjectName || props.subjectName;
  const moduleNumber = props.item?.moduleNumber || props.moduleNumber || props.moduleName;
  const topicTitle = props.item?.topicTitle || props.topicTitle;
  const metadata = props.item?.metadata || props.metadata;

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkStatus() {
      try {
        const res = await fetchApi(`/api/bookmarks?targetUrl=${encodeURIComponent(targetUrl)}`);
        if (isMounted && res && res.bookmarks && res.bookmarks.length > 0) {
          const match = res.bookmarks.find((b: { targetUrl: string }) => b.targetUrl === targetUrl);
          if (match) {
            setIsBookmarked(true);
            setBookmarkId(match.id);
            return;
          }
        }
      } catch {
        // Local fallback
        try {
          const local = localStorage.getItem('cognora_local_bookmarks');
          if (local) {
            const list = JSON.parse(local) as Array<{ targetUrl: string; id: string }>;
            const match = list.find((b) => b.targetUrl === targetUrl);
            if (isMounted && match) {
              setIsBookmarked(true);
              setBookmarkId(match.id);
            }
          }
        } catch {}
      }
    }

    if (targetUrl) {
      void checkStatus();
    }

    return () => {
      isMounted = false;
    };
  }, [targetUrl]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);

    if (isBookmarked && bookmarkId) {
      // Remove bookmark
      try {
        await fetchApi(`/api/bookmarks?id=${bookmarkId}`, { method: 'DELETE' });
        setIsBookmarked(false);
        setBookmarkId(null);
      } catch (err) {
        console.error('Delete bookmark error:', err);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Add bookmark
    try {
      const payload = {
        itemType,
        resourceType: itemType,
        resourceId,
        title,
        targetUrl,
        description,
        subjectId,
        subjectName,
        moduleNumber,
        moduleName: moduleNumber,
        topicTitle,
        metadata,
      };

      const res = await fetchApi('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res && res.bookmark) {
        setIsBookmarked(true);
        setBookmarkId(res.bookmark.id);
      } else {
        // Fallback local persistence
        const id = 'local-bm-' + Date.now();
        const saved = localStorage.getItem('cognora_local_bookmarks');
        const list = saved ? JSON.parse(saved) : [];
        list.push({ ...payload, id });
        localStorage.setItem('cognora_local_bookmarks', JSON.stringify(list));
        setIsBookmarked(true);
        setBookmarkId(id);
      }
    } catch (err) {
      console.error('Create bookmark error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs border ${
        isBookmarked
          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
      } ${className}`}
      title={isBookmarked ? 'Bookmarked in vault (click to remove)' : 'Save to academic vault'}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : isBookmarked ? (
        <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
      ) : (
        <Bookmark className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
      )}
      {!iconOnly && <span>{isBookmarked ? 'Saved' : 'Bookmark'}</span>}
    </button>
  );
}
