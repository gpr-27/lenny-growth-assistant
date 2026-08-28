import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, SortDesc, FileCode, FileText, Layers, Download, 
  Trash2, Edit3, Eye, Copy, Check, Sparkles, RefreshCw, ExternalLink,
  Clock, ArrowRight, MessageSquare
} from 'lucide-react';
import type { ArtifactSummary, Artifact } from '../types';

interface ArtifactsLibraryProps {
  onOpenArtifact: (artifact: Artifact) => void;
  onNavigateToSession: (sessionId: string) => void;
  onStartNewChatWithPrompt: (prompt: string) => void;
}

export default function ArtifactsLibrary({ 
  onOpenArtifact, 
  onNavigateToSession,
  onStartNewChatWithPrompt 
}: ArtifactsLibraryProps) {
  const [artifacts, setArtifacts] = useState<ArtifactSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [renamingArtifact, setRenamingArtifact] = useState<{ id: string; title: string } | null>(null);
  const [renameInput, setRenameInput] = useState('');

  const fetchArtifacts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/artifacts');
      if (res.ok) {
        const data = await res.json();
        setArtifacts(data);
      }
    } catch (err) {
      console.error('Failed to load artifacts library', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtifacts();
  }, []);

  const handleOpen = async (artSummary: ArtifactSummary) => {
    try {
      const res = await fetch(`/api/artifacts/${artSummary.id}`);
      if (res.ok) {
        const fullArt = await res.json();
        onOpenArtifact(fullArt);
      }
    } catch (err) {
      console.error('Failed to fetch full artifact', err);
    }
  };

  const handleCopy = async (artSummary: ArtifactSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/artifacts/${artSummary.id}`);
      if (res.ok) {
        const fullArt = await res.json();
        navigator.clipboard.writeText(fullArt.content);
        setCopiedId(artSummary.id);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownload = async (artSummary: ArtifactSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/artifacts/${artSummary.id}`);
      if (res.ok) {
        const fullArt = await res.json();
        const ext = fullArt.type === 'html' ? 'html' : (fullArt.type === 'markdown' ? 'md' : 'txt');
        const filename = fullArt.filename || `${(fullArt.title || 'artifact').toLowerCase().replace(/\s+/g, '_')}.${ext}`;
        const blob = new Blob([fullArt.content], { type: fullArt.type === 'html' ? 'text/html' : 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to download', err);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this artifact?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/artifacts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setArtifacts(prev => prev.filter(a => a.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveRename = async () => {
    if (!renamingArtifact || !renameInput.trim()) return;
    try {
      const res = await fetch(`/api/artifacts/${renamingArtifact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: renameInput.trim() })
      });
      if (res.ok) {
        setArtifacts(prev => prev.map(a => a.id === renamingArtifact.id ? { ...a, title: renameInput.trim() } : a));
        setRenamingArtifact(null);
      }
    } catch (err) {
      console.error('Failed to rename', err);
    }
  };

  // Filter and sort
  const filteredArtifacts = artifacts.filter(a => {
    const matchesSearch = 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.session_title && a.session_title.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === 'all' || a.type.toLowerCase() === typeFilter.toLowerCase();
    return matchesSearch && matchesType;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    return 0;
  });

  const htmlCount = artifacts.filter(a => a.type === 'html').length;
  const mdCount = artifacts.filter(a => a.type === 'markdown').length;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 md:p-10 transition-colors">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 rounded-full text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-2">
              <Sparkles size={13} />
              <span>Claude-Style Artifacts System</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Artifacts & Documents Library
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Every dashboard, wireframe, Ship 30 essay, and report generated across your podcast intelligence sessions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 shadow-2xs">
              <Layers size={14} className="text-indigo-500" />
              <span>{artifacts.length} Total</span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="text-emerald-600 dark:text-emerald-400">{htmlCount} HTML</span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="text-indigo-600 dark:text-indigo-400">{mdCount} Markdown</span>
            </div>
            <button
              onClick={fetchArtifacts}
              className="p-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 rounded-xl transition-all shadow-2xs"
              title="Refresh library"
            >
              <RefreshCw size={15} className={loading ? "animate-spin text-indigo-500" : ""} />
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search artifacts by title, content, or session..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs transition-all"
            />
          </div>

          {/* Type Filter & Sort Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-slate-200/80 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800 text-xs">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1.5 font-semibold rounded-lg transition-all ${
                  typeFilter === 'all'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                All ({artifacts.length})
              </button>
              <button
                onClick={() => setTypeFilter('html')}
                className={`px-3 py-1.5 font-semibold rounded-lg transition-all ${
                  typeFilter === 'html'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                HTML ({htmlCount})
              </button>
              <button
                onClick={() => setTypeFilter('markdown')}
                className={`px-3 py-1.5 font-semibold rounded-lg transition-all ${
                  typeFilter === 'markdown'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Markdown ({mdCount})
              </button>
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-600 dark:text-slate-300 shadow-2xs">
              <SortDesc size={14} className="text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent border-none focus:outline-hidden text-xs font-semibold cursor-pointer"
              >
                <option value="newest">Recently Created</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Artifacts Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 animate-pulse space-y-4">
                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-md w-1/3"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4"></div>
                <div className="h-20 bg-slate-100 dark:bg-slate-800/40 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : filteredArtifacts.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl space-y-4 shadow-xs">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Layers size={28} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No artifacts found</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-md mx-auto mt-1">
                {searchQuery || typeFilter !== 'all' 
                  ? 'No saved artifacts match your current search and filter criteria.'
                  : 'Start asking the assistant to generate dashboards, essays, or prototypes to populate your library.'}
              </p>
            </div>

            {/* Quick Generator Buttons */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-2 max-w-lg mx-auto">
              <button
                onClick={() => onStartNewChatWithPrompt('Generate an interactive HTML growth dashboard wireframe with metric cards.')}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
              >
                <span>📊 Create Growth Dashboard</span>
                <ArrowRight size={12} />
              </button>
              <button
                onClick={() => onStartNewChatWithPrompt("Turn the key retention metrics and PM lessons from Lenny's guests into a Ship 30 for 30 essay.")}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
              >
                <span>✍️ Generate Ship 30 Essay</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredArtifacts.map((art) => {
              const isHtml = art.type === 'html';
              return (
                <div
                  key={art.id}
                  onClick={() => handleOpen(art)}
                  className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col justify-between cursor-pointer relative"
                >
                  <div className="space-y-3">
                    {/* Top Row: Type Badge + Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider ${
                          isHtml 
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
                            : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                        }`}>
                          {isHtml ? <FileCode size={13} /> : <FileText size={13} />}
                          <span>{art.type}</span>
                        </span>
                        <span className="font-mono text-[11px] text-slate-400 truncate max-w-[120px]">
                          {art.filename}
                        </span>
                      </div>

                      {/* Card Actions Menu */}
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleCopy(art, e)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Copy source code"
                        >
                          {copiedId === art.id ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                        </button>
                        <button
                          onClick={(e) => handleDownload(art, e)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Download file"
                        >
                          <Download size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingArtifact({ id: art.id, title: art.title });
                            setRenameInput(art.title);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Rename title"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(art.id, e)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          title="Delete artifact"
                        >
                          <Trash2 size={13} className={deletingId === art.id ? "animate-spin" : ""} />
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {art.title}
                    </h3>

                    {/* Description / Content Preview */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800/80 rounded-xl text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed font-normal">
                      {art.description || 'Interactive product intelligence artifact generated from Lenny podcast insights.'}
                    </div>
                  </div>

                  {/* Footer Row: Session Origin & Meta */}
                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    {/* Originating Chat */}
                    {art.session_id ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToSession(art.session_id!);
                        }}
                        className="inline-flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 truncate max-w-[140px] text-left font-medium transition-colors"
                        title={`Origin: ${art.session_title}`}
                      >
                        <MessageSquare size={12} className="shrink-0 text-slate-400" />
                        <span className="truncate">{art.session_title}</span>
                      </button>
                    ) : (
                      <span>Autonomous Artifact</span>
                    )}

                    <div className="flex items-center gap-2 shrink-0">
                      <span>{art.word_count || Math.round(art.char_count / 5)} words</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        <span>{new Date(art.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Rename Modal */}
        {renamingArtifact && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Rename Artifact</h3>
              <input
                type="text"
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter new artifact title"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setRenamingArtifact(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRename}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-xs"
                >
                  Save Title
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
