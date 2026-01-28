// frontend/src/hooks/useJobTracker.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useToast } from '../components/ui/Toast';

const API_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080';

export const useJobTracker = () => {
  const { getToken } = useAuth();
  const toast = useToast();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all jobs
  const fetchJobs = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const token = await getToken();
      
      // Build query string from filters
      const queryParams = new URLSearchParams();
      if (filters.stage) queryParams.append('stage', filters.stage);
      if (filters.priority) queryParams.append('priority', filters.priority);
      if (filters.company) queryParams.append('company', filters.company);
      if (filters.search) queryParams.append('search', filters.search);

      const queryString = queryParams.toString();
      const url = `${API_URL}/api/tracker/jobs${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const data = await response.json();
      setJobs(data.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err.message);
      toast.error('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  }, [getToken, toast]);

  // Create a new job
  const createJob = useCallback(async (jobData) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/tracker/jobs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jobData)
      });

      if (!response.ok) {
        throw new Error('Failed to create job');
      }

      const data = await response.json();
      setJobs(prev => [data.data, ...prev]);
      toast.success('Job saved to tracker!');
      return data.data;
    } catch (err) {
      console.error('Error creating job:', err);
      toast.error('Failed to save job');
      throw err;
    }
  }, [getToken, toast]);

  // Update a job
  const updateJob = useCallback(async (jobId, updates) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/tracker/jobs/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update job');
      }

      const data = await response.json();
      setJobs(prev => prev.map(job => job._id === jobId ? data.data : job));
      toast.success('Job updated successfully!');
      return data.data;
    } catch (err) {
      console.error('Error updating job:', err);
      toast.error('Failed to update job');
      throw err;
    }
  }, [getToken, toast]);

  // Delete a job
  const deleteJob = useCallback(async (jobId) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/tracker/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete job');
      }

      setJobs(prev => prev.filter(job => job._id !== jobId));
      toast.success('Job deleted successfully!');
    } catch (err) {
      console.error('Error deleting job:', err);
      toast.error('Failed to delete job');
      throw err;
    }
  }, [getToken, toast]);

  // Update stage (for drag-and-drop)
  const updateStage = useCallback(async (jobId, newStage) => {
    // Optimistic update: Update state immediately
    const originalJobs = [...jobs];
    setJobs(prev => prev.map(job => 
      job._id === jobId ? { ...job, stage: newStage } : job
    ));

    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/tracker/jobs/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stage: newStage })
      });

      if (!response.ok) {
        throw new Error('Failed to update stage');
      }

      const data = await response.json();
      // Update with server data to ensure consistency (e.g. timestamps)
      setJobs(prev => prev.map(job => job._id === jobId ? data.data : job));
      return data.data;
    } catch (err) {
      // Revert optimistic update on failure
      console.error('Error updating stage:', err);
      setJobs(originalJobs);
      toast.error('Failed to update stage');
      throw err;
    }
  }, [jobs, getToken, toast]);

  // Add a note
  const addNote = useCallback(async (jobId, content) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/tracker/jobs/${jobId}/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });

      if (!response.ok) {
        throw new Error('Failed to add note');
      }

      const data = await response.json();
      setJobs(prev => prev.map(job => job._id === jobId ? data.data : job));
      toast.success('Note added!');
      return data.data;
    } catch (err) {
      console.error('Error adding note:', err);
      toast.error('Failed to add note');
      throw err;
    }
  }, [getToken, toast]);

  // Add a reminder
  const addReminder = useCallback(async (jobId, reminderData) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/tracker/jobs/${jobId}/reminders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reminderData)
      });

      if (!response.ok) {
        throw new Error('Failed to add reminder');
      }

      const data = await response.json();
      setJobs(prev => prev.map(job => job._id === jobId ? data.data : job));
      toast.success('Reminder added!');
      return data.data;
    } catch (err) {
      console.error('Error adding reminder:', err);
      toast.error('Failed to add reminder');
      throw err;
    }
  }, [getToken, toast]);

  // Add an interview
  const addInterview = useCallback(async (jobId, interviewData) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/tracker/jobs/${jobId}/interviews`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(interviewData)
      });

      if (!response.ok) {
        throw new Error('Failed to add interview');
      }

      const data = await response.json();
      setJobs(prev => prev.map(job => job._id === jobId ? data.data : job));
      toast.success('Interview round added!');
      return data.data;
    } catch (err) {
      console.error('Error adding interview:', err);
      toast.error('Failed to add interview');
      throw err;
    }
  }, [getToken, toast]);

  // Bulk update stage
  const bulkUpdateStage = useCallback(async (jobIds, stage) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/tracker/jobs/bulk/stage`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ jobIds, stage })
      });

      if (!response.ok) {
        throw new Error('Failed to bulk update');
      }

      // Refresh jobs after bulk update
      await fetchJobs();
      toast.success(`Updated ${jobIds.length} jobs!`);
    } catch (err) {
      console.error('Error bulk updating:', err);
      toast.error('Failed to bulk update');
      throw err;
    }
  }, [getToken, toast, fetchJobs]);

  // Initial fetch
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return {
    jobs,
    loading,
    error,
    createJob,
    updateJob,
    deleteJob,
    updateStage,
    addNote,
    addReminder,
    addInterview,
    bulkUpdateStage,
    refreshJobs: fetchJobs
  };
};
