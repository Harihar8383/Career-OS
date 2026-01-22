import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for managing Job Hunter Agent sessions
 * Handles starting hunts, polling for updates, and managing session state
 */
export function useJobHunt() {
    const [sessionId, setSessionId] = useState(null);
    const [logs, setLogs] = useState([]);
    const [status, setStatus] = useState('idle'); // idle, running, completed, error
    const [error, setError] = useState(null);
    const [results, setResults] = useState([]);
    const pollingIntervalRef = useRef(null);

    /**
     * Start a new job hunt session
     * @param {Object} criteria - Job search criteria
     * @returns {Promise<string>} - Session ID
     */
    const startHunt = useCallback(async (criteria) => {
        try {
            setStatus('running');
            setError(null);
            setLogs([]);
            setResults([]);

            const response = await fetch('/api/hunter/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(criteria),
            });

            if (!response.ok) {
                throw new Error(`Failed to start hunt: ${response.statusText}`);
            }

            const data = await response.json();
            const newSessionId = data.sessionId;
            
            setSessionId(newSessionId);
            return newSessionId;
        } catch (err) {
            setStatus('error');
            setError(err.message);
            throw err;
        }
    }, []);

    /**
     * Poll a session for updates
     * @param {string} id - Session ID to poll
     * @returns {Promise<Object>} - Session data with logs and status
     */
    const pollSession = useCallback(async (id) => {
        try {
            const response = await fetch(`/api/hunter/session/${id}`);

            if (!response.ok) {
                throw new Error(`Failed to fetch session: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Update logs (append new logs)
            if (data.logs && Array.isArray(data.logs)) {
                setLogs(data.logs);
            }

            // Update status
            if (data.status) {
                setStatus(data.status);
            }

            // If completed, fetch results
            if (data.status === 'completed') {
                try {
                    const resultsResponse = await fetch(`/api/hunter/results/${id}`);
                    if (resultsResponse.ok) {
                        const resultsData = await resultsResponse.json();
                        if (resultsData.results && Array.isArray(resultsData.results)) {
                            setResults(resultsData.results);
                        }
                    }
                } catch (fetchErr) {
                    console.error("Error fetching results:", fetchErr);
                }
            }

            return data;
        } catch (err) {
            setError(err.message);
            setStatus('error');
            throw err;
        }
    }, []);

    /**
     * Start polling the current session
     */
    const startPolling = useCallback((id) => {
        // Clear any existing polling
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }

        // Start new polling interval (every 2 seconds)
        pollingIntervalRef.current = setInterval(() => {
            pollSession(id);
        }, 2000);
    }, [pollSession]);

    /**
     * Stop polling
     */
    const stopPolling = useCallback(() => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    }, []);

    /**
     * Reset the hook to initial state
     */
    const reset = useCallback(() => {
        stopPolling();
        setSessionId(null);
        setLogs([]);
        setStatus('idle');
        setError(null);
        setResults([]);
    }, [stopPolling]);

    // Auto-start polling when sessionId changes
    useEffect(() => {
        if (sessionId && status === 'running') {
            startPolling(sessionId);
        }

        // Cleanup on unmount or when sessionId changes
        return () => {
            stopPolling();
        };
    }, [sessionId, status, startPolling, stopPolling]);

    // Stop polling when status is completed or error
    useEffect(() => {
        if (status === 'completed' || status === 'error') {
            stopPolling();
        }
    }, [status, stopPolling]);

    return {
        // State
        sessionId,
        logs,
        status,
        error,
        results,
        
        // Actions
        startHunt,
        pollSession,
        reset,
    };
}
