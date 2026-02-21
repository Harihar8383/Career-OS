// src/components/AIChat/ChatInterface.jsx
import { useState, useEffect, useRef } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    Send, Sparkles, Loader2, ChevronDown, ChevronRight,
    BrainCircuit, MessageSquare, Menu,
    Lightbulb, Compass, Code, GraduationCap,
    PanelLeftClose, PanelLeftOpen, History
} from 'lucide-react';
import ActionCard from './ActionCard';

export default function ChatInterface() {
    const { getToken } = useAuth();
    const { user } = useUser();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [currentThought, setCurrentThought] = useState('');
    const [threadId, setThreadId] = useState(null);
    const [threads, setThreads] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    const API_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080';

    const scrollToBottom = (force = false) => {
        if (!messagesEndRef.current) return;

        // If forcing (e.g. new message sent), scroll immediately
        if (force) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            return;
        }

        // Otherwise only auto-scroll if already near the bottom (within 150px)
        const container = messagesEndRef.current.parentElement;
        if (container) {
            const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
            if (isNearBottom) {
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    useEffect(() => {
        scrollToBottom(isStreaming);
    }, [messages, currentThought, isStreaming]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [input]);

    // Initialize thread ID
    useEffect(() => {
        const storedThreadId = localStorage.getItem('chatThreadId');
        if (storedThreadId) {
            setThreadId(storedThreadId);
            fetchChatHistory(storedThreadId);
        } else {
            startNewChat();
        }
        fetchThreads();
    }, []);

    const fetchThreads = async () => {
        try {
            const token = await getToken();
            const response = await fetch(`${API_URL}/api/chat/threads`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setThreads(data.threads || []);
            }
        } catch (error) {
            console.error('Failed to fetch threads:', error);
        }
    };

    const fetchChatHistory = async (tid) => {
        try {
            const token = await getToken();
            const response = await fetch(`${API_URL}/api/chat/history/${tid}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const history = data.history.map(msg => {
                    let parsedContent = msg.content;
                    if (msg.role === 'action_card') {
                        try {
                            parsedContent = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;
                        } catch (e) {
                            console.error("Failed to parse action card content:", e);
                            parsedContent = {};
                        }
                    }
                    return {
                        role: msg.role,
                        content: parsedContent,
                        isActionCard: msg.role === 'action_card',
                        // Restore saved thoughts from metadata so "View Reasoning" persists on reload
                        thoughts: (msg.role === 'assistant' && msg.metadata?.thoughts?.length)
                            ? msg.metadata.thoughts
                            : [],
                        isThinkingExpanded: false,
                        id: msg._id || Date.now() + Math.random()
                    };
                });
                setMessages(history);
            }
        } catch (error) {
            console.error('Failed to fetch history:', error);
        }
    };

    const startNewChat = () => {
        const newThreadId = `thread_${Date.now()}`;
        localStorage.setItem('chatThreadId', newThreadId);
        setThreadId(newThreadId);
        setMessages([]);
        fetchThreads();
    };

    const switchThread = (tid) => {
        if (tid === threadId) return;
        localStorage.setItem('chatThreadId', tid);
        setThreadId(tid);
        setMessages([]);
        fetchChatHistory(tid);
        if (window.innerWidth < 768) setIsSidebarOpen(false);
    };

    const sendMessage = async () => {
        if (!input.trim() || isStreaming) return;

        const userMessage = { role: 'user', content: input, id: Date.now() };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsStreaming(true);
        if (textareaRef.current) textareaRef.current.style.height = 'auto';

        const currentMsgId = Date.now() + 1;
        // Add optimistic assistant message
        setMessages(prev => [...prev, {
            role: 'assistant',
            content: '',
            thoughts: [],
            isThinkingExpanded: true,
            isStreaming: true,
            id: currentMsgId
        }]);

        try {
            const token = await getToken();
            const response = await fetch(`${API_URL}/api/chat/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: currentInput,
                    threadId: threadId
                })
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let sseBuffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                // Use stream:true so multi-byte chars split across chunks decode correctly
                sseBuffer += decoder.decode(value, { stream: true });
                const lines = sseBuffer.split('\n');
                // Keep the last (potentially incomplete) line in the buffer
                sseBuffer = lines.pop();

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6).trim();
                        if (data === '[DONE]') continue;

                        try {
                            const event = JSON.parse(data);

                            setMessages(prev => {
                                const updated = [...prev];
                                const lastMsgIndex = updated.findIndex(m => m.id === currentMsgId);
                                if (lastMsgIndex === -1) return prev;

                                const lastMsg = { ...updated[lastMsgIndex] };

                                if (event.type === 'thought' || event.type === 'tool_start') {
                                    lastMsg.thoughts = [...(lastMsg.thoughts || []), event.content];
                                    setCurrentThought(event.content);
                                } else if (event.type === 'token') {
                                    // Accumulate from prev state, not an outer variable,
                                    // so React Strict Mode double-invocation won't duplicate tokens
                                    lastMsg.content = (lastMsg.content || '') + event.content;
                                } else if (event.type === 'done') {
                                    lastMsg.isStreaming = false;
                                    lastMsg.isThinkingExpanded = false; // Auto-collapse
                                    setCurrentThought('');
                                    fetchThreads();
                                } else if (event.type === 'action_card') {
                                    lastMsg.isStreaming = false;
                                }

                                updated[lastMsgIndex] = lastMsg;
                                return updated;
                            });

                            if (event.type === 'action_card') {
                                setMessages(prev => [...prev, {
                                    role: 'assistant', // Keep standardized role for list logic if needed, but flag handles render
                                    content: event.content,
                                    isActionCard: true,
                                    id: Date.now() + Math.random()
                                }]);
                            }

                        } catch (e) {
                            console.error('Parse error:', e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Error: Failed to get response.', id: Date.now() }]);
        } finally {
            setIsStreaming(false);
            setCurrentThought('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const suggestions = [
        { icon: Lightbulb, text: "Optimize my resume for a startup role" },
        { icon: Code, text: "Help me prepare for my Google interview" },
        { icon: Compass, text: "Find high-paying React jobs in Bangalore" },
        { icon: GraduationCap, text: "What's the status of my application?" }
    ];

    return (
        // Using explicit CareerOS dark theme classes: bg-bg-dark
        <div className="flex h-dvh w-full bg-bg-dark text-text-primary overflow-hidden font-dm-sans">

            {/* Sidebar with explicit styling */}
            <aside className={`${isSidebarOpen ? 'w-[280px] translate-x-0' : 'w-0 -translate-x-full opacity-0 pointer-events-none'} 
                bg-bg-card/80 backdrop-blur-xl border-r border-border-primary/50 transition-all duration-300 ease-in-out flex flex-col fixed md:relative z-20 h-full shadow-2xl`}>

                <div className="p-4 flex items-center justify-between border-b border-border-primary/30">
                    <div className="text-xs font-semibold tracking-widest text-text-secondary/70 px-2 font-clash-display uppercase">History</div>
                    {/* Mobile Close Button */}
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="md:hidden p-2 hover:bg-white/5 rounded-full text-text-secondary"
                    >
                        <PanelLeftClose className="w-4 h-4" />
                    </button>

                    {/* Desktop Collapse Button */}
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="hidden md:block p-2 hover:bg-white/5 rounded-full text-text-secondary transition-colors"
                        title="Collapse Sidebar"
                    >
                        <PanelLeftClose className="w-4 h-4" />
                    </button>
                </div>

                <div className="px-4 py-4">
                    <button
                        onClick={startNewChat}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all text-sm font-medium border border-white/10 shadow-sm active:scale-95 group"
                    >
                        <MessageSquare className="w-4 h-4 text-[#A855F7] group-hover:scale-110 transition-transform" />
                        <span>New Conversation</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-2 space-y-1 terminal-scrollbar">
                    {threads.length === 0 ? (
                        <p className="text-xs text-text-secondary/50 text-center py-8">No recent history</p>
                    ) : (
                        threads.map(t => (
                            <button
                                key={t._id}
                                onClick={() => switchThread(t._id)}
                                className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all group flex items-center gap-3 relative overflow-hidden ${threadId === t._id
                                    ? 'bg-white/10 border-l-2 border-[#A855F7] text-white font-medium'
                                    : 'text-text-secondary/70 hover:bg-white/5 hover:text-text-primary'
                                    }`}
                            >
                                <div className="truncate flex-1 z-10">
                                    <span className="block truncate">{t.lastMessage || 'New Conversation'}</span>
                                    <span className="text-[10px] opacity-60 mt-0.5 block">{new Date(t.updatedAt).toLocaleDateString()}</span>
                                </div>
                                {threadId === t._id && (
                                    <div className="absolute inset-0 bg-[#A855F7]/5 pointer-events-none" />
                                )}
                            </button>
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-border-primary/30 bg-bg-card/50">
                    <div className="flex items-center gap-2 text-[10px] text-text-secondary/40 px-2 uppercase tracking-wider font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        CareerOS Intelligence
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full relative bg-bg-dark w-full">

                {/* Top Bar with Sidebar Toggle */}
                <header className="flex items-center justify-between p-4 sticky top-0 bg-bg-card/80 backdrop-blur-md z-10 w-full border-b border-border-primary/30">
                    <div className="flex items-center gap-3">
                        {!isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="p-2 hover:bg-white/5 rounded-lg text-text-secondary transition-colors relative group"
                                title="View History"
                            >
                                <History className="w-5 h-5" />
                                {threads.length > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#A855F7] rounded-full ring-2 ring-bg-card" />
                                )}
                            </button>
                        )}
                        <div className="flex items-center gap-2 text-text-primary font-clash-display font-medium text-lg tracking-tight">

                            <span className="text-white">AI Career Mentor</span>
                        </div>
                    </div>
                </header>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto px-4 terminal-scrollbar w-full">
                    <div className="max-w-3xl mx-auto w-full pb-4 pt-8">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-10 animate-in fade-in duration-700 slide-in-from-bottom-4">
                                <div className="space-y-6">
                                    <div className="relative mx-auto w-24 h-24">
                                        <div className="absolute inset-0 bg-[#A855F7]/20 blur-xl rounded-full animate-pulse" />
                                        <div className="relative w-full h-full bg-bg-card rounded-2xl border border-[#A855F7]/30 flex items-center justify-center shadow-2xl shadow-purple-900/20 overflow-hidden">
                                            <img src="/icons/mentor_icon.png" alt="AI Mentor" className="w-full h-full object-cover" />
                                        </div>
                                    </div>

                                    <div className="space-y-2 max-w-lg mx-auto">
                                        <h1 className="text-4xl md:text-5xl font-clash-display font-medium text-white tracking-tight">
                                            Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A855F7] to-pink-600">{user?.firstName || 'Friend'}</span>
                                        </h1>
                                        <h2 className="text-lg text-text-secondary font-dm-sans leading-relaxed">
                                            I'm your dedicated career strategist. Let's optimize your path to success.
                                        </h2>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl px-4 font-dm-sans">
                                    {suggestions.map((s, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setInput(s.text)}
                                            className="p-5 rounded-xl bg-bg-card border border-border-primary/60 hover:border-[#A855F7]/40 hover:bg-white/5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-900/5 group relative overflow-hidden"
                                        >
                                            <div className="flex items-center gap-4 relative z-10">
                                                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-[#A855F7]/10 transition-colors border border-white/5 group-hover:border-[#A855F7]/20">
                                                    <s.icon className="w-5 h-5 text-text-secondary group-hover:text-[#A855F7] transition-colors" />
                                                </div>
                                                <p className="text-sm font-medium text-text-primary group-hover:text-white transition-colors">{s.text}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`flex w-full group ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

                                        {/* Avatar for Assistant */}
                                        {msg.role === 'assistant' && (
                                            <div className="w-8 h-8 rounded-lg bg-bg-card border border-border-primary flex items-center justify-center flex-shrink-0 mr-4 mt-1 shadow-sm overflow-hidden">
                                                <img src="/icons/mentor_icon.png" alt="AI" className="w-full h-full object-cover" />
                                            </div>
                                        )}

                                        <div className={`max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'bg-blue-500 text-white px-6 py-3.5 rounded-2xl rounded-br-sm shadow-lg shadow-purple-900/20' : 'w-full'}`}>

                                            {msg.isActionCard ? (
                                                <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
                                                    <ActionCard data={msg.content} />
                                                </div>
                                            ) : (
                                                <>
                                                    {/* Thoughts */}
                                                    {((msg.thoughts && msg.thoughts.length > 0) || (msg.isStreaming && !msg.content)) && (
                                                        <div className="mb-4">
                                                            <button
                                                                onClick={() => {
                                                                    const updated = [...messages];
                                                                    updated[idx].isThinkingExpanded = !updated[idx].isThinkingExpanded;
                                                                    setMessages(updated);
                                                                }}
                                                                className="flex items-center gap-2 text-[10px] font-bold tracking-wider uppercase text-text-secondary hover:text-white transition-all bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-md border border-white/10"
                                                            >
                                                                {msg.isStreaming && !msg.content ? (
                                                                    <Loader2 className="w-3 h-3 animate-spin text-[#A855F7]" />
                                                                ) : (
                                                                    <BrainCircuit className="w-3 h-3" />
                                                                )}
                                                                <span>{msg.isStreaming && !msg.content ? ((currentThought || 'Processing Data...').slice(0, 30)) : (msg.isThinkingExpanded ? 'Hide Reasoning' : 'View Reasoning')}</span>
                                                                {msg.isThinkingExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                                            </button>

                                                            {msg.isThinkingExpanded && (
                                                                <div className="mt-3 pl-4 py-2 border-l border-[#A855F7]/20 space-y-2">
                                                                    {msg.thoughts?.map((t, i) => (
                                                                        <div key={i} className="text-xs text-text-secondary font-mono leading-relaxed opacity-80">{t}</div>
                                                                    ))}
                                                                    {msg.isStreaming && !msg.content && (
                                                                        <div className="text-xs text-[#A855F7] font-mono animate-pulse">{currentThought}...</div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Markdown Content */}
                                                    <div className={`prose dark:prose-invert prose-sm max-w-none leading-relaxed font-dm-sans ${msg.role === 'assistant' ? 'text-text-primary' : 'text-white/95'} selection:bg-[#A855F7]/30`}>
                                                        {typeof msg.content === 'string' ? (
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                {msg.content}
                                                            </ReactMarkdown>
                                                        ) : (
                                                            <span className="text-red-500">Error: Content is not text</span>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Input Area (CareerOS Style - Minimal) */}
                <div className="p-6 bg-bg-dark w-full">
                    <div className="max-w-3xl mx-auto relative">
                        <div className="bg-bg-card/40 rounded-2xl p-2 flex items-end gap-3 border border-border-primary/60 hover:border-border-primary transition-colors shadow-sm focus-within:ring-2 focus-within:ring-[#A855F7]/20 focus-within:border-[#A855F7]/40">
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask about specific jobs, interview questions, or your resume..."
                                className="flex-1 bg-transparent px-4 py-3.5 outline-none text-text-primary placeholder:text-text-secondary/60 resize-none max-h-[200px] font-dm-sans text-sm min-h-[52px]"
                                rows={1}
                                disabled={isStreaming}
                            />

                            <button
                                onClick={sendMessage}
                                disabled={isStreaming || !input.trim()}
                                className={`p-3 rounded-xl h-[44px] w-[44px] flex items-center justify-center flex-shrink-0 transition-all duration-300 ${input.trim()
                                    ? 'bg-[#A855F7] hover:bg-[#9333EA] text-white shadow-lg shadow-[#A855F7]/20 scale-100'
                                    : 'bg-white/5 text-text-secondary/40 scale-95 cursor-not-allowed'
                                    }`}
                            >
                                {isStreaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            </button>
                        </div>
                        <p className="text-center text-[10px] text-text-secondary/40 mt-3 font-medium tracking-widest uppercase font-clash-display">
                            AI Mentor v3.0 • Powered by RAG & Live Market Data
                        </p>
                    </div>
                </div>

            </main>
        </div>
    );
}
