import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import ArtifactViewer from './components/ArtifactViewer';
import ArtifactsLibrary from './components/ArtifactsLibrary';
import SettingsModal from './components/SettingsModal';
import { useChat } from './hooks/useChat';
import { Cpu, Cloud, Database, Sparkles, Settings, Trash2, Plus, Sun, Moon, PanelLeftClose, PanelLeft, ChevronRight, MessageSquare, Layers } from 'lucide-react';
import type { ModelInfo } from './types';

function App() {
  const [currentTab, setCurrentTab] = useState<'chat' | 'artifacts'>('chat');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [provider, setProvider] = useState<'ollama' | 'anthropic' | 'openai'>('ollama');
  const [activeModel, setActiveModel] = useState<string>('llama3.2:1b');
  const [modelsList, setModelsList] = useState<ModelInfo[]>([
    {
      id: "llama3.2:1b",
      name: "Llama 3.2 1B",
      tag: "💻 Free / Local",
      pricing: "100% Free (Local)",
      description: "Standard 1B open model"
    }
  ]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<{ transcripts?: number; chunks?: number } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCustomModelModalOpen, setIsCustomModelModalOpen] = useState(false);
  const [customModelInput, setCustomModelInput] = useState('');
  
  const { 
    messages, 
    loading, 
    sendMessage, 
    activeArtifact, 
    setActiveArtifact, 
    startNewSession, 
    messageQueue, 
    removeFromQueue, 
    clearQueue 
  } = useChat(
    sessionId, 
    provider, 
    activeModel,
    (newId) => setSessionId(newId)
  );

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('lenny_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
  });

  // Sync theme with HTML root and body
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (theme === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
      body.style.backgroundColor = '#020617';
      body.style.color = '#f8fafc';
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
      body.style.backgroundColor = '#f8fafc';
      body.style.color = '#0f172a';
    }
    localStorage.setItem('lenny_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleSetTheme = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
  };

  // Sync active model when provider changes
  useEffect(() => {
    const fetchModelsForProvider = async () => {
      const savedKey = provider === 'anthropic' 
        ? localStorage.getItem('lenny_anthropic_key') 
        : provider === 'openai' 
        ? localStorage.getItem('lenny_openai_key') 
        : null;

      const savedModel = provider === 'anthropic'
        ? (localStorage.getItem('lenny_anthropic_model') || 'claude-3-5-haiku-20241022')
        : provider === 'openai'
        ? (localStorage.getItem('lenny_openai_model') || 'gpt-4o-mini')
        : (localStorage.getItem('lenny_ollama_model') || 'llama3.2:1b');

      setActiveModel(savedModel);

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/models`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider, api_key: savedKey || undefined })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.models && data.models.length > 0) {
            let list: ModelInfo[] = data.models;
            if (!list.some(m => m.id === savedModel)) {
              const customItem: ModelInfo = {
                id: savedModel,
                name: savedModel,
                tag: "✏️ Custom",
                pricing: "Custom Model",
                description: `Custom model ID: ${savedModel}`
              };
              list = [customItem, ...list];
            }
            setModelsList(list);
          }
        }
      } catch (e) {
        console.error("Failed to load models list", e);
      }
    };

    fetchModelsForProvider();
  }, [provider]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/health/db`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.corpus) {
          setDbStatus({ transcripts: data.corpus.transcripts, chunks: data.corpus.vector_chunks });
        }
      })
      .catch(() => {});
  }, []);

  const handleSessionChange = (id: string | null) => {
    setSessionId(id);
    setActiveArtifact(null);
  };

  const handleSettingsSave = (settings: { anthropicModel: string; openaiModel: string; ollamaModel: string }) => {
    const selected = provider === 'anthropic' 
      ? settings.anthropicModel 
      : provider === 'openai' 
      ? settings.openaiModel 
      : settings.ollamaModel;

    setActiveModel(selected);
    setModelsList(prev => {
      if (!prev.some(m => m.id === selected)) {
        return [
          {
            id: selected,
            name: selected,
            tag: "✏️ Custom",
            pricing: "Custom Model",
            description: `Model ID: ${selected}`
          },
          ...prev
        ];
      }
      return prev;
    });
  };

  const handleApplyCustomModel = () => {
    const trimmed = customModelInput.trim();
    if (trimmed) {
      const customItem: ModelInfo = {
        id: trimmed,
        name: trimmed,
        tag: "✏️ Custom",
        pricing: "Custom Model",
        description: `Custom model: ${trimmed}`
      };
      setModelsList(prev => [customItem, ...prev.filter(m => m.id !== trimmed)]);
      setActiveModel(trimmed);

      if (provider === 'anthropic') localStorage.setItem('lenny_anthropic_model', trimmed);
      if (provider === 'openai') localStorage.setItem('lenny_openai_model', trimmed);
      if (provider === 'ollama') localStorage.setItem('lenny_ollama_model', trimmed);
    }
    setIsCustomModelModalOpen(false);
  };

  const handleDeleteCustomModel = (modelId: string) => {
    const defaultModel = provider === 'anthropic' 
      ? 'claude-3-5-haiku-20241022' 
      : provider === 'openai' 
      ? 'gpt-4o-mini' 
      : 'llama3.2:1b';

    const remaining = modelsList.filter(m => m.id !== modelId);
    setModelsList(remaining);

    if (activeModel === modelId) {
      const fallback = remaining.length > 0 ? remaining[0].id : defaultModel;
      setActiveModel(fallback);
      if (provider === 'anthropic') localStorage.setItem('lenny_anthropic_model', fallback);
      if (provider === 'openai') localStorage.setItem('lenny_openai_model', fallback);
      if (provider === 'ollama') localStorage.setItem('lenny_ollama_model', fallback);
    }
  };

  const isCurrentModelCustom = modelsList.find(m => m.id === activeModel)?.tag.includes("Custom");
  const customModels = modelsList.filter(m => m.tag.includes("Custom"));

  return (
    <div className={`flex h-screen w-full ${theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} overflow-hidden font-sans antialiased selection:bg-indigo-500/30 selection:text-indigo-300 transition-colors duration-200`}>
      {/* Session History Sidebar */}
      <Sidebar 
        currentSessionId={sessionId} 
        onSelectSession={(id) => {
          handleSessionChange(id);
          setCurrentTab('chat');
        }}
        onNewSession={() => {
          setSessionId(null);
          startNewSession();
          setCurrentTab('chat');
        }}
        onOpenArtifacts={() => setCurrentTab('artifacts')}
        theme={theme}
        onToggleTheme={toggleTheme}
        onSetTheme={handleSetTheme}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col min-w-0 relative bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        <header className="h-14 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between px-4 sm:px-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shrink-0 z-10 select-none transition-colors duration-200">
          <div className="flex items-center gap-3">
            {/* Sidebar expand button when collapsed */}
            {isSidebarCollapsed && (
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Expand Sidebar"
              >
                <PanelLeft size={18} />
              </button>
            )}

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulseGlow" />
              <h1 className="font-bold text-slate-900 dark:text-white text-sm md:text-base tracking-tight flex items-center gap-1.5">
                <span>The Lenny Growth Assistant</span>
              </h1>
            </div>

            {/* Primary Tab Switcher: Chat vs Artifacts */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs font-semibold ml-2">
              <button
                onClick={() => setCurrentTab('chat')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                  currentTab === 'chat'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <MessageSquare size={13} />
                <span>Chat</span>
              </button>
              <button
                onClick={() => setCurrentTab('artifacts')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                  currentTab === 'artifacts'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Layers size={13} />
                <span>Artifacts</span>
              </button>
            </div>

            {dbStatus && (
              <span className="hidden 2xl:inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 px-2.5 py-0.5 rounded-full font-medium shadow-xs">
                <Database size={11} className="text-emerald-500" />
                <span>{dbStatus.transcripts} episodes ({dbStatus.chunks} chunks)</span>
              </span>
            )}
          </div>

          {/* Model & Provider Selector Pill */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 p-1 rounded-xl shadow-xs">
              <button
                onClick={() => setProvider('ollama')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  provider === 'ollama' 
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200/60 dark:border-slate-700' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Cpu size={13} className={provider === 'ollama' ? 'text-blue-500' : 'text-slate-400'} />
                <span>Ollama</span>
              </button>

              <button
                onClick={() => setProvider('anthropic')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  provider === 'anthropic' 
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200/60 dark:border-slate-700' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Cloud size={13} className={provider === 'anthropic' ? 'text-purple-500' : 'text-slate-400'} />
                <span>Anthropic</span>
              </button>

              <button
                onClick={() => setProvider('openai')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  provider === 'openai' 
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200/60 dark:border-slate-700' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sparkles size={13} className={provider === 'openai' ? 'text-emerald-500' : 'text-slate-400'} />
                <span>OpenAI</span>
              </button>
            </div>

            {/* Dynamic Model Dropdown with Pricing */}
            <div className="hidden lg:flex items-center bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl px-2.5 py-1 gap-1.5">
              <select
                value={activeModel}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'custom_prompt') {
                    setCustomModelInput(activeModel);
                    setIsCustomModelModalOpen(true);
                  } else {
                    setActiveModel(val);
                    if (provider === 'anthropic') localStorage.setItem('lenny_anthropic_model', val);
                    if (provider === 'openai') localStorage.setItem('lenny_openai_model', val);
                    if (provider === 'ollama') localStorage.setItem('lenny_ollama_model', val);
                  }
                }}
                className="bg-transparent text-xs text-slate-800 dark:text-slate-200 py-0.5 px-1 focus:outline-none cursor-pointer max-w-[240px] font-medium"
                title="Active Model for current provider"
              >
                {modelsList.map((m) => (
                  <option key={m.id} value={m.id} className="dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {m.name} {m.pricing ? `— ${m.pricing}` : ''}
                  </option>
                ))}
                <option value="custom_prompt" className="dark:bg-slate-900 text-slate-900 dark:text-slate-100">+ Enter Custom Model ID...</option>
              </select>

              {isCurrentModelCustom && (
                <button
                  type="button"
                  onClick={() => handleDeleteCustomModel(activeModel)}
                  className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded transition-colors"
                  title="Remove this custom model"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
            
            {/* Quick Theme Switcher */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-200/60 dark:border-slate-700/60"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-700" />}
            </button>

            {/* Settings Modal Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-200/60 dark:border-slate-700/60"
              title="Provider & Model Settings"
            >
              <Settings size={16} />
            </button>
          </div>
        </header>

        {/* Dynamic Workspace: Artifacts Library vs Dual-Pane Chat Workspace */}
        {/* Artifacts Library Tab */}
        <div className={`flex-1 min-h-0 flex overflow-hidden ${currentTab === 'artifacts' ? 'flex' : 'hidden'}`}>
          <ArtifactsLibrary 
            onOpenArtifact={(art) => {
              setActiveArtifact(art);
              setCurrentTab('chat');
            }}
            onNavigateToSession={(sId) => {
              handleSessionChange(sId);
              setCurrentTab('chat');
            }}
            onStartNewChatWithPrompt={(prompt) => {
              setSessionId(null);
              startNewSession();
              sendMessage(prompt);
              setCurrentTab('chat');
            }}
          />
        </div>

        {/* Dual-Pane Chat & Artifact Viewer Workspace */}
        <div className={`flex-1 min-h-0 flex overflow-hidden ${currentTab === 'chat' ? 'flex' : 'hidden'}`}>
          {/* Chat Panel */}
          <div className={`flex-1 min-h-0 min-w-0 flex flex-col transition-all duration-300 ease-in-out ${
            activeArtifact ? 'w-1/2 border-r border-slate-200 dark:border-slate-800' : 'w-full'
          }`}>
            <Chat 
              messages={messages} 
              loading={loading} 
              onSendMessage={sendMessage}
              onArtifactClick={(artifact) => setActiveArtifact(artifact)}
              messageQueue={messageQueue}
              onRemoveFromQueue={removeFromQueue}
              onClearQueue={clearQueue}
            />
          </div>
          
          {/* Artifact Viewer Panel */}
          {activeArtifact && (
            <div className="w-1/2 min-h-0 min-w-0 bg-slate-50 dark:bg-slate-900/50 overflow-hidden flex flex-col relative z-20 shadow-[-10px_0_25px_-5px_rgba(0,0,0,0.1)] transition-all duration-300">
               <ArtifactViewer 
                 artifact={activeArtifact} 
                 onClose={() => setActiveArtifact(null)} 
               />
            </div>
          )}
        </div>
      </main>

      {/* Custom Model Dialog */}
      {isCustomModelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm animate-fadeIn p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Custom Model Management</h3>
              <button 
                onClick={() => setIsCustomModelModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>
            
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Add New Model ID:</label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                Type any fine-tuned or custom model ID for {provider.toUpperCase()} (e.g. <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-blue-500">gpt-4o-mini</code>, <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-purple-400">claude-3-5-haiku-20241022</code>):
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customModelInput}
                  onChange={(e) => setCustomModelInput(e.target.value)}
                  placeholder="e.g. gpt-4o-mini"
                  className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:border-indigo-500 transition-all"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleApplyCustomModel();
                  }}
                />
                <button
                  type="button"
                  onClick={handleApplyCustomModel}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xs transition-all flex items-center gap-1 shrink-0"
                >
                  <Plus size={14} />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* List of existing custom models with delete option */}
            {customModels.length > 0 && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  Active Custom Models ({customModels.length})
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {customModels.map(cm => (
                    <div 
                      key={cm.id} 
                      className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200"
                    >
                      <span className="truncate flex-1 mr-2">{cm.name}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomModel(cm.id)}
                        className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Delete custom model"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsCustomModelModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onSave={handleSettingsSave} 
      />
    </div>
  );
}

export default App;
