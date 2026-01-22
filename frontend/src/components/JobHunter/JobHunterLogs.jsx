import React, { useEffect, useRef } from 'react';
import { Terminal, AnimatedSpan } from '../ui/terminal';
import { Zap } from 'lucide-react';

/**
 * JobHunterLogs - Displays real-time logs from Job Hunter Agent session
 * @param {Array} logs - Array of log entries from API
 * @param {string} status - Current session status (running, completed, error)
 */
export function JobHunterLogs({ logs = [], status = 'running' }) {
    const terminalRef = useRef(null);
    const isUserScrollingRef = useRef(false);

    // Auto-scroll to latest log
    useEffect(() => {
        if (!terminalRef.current) return;

        const pre = terminalRef.current.querySelector('pre');
        if (!pre) return;

        // Track if user is manually scrolling
        const handleScroll = () => {
            const isAtBottom = Math.abs(pre.scrollHeight - pre.scrollTop - pre.clientHeight) < 10;
            isUserScrollingRef.current = !isAtBottom;
        };

        pre.addEventListener('scroll', handleScroll, { passive: true });

        // Auto-scroll when content changes using MutationObserver
        const observer = new MutationObserver(() => {
            // Only auto-scroll if user hasn't manually scrolled up
            if (!isUserScrollingRef.current) {
                requestAnimationFrame(() => {
                    pre.scrollTop = pre.scrollHeight;
                });
            }
        });

        observer.observe(pre, {
            childList: true,
            subtree: true,
            characterData: true
        });

        return () => {
            pre.removeEventListener('scroll', handleScroll);
            observer.disconnect();
        };
    }, []);

    /**
     * Get the appropriate CSS class for a log entry based on its type
     */
    const getLogClass = (log) => {
        const type = log.type || log.level || 'info';
        switch (type.toLowerCase()) {
            case 'success':
            case 'complete':
                return 'text-green-400';
            case 'error':
            case 'fail':
                return 'text-red-400';
            case 'warning':
            case 'warn':
                return 'text-yellow-400';
            case 'info':
            case 'progress':
                return 'text-blue-400';
            default:
                return 'text-text-primary';
        }
    };

    const getStatusBadge = () => {
        switch (status) {
            case 'running':
                return (
                    <span className="px-3 py-1 bg-green-500/20 text-green-300 text-xs font-bold rounded-full border border-green-500/30 flex items-center gap-1.5 animate-pulse">
                        <Zap size={12} />
                        LIVE
                    </span>
                );
            case 'completed':
                return (
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-bold rounded-full border border-blue-500/30 flex items-center gap-1.5">
                        ✓ COMPLETED
                    </span>
                );
            case 'error':
                return (
                    <span className="px-3 py-1 bg-red-500/20 text-red-300 text-xs font-bold rounded-full border border-red-500/30 flex items-center gap-1.5">
                        ✗ ERROR
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="w-full space-y-4">
            {/* Header */}
            <div className="text-center space-y-1.5 pb-3">
                <div className="flex items-center justify-center gap-3">
                    <h2 className="text-2xl font-clash-display text-white">
                        {status === 'completed' ? 'Hunt Complete' : 'Agent Running'}
                    </h2>
                    {getStatusBadge()}
                </div>
                <p className="text-text-secondary text-sm font-dm-sans">
                    {status === 'completed'
                        ? 'Your Job Hunter Agent has completed the search'
                        : 'Watch your Job Hunter Agent in action'}
                </p>
            </div>

            {/* Terminal */}
            <div className="flex justify-center">
                <div className="w-full max-w-4xl" ref={terminalRef}>
                    <Terminal className="w-full" sequence={false} startOnView={false}>
                        {logs.length === 0 ? (
                            <AnimatedSpan className="text-blue-400">
                                ℹ Waiting for logs...
                            </AnimatedSpan>
                        ) : (
                            logs.map((log, index) => (
                                <AnimatedSpan
                                    key={log.id || index}
                                    className={getLogClass(log)}
                                    startOnView={false}
                                >
                                    {log.message || log.text || String(log)}
                                </AnimatedSpan>
                            ))
                        )}
                    </Terminal>
                </div>
            </div>
        </div>
    );
}
