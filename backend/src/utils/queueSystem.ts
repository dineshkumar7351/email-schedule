import { logger } from './logger';
import { prisma } from './db';

type Processor = (job: any) => Promise<any>;

class QueueSystem {
  private processors = new Map<string, Processor>();
  private activeJobsCount = 0;
  private concurrency = 5;
  private delayBetweenJobs = 2000;
  private lastJobTime = 0;
  
  private jobs: any[] = [];

  registerProcessor(queueName: string, processor: Processor, opts: any) {
    this.processors.set(queueName, processor);
    this.concurrency = opts.concurrency || 5;
    this.delayBetweenJobs = opts.limiter?.duration || 2000;
    
    // Auto-restore scheduled jobs from the SQLite database
    this.loadJobsFromDatabase(queueName);
  }

  async loadJobsFromDatabase(queueName: string) {
    try {
      // Small timeout to let setup run
      await new Promise(r => setTimeout(r, 1000));
      
      const scheduledEmails = await prisma.email.findMany({
        where: { status: 'SCHEDULED' }
      });
      
      logger.info(`QueueSystem: Found ${scheduledEmails.length} scheduled emails in database to restore.`);
      
      for (const email of scheduledEmails) {
        const delay = Math.max(0, new Date(email.scheduledAt).getTime() - Date.now());
        
        const jobData = {
          emailId: email.id,
          senderId: email.senderId,
          recipient: email.recipient,
          subject: email.subject,
          body: email.body,
          hourlyLimit: 200
        };
        
        this.addJob(queueName, jobData, {
          delay,
          jobId: `email-${email.id}`
        });
      }
    } catch (e) {
      logger.error(e, 'Failed to restore scheduled jobs from database');
    }
  }

  addJob(queueName: string, data: any, opts: any) {
    // Check if job already exists to maintain idempotency
    const existing = this.jobs.find(j => j.id === opts.jobId);
    if (existing) {
      logger.info(`QueueSystem: Job ${opts.jobId} already exists in queue, skipping double add.`);
      return existing;
    }

    const job = {
      id: opts.jobId || Math.random().toString(),
      data,
      status: opts.delay > 0 ? 'delayed' : 'waiting',
      delay: opts.delay || 0,
      timestamp: Date.now(),
      token: 'mock-token',
      moveToDelayed: async (timestamp: number) => {
        job.status = 'delayed';
        const delay = Math.max(0, timestamp - Date.now());
        logger.info(`QueueSystem: Rescheduling job ${job.id} for next hour (${delay}ms delay)`);
        setTimeout(() => {
          job.status = 'waiting';
          this.processQueue(queueName);
        }, delay);
      }
    };

    this.jobs.push(job);

    if (job.status === 'delayed') {
      setTimeout(() => {
        job.status = 'waiting';
        this.processQueue(queueName);
      }, job.delay);
    } else {
      this.processQueue(queueName);
    }

    return job;
  }

  private async processQueue(queueName: string) {
    if (this.activeJobsCount >= this.concurrency) {
      return;
    }

    const processor = this.processors.get(queueName);
    if (!processor) return;

    const job = this.jobs.find(j => j.status === 'waiting');
    if (!job) return;

    const now = Date.now();
    const timeSinceLastJob = now - this.lastJobTime;
    if (timeSinceLastJob < this.delayBetweenJobs) {
      const waitTime = this.delayBetweenJobs - timeSinceLastJob;
      setTimeout(() => this.processQueue(queueName), waitTime);
      return;
    }

    job.status = 'active';
    this.activeJobsCount++;
    this.lastJobTime = Date.now();

    try {
      await processor(job);
      job.status = 'completed';
    } catch (error: any) {
      if (error.message === 'DelayedError') {
        // Special handled error bymoveToDelayed
      } else {
        job.status = 'failed';
        logger.error(error, `QueueSystem: Job ${job.id} failed`);
      }
    } finally {
      this.activeJobsCount--;
      this.processQueue(queueName);
    }
  }

  getJobCounts() {
    const counts = { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
    for (const job of this.jobs) {
      if (job.status in counts) {
        counts[job.status as keyof typeof counts]++;
      }
    }
    return counts;
  }

  getJobs() {
    return this.jobs.map(j => ({
      id: j.id,
      name: 'send-email',
      data: j.data,
      opts: { delay: j.delay },
      status: j.status,
      getState: async () => j.status
    }));
  }
}

export const InMemoryQueueSystem = new QueueSystem();
