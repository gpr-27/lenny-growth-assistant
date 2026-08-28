import { useState, useEffect, useRef } from 'react';
import type { Message, Artifact } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

export function useChat(
  sessionId: string | null, 
  provider: 'ollama' | 'anthropic' | 'openai', 
  model?: string,
  onSessionCreated?: (id: string) => void
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId);
  const [messageQueue, setMessageQueue] = useState<string[]>([]);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    // Abort any ongoing stream from previous session
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    isProcessingRef.current = false;
    setMessageQueue([]);

    if (sessionId) {
      setCurrentSessionId(sessionId);
      fetchMessages(sessionId);
    } else {
      setMessages([]);
      setActiveArtifact(null);
      setCurrentSessionId(null);
    }
  }, [sessionId]);

  const fetchMessages = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/sessions/${id}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
      } else {
        setMessages([]);
      }
    } catch (e) {
      console.error("Failed to fetch messages", e);
      setMessages([]);
    }
  };

  const startNewSession = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    try {
      const res = await fetch(`${API_URL}/sessions`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setCurrentSessionId(data.id);
        setMessages([]);
        setActiveArtifact(null);
        setMessageQueue([]);
        if (onSessionCreated) onSessionCreated(data.id);
        return data.id;
      }
    } catch (e) {
      console.error("Failed to create session", e);
    }
    return null;
  };

  const executeSendMessage = async (message: string) => {
    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      activeSessionId = await startNewSession();
      if (!activeSessionId) {
        setLoading(false);
        isProcessingRef.current = false;
        return;
      }
    }

    // Optimistically add user message
    const tempUserMsg: Message = { id: Date.now().toString(), role: 'user', content: message };
    setMessages(prev => [...prev, tempUserMsg]);
    setLoading(true);
    isProcessingRef.current = true;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const anthropicKey = localStorage.getItem('lenny_anthropic_key') || undefined;
      const openaiKey = localStorage.getItem('lenny_openai_key') || undefined;
      let api_key = undefined;
      if (provider === 'anthropic') api_key = anthropicKey;
      if (provider === 'openai') api_key = openaiKey;

      const activeModel = model || (
        provider === 'anthropic' ? (localStorage.getItem('lenny_anthropic_model') || 'claude-3-5-sonnet-20241022') :
        provider === 'openai' ? (localStorage.getItem('lenny_openai_model') || 'gpt-4o') :
        (localStorage.getItem('lenny_ollama_model') || 'llama3.2:1b')
      );

      const res = await fetch(`${API_URL}/sessions/${activeSessionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, provider, model: activeModel, api_key }),
        signal: controller.signal
      });

      if (res.ok && res.body) {
        const asstMsgId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: asstMsgId, role: 'assistant', content: '' }]);
        
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let assistantContent = '';
        let buffer = '';

        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';
            
            for (const chunk of lines) {
              const line = chunk.trim();
              if (line.startsWith('data: ')) {
                const dataStr = line.slice(6);
                try {
                  const data = JSON.parse(dataStr);
                  if (data.type === 'meta') {
                    setMessages(prev => prev.map(m => m.id === asstMsgId ? { ...m, citations: data.citations, trace: data.trace } : m));
                  } else if (data.type === 'chunk') {
                    assistantContent += data.text;
                    setMessages(prev => prev.map(m => m.id === asstMsgId ? { ...m, content: assistantContent } : m));
                  } else if (data.type === 'done') {
                    const finalContent = data.text || (data.artifacts && data.artifacts.length > 0 
                      ? `I've generated the **${data.artifacts[0].title || 'interactive artifact'}**. You can interact with it and inspect the code in the preview panel on the right.`
                      : assistantContent);
                    setMessages(prev => prev.map(m => m.id === asstMsgId ? { 
                      ...m, 
                      content: finalContent, 
                      artifacts: data.artifacts, 
                      citations: data.citations, 
                      trace: data.trace 
                    } : m));
                    if (data.artifacts && data.artifacts.length > 0) {
                      setActiveArtifact(data.artifacts[0]);
                    }
                  } else if (data.type === 'error') {
                     throw new Error(data.error);
                  }
                } catch (err) {
                  console.error("Failed to parse chunk", err);
                }
              }
            }
          }
        }
      } else {
        throw new Error('Failed to send message');
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        console.log("Chat stream aborted gracefully.");
      } else {
        console.error(e);
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: "An error occurred while generating a response." }]);
      }
    } finally {
      abortControllerRef.current = null;
      setLoading(false);
      isProcessingRef.current = false;
    }
  };

  const sendMessage = (message: string) => {
    if (!message.trim()) return;
    if (loading || isProcessingRef.current) {
      // Enqueue message if a stream is currently active
      setMessageQueue(prev => [...prev, message]);
    } else {
      executeSendMessage(message);
    }
  };

  const removeFromQueue = (index: number) => {
    setMessageQueue(prev => prev.filter((_, i) => i !== index));
  };

  const clearQueue = () => {
    setMessageQueue([]);
  };

  // Automatic Queue Execution
  useEffect(() => {
    if (!loading && !isProcessingRef.current && messageQueue.length > 0) {
      const nextMessage = messageQueue[0];
      setMessageQueue(prev => prev.slice(1));
      executeSendMessage(nextMessage);
    }
  }, [loading, messageQueue]);

  return {
    messages,
    loading,
    sendMessage,
    activeArtifact,
    setActiveArtifact,
    startNewSession,
    messageQueue,
    removeFromQueue,
    clearQueue
  };
}
