export interface Artifact {
  id?: string;
  message_id?: string;
  session_id?: string;
  session_title?: string;
  type: string;
  title: string;
  filename?: string;
  content: string;
  char_count?: number;
  word_count?: number;
  description?: string;
  created_at?: string;
}

export interface ArtifactSummary {
  id: string;
  message_id: string;
  session_id: string | null;
  session_title: string;
  type: string;
  title: string;
  filename: string;
  char_count: number;
  word_count: number;
  description: string;
  created_at: string;
}

export interface Citation {
  id?: string;
  title: string;
  episode?: string;
  url?: string;
  snippet?: string;
  content?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  artifacts?: Artifact[];
  citations?: (Citation | string)[];
  trace?: string[];
}

export interface ModelInfo {
  id: string;
  name: string;
  tag: string;
  pricing: string;
  description: string;
}

export interface Session {
  id: string;
  title: string;
  created_at: string;
}
