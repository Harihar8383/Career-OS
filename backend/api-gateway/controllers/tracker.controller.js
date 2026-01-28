// backend/api-gateway/controllers/tracker.controller.js
import TrackedJob from '../models/TrackedJob.js';

/**
 * Create a new tracked job
 * POST /api/tracker/jobs
 */
export const createTrackedJob = async (req, res) => {
  try {
    const { userId } = req.auth(); // Clerk auth as function
    const jobData = {
      ...req.body,
      userId
    };

    // Initialize status history with initial stage
    if (!jobData.statusHistory || jobData.statusHistory.length === 0) {
      jobData.statusHistory = [{
        stage: jobData.stage || 'saved',
        changedAt: new Date(),
        note: 'Job saved to tracker'
      }];
    }

    const trackedJob = new TrackedJob(jobData);
    await trackedJob.save();

    res.status(201).json({
      success: true,
      data: trackedJob
    });
  } catch (error) {
    console.error('Error creating tracked job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create tracked job',
      error: error.message
    });
  }
};

/**
 * Get all tracked jobs for a user
 * GET /api/tracker/jobs?stage=applied&priority=high
 */
export const getAllTrackedJobs = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { stage, priority, company, search } = req.query;

    // Build filter
    const filter = { userId };
    if (stage) filter.stage = stage;
    if (priority) filter.priority = priority;
    if (company) filter.company = new RegExp(company, 'i');
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { company: new RegExp(search, 'i') },
        { location: new RegExp(search, 'i') }
      ];
    }

    const jobs = await TrackedJob.find(filter).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs
    });
  } catch (error) {
    console.error('Error fetching tracked jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tracked jobs',
      error: error.message
    });
  }
};

/**
 * Get a single tracked job by ID
 * GET /api/tracker/jobs/:id
 */
export const getTrackedJobById = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.params;

    const job = await TrackedJob.findOne({ _id: id, userId });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Error fetching tracked job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tracked job',
      error: error.message
    });
  }
};

/**
 * Update a tracked job
 * PATCH /api/tracker/jobs/:id
 */
export const updateTrackedJob = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.params;
    const updates = req.body;

    // Find the job first to check if stage changed
    const job = await TrackedJob.findOne({ _id: id, userId });
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // If stage is changing, add to status history
    if (updates.stage && updates.stage !== job.stage) {
      if (!updates.statusHistory) {
        updates.statusHistory = [...job.statusHistory];
      }
      updates.statusHistory.push({
        stage: updates.stage,
        changedAt: new Date(),
        note: updates.stageChangeNote || ''
      });
    }

    // Update the job
    Object.assign(job, updates);
    await job.save();

    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Error updating tracked job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tracked job',
      error: error.message
    });
  }
};

/**
 * Delete a tracked job
 * DELETE /api/tracker/jobs/:id
 */
export const deleteTrackedJob = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.params;

    const job = await TrackedJob.findOneAndDelete({ _id: id, userId });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tracked job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete tracked job',
      error: error.message
    });
  }
};

/**
 * Add a note to a job
 * POST /api/tracker/jobs/:id/notes
 */
export const addNote = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Note content is required'
      });
    }

    const job = await TrackedJob.findOne({ _id: id, userId });
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    job.notes.push({
      content,
      createdAt: new Date()
    });

    await job.save();

    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add note',
      error: error.message
    });
  }
};

/**
 * Add a reminder to a job
 * POST /api/tracker/jobs/:id/reminders
 */
export const addReminder = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.params;
    const { date, message } = req.body;

    if (!date || !message) {
      return res.status(400).json({
        success: false,
        message: 'Date and message are required'
      });
    }

    const job = await TrackedJob.findOne({ _id: id, userId });
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    job.reminders.push({
      date: new Date(date),
      message,
      completed: false
    });

    await job.save();

    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Error adding reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add reminder',
      error: error.message
    });
  }
};

/**
 * Add an interview round to a job
 * POST /api/tracker/jobs/:id/interviews
 */
export const addInterview = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.params;
    const { round, scheduledDate, interviewers, feedback, result } = req.body;

    if (!round) {
      return res.status(400).json({
        success: false,
        message: 'Interview round name is required'
      });
    }

    const job = await TrackedJob.findOne({ _id: id, userId });
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    job.interviews.push({
      round,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      interviewers: interviewers || '',
      feedback: feedback || '',
      result: result || 'pending'
    });

    await job.save();

    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Error adding interview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add interview',
      error: error.message
    });
  }
};

/**
 * Bulk update stage for multiple jobs
 * PATCH /api/tracker/jobs/bulk/stage
 */
export const bulkUpdateStage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { jobIds, stage } = req.body;

    if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Job IDs array is required'
      });
    }

    if (!stage) {
      return res.status(400).json({
        success: false,
        message: 'Stage is required'
      });
    }

    // Update all jobs
    const updatePromises = jobIds.map(async (jobId) => {
      const job = await TrackedJob.findOne({ _id: jobId, userId });
      if (job && job.stage !== stage) {
        job.stage = stage;
        job.statusHistory.push({
          stage,
          changedAt: new Date(),
          note: 'Bulk update'
        });
        await job.save();
      }
      return job;
    });

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: `Updated ${jobIds.length} jobs to stage: ${stage}`
    });
  } catch (error) {
    console.error('Error bulk updating jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update jobs',
      error: error.message
    });
  }
};
