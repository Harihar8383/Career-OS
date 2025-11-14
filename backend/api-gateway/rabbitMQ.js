// backend/api-gateway/rabbitMQ.js
import amqp from "amqplib";

const RABBITMQ_URI = process.env.RABBITMQ_URI;
const QUEUE_NAME = "resume_processing_queue";

let connection = null;
let channel = null;

export async function connectRabbitMQ() {
  try {
    connection = await amqp.connect(RABBITMQ_URI);
    channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    console.log("🐇 RabbitMQ Publisher connected and queue asserted.");
  } catch (error) {
    console.error("❌ Failed to connect to RabbitMQ:", error);
    process.exit(1);
  }
}

export async function publishJob(job) {
  if (!channel) {
    throw new Error("RabbitMQ channel is not available.");
  }
  try {
    channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(job)), {
      persistent: true,
    });
    console.log(`✅ Job published to ${QUEUE_NAME}:`, job.fileName);
  } catch (error) {
    console.error("❌ Failed to publish job:", error);
  }
}