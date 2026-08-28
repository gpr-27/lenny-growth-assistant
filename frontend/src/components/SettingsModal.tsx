import { useState, useEffect } from 'react';
import { X, Key, Shield, Settings, Sparkles, Zap, Cpu, Edit3, Trash2, Check } from 'lucide-react';
import type { ModelInfo } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: { 
    anthropicKey: string; 
    openaiKey: string;
    anthropicModel: string;
    openaiModel: string;
    ollamaModel: string;
  }) => void;
}

export default function SettingsModal({ isOpen, onClose, onSave }: SettingsModalProps) {
  const [anthropicKey, setAnthropicKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  
  const [anthropicModel, setAnthropicModel] = useState('claude-3-5-haiku-20241022');
  const [openaiModel, setOpenaiModel] = useState('gpt-4o-mini');
  const [ollamaModel, setOllamaModel] = useState('llama3.2:1b');

  const [customInputOpen, setCustomInputOpen] = useState<{ provider?: 'anthropic' | 'openai' | 'ollama' }>({});
  const [tempCustomVal, setTempCustomVal] = useState('');

  const [anthropicModels, setAnthropicModels] = useState<ModelInfo[]>([
    { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", tag: "⚡ Fast & Cheap", pricing: "$0.80 / $4.00 per 1M tokens", description: "Next-gen lightning fast model" },
    { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", tag: "🚀 Flagship Intelligence", pricing: "$3.00 / $15.00 per 1M tokens", description: "Industry benchmark for nuance" },
    { id: "claude-3-7-sonnet-20250219", name: "Claude 3.7 Sonnet", tag: "🧠 Hybrid Reasoning", pricing: "$3.00 / $15.00 per 1M tokens", description: "Hybrid extended thinking model" },
    { id: "claude-3-opus-20240229", name: "Claude 3 Opus", tag: "📚 Deep Analysis", pricing: "$15.00 / $75.00 per 1M tokens", description: "Deep analytical capability" }
  ]);

  const [openaiModels, setOpenaiModels] = useState<ModelInfo[]>([
    { id: "gpt-4o-mini", name: "GPT-4o Mini", tag: "⚡ Fast & Cheap", pricing: "$0.15 / $0.60 per 1M tokens", description: "Affordable multimodal intelligence" },
    { id: "gpt-4o", name: "GPT-4o", tag: "🚀 Flagship", pricing: "$2.50 / $10.00 per 1M tokens", description: "Omni multimodal flagship" },
    { id: "o3-mini", name: "o3-mini", tag: "🧠 Fast Reasoning", pricing: "$1.10 / $4.40 per 1M tokens", description: "High-speed reasoning model" },
    { id: "o1", name: "o1", tag: "🔬 Deep Reasoning", pricing: "$15.00 / $60.00 per 1M tokens", description: "Deep thinking model" },
    { id: "gpt-4.5-preview", name: "GPT-4.5 Preview", tag: "✨ Frontier Research", pricing: "$75.00 / $150.00 per 1M tokens", description: "Frontier research model" }
  ]);

  const [ollamaModels, setOllamaModels] = useState<ModelInfo[]>([
    { id: "llama3.2:1b", name: "Llama 3.2 1B", tag: "💻 Free / Local", pricing: "100% Free", description: "Lightweight 1B model" },
    { id: "llama3.2", name: "Llama 3.2 3B", tag: "⚡ Ultra-Fast Local", pricing: "100% Free", description: "3B model for low memory" },
    { id: "deepseek-r1:8b", name: "DeepSeek R1 8B", tag: "🧠 Local Reasoning", pricing: "100% Free", description: "Open reasoning model" },
    { id: "qwen2.5", name: "Qwen 2.5 7B", tag: "🌐 Multilingual Open", pricing: "100% Free", description: "Alibaba flagship open weights" }
  ]);

  useEffect(() => {
    if (isOpen) {
      const savedAKey = localStorage.getItem('lenny_anthropic_key') || '';
      const savedOKey = localStorage.getItem('lenny_openai_key') || '';
      setAnthropicKey(savedAKey);
      setOpenaiKey(savedOKey);

      const savedAModel = localStorage.getItem('lenny_anthropic_model') || 'claude-3-5-haiku-20241022';
      const savedOModel = localStorage.getItem('lenny_openai_model') || 'gpt-4o-mini';
      const savedLModel = localStorage.getItem('lenny_ollama_model') || 'llama3.2:1b';

      setAnthropicModel(savedAModel);
      setOpenaiModel(savedOModel);
      setOllamaModel(savedLModel);

      fetch(`${API_URL}/models`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'anthropic', api_key: savedAKey || undefined })
      })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.models && data.models.length > 0) {
          let list: ModelInfo[] = data.models;
          if (!list.some(m => m.id === savedAModel)) {
            list = [{ id: savedAModel, name: savedAModel, tag: "✏️ Custom", pricing: "Custom Model", description: `Custom: ${savedAModel}` }, ...list];
          }
          setAnthropicModels(list);
        }
      })
      .catch(() => {});

      fetch(`${API_URL}/models`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'openai', api_key: savedOKey || undefined })
      })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.models && data.models.length > 0) {
          let list: ModelInfo[] = data.models;
          if (!list.some(m => m.id === savedOModel)) {
            list = [{ id: savedOModel, name: savedOModel, tag: "✏️ Custom", pricing: "Custom Model", description: `Custom: ${savedOModel}` }, ...list];
          }
          setOpenaiModels(list);
        }
      })
      .catch(() => {});

      fetch(`${API_URL}/models`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'ollama' })
      })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.models && data.models.length > 0) {
          let list: ModelInfo[] = data.models;
          if (!list.some(m => m.id === savedLModel)) {
            list = [{ id: savedLModel, name: savedLModel, tag: "✏️ Custom", pricing: "Custom Model", description: `Custom: ${savedLModel}` }, ...list];
          }
          setOllamaModels(list);
        }
      })
      .catch(() => {});
    }
  }, [isOpen]);

  const handleSave = () => {
    if (anthropicKey.trim()) localStorage.setItem('lenny_anthropic_key', anthropicKey.trim());
    else localStorage.removeItem('lenny_anthropic_key');

    if (openaiKey.trim()) localStorage.setItem('lenny_openai_key', openaiKey.trim());
    else localStorage.removeItem('lenny_openai_key');

    localStorage.setItem('lenny_anthropic_model', anthropicModel);
    localStorage.setItem('lenny_openai_model', openaiModel);
    localStorage.setItem('lenny_ollama_model', ollamaModel);

    onSave({
      anthropicKey: anthropicKey.trim(),
      openaiKey: openaiKey.trim(),
      anthropicModel,
      openaiModel,
      ollamaModel
    });
    onClose();
  };

  const handleAddCustomModel = (provider: 'anthropic' | 'openai' | 'ollama') => {
    const trimmed = tempCustomVal.trim();
    if (!trimmed) return;

    const customItem: ModelInfo = {
      id: trimmed,
      name: trimmed,
      tag: "✏️ Custom",
      pricing: "Custom Model",
      description: `User-defined ${provider.toUpperCase()} model: ${trimmed}`
    };

    if (provider === 'anthropic') {
      setAnthropicModels(prev => [customItem, ...prev.filter(m => m.id !== trimmed)]);
      setAnthropicModel(trimmed);
      localStorage.setItem('lenny_anthropic_model', trimmed);
    } else if (provider === 'openai') {
      setOpenaiModels(prev => [customItem, ...prev.filter(m => m.id !== trimmed)]);
      setOpenaiModel(trimmed);
      localStorage.setItem('lenny_openai_model', trimmed);
    } else {
      setOllamaModels(prev => [customItem, ...prev.filter(m => m.id !== trimmed)]);
      setOllamaModel(trimmed);
      localStorage.setItem('lenny_ollama_model', trimmed);
    }

    setCustomInputOpen({});
    setTempCustomVal('');
  };

  const handleDeleteModel = (provider: 'anthropic' | 'openai' | 'ollama', modelId: string) => {
    if (provider === 'anthropic') {
      const remaining = anthropicModels.filter(m => m.id !== modelId);
      setAnthropicModels(remaining);
      if (anthropicModel === modelId) {
        const fallback = remaining.length > 0 ? remaining[0].id : 'claude-3-5-haiku-20241022';
        setAnthropicModel(fallback);
        localStorage.setItem('lenny_anthropic_model', fallback);
      }
    } else if (provider === 'openai') {
      const remaining = openaiModels.filter(m => m.id !== modelId);
      setOpenaiModels(remaining);
      if (openaiModel === modelId) {
        const fallback = remaining.length > 0 ? remaining[0].id : 'gpt-4o-mini';
        setOpenaiModel(fallback);
        localStorage.setItem('lenny_openai_model', fallback);
      }
    } else {
      const remaining = ollamaModels.filter(m => m.id !== modelId);
      setOllamaModels(remaining);
      if (ollamaModel === modelId) {
        const fallback = remaining.length > 0 ? remaining[0].id : 'llama3.2:1b';
        setOllamaModel(fallback);
        localStorage.setItem('lenny_ollama_model', fallback);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm animate-fadeIn p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-fadeIn">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Settings size={16} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">Provider & Model Configuration</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Manage LLM engines, custom fine-tunes, and API keys</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Sparkles size={14} className="text-emerald-500" />
                <span>OpenAI Provider</span>
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key size={13} className="text-slate-400" />
              </div>
              <input
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-proj-..."
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono transition-all"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Select Model</span>
                <button
                  type="button"
                  onClick={() => { setCustomInputOpen({ provider: 'openai' }); setTempCustomVal(openaiModel); }}
                  className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1"
                >
                  <Edit3 size={11} />
                  <span>Custom ID</span>
                </button>
              </div>

              {customInputOpen.provider === 'openai' ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempCustomVal}
                    onChange={(e) => setTempCustomVal(e.target.value)}
                    placeholder="e.g. gpt-4o-mini"
                    className="flex-1 min-w-0 px-3 py-1.5 bg-white dark:bg-slate-900 border border-emerald-500 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustomModel('openai'); }}
                  />
                  <button type="button" onClick={() => handleAddCustomModel('openai')} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow-xs shrink-0">Apply</button>
                  <button type="button" onClick={() => setCustomInputOpen({})} className="px-2 py-1.5 text-xs text-slate-500 shrink-0">Cancel</button>
                </div>
              ) : (
                <div className="flex items-center gap-2 w-full min-w-0">
                  <select 
                    value={openaiModel} 
                    onChange={(e) => setOpenaiModel(e.target.value)} 
                    className="w-full min-w-0 flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer truncate"
                  >
                    {openaiModels.map(m => (<option key={m.id} value={m.id} className="dark:bg-slate-900">{m.name} ({m.tag}) {m.pricing ? `— ${m.pricing}` : ''}</option>))}
                  </select>
                  {openaiModels.find(m => m.id === openaiModel)?.tag.includes("Custom") && (
                    <button type="button" onClick={() => handleDeleteModel('openai', openaiModel)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors shrink-0" title="Remove this custom model"><Trash2 size={13} /></button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                <Zap size={14} className="text-purple-500" />
                <span>Anthropic Claude Provider</span>
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key size={13} className="text-slate-400" />
              </div>
              <input
                type="password"
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                placeholder="sk-ant-api03-..."
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono transition-all"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Select Model</span>
                <button
                  type="button"
                  onClick={() => { setCustomInputOpen({ provider: 'anthropic' }); setTempCustomVal(anthropicModel); }}
                  className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline font-semibold flex items-center gap-1"
                >
                  <Edit3 size={11} />
                  <span>Custom ID</span>
                </button>
              </div>
              {customInputOpen.provider === 'anthropic' ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempCustomVal}
                    onChange={(e) => setTempCustomVal(e.target.value)}
                    placeholder="e.g. claude-3-5-haiku-20241022"
                    className="flex-1 min-w-0 px-3 py-1.5 bg-white dark:bg-slate-900 border border-purple-500 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustomModel('anthropic'); }}
                  />
                  <button type="button" onClick={() => handleAddCustomModel('anthropic')} className="px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-xl shadow-xs shrink-0">Apply</button>
                  <button type="button" onClick={() => setCustomInputOpen({})} className="px-2 py-1.5 text-xs text-slate-500 shrink-0">Cancel</button>
                </div>
              ) : (
                <div className="flex items-center gap-2 w-full min-w-0">
                  <select 
                    value={anthropicModel} 
                    onChange={(e) => setAnthropicModel(e.target.value)} 
                    className="w-full min-w-0 flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer truncate"
                  >
                    {anthropicModels.map(m => (<option key={m.id} value={m.id} className="dark:bg-slate-900">{m.name} ({m.tag}) {m.pricing ? `— ${m.pricing}` : ''}</option>))}
                  </select>
                  {anthropicModels.find(m => m.id === anthropicModel)?.tag.includes("Custom") && (
                    <button type="button" onClick={() => handleDeleteModel('anthropic', anthropicModel)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors shrink-0" title="Remove this custom model"><Trash2 size={13} /></button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <Cpu size={14} className="text-blue-500" />
                <span>Local Ollama Models</span>
              </label>
              <button
                type="button"
                onClick={() => { setCustomInputOpen({ provider: 'ollama' }); setTempCustomVal(ollamaModel); }}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1"
              >
                <Edit3 size={11} />
                <span>Custom ID</span>
              </button>
            </div>
            <div>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium block mb-1.5">Select Model</span>
              {customInputOpen.provider === 'ollama' ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempCustomVal}
                    onChange={(e) => setTempCustomVal(e.target.value)}
                    placeholder="e.g. llama3.2:1b"
                    className="flex-1 min-w-0 px-3 py-1.5 bg-white dark:bg-slate-900 border border-blue-500 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustomModel('ollama'); }}
                  />
                  <button type="button" onClick={() => handleAddCustomModel('ollama')} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-xs shrink-0">Apply</button>
                  <button type="button" onClick={() => setCustomInputOpen({})} className="px-2 py-1.5 text-xs text-slate-500 shrink-0">Cancel</button>
                </div>
              ) : (
                <div className="flex items-center gap-2 w-full min-w-0">
                  <select 
                    value={ollamaModel} 
                    onChange={(e) => setOllamaModel(e.target.value)} 
                    className="w-full min-w-0 flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer truncate"
                  >
                    {ollamaModels.map(m => (<option key={m.id} value={m.id} className="dark:bg-slate-900">{m.name} ({m.tag}) {m.pricing ? `— ${m.pricing}` : ''}</option>))}
                  </select>
                  {ollamaModels.find(m => m.id === ollamaModel)?.tag.includes("Custom") && (
                    <button type="button" onClick={() => handleDeleteModel('ollama', ollamaModel)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors shrink-0" title="Remove this custom model"><Trash2 size={13} /></button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Check size={14} />
            <span>Save & Apply</span>
          </button>
        </div>
      </div>
    </div>
  );
}
