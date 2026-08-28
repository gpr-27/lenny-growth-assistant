import { useState, useEffect } from 'react';
import { PlusCircle, MessageSquare, Trash2, Search, Sparkles, Sun, Moon, PanelLeftClose, PanelLeft, X, Layers } from 'lucide-react';
import type { Session } from '../types';

interface ExtendedSession extends Session {
  message_count?: number;
}

interface SidebarProps {
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onOpenArtifacts?: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onSetTheme?: (theme: 'dark' | 'light') => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ 
  currentSessionId, 
  onSelectSession, 
  onNewSession,
  onOpenArtifacts,
  theme,
  onToggleTheme,
  onSetTheme,
  isCollapsed,
  onToggleCollapse
}: SidebarProps) {
  const [sessions, setSessions] = useState<ExtendedSession[]>([]);
  const [search, setSearch] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/sessions`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (e) {
      console.error("Failed to fetch sessions", e);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [currentSessionId]);

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setIsDeleting(id);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/sessions/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== id));
        if (currentSessionId === id) {
          onNewSession();
        }
      }
    } catch (e) {
      console.error("Failed to delete session", e);
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  if (isCollapsed) {
    return (
      <aside className="w-14 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center justify-between py-4 select-none shrink-0 transition-all">
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={onToggleCollapse}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title="Expand Sidebar"
          >
            <PanelLeft size={18} />
          </button>
          
          <button
            onClick={onNewSession}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xs transition-all active:scale-95"
            title="New Conversation"
          >
            <PlusCircle size={18} />
          </button>

          {onOpenArtifacts && (
            <button
              onClick={onOpenArtifacts}
              className="p-2.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              title="Artifacts Library"
            >
              <Layers size={18} />
            </button>
          )}
        </div>

        <div className="flex flex-col items-center gap-2">
          <button
            onClick={onToggleTheme}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-700" />}
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-72 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 flex flex-col h-full shrink-0 border-r border-slate-200 dark:border-slate-800 transition-all duration-200 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-xs shadow-indigo-500/20">
              <Sparkles size={16} />
            </div>
            <div>
              <h1 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">Lenny Growth AI</h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Internal PM & Growth Suite</p>
            </div>
          </div>

          <button
            onClick={onToggleCollapse}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Collapse Sidebar"
          >
            <PanelLeftClose size={16} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button 
            onClick={onNewSession}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-all shadow-xs active:scale-98"
          >
            <PlusCircle size={15} />
            <span>New Conversation</span>
          </button>

          {onOpenArtifacts && (
            <button 
              onClick={onOpenArtifacts}
              className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-semibold py-2 px-4 rounded-xl transition-all border border-slate-200/60 dark:border-slate-700/60"
            >
              <Layers size={14} className="text-indigo-500" />
              <span>Artifacts Library</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Sessions */}
      <div className="px-3.5 py-2.5 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-slate-100 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>
      
      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2.5 py-1">
          Recent History ({filteredSessions.length})
        </div>
        
        {filteredSessions.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">
            {search ? 'No matching chats found' : 'No conversations yet'}
          </div>
        ) : (
          filteredSessions.map(session => (
            <div
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`group w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer select-none ${
                currentSessionId === session.id 
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-500/20 font-medium shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <MessageSquare size={14} className={`shrink-0 ${currentSessionId === session.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span className="truncate">{session.title}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {session.message_count !== undefined && session.message_count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono transition-opacity ${
                    currentSessionId === session.id ? 'group-hover:hidden' : 'group-hover:hidden'
                  } bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400`}>
                    {session.message_count}
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => handleDeleteSession(e, session.id)}
                  disabled={isDeleting === session.id}
                  className={`p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-all z-10 shrink-0 ${
                    currentSessionId === session.id ? 'opacity-80 hover:opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                  title="Delete conversation"
                >
                  <Trash2 size={13} className={isDeleting === session.id ? 'animate-spin text-rose-500' : ''} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Controls & Theme Switcher */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col gap-2 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center justify-between bg-slate-200/60 dark:bg-slate-800/70 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs">
          <button
            onClick={() => { if (onSetTheme) onSetTheme('light'); else onToggleTheme(); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1 rounded-lg font-medium transition-all ${
              theme === 'light' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sun size={13} className={theme === 'light' ? 'text-amber-500' : ''} />
            <span>Light</span>
          </button>
          <button
            onClick={() => { if (onSetTheme) onSetTheme('dark'); else onToggleTheme(); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1 rounded-lg font-medium transition-all ${
              theme === 'dark' 
                ? 'bg-slate-900 text-white shadow-xs' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Moon size={13} className={theme === 'dark' ? 'text-indigo-400' : ''} />
            <span>Dark</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between px-1">
          <span>Corpus: 300+ Episodes</span>
          <span className="inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Ready</span>
          </span>
        </div>
      </div>
    </aside>
  );
}
