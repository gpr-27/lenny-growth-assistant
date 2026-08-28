import { useState, useRef, useEffect } from 'react';
import { Send, FileCode2, Sparkles, Copy, Check, ExternalLink, Lightbulb, TrendingUp, Layers, BookOpen, Headphones, X, ChevronDown, ChevronRight, Activity, Search, ShieldCheck, PenTool, Bot, User as UserIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message, Artifact, Citation } from '../types';

interface ChatProps {
  messages: Message[];
  loading: boolean;
  onSendMessage: (msg: string) => void;
  onArtifactClick: (artifact: Artifact) => void;
  messageQueue?: string[];
  onRemoveFromQueue?: (index: number) => void;
  onClearQueue?: () => void;
}

export default function Chat({ 
  messages, 
  loading, 
  onSendMessage, 
  onArtifactClick, 
  messageQueue = [],
  onRemoveFromQueue,
  onClearQueue
}: ChatProps) {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedSource, setCopiedSource] = useState(false);
  const [expandedTraces, setExpandedTraces] = useState<Record<string, boolean>>({});
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const toggleTrace = (id: string) => {
    setExpandedTraces(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    if (distanceFromBottom < 80) {
      setIsAutoScrollEnabled(true);
      setShowScrollBottomBtn(false);
    } else {
      setIsAutoScrollEnabled(false);
      setShowScrollBottomBtn(true);
    }
  };

  useEffect(() => {
    if (isAutoScrollEnabled) {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages, loading, isAutoScrollEnabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setIsAutoScrollEnabled(true);
    setShowScrollBottomBtn(false);
    onSendMessage(input);
    setInput('');
  };

  const scrollToBottom = () => {
    setIsAutoScrollEnabled(true);
    setShowScrollBottomBtn(false);
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopySourceText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSource(true);
    setTimeout(() => setCopiedSource(false), 2000);
  };

  const promptSuggestions = [
    {
      icon: <Lightbulb size={16} className="text-amber-500" />,
      category: "1. Grounded Q&A",
      title: "Stripe Operating Principles",
      prompt: "What are Claire Hughes Johnson's core operating principles from scaling Stripe?"
    },
    {
      icon: <Sparkles size={16} className="text-violet-500" />,
      category: "2. Content Engine",
      title: "Ship 30 for 30 Essay",
      prompt: "Turn the key retention metrics and PM lessons from Lenny's guests into a Ship 30 for 30 essay."
    },
    {
      icon: <Layers size={16} className="text-indigo-500" />,
      category: "3. Visual Artifacts",
      title: "Interactive Growth Dashboard",
      prompt: "Generate an interactive HTML growth dashboard wireframe with metric cards."
    },
    {
      icon: <TrendingUp size={16} className="text-emerald-500" />,
      category: "4. Product Frameworks",
      title: "PMF Evaluation Wireframe",
      prompt: "Create an interactive HTML product-market fit evaluation framework wireframe with metric cards."
    }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative overflow-hidden transition-colors duration-200 bg-grid-pattern ambient-glow">
      {/* Messages Scroll Area */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-6 space-y-6 relative z-10"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-8 animate-fadeIn">
            {/* Ambient Hero Avatar */}
            <div className="relative mb-5">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-600 rounded-3xl blur-md opacity-40 animate-pulseGlow"></div>
              <div className="relative w-16 h-16 bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-900 text-white rounded-2xl shadow-2xl ring-1 ring-white/25 flex items-center justify-center">
                <Sparkles size={28} className="text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)]" />
              </div>
            </div>
            
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/30 rounded-full text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-3 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
              <span>Lenny’s Podcast Intelligence Suite</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
              The Lenny Growth Assistant
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-md mb-8 leading-relaxed">
              Synthesized product frameworks, retention loops, and growth strategies grounded strictly in 300+ episodes of Lenny’s Podcast transcripts.
            </p>

            {/* Quick Prompt Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full text-left">
              {promptSuggestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(item.prompt)}
                  className="p-4 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/60 dark:hover:border-indigo-500/60 hover:shadow-lg dark:hover:shadow-indigo-950/40 hover:-translate-y-0.5 transition-all duration-200 rounded-2xl group flex flex-col gap-2.5 text-left shadow-xs"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/50 group-hover:scale-105 transition-transform">
                        {item.icon}
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{item.title}</span>
                    </div>
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-700/40">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors leading-relaxed">
                    {item.prompt}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div 
              key={msg.id || i} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
            >
              <div 
                className={`max-w-[90%] md:max-w-[85%] rounded-2xl px-5 sm:px-6 py-4 sm:py-5 shadow-xs transition-all ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-indigo-600 via-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-500/15 border border-indigo-500/30' 
                    : 'bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 shadow-sm'
                }`}
              >
                {/* Message Header / Controls */}
                <div className="flex items-center justify-between gap-4 mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-2">
                    {msg.role === 'user' ? (
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white">
                        <UserIcon size={12} />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <Bot size={12} />
                      </div>
                    )}
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${msg.role === 'user' ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                      {msg.role === 'user' ? 'You' : 'Lenny Growth Assistant'}
                    </span>
                  </div>

                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  )}
                </div>

                {/* Markdown Rendered Content */}
                <div className={`prose prose-sm max-w-none break-words ${msg.role === 'user' ? 'prose-invert text-white' : 'prose-slate dark:prose-invert'}`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
                
                {/* Interactive Citations Badges */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                      <BookOpen size={12} className="text-indigo-500" />
                      <span>Verified Sources & Transcripts:</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {msg.citations.map((cite, idx) => {
                        const isObj = typeof cite === 'object' && cite !== null;
                        const title = isObj ? cite.title : cite;
                        const ep = isObj && cite.episode ? cite.episode : null;
                        const citeObj: Citation = isObj ? cite : { title: String(cite) };

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedCitation(citeObj)}
                            className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs px-2.5 py-1 rounded-lg font-medium border border-indigo-200/70 dark:border-indigo-800/50 transition-all cursor-pointer shadow-2xs active:scale-95 text-left group"
                            title="Click to view exact transcript grounding passage"
                          >
                            <span>{title}</span>
                            {ep && <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-100 dark:bg-indigo-900/80 px-1 py-0.2 rounded">{ep}</span>}
                            <ExternalLink size={10} className="text-indigo-500 opacity-60 group-hover:opacity-100" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Trace Visualization */}
                {msg.trace && msg.trace.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <button 
                      onClick={() => toggleTrace(msg.id)}
                      className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:text-slate-800 dark:hover:text-slate-200 transition-colors w-full text-left"
                    >
                      {expandedTraces[msg.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <span>Execution Trace</span>
                    </button>
                    
                    {expandedTraces[msg.id] && (
                      <div className="mt-3 pl-2 space-y-2.5 relative before:absolute before:inset-y-2 before:left-3.5 before:w-px before:bg-slate-200 dark:before:bg-slate-800">
                        {msg.trace.map((step, idx) => {
                          let Icon = Activity;
                          let color = "text-slate-400 bg-slate-100 dark:bg-slate-800";
                          if (step.includes("expand")) { Icon = Search; color = "text-blue-500 bg-blue-100 dark:bg-blue-950"; }
                          else if (step.includes("retrieve")) { Icon = Search; color = "text-purple-500 bg-purple-100 dark:bg-purple-950"; }
                          else if (step.includes("grade")) { Icon = ShieldCheck; color = "text-emerald-500 bg-emerald-100 dark:bg-emerald-950"; }
                          else if (step.includes("give_up")) { Icon = ShieldCheck; color = "text-amber-500 bg-amber-100 dark:bg-amber-950"; }
                          else if (step.includes("generate")) { Icon = PenTool; color = "text-indigo-600 bg-indigo-100 dark:bg-indigo-950"; }
                          
                          return (
                            <div key={idx} className="relative flex items-start gap-3 animate-fadeIn">
                              <div className={`relative z-10 p-1 rounded-full ${color} ring-4 ring-white dark:ring-slate-900`}>
                                <Icon size={12} />
                              </div>
                              <div className="pt-0.5">
                                <span className="text-xs font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shadow-2xs">
                                  {step}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Renderable Artifacts Cards */}
                {msg.artifacts && msg.artifacts.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-2">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Generated Artifact:</span>
                    {msg.artifacts.map((art, idx) => (
                      <button
                        key={idx}
                        onClick={() => onArtifactClick(art)}
                        className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 px-4 py-3 rounded-xl transition-all shadow-xs group w-full text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <FileCode2 size={16} />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {art.title || 'Interactive Dashboard Artifact'}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">Click to open live sandbox in split viewer</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950 px-2 py-0.5 rounded-full uppercase tracking-wider border border-indigo-200 dark:border-indigo-800/60">
                          {art.type}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        
        {/* Streaming / Loading Bubble */}
        {loading && (
          <div className="flex justify-start animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl px-5 py-3.5 flex items-center gap-3 shadow-xs">
              <Sparkles size={16} className="text-indigo-600 dark:text-indigo-400 animate-spin" />
              <span className="text-xs font-medium">Synthesizing grounded transcript knowledge...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottomBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 sm:right-10 z-20 flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg shadow-indigo-500/30 text-xs font-semibold animate-fadeIn transition-all active:scale-95"
        >
          <ChevronDown size={14} className="animate-bounce" />
          <span>Scroll to latest</span>
        </button>
      )}

      {/* Input Composer */}
      <div className="p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 shrink-0 transition-colors duration-200">
        {/* Message Queue Individual Rectangular Cards */}
        {messageQueue && messageQueue.length > 0 && (
          <div className="max-w-4xl mx-auto mb-2.5 space-y-1.5 animate-fadeIn">
            <div className="flex items-center justify-between px-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                <span>Queued Messages ({messageQueue.length}) — Auto-sends in order:</span>
              </span>
              {messageQueue.length > 1 && onClearQueue && (
                <button
                  type="button"
                  onClick={onClearQueue}
                  className="text-[10px] text-slate-400 hover:text-rose-500 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto pr-1">
              {messageQueue.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white dark:bg-slate-900/90 border border-indigo-200/90 dark:border-indigo-800/80 rounded-xl px-3 py-1.5 shadow-2xs text-xs text-slate-800 dark:text-slate-200 group hover:border-indigo-400 dark:hover:border-indigo-600 transition-all"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800 shrink-0 font-mono">
                      #{index + 1}
                    </span>
                    <span className="truncate text-xs text-slate-700 dark:text-slate-300 font-medium">
                      {item}
                    </span>
                  </div>

                  {onRemoveFromQueue && (
                    <button
                      type="button"
                      onClick={() => onRemoveFromQueue(index)}
                      className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors shrink-0"
                      title="Remove from queue"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={loading ? "Type next message to add to queue..." : "Ask about retention loops, PM frameworks, or request an interactive dashboard..."}
            className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl pl-5 pr-14 py-3.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
          />
          <button 
            type="submit"
            disabled={!input.trim()}
            className="absolute right-2 aspect-square bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl p-2.5 flex items-center justify-center transition-all shadow-xs hover:shadow active:scale-95"
            title={loading ? "Queue message to send next" : "Send prompt"}
          >
            <Send size={16} className={input.trim() ? "ml-0.5" : ""} />
          </button>
        </form>
      </div>

      {/* Source Inspector Modal */}
      {selectedCitation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm animate-fadeIn p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-fadeIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Headphones size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    {selectedCitation.title}
                  </h3>
                  {selectedCitation.episode && (
                    <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900">
                      {selectedCitation.episode}
                    </span>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setSelectedCitation(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <BookOpen size={13} className="text-indigo-500" />
                  Retrieved Transcript Passage
                </span>
                <button
                  onClick={() => handleCopySourceText(selectedCitation.content || selectedCitation.snippet || '')}
                  className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2.5 py-1 rounded-lg transition-colors"
                >
                  {copiedSource ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  <span>{copiedSource ? 'Copied' : 'Copy Passage'}</span>
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-700 dark:text-slate-300 leading-relaxed max-h-[350px] overflow-y-auto whitespace-pre-wrap selection:bg-indigo-500/20">
                {selectedCitation.content || selectedCitation.snippet || "Full transcript excerpt for this chunk is available in the vector index."}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              {selectedCitation.url ? (
                <a
                  href={selectedCitation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-semibold flex items-center gap-1.5 transition-colors bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800/60 shadow-2xs"
                >
                  <span>View Full Transcript on GitHub</span>
                  <ExternalLink size={12} />
                </a>
              ) : (
                <span className="text-xs text-slate-400">Lenny's Podcast Archive</span>
              )}
              <button
                onClick={() => setSelectedCitation(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
