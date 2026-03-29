import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Bell, Clock, Building } from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';

export const UpcomingInterviews = ({ interviews, reminders }) => {
  const hasEvents = interviews?.length > 0 || reminders?.length > 0;

  const formatDateLabel = (dateString) => {
    const date = new Date(dateString);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d, yyyy');
  };

  return (
    <div className="bg-bg-dark/50 border border-border-primary rounded-2xl p-6 backdrop-blur-md h-full overflow-y-auto custom-scrollbar">
      <h3 className="text-lg font-clash-display text-text-primary mb-6">Upcoming Agenda</h3>

      {!hasEvents ? (
        <div className="flex flex-col items-center justify-center h-48 text-text-secondary opacity-70">
          <Calendar className="w-12 h-12 mb-3" />
          <p>No upcoming interviews or reminders.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Interviews First */}
          {interviews?.map((int, idx) => (
            <motion.div
              key={`int-${idx}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex gap-4 p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 hover:border-purple-500/40 transition-colors"
            >
              <div className="flex-shrink-0 mt-1">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-400" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-text-primary font-medium text-sm mb-1 line-clamp-1">{int.company} • {int.round}</h4>
                <p className="text-xs text-text-secondary line-clamp-1 mb-2">{int.title}</p>
                <div className="flex items-center gap-2 text-xs text-purple-400 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatDateLabel(int.scheduledDate)} at {format(new Date(int.scheduledDate), 'h:mm a')}</span>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Reminders Next */}
          {reminders?.map((rem, idx) => (
            <motion.div
              key={`rem-${idx}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (interviews?.length || 0) * 0.1 + idx * 0.1 }}
              className="flex gap-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 hover:border-blue-500/40 transition-colors"
            >
              <div className="flex-shrink-0 mt-1">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-blue-400" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-text-primary font-medium text-sm mb-1 line-clamp-1">{rem.company}</h4>
                <p className="text-xs text-text-secondary line-clamp-2 mb-2">{rem.message}</p>
                <div className="flex items-center gap-2 text-xs text-blue-400 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatDateLabel(rem.date)}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
