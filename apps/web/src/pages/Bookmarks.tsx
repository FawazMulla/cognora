import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark as BookmarkIcon,
  FolderPlus,
  Search,
  Filter,
  ExternalLink,
  Trash2,
  Edit3,
  FileText,
  Download,
  Folder,
  Tag,
  Calendar,
  Layers,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { fetchApi } from '../lib/api';
import { AsyncStateView } from '../components/AsyncStateView';
import { AnnotationModal } from '../components/AnnotationModal';
import { exportToDocx, exportToPdf } from '../lib/export-engine';

interface BookmarkItem {
  id: string;
  resourceType: string;
  resourceId: string;
  title: string;
  description?: string;
  subjectId?: string;
  subjectName?: string;
  moduleId?: string;
  moduleName?: string;
  targetUrl: string;
  metadata?: any;
  collectionId?: string;
  createdAt: string;
  annotations?: {
    id: string;
    note: string;
    highlightText?: string;
    tags?: string[];
    createdAt: string;
  }[];
}

interface CollectionItem {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  // New Collection Modal State
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColColor, setNewColColor] = useState('#4F46E5');

  // Annotation Edit State
  const [activeAnnotationTarget, setActiveAnnotationTarget] = useState<{
    resourceType: string;
    resourceId: string;
    title: string;
    collectionId?: string;
  } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [bmRes, colRes] = await Promise.all([
        fetch('http://localhost:3001/api/bookmarks', {
          headers: { 'x-user-id': 'dev-user-local' },
        }).then((r) => r.json()),
        fetch('http://localhost:3001/api/bookmarks/collections', {
          headers: { 'x-user-id': 'dev-user-local' },
        }).then((r) => r.json()),
      ]);

      setBookmarks(bmRes.bookmarks || []);
      setCollections(colRes.collections || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;

    try {
      const res = await fetch('http://localhost:3001/api/bookmarks/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'dev-user-local',
        },
        body: JSON.stringify({
          name: newColName.trim(),
          color: newColColor,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCollections((prev) => [data.collection, ...prev]);
        setNewColName('');
        setShowNewCollection(false);
      }
    } catch (err) {
      console.error('Error creating collection:', err);
    }
  };

  const handleDeleteBookmark = async (id: string) => {
    if (!window.confirm('Remove this bookmark?')) return;
    try {
      const res = await fetch(`http://localhost:3001/api/bookmarks?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': 'dev-user-local' },
      });
      if (res.ok) {
        setBookmarks((prev) => prev.filter((b) => b.id !== id));
      }
    } catch (err) {
      console.error('Error deleting bookmark:', err);
    }
  };

  const handleExportBookmark = async (bm: BookmarkItem, format: 'pdf' | 'docx') => {
    const rawContent =
      bm.metadata?.rawContent ||
      bm.description ||
      `# ${bm.title}\n\n${bm.annotations?.map((a) => `> Annotation: ${a.note}`).join('\n\n') || 'Academic resource saved in Cognora.'}`;

    const opts = {
      title: bm.title,
      subject: bm.subjectName,
      module: bm.moduleName,
      rawMarkdown: rawContent,
    };

    if (format === 'pdf') {
      exportToPdf(opts);
    } else {
      await exportToDocx(opts);
    }
  };

  // Filter bookmarks
  const filteredBookmarks = bookmarks.filter((bm) => {
    const matchesSearch =
      bm.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bm.description && bm.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (bm.subjectName && bm.subjectName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCollection =
      selectedCollection === 'all' ||
      (selectedCollection === 'unfiled' ? !bm.collectionId : bm.collectionId === selectedCollection);

    const matchesType = selectedType === 'all' || bm.resourceType === selectedType;

    return matchesSearch && matchesCollection && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <BookmarkIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Academic Bookmarks & Annotations
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Centralized knowledge vault for quick revision, starred questions, and personal notes.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowNewCollection(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
          >
            <FolderPlus className="w-4 h-4" />
            <span>New Collection</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Collections Sidebar & Bookmarks Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Collections Left Pane */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Collections
            </h3>

            <div className="space-y-1">
              <button
                onClick={() => setSelectedCollection('all')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  selectedCollection === 'all'
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4" />
                  <span>All Bookmarks</span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {bookmarks.length}
                </span>
              </button>

              {collections.map((col) => {
                const count = bookmarks.filter((b) => b.collectionId === col.id).length;
                return (
                  <button
                    key={col.id}
                    onClick={() => setSelectedCollection(col.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      selectedCollection === col.id
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <Folder
                        className="w-4 h-4 shrink-0"
                        style={{ color: col.color || '#4F46E5' }}
                      />
                      <span className="truncate">{col.name}</span>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {count}
                    </span>
                  </button>
                );
              })}

              <button
                onClick={() => setSelectedCollection('unfiled')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  selectedCollection === 'unfiled'
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <BookmarkIcon className="w-4 h-4" />
                  <span>Uncategorized</span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {bookmarks.filter((b) => !b.collectionId).length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Bookmarks List Right Pane */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search & Type Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search bookmarked questions, notes, practicals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto">
              {[
                { id: 'all', label: 'All Types' },
                { id: 'question', label: 'Questions' },
                { id: 'answer', label: 'Answers' },
                { id: 'note', label: 'Notes' },
                { id: 'practical', label: 'Practicals' },
                { id: 'pyq', label: 'PYQ' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedType(t.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedType === t.id
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bookmarks Grid / State */}
          <AsyncStateView
            status={
              loading
                ? 'loading'
                : error
                ? 'error'
                : filteredBookmarks.length === 0
                ? 'empty'
                : 'success'
            }
            loadingMessage="Loading your academic vault..."
            skeletonType="cards"
            errorMessage={error || undefined}
            onRetry={loadData}
            emptyTitle={bookmarks.length === 0 ? 'No Bookmarks Saved Yet' : 'No Matches Found'}
            emptyDescription={
              bookmarks.length === 0
                ? 'Star questions, practicals, notes, or model answers across Cognora to review them here.'
                : 'Try adjusting your search query or collection filter.'
            }
            emptyActionLabel={bookmarks.length === 0 ? 'Explore Question Bank' : 'Reset Filters'}
            onEmptyAction={() => {
              if (bookmarks.length === 0) {
                window.location.href = '/questions';
              } else {
                setSearchQuery('');
                setSelectedCollection('all');
                setSelectedType('all');
              }
            }}
          >
            <div className="space-y-3">
              {filteredBookmarks.map((bm) => {
                const hasAnnotations = bm.annotations && bm.annotations.length > 0;
                return (
                  <div
                    key={bm.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-sm transition-all hover:shadow group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                            {bm.resourceType}
                          </span>
                          {bm.subjectName && (
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {bm.subjectName}
                            </span>
                          )}
                          {bm.moduleName && (
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              • {bm.moduleName}
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                          {bm.title}
                        </h3>

                        {bm.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                            {bm.description}
                          </p>
                        )}

                        {/* Annotations Section */}
                        {hasAnnotations && (
                          <div className="mt-3 p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs space-y-1.5">
                            <div className="flex items-center text-amber-800 dark:text-amber-300 font-semibold text-[11px]">
                              <Edit3 className="w-3.5 h-3.5 mr-1" />
                              <span>Personal Note</span>
                            </div>
                            {bm.annotations?.map((an) => (
                              <p key={an.id} className="text-slate-700 dark:text-slate-300 italic">
                                "{an.note}"
                              </p>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-1 shrink-0">
                        {/* Open Link */}
                        <Link
                          to={bm.targetUrl}
                          className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors"
                          title="Open resource in workspace"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>

                        {/* Add / Edit Annotation */}
                        <button
                          onClick={() =>
                            setActiveAnnotationTarget({
                              resourceType: bm.resourceType,
                              resourceId: bm.resourceId,
                              title: bm.title,
                              collectionId: bm.collectionId,
                            })
                          }
                          className="p-2 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60 transition-colors"
                          title="Edit Personal Annotation"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Export Menu */}
                        <button
                          onClick={() => handleExportBookmark(bm, 'pdf')}
                          className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-colors"
                          title="Export as PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteBookmark(bm.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60 transition-colors"
                          title="Remove Bookmark"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </AsyncStateView>
        </div>
      </div>

      {/* New Collection Modal */}
      {showNewCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Create New Bookmark Collection
            </h3>
            <form onSubmit={handleCreateCollection} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Collection Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Endsem Formula Revision"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Tag Color
                </label>
                <div className="flex items-center space-x-2">
                  {['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'].map(
                    (color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewColColor(color)}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          newColColor === color ? 'scale-125 ring-2 ring-offset-2 ring-indigo-500' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    )
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewCollection(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newColName.trim()}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs disabled:opacity-50"
                >
                  Create Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Annotation Modal */}
      {activeAnnotationTarget && (
        <AnnotationModal
          isOpen={true}
          onClose={() => {
            setActiveAnnotationTarget(null);
            loadData();
          }}
          resourceType={activeAnnotationTarget.resourceType}
          resourceId={activeAnnotationTarget.resourceId}
          resourceTitle={activeAnnotationTarget.title}
          collectionId={activeAnnotationTarget.collectionId}
          onSaved={() => {
            setActiveAnnotationTarget(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

