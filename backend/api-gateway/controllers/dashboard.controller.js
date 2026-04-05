// backend/api-gateway/controllers/dashboard.controller.js
import TrackedJob from '../models/TrackedJob.js';
import JdAnalysis from '../models/jdAnalysis.models.js';
import HunterSession from '../models/HunterSession.js';
import JobResult from '../models/JobResult.js';

/**
 * GET /api/dashboard/analytics
 * Aggregates data from TrackedJob, JdAnalysis, HunterSession, and JobResult
 * into a single payload for the Analytics Dashboard.
 */
export const getDashboardAnalytics = async (req, res) => {
  try {
    const { userId } = req.auth;
    const now = new Date();

    // ── Parallel DB Queries ──────────────────────────────────────────────
    const [
      trackedJobs,
      jdAnalyses,
      hunterSessionCount,
      hunterJobCount,
      topCompaniesAgg,
      sourceDistAgg,
    ] = await Promise.all([
      TrackedJob.find({ userId }).lean(),
      JdAnalysis.find({ clerkId: userId, status: 'complete' })
        .sort({ createdAt: -1 })
        .limit(50)
        .select('runId createdAt jdText analysisResults.match_score analysisResults.jd_summary analysisResults.keyword_gap')
        .lean(),
      HunterSession.countDocuments({ userId }),
      JobResult.countDocuments({ userId }),
      JobResult.aggregate([
        { $match: { userId } },
        { $group: { _id: '$company', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 7 },
      ]),
      TrackedJob.aggregate([
        { $match: { userId } },
        { $group: { _id: '$source', count: { $sum: 1 } } },
      ]),
    ]);

    // ── 1. KPI Cards ─────────────────────────────────────────────────────
    const totalTracked = trackedJobs.length;

    const ACTIVE_STAGES = ['applied', 'screening', 'interview'];
    const activeApplications = trackedJobs.filter(j => ACTIVE_STAGES.includes(j.stage)).length;

    let interviewsScheduled = 0;
    trackedJobs.forEach(j => {
      if (j.interviews) {
        j.interviews.forEach(i => {
          if (i.scheduledDate && new Date(i.scheduledDate) >= now) interviewsScheduled++;
        });
      }
    });

    const offersReceived = trackedJobs.filter(j => j.stage === 'offer' || j.stage === 'accepted').length;

    const scoredJobs = trackedJobs.filter(j => j.matchScore && j.matchScore > 0);
    const avgMatchScore = scoredJobs.length > 0
      ? Math.round(scoredJobs.reduce((s, j) => s + j.matchScore, 0) / scoredJobs.length)
      : 0;

    const jdAnalysesRun = jdAnalyses.length;

    // ── 3. Pipeline Funnel ───────────────────────────────────────────────
    const pipeline = { saved: 0, applied: 0, screening: 0, interview: 0, offer: 0, accepted: 0, rejected: 0 };
    trackedJobs.forEach(j => { if (pipeline[j.stage] !== undefined) pipeline[j.stage]++; });

    // ── 13. Action Items Feed ────────────────────────────────────────────
    const actionItems = [];
    
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    trackedJobs.forEach(job => {
      // Future and today's interviews
      if (job.interviews) {
        job.interviews.forEach(int => {
          if (int.scheduledDate && new Date(int.scheduledDate) >= startOfToday) {
            actionItems.push({
              type: 'interview',
              urgency: _getUrgency(int.scheduledDate, now),
              date: int.scheduledDate,
              title: `${int.round} at ${job.company}`,
              subtitle: job.title,
              jobId: job._id,
            });
          }
        });
      }
      // Pending reminders (including overdue)
      if (job.reminders) {
        job.reminders.forEach(rem => {
          if (!rem.completed && rem.date) {
            actionItems.push({
              type: 'reminder',
              urgency: _getUrgency(rem.date, now),
              date: rem.date,
              title: rem.message,
              subtitle: `${job.company} — ${job.title}`,
              jobId: job._id,
            });
          }
        });
      }
      // Stale applications (applied 14+ days ago with no progress)
      if (job.stage === 'applied') {
        const lastChange = job.statusHistory && job.statusHistory.length > 0
          ? new Date(job.statusHistory[job.statusHistory.length - 1].changedAt)
          : new Date(job.createdAt);
        const daysSince = Math.floor((now - lastChange) / (1000 * 60 * 60 * 24));
        if (daysSince >= 14) {
          actionItems.push({
            type: 'stale',
            urgency: 'stale',
            date: lastChange,
            title: `No update for ${daysSince} days`,
            subtitle: `${job.company} — ${job.title}`,
            jobId: job._id,
          });
        }
      }
    });

    // Sort: today first, then tomorrow, then this week, then stale
    const URGENCY_ORDER = { today: 0, tomorrow: 1, thisWeek: 2, stale: 3, later: 4 };
    actionItems.sort((a, b) => (URGENCY_ORDER[a.urgency] ?? 5) - (URGENCY_ORDER[b.urgency] ?? 5));

    // ── 4. Match Score Trend ─────────────────────────────────────────────
    const matchScoreTrend = jdAnalyses
      .filter(a => a.analysisResults?.match_score != null)
      .map(a => ({
        date: a.createdAt,
        score: a.analysisResults.match_score,
        jobTitle: a.analysisResults?.jd_summary?.job_title || 'Unknown',
        company: a.analysisResults?.jd_summary?.company || 'Unknown',
      }))
      .reverse(); // chronological order

    // ── 5. Skill Gap Radar ───────────────────────────────────────────────
    const skillFreq = { missing: {}, matched: {}, weak: {} };
    jdAnalyses.forEach(a => {
      const gap = a.analysisResults?.keyword_gap;
      if (!gap) return;
      (gap.missing || []).forEach(s => { skillFreq.missing[s] = (skillFreq.missing[s] || 0) + 1; });
      (gap.matched || []).forEach(s => { skillFreq.matched[s] = (skillFreq.matched[s] || 0) + 1; });
      (gap.weak || []).forEach(s => { skillFreq.weak[s] = (skillFreq.weak[s] || 0) + 1; });
    });

    const toSorted = (obj) => Object.entries(obj)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count);

    const skillGaps = {
      repeatedlyMissing: toSorted(skillFreq.missing).slice(0, 10),
      usuallyMatched: toSorted(skillFreq.matched).slice(0, 10),
      sometimesWeak: toSorted(skillFreq.weak).slice(0, 8),
    };

    // ── 6. Recent JD Analyses ────────────────────────────────────────────
    const recentAnalyses = jdAnalyses.slice(0, 5).map(a => ({
      runId: a.runId,
      date: a.createdAt,
      jobTitle: a.analysisResults?.jd_summary?.job_title || 'Unknown Job',
      company: a.analysisResults?.jd_summary?.company || 'Unknown',
      score: a.analysisResults?.match_score || 0,
    }));

    // ── 7 & 8. Hunter Summary + Top Companies ────────────────────────────
    const jobsSavedFromHunter = trackedJobs.filter(j => j.source === 'hunter').length;

    // Latest session
    const latestSession = await HunterSession.findOne({ userId })
      .sort({ createdAt: -1 })
      .select('sessionId criteria status createdAt')
      .lean();

    let latestSessionJobCount = 0;
    if (latestSession) {
      latestSessionJobCount = await JobResult.countDocuments({
        sessionId: latestSession.sessionId,
        userId,
      });
    }

    const hunterSummary = {
      totalSessions: hunterSessionCount,
      totalJobsFound: hunterJobCount,
      jobsSaved: jobsSavedFromHunter,
      latestSession: latestSession
        ? {
            sessionId: latestSession.sessionId,
            criteria: latestSession.criteria,
            status: latestSession.status,
            createdAt: latestSession.createdAt,
            jobCount: latestSessionJobCount,
          }
        : null,
    };

    const topCompanies = topCompaniesAgg.map(c => ({ company: c._id, count: c.count }));

    // ── 11. Time in Stage ────────────────────────────────────────────────
    const stageTransitions = {};
    const STAGE_ORDER = ['saved', 'applied', 'screening', 'interview', 'offer', 'accepted'];

    trackedJobs.forEach(job => {
      if (!job.statusHistory || job.statusHistory.length < 2) return;
      const sorted = [...job.statusHistory].sort((a, b) => new Date(a.changedAt) - new Date(b.changedAt));
      for (let i = 1; i < sorted.length; i++) {
        const from = sorted[i - 1].stage;
        const to = sorted[i].stage;
        if (to === 'rejected') continue; // skip rejected transitions for avg time calc
        const key = `${from}→${to}`;
        const days = (new Date(sorted[i].changedAt) - new Date(sorted[i - 1].changedAt)) / (1000 * 60 * 60 * 24);
        if (days < 0 || days > 365) continue; // skip invalid
        if (!stageTransitions[key]) stageTransitions[key] = [];
        stageTransitions[key].push(days);
      }
    });

    const timeInStage = Object.entries(stageTransitions).map(([key, durations]) => ({
      transition: key,
      avgDays: parseFloat((durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1)),
      count: durations.length,
    })).sort((a, b) => {
      // Sort by the STAGE_ORDER of the "from" stage
      const fromA = a.transition.split('→')[0];
      const fromB = b.transition.split('→')[0];
      return STAGE_ORDER.indexOf(fromA) - STAGE_ORDER.indexOf(fromB);
    });

    // ── 14. Source Distribution ───────────────────────────────────────────
    const sourceDistribution = { hunter: 0, matcher: 0, manual: 0 };
    sourceDistAgg.forEach(s => {
      if (sourceDistribution[s._id] !== undefined) sourceDistribution[s._id] = s.count;
    });

    // ── 2. Activity Heatmap ──────────────────────────────────────────────
    const heatmapMap = {};
    // Count job creation dates
    trackedJobs.forEach(j => {
      const day = new Date(j.createdAt).toISOString().split('T')[0];
      heatmapMap[day] = (heatmapMap[day] || 0) + 1;
    });
    // Count status changes
    trackedJobs.forEach(j => {
      if (j.statusHistory) {
        j.statusHistory.forEach(sh => {
          const day = new Date(sh.changedAt).toISOString().split('T')[0];
          heatmapMap[day] = (heatmapMap[day] || 0) + 1;
        });
      }
    });
    // Convert to array sorted by date
    const activityHeatmap = Object.entries(heatmapMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ── Response ─────────────────────────────────────────────────────────
    res.status(200).json({
      success: true,
      data: {
        kpiCards: { totalTracked, activeApplications, interviewsScheduled, offersReceived, avgMatchScore, jdAnalysesRun },
        pipeline,
        actionItems: actionItems.slice(0, 10),
        matchScoreTrend,
        skillGaps,
        recentAnalyses,
        hunterSummary,
        topCompanies,
        timeInStage,
        sourceDistribution,
        activityHeatmap,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard analytics', error: error.message });
  }
};

// ── Helpers ────────────────────────────────────────────────────────────────
function _getUrgency(dateVal, now) {
  const d = new Date(dateVal);
  const diff = d - now;
  const msInDay = 1000 * 60 * 60 * 24;
  if (diff < 0) return 'today'; // past-due or today
  if (diff < msInDay) return 'today';
  if (diff < 2 * msInDay) return 'tomorrow';
  if (diff < 7 * msInDay) return 'thisWeek';
  return 'later';
}
