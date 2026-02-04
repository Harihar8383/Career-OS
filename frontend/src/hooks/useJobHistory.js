import { useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';

/**
 * Custom hook for managing Job Hunter session history
 * Handles fetching and pagination of previous hunt sessions
 */
export function useJobHistory() {
  const { getToken } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 18,
    totalSessions: 0,
    totalPages: 0,
    hasMore: false
  });

  /**
   * Fetch sessions from the API
   * @param {number} page - Page number to fetch
   */
  const fetchSessions = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const API_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080';
      
      const response = await fetch(
        `${API_URL}/api/hunter/sessions?page=${page}&limit=18`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch sessions: ${response.statusText}`);
      }

      const data = await response.json();
      
      setSessions(data.sessions || []);
      setPagination(data.pagination || {
        page: 1,
        limit: 18,
        totalSessions: 0,
        totalPages: 0,
        hasMore: false
      });

    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  /**
   * Go to a specific page
   */
  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= pagination.totalPages && !isLoading) {
      fetchSessions(page);
    }
  }, [pagination.totalPages, isLoading, fetchSessions]);

  /**
   * Load more sessions (next page)
   */
  const loadMore = useCallback(() => {
    if (pagination.hasMore && !isLoading) {
      fetchSessions(pagination.page + 1);
    }
  }, [pagination.hasMore, pagination.page, isLoading, fetchSessions]);

  /**
   * Refresh sessions (reload from page 1)
   */
  const refreshSessions = useCallback(() => {
    fetchSessions(1);
  }, [fetchSessions]);

  return {
    sessions,
    isLoading,
    error,
    pagination,
    fetchSessions,
    goToPage,
    loadMore,
    refreshSessions,
  };
}
