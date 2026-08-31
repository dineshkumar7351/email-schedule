import { Router } from 'express';
import { prisma } from '../utils/db';
import { esClient } from '../utils/elasticsearch';
import { emailQueue } from '../queues/emailQueue';
import { z } from 'zod';
import crypto from 'crypto';

export const emailsRouter = Router();

const scheduleEmailSchema = z.object({
  senderId: z.string(),
  subject: z.string().min(1),
  body: z.string().min(1),
  recipients: z.array(z.string().email()).min(1),
  startTime: z.string().datetime(),
  delayMs: z.number().min(0),
  hourlyLimit: z.number().min(1),
});

emailsRouter.post('/schedule', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ success: false, message: 'Unauthorized' });
  const user = req.user as any;

  try {
    const validated = scheduleEmailSchema.parse(req.body);
    let currentStartTime = new Date(validated.startTime).getTime();

    const emailsToCreate = validated.recipients.map((recipient, index) => {
      // Just set the scheduled time for the DB record based on start + (index * delay).
      // Wait, the requirements state: "Use Redis-backed coordination or another distributed-safe mechanism"
      // to apply delay. So they should all be scheduled at the `startTime`. The worker's rate limiter
      // will enforce the delay globally for the worker.
      // However, if we want to spread them out initially, we can just spread their delayed time.
      const scheduledAt = new Date(currentStartTime);
      currentStartTime += validated.delayMs;
      
      return {
        userId: user.id,
        senderId: validated.senderId,
        recipient,
        subject: validated.subject,
        body: validated.body,
        scheduledAt,
      };
    });

    // Create DB records
    const createdEmails = await prisma.$transaction(
      emailsToCreate.map(data => prisma.email.create({ data }))
    );

    // Create BullMQ jobs and update ES
    for (const email of createdEmails) {
      const jobId = `email-${email.id}`; // idempotency key
      const delay = Math.max(0, email.scheduledAt.getTime() - Date.now());

      await emailQueue.add('send-email', {
        emailId: email.id,
        senderId: email.senderId,
        recipient: email.recipient,
        subject: email.subject,
        body: email.body,
        hourlyLimit: validated.hourlyLimit
      }, {
        delay,
        jobId, // prevents duplicate creation
      });

      await prisma.email.update({
        where: { id: email.id },
        data: { bullJobId: jobId }
      });

      // Index in ES
      try {
        await esClient.index({
          index: 'emails',
          id: email.id,
          document: {
            id: email.id,
            userId: email.userId,
            senderId: email.senderId,
            recipient: email.recipient,
            subject: email.subject,
            body: email.body,
            status: email.status,
            scheduledAt: email.scheduledAt,
            createdAt: email.createdAt
          }
        });
      } catch (e) {}
    }

    res.json({ success: true, message: `${createdEmails.length} emails scheduled successfully.` });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.errors || error.message });
  }
});

emailsRouter.get('/scheduled', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ success: false, message: 'Unauthorized' });
  const user = req.user as any;
  const page = parseInt(req.query.page as string) || 1;
  const limit = 20;

  const emails = await prisma.email.findMany({
    where: { userId: user.id, status: 'SCHEDULED' },
    orderBy: { scheduledAt: 'asc' },
    skip: (page - 1) * limit,
    take: limit,
  });
  res.json({ success: true, data: emails });
});

emailsRouter.get('/sent', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ success: false, message: 'Unauthorized' });
  const user = req.user as any;
  const page = parseInt(req.query.page as string) || 1;
  const limit = 20;

  const emails = await prisma.email.findMany({
    where: { userId: user.id, status: 'SENT' },
    orderBy: { sentAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });
  res.json({ success: true, data: emails });
});

emailsRouter.get('/search', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ success: false, message: 'Unauthorized' });
  const user = req.user as any;
  const q = req.query.q as string;
  if (!q) return res.json({ success: true, data: [] });

  try {
    const result = await esClient.search({
      index: 'emails',
      query: {
        bool: {
          must: [
            { term: { userId: user.id } },
            {
              multi_match: {
                query: q,
                fields: ['recipient', 'subject', 'body']
              }
            }
          ]
        }
      }
    });
    const hits = result.hits.hits.map((h: any) => h._source);
    res.json({ success: true, data: hits });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Search failed' });
  }
});

emailsRouter.get('/:id', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ success: false, message: 'Unauthorized' });
  const user = req.user as any;
  const email = await prisma.email.findFirst({ where: { id: req.params.id, userId: user.id } });
  if (!email) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: email });
});
