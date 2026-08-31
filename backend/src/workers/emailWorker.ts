import { InMemoryQueueSystem } from '../utils/queueSystem';
import { redis } from '../utils/redis';
import { config } from '../config';
import { logger } from '../utils/logger';
import { prisma } from '../utils/db';
import { esClient } from '../utils/elasticsearch';
import nodemailer from 'nodemailer';

async function processEmail(job: any) {
  const { emailId, senderId, recipient, subject, body, hourlyLimit } = job.data;

  // 1. Check idempotency
  const emailRecord = await prisma.email.findUnique({ where: { id: emailId } });
  if (!emailRecord || emailRecord.status !== 'SCHEDULED') {
    logger.info(`Skipping job ${job.id} - Email ${emailId} is not SCHEDULED`);
    return;
  }

  // 2. Rate limiting check
  const now = new Date();
  const hourStr = now.toISOString().substring(0, 13); // yyyy-mm-ddThh
  const rateLimitKey = `email-rate:${senderId}:${hourStr}`;
  
  const currentCount = await redis.incr(rateLimitKey);
  if (currentCount === 1) {
    await redis.expire(rateLimitKey, 3600); // 1 hour expiry
  }

  if (currentCount > hourlyLimit) {
    logger.warn(`Sender ${senderId} hit hourly limit of ${hourlyLimit}. Rescheduling...`);
    await redis.decr(rateLimitKey); // rollback

    // Reschedule for next hour
    const nextHour = new Date(now);
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0); // Beginning of next hour
    const delay = nextHour.getTime() - now.getTime();
    
    // Move job
    await job.moveToDelayed(Date.now() + delay);
    
    // Update DB
    await prisma.email.update({
      where: { id: emailId },
      data: { scheduledAt: nextHour }
    });

    throw new Error('DelayedError');
  }

  // 3. Atomically change to PROCESSING
  const updated = await prisma.email.updateMany({
    where: { id: emailId, status: 'SCHEDULED' },
    data: { status: 'PROCESSING' }
  });

  if (updated.count === 0) {
    logger.info(`Skipping job ${job.id} - Failed atomic update to PROCESSING`);
    return;
  }

  // 4. Send email
  const sender = await prisma.sender.findUnique({ where: { id: senderId } });
  if (!sender) {
    throw new Error(`Sender ${senderId} not found`);
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: sender.etherealUser,
        pass: sender.etherealPassword
      }
    } as any);

    const info = await transporter.sendMail({
      from: `"${sender.displayName}" <${sender.email}>`,
      to: recipient,
      subject,
      text: body,
      html: `<p>${body}</p>`
    });

    logger.info(`Email sent: ${nodemailer.getTestMessageUrl(info as any)}`);

    await prisma.email.update({
      where: { id: emailId },
      data: { 
        status: 'SENT', 
        sentAt: new Date(), 
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info as any) || null
      }
    });

    // Update Elasticsearch mock
    try {
      await esClient.update({
        index: 'emails',
        id: emailId,
        doc: { status: 'SENT', sentAt: new Date() }
      });
    } catch (e) {
      logger.error(e, 'ES update failed');
    }

  } catch (error: any) {
    // Revert to FAILED
    await prisma.email.update({
      where: { id: emailId },
      data: { status: 'FAILED', failureReason: error.message }
    });
    
    try {
      await esClient.update({
        index: 'emails',
        id: emailId,
        doc: { status: 'FAILED' }
      });
    } catch (e) {
      logger.error(e, 'ES update failed');
    }
    throw error;
  }
}

// Create a worker wrapper that mimics the BullMQ API events
class MockWorker {
  private events = new Map<string, Function[]>();

  constructor(queueName: string, processor: any, opts: any) {
    InMemoryQueueSystem.registerProcessor(queueName, async (job) => {
      try {
        await processor(job);
        this.emit('completed', job);
      } catch (err: any) {
        this.emit('failed', job, err);
        throw err;
      }
    }, opts);
  }

  on(event: string, callback: Function) {
    const listeners = this.events.get(event) || [];
    listeners.push(callback);
    this.events.set(event, listeners);
  }

  private emit(event: string, ...args: any[]) {
    const listeners = this.events.get(event) || [];
    for (const listener of listeners) {
      listener(...args);
    }
  }
}

export const emailWorker = new MockWorker('emailQueue', processEmail, {
  concurrency: config.workerConcurrency,
  limiter: {
    max: 1,
    duration: config.emailDelayMs, 
  }
}) as any;
