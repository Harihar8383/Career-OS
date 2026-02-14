// src/components/AIChat/ChatInterface.jsx
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Send, Sparkles, Loader2, ChevronDown, ChevronRight, BrainCircuit } from 'lucide-react';
import ActionCard from './ActionCard';

export default function ChatInterface() {
    const { getToken } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [currentThought, setCurrentThought] = useState('');
    const [threadId, setThreadId] = useState(null);
    const messagesEndRef = useRef(null);
    const API_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, currentThought]);

    // Initialize thread ID
    useEffect(() => {
        const storedThreadId = localStorage.getItem('chatThreadId');
        if (storedThreadId) {
            setThreadId(storedThreadId);
        } else {
            const newThreadId = `thread_${Date.now()}`;
            localStorage.setItem('chatThreadId', newThreadId);
            setThreadId(newThreadId);
        }
    }, []);

    const sendMessage = async () => {
        if (!input.trim() || isStreaming) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsStreaming(true);

        let assistantMessage = { role: 'assistant', content: '', thoughts: [], isThinkingExpanded: false };
        setMessages(prev => [...prev, assistantMessage]);

        try {
            const token = await getToken();
            const response = await fetch(`${API_URL}/api/chat/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: input,
                    threadId: threadId
                })
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let streamingContent = "";  // Accumulate tokens

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;

                        try {
                            const event = JSON.parse(data);

                            if (event.type === 'thought' || event.type === 'tool_start') {
                                setMessages(prev => {
                                    const updated = [...prev];
                                    const lastMsg = updated[updated.length - 1];
                                    if (lastMsg) {
                                        lastMsg.thoughts = [...(lastMsg.thoughts || []), event.content];
                                    }
                                    return updated;
                                });
                                setCurrentThought(event.content);
                            } else if (event.type === 'token') {
                                // Accumulate tokens for typing effect
                                streamingContent += event.content;
                                setMessages(prev => {
                                    const updated = [...prev];
                                    updated[updated.length - 1].content = streamingContent;
                                    updated[updated.length - 1].isStreaming = true;
                                    return updated;
                                });
                            } else if (event.type === 'done') {
                                // Streaming complete
                                setMessages(prev => {
                                    const updated = [...prev];
                                    updated[updated.length - 1].isStreaming = false;
                                    return updated;
                                });
                                setCurrentThought('');
                            } else if (event.type === 'response') {
                                // Fallback for non-streaming responses
                                setMessages(prev => {
                                    const updated = [...prev];
                                    updated[updated.length - 1].content = event.content;
                                    updated[updated.length - 1].isStreaming = false;
                                    return updated;
                                });
                                setCurrentThought('');
                            } else if (event.type === 'action_card') {
                                // Action Card received - add as a special message
                                setMessages(prev => [
                                    ...prev,
                                    {
                                        role: 'action_card',
                                        content: event.content,
                                        isActionCard: true
                                    }
                                ]);
                                setCurrentThought('');
                            } else if (event.type === 'error') {
                                setMessages(prev => {
                                    const updated = [...prev];
                                    updated[updated.length - 1].content = event.content || 'An error occurred';
                                    updated[updated.length - 1].isStreaming = false;
                                    return updated;
                                });
                                setCurrentThought('');
                            }
                        } catch (e) {
                            console.error('Parse error:', e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1].content = 'Error: Failed to get response. Please try again.';
                return updated;
            });
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

    return (
        <div className="flex flex-col h-full w-full bg-[#0a0a0a] overflow-hidden shadow-2xl relative">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#262626] bg-[#171717]">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600/10 rounded-lg">
                        <Sparkles className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-clash-display text-white">AI Career Mentor</h2>
                        <p className="text-sm text-[#71717a]">Ask me anything about your job search</p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 terminal-scrollbar">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="p-4 bg-blue-600/10 rounded-full mb-4">
                            <Sparkles className="w-8 h-8 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-clash-display text-white mb-2">
                            Welcome to your AI Career Mentor
                        </h3>
                        <p className="text-[#71717a] max-w-md">
                            I can help you with job applications, resume optimization, interview prep, and career advice.
                        </p>
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
                            {[
                                "What jobs have I applied to?",
                                "Help me prepare for my Google interview",
                                "What skills am I missing?",
                                "Optimize my resume for a startup role"
                            ].map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setInput(suggestion)}
                                    className="px-4 py-3 bg-[#171717] hover:bg-[#262626] border border-[#262626] rounded-lg text-left text-sm text-[#d4d4d8] transition-colors"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {msg.isActionCard ? (
                            // Render Action Card
                            <div className="w-full max-w-md">
                                <ActionCard data={msg.content} />
                            </div>
                        ) : (
                            // Render regular message
                            <div
                                className={`max-w-[80%] px-4 py-3 rounded-lg ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-[#171717] text-[#d4d4d8] border border-[#262626]'
                                    }`}
                            >
                                {/* Thoughts Toggle */}
                                {/* Thoughts Section - Active Status & Collapsible */}
                                {(msg.thoughts && msg.thoughts.length > 0) || (msg.role === 'assistant' && msg.isStreaming && !msg.content) ? (
                                    <div className="mb-4">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setMessages(prev => {
                                                    const updated = [...prev];
                                                    updated[idx] = {
                                                        ...updated[idx],
                                                        isThinkingExpanded: !updated[idx].isThinkingExpanded
                                                    };
                                                    return updated;
                                                });
                                            }}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-all duration-200 group cursor-pointer z-10 
                                                ${msg.isStreaming && !msg.content
                                                    ? 'bg-blue-900/20 border-blue-500/30 text-blue-400'
                                                    : 'bg-[#262626] hover:bg-[#333] border-[#404040] text-[#a1a1aa]'}`}
                                        >
                                            {msg.isStreaming && !msg.content ? (
                                                <div className="relative flex h-3 w-3">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                                </div>
                                            ) : (
                                                <BrainCircuit className="w-3.5 h-3.5" />
                                            )}

                                            <span className="font-medium select-none">
                                                {msg.isStreaming && !msg.content
                                                    ? (currentThought || 'Thinking...')
                                                    : (msg.isThinkingExpanded ? 'Hide process' : 'View process')}
                                            </span>

                                            {msg.isThinkingExpanded ?
                                                <ChevronDown className="w-3.5 h-3.5 opacity-70" /> :
                                                <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                                            }
                                        </button>

                                        {msg.isThinkingExpanded && (
                                            <div className="mt-3 ml-2 pl-4 border-l-2 border-blue-500/30 space-y-3 relative animate-in fade-in slide-in-from-top-2 duration-300">
                                                {/* Connecting line decoration */}
                                                <div className="absolute -left-[9px] top-0 w-2 h-2 rounded-full bg-blue-500/30" />

                                                {msg.thoughts && msg.thoughts.map((thought, tIdx) => (
                                                    <div key={tIdx} className="text-xs text-[#a1a1aa] font-mono leading-relaxed bg-[#0a0a0a]/50 p-2 rounded border border-[#262626] flex items-start gap-2">
                                                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500/50 flex-shrink-0" />
                                                        <span>{thought}</span>
                                                    </div>
                                                ))}

                                                {/* Active thinking indicator inside the block */}
                                                {msg.isStreaming && !msg.content && (
                                                    <div className="flex items-center gap-2 text-xs text-blue-400 font-mono p-2 bg-blue-900/10 rounded border border-blue-500/20 animate-pulse">
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                        <span>{currentThought || 'Processing...'}</span>
                                                    </div>
                                                )}

                                                <div className="absolute -left-[9px] bottom-0 w-2 h-2 rounded-full bg-blue-500/30" />
                                            </div>
                                        )}
                                    </div>
                                ) : null}

                                <div className="whitespace-pre-wrap">
                                    {msg.content}
                                    {msg.isStreaming && (
                                        <span className="inline-block w-[2px] h-4 ml-1 bg-blue-500 animate-pulse"></span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {/* Thinking indicator */}
                {currentThought && (
                    <div className="flex justify-start">
                        <div className="max-w-[80%] px-4 py-3 rounded-lg bg-[#171717]/50 border border-[#262626] text-[#71717a] italic flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {currentThought}
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-[#262626] p-4 bg-[#171717]">
                <div className="flex gap-3">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me anything about your job search..."
                        className="flex-1 px-4 py-3 bg-[#0a0a0a] text-white rounded-lg border border-[#262626] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows={1}
                        disabled={isStreaming}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={isStreaming || !input.trim()}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        {isStreaming ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </div>
                <p className="text-xs text-[#71717a] mt-2">
                    Press Enter to send, Shift+Enter for new line
                </p>
            </div>
        </div>
    );
}
