// backend/api-gateway/rabbitMQ.js
import amqp from "amqplib";

const RABBITMQ_URI = process.env.RABBITMQ_URI;
const RESUME_QUEUE = "resume_processing_queue";
const JD_QUEUE = "jd_analysis_queue"; // <-- New queue

let connection = null;
let channel = null;

export async function connectRabbitMQ() {
  try {
    connection = await amqp.connect(RABBITMQ_URI);
    channel = await connection.createChannel();
    // Assert both queues to make sure they exist
    await channel.assertQueue(RESUME_QUEUE, { durable: true });
    await channel.assertQueue(JD_QUEUE, { durable: true }); // <-- Assert new queue
    console.log("🐇 RabbitMQ Publisher connected and queues asserted.");
  } catch (error) {
    console.error("❌ Failed to connect to RabbitMQ:", error);
    process.exit(1);
  }
}

/**
 * Publishes a job to a specific RabbitMQ queue.
 * @param {string} queueName - The name of the queue to publish to.
 * @param {object} job - The job payload to send.
 */
export async function publishJob(queueName, job) {
  if (!channel) {
    throw new Error("RabbitMQ channel is not available.");
  }
  try {
    // --- MODIFICATION: Use dynamic queueName ---
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(job)), {
      persistent: true,
    });
    console.log(`✅ Job published to ${queueName}:`, job.clerkId || job.userId);
  } catch (error) {
    console.error(`❌ Failed to publish job to ${queueName}:`, error);
  }
}

// Export queue names for easy use in controllers
export const QUEUES = {
  RESUME_PROCESSING: RESUME_QUEUE,
  JD_ANALYSIS: JD_QUEUE,
};