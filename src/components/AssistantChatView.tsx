import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquareCode,
  Send,
  Database,
  Bot,
  User,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { sendAssistantMessage } from '../api.ts';
import { AssistantMessage } from '../types/spaceMem.ts';

interface AssistantChatViewProps {
  onSelectCase: (caseId: string) => void;
}

export const AssistantChatView: React.FC<AssistantChatViewProps> = ({ onSelectCase }) => {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'init-msg',
      role: 'assistant',
      content: `Welcome to the SPACE-MEM Investigation Assistant.
I am grounded in the **space-mem-engineering** Hindsight memory bank containing 12 historical spacecraft failure cases.

Ask me about historical anomaly precedents, what corrective actions worked vs failed, or lessons learned.

Every response distinguishes between:
• [HISTORICAL EVIDENCE]
• [CURRENT CASE / CONTEXT]
• [AI HYPOTHESIS]
• [ENGINEER VALIDATION REQUIRED]`,
      timestamp: new Date().toISOString()
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    "Have we seen 28V bus voltage instability in TVAC before?",
    "What corrective action worked for reaction wheel jitter post-vibration?",
    "Were there cases where the first hypothesis was wrong?",
    "What lessons have we learned about heat pipe dryout under high solar load?",
    "Show historical failures involving ground loop noise in TT&C transmitters.",
    "What happened when latch valves leaked after acoustic vibration?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: AssistantMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const assistantReply = await sendAssistantMessage(query, messages);
      setMessages(prev => [...prev, assistantReply]);
      setLoading(false);
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Error communicating with investigation engine: ' + (err.message || 'Network failure'),
          timestamp: new Date().toISOString()
        }
      ]);
      setLoading(false);
    }
  };

  const renderMessageContent = (content: string) => {
    const hasEvidence = content.includes('[HISTORICAL EVIDENCE]');
    const hasHypothesis = content.includes('[AI HYPOTHESIS]');

    if (!hasEvidence && !hasHypothesis) {
      return <div className="whitespace-pre-wrap leading-relaxed">{content}</div>;
    }

    const parts = content.split(/(\[(?:HISTORICAL EVIDENCE|CURRENT CASE \/ CONTEXT|CURRENT CASE|AI HYPOTHESIS|ENGINEER VALIDATION REQUIRED)\])/g);

    return (
      <div className="space-y-2.5">
        {parts.map((part, idx) => {
          if (part.startsWith('[') && part.endsWith(']')) {
            const tagColor =
              part.includes('HISTORICAL EVIDENCE') ? 'text-sky-800 bg-sky-50 border-sky-300 font-bold' :
              part.includes('CURRENT') ? 'text-indigo-800 bg-indigo-50 border-indigo-300 font-bold' :
              part.includes('AI HYPOTHESIS') ? 'text-amber-800 bg-amber-50 border-amber-300 font-bold' :
              'text-red-800 bg-red-50 border-red-300 font-bold';

            return (
              <div key={idx} className={`inline-block font-mono text-xs px-2 py-0.5 rounded border ${tagColor} mr-2 mt-2 font-medium`}>
                {part}
              </div>
            );
          } else if (part.trim()) {
            return (
              <div key={idx} className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed pl-1 font-sans">
                {part.trim()}
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto flex flex-col h-[calc(100vh-180px)] min-h-[580px] animate-fade-in pb-4 font-sans text-slate-100">
      {/* Header Bar */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/15 shadow-2xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shadow-sm">
            <MessageSquareCode className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-['Inter'] text-sm sm:text-base font-bold text-white tracking-tight">
              SPACE-MEM INVESTIGATION ASSISTANT
            </h1>
            <p className="text-xs text-sky-400 font-mono font-medium">
              Grounded in Hindsight Engineering Memory Bank
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setMessages([messages[0]]);
          }}
          className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer bg-white/[0.08] hover:bg-white/[0.14] px-3 py-1.5 rounded-lg border border-white/15 transition-colors shadow-sm font-medium backdrop-blur-md"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Reset Chat</span>
        </button>
      </div>

      {/* Quick Prompt Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none shrink-0 text-xs font-sans px-1">
        <span className="text-slate-400 text-[10px] shrink-0 font-bold tracking-wider uppercase font-mono">SUGGESTIONS:</span>
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="px-3 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 hover:border-sky-400/40 text-slate-300 hover:text-white transition-all whitespace-nowrap cursor-pointer shrink-0 text-[11px] shadow-sm backdrop-blur-md"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-5 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/15 space-y-4 shadow-2xl">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-3xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1 shadow-sm ${
              msg.role === 'user'
                ? 'bg-sky-600 text-white'
                : 'bg-white/10 border border-white/15 text-sky-400'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-sky-400" />}
            </div>

            <div className={`p-4 sm:p-5 rounded-2xl border text-xs sm:text-sm space-y-2 shadow-lg backdrop-blur-md ${
              msg.role === 'user'
                ? 'bg-sky-600 border-sky-500 text-white rounded-tr-none'
                : 'bg-white/[0.06] border-white/15 text-slate-100 rounded-tl-none'
            }`}>
              {/* Message Header */}
              <div className={`flex items-center justify-between text-[11px] font-mono border-b pb-1.5 ${
                msg.role === 'user' ? 'border-sky-500/50 text-sky-100' : 'border-white/10 text-slate-400'
              }`}>
                <span className="font-bold tracking-wider">
                  {msg.role === 'user' ? 'TEST ENGINEER' : 'SPACE-MEM ASSISTANT'}
                </span>
                <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
              </div>

              {/* Message Content */}
              {renderMessageContent(msg.content)}

              {/* Cited Historical Evidence Links */}
              {msg.historicalEvidenceUsed && msg.historicalEvidenceUsed.length > 0 && (
                <div className={`pt-2 border-t flex flex-wrap items-center gap-2 text-xs font-mono ${
                  msg.role === 'user' ? 'border-sky-500/50' : 'border-white/10'
                }`}>
                  <span className="text-sky-400 font-bold flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-sky-400" />
                    <span>Evidence Cited:</span>
                  </span>
                  {msg.historicalEvidenceUsed.map(cid => (
                    <button
                      key={cid}
                      onClick={() => onSelectCase(cid)}
                      className="px-2.5 py-0.5 rounded bg-white/10 hover:bg-white/20 border border-white/15 text-sky-300 flex items-center gap-1 cursor-pointer transition-colors shadow-sm font-semibold"
                    >
                      <span>{cid}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 max-w-lg">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0 text-sky-400">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.06] border border-white/15 text-xs font-mono text-sky-300 flex items-center gap-2.5 shadow-sm backdrop-blur-md">
              <Database className="w-4 h-4 text-sky-400 animate-pulse" />
              <span>Querying Hindsight bank: space-mem-engineering...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSend();
        }}
        className="p-2 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/15 shadow-2xl flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about historical failure precedents, what failed first, or lessons learned..."
          className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none font-sans"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg transition-all"
        >
          <Send className="w-3.5 h-3.5 text-white" />
          <span className="hidden sm:inline">Send Query</span>
        </button>
      </form>
    </div>
  );
};
