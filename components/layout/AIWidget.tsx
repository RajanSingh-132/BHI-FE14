'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Bot, X, Send, RotateCcw, Sparkles, MessageSquare, Minus, Maximize2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { useTheme } from '@/lib/theme';
import { fetchApi } from '@/lib/api';
import { useDataset } from '@/lib/store';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function AIWidget() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const { dashboardSummary } = useDataset();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'human' | 'ai'; content: string; image?: string; timestamp: string }[]>([
    {
      role: 'ai',
      content: 'Hello! I am your BHI AI Assistant. How can I help you analyze your business data today?',
      timestamp: '' // Set correctly after mount to avoid hydration mismatch
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset chat history when the page changes
  useEffect(() => {
    setChatHistory([{
      role: 'ai',
      content: 'Hello! I am your BHI AI Assistant. How can I help you analyze your business data today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  }, [pathname]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isTyping]);

  const handleRefresh = () => {
    setChatHistory([
      {
        role: 'ai',
        content: 'Hello! I am your BHI AI Assistant. How can I help you analyze your business data today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!message.trim() || isTyping) return;

    const userMessage = message.trim();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newHistory = [...chatHistory, { role: 'human' as const, content: userMessage, timestamp }];
    setChatHistory(newHistory);
    setMessage('');
    setIsTyping(true);

    try {
      // Prepare history for API (backend expects 'human'/'ai')
      const apiHistory = newHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
        type: 'text'
      }));

      // Dynamically select endpoint based on pathname (case-insensitive)
      const path = pathname.toLowerCase();
      let endpoint = '/api/summary-chat'; // Default to summary instead of non-existent /api/chat
      
      if (path.includes('leads')) endpoint = '/api/leads-chat';
      else if (path.includes('sales')) endpoint = '/api/sales-chat';
      else if (path.includes('productivity')) endpoint = '/api/productivity-chat';
      else if (path.includes('summary')) endpoint = '/api/summary-chat';

      const response = await fetchApi<{ answer: string; type?: string }>(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          chat_history: apiHistory,
          context: pathname,
          dashboard_summary: dashboardSummary
        }),
      });

      const responseTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setChatHistory(prev => [...prev, {
        role: 'ai',
        content: response.answer,
        timestamp: responseTimestamp
      }]);
    } catch (error) {
      console.error('Chat Error:', error);
      setChatHistory(prev => [...prev, {
        role: 'ai',
        content: "I'm sorry, I encountered an error. Please ensure your data is loaded and try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const allowedRoutes = [
    '/analysis/leads',
    '/analysis/Sales',
    '/analysis/productivity',
    '/analysis/summary'
  ];

  if (!allowedRoutes.includes(pathname)) {
    return null;
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 z-[9999] flex flex-col items-end pointer-events-none">
      {/* Chat Window */}
      <div
        className={cn(
          "mb-4 w-[calc(100vw-48px)] sm:w-[480px] h-[550px] max-h-[70vh] sm:max-h-[550px] bg-[var(--bg-card)] rounded-2xl shadow-premium border border-[var(--border)] overflow-hidden flex flex-col transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] origin-bottom-right pointer-events-auto",
          isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-90 opacity-0 translate-y-10 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className={cn(
          "p-4 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-bright)] flex items-center justify-between transition-colors",
          theme === 'dark' ? "text-slate-900" : "text-white"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-colors", theme === 'dark' ? "bg-black/10" : "bg-white/20")}>
              <Bot size={22} className={theme === 'dark' ? "text-slate-900" : "text-white"} />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">BHI Assistant</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] opacity-90 uppercase tracking-wider font-semibold">Online</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleRefresh}
              className={cn("p-2 rounded-full transition-colors", theme === 'dark' ? "hover:bg-black/10" : "hover:bg-white/10")}
              title="Refresh Chat"
            >
              <RotateCcw size={18} />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className={cn("p-2 rounded-full transition-colors", theme === 'dark' ? "hover:bg-black/10" : "hover:bg-white/10")}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-gradient-to-b from-[var(--bg)] to-[var(--bg-secondary)]"
        >
          {chatHistory.map((msg, idx) => (
            <div
              key={idx}
              className={cn(
                "flex flex-col max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300",
                msg.role === 'human' ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div className={cn(
                "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                msg.role === 'human'
                  ? cn("bg-[var(--accent)] rounded-tr-none shadow-sm", theme === 'dark' ? "text-slate-900" : "text-white")
                  : "bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] rounded-tl-none shadow-sm"
              )}>
                {msg.role === 'ai' ? (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none 
                      [&_p]:mb-3 [&_p:last-child]:mb-0 
                      [&_strong]:font-bold [&_strong]:text-[var(--accent)]"
                    dangerouslySetInnerHTML={{ __html: msg.content }}
                  />
                ) : (
                  msg.content
                )}
                {msg.image && (
                  <div className="mt-3 rounded-lg overflow-hidden border border-[var(--border)] shadow-md animate-in fade-in zoom-in duration-500">
                    <img
                      src={msg.image}
                      alt="AI Generated Analysis"
                      className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                )}
              </div>
              {mounted && (
                <span className="text-[10px] text-[var(--text-muted)] mt-1 px-1">
                  {msg.timestamp}
                </span>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex items-start gap-2 mr-auto">
              <div className="bg-[var(--bg-card)] border border-[var(--border)] px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={handleSendMessage}
          className="p-4 bg-[var(--bg-card)] border-t border-[var(--border)] flex items-center gap-2"
        >
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border)] rounded-full px-4 py-2.5 text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className={cn(
              "w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center hover:bg-[var(--accent-hover)] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md",
              theme === 'dark' ? "text-slate-900" : "text-white"
            )}
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center shadow-premium transition-all duration-500 group relative pointer-events-auto",
          isOpen
            ? "bg-white dark:bg-gray-800 text-[var(--accent)] rotate-90"
            : "bg-gradient-to-br from-[var(--accent)] to-[var(--accent-bright)] text-white hover:scale-110 active:scale-95"
        )}
      >
        {isOpen ? (
          <X size={24} />
        ) : (
          <div className="relative">
            <Sparkles size={24} className="animate-pulse" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white dark:border-gray-800 rounded-full" />
          </div>
        )}

        {/* Tooltip */}
        {!isOpen && (
          <div className="absolute right-full mr-4 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
            Ask BHI AI
            <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45" />
          </div>
        )}
      </button>
    </div>
  );
}
