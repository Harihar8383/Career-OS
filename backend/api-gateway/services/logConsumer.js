// backend/api-gateway/services/logConsumer.js
import { getChannel, QUEUES } from '../rabbitMQ.js';
import HunterSession from '../models/HunterSession.js';

/**
 * Background service that consumes job hunt logs from RabbitMQ
 * and saves them to MongoDB for persistence
 */
class LogConsumerService {
    constructor() {
        this.isRunning = false;
        this.consumerTag = null;
    }

    /**
     * Start consuming logs from RabbitMQ
     */
    async start() {
        if (this.isRunning) {
            console.log('[LogConsumer] Already running');
            return;
        }

        try {
            const channel = getChannel();
            
            if (!channel) {
                console.error('[LogConsumer] RabbitMQ channel not available');
                return;
            }

            // Ensure the logs queue exists
            await channel.assertQueue(QUEUES.JOB_HUNT_LOGS, { durable: true });

            console.log('[LogConsumer] Starting log consumer...');

            // Start consuming messages
            const { consumerTag } = await channel.consume(
                QUEUES.JOB_HUNT_LOGS,
                async (msg) => {
                    if (msg) {
                        try {
                            const logEntry = JSON.parse(msg.content.toString());
                            
                            // Save log to MongoDB
                            await this.saveLogToDatabase(logEntry);
                            
                            // Acknowledge the message
                            channel.ack(msg);
                        } catch (err) {
                            console.error('[LogConsumer] Error processing log:', err);
                            // Reject and requeue the message
                            channel.nack(msg, false, true);
                        }
                    }
                },
                { noAck: false }
            );

            this.consumerTag = consumerTag;
            this.isRunning = true;
            console.log('[LogConsumer] ✅ Log consumer started successfully');

        } catch (error) {
            console.error('[LogConsumer] Failed to start:', error);
        }
    }

    /**
     * Save a log entry to MongoDB
     */
    async saveLogToDatabase(logEntry) {
        const { sessionId, level, message, timestamp } = logEntry;

        if (!sessionId) {
            console.warn('[LogConsumer] Log entry missing sessionId, skipping');
            return;
        }

        try {
            // Format log message with level and timestamp
            const formattedLog = `[${level.toUpperCase()}] ${message}`;

            // Update the session document, adding the log to the logs array
            await HunterSession.updateOne(
                { sessionId },
                { 
                    $push: { logs: formattedLog },
                    $set: { updatedAt: new Date() }
                }
            );

            // console.log(`[LogConsumer] Saved log for session ${sessionId}`);
        } catch (err) {
            console.error('[LogConsumer] Error saving log to database:', err);
            throw err;
        }
    }

    /**
     * Stop the log consumer
     */
    async stop() {
        if (!this.isRunning) {
            return;
        }

        try {
            const channel = getChannel();
            
            if (channel && this.consumerTag) {
                await channel.cancel(this.consumerTag);
                console.log('[LogConsumer] Log consumer stopped');
            }

            this.isRunning = false;
            this.consumerTag = null;
        } catch (error) {
            console.error('[LogConsumer] Error stopping consumer:', error);
        }
    }
}

// Create singleton instance
const logConsumer = new LogConsumerService();

export default logConsumer;
