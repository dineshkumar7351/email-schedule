import { InMemoryQueueSystem } from '../utils/queueSystem';

export class MockQueue {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
  
  async add(name: string, data: any, opts: any) {
    return InMemoryQueueSystem.addJob(this.name, data, opts);
  }

  async getJobCounts() {
    return InMemoryQueueSystem.getJobCounts();
  }

  async getJobs() {
    return InMemoryQueueSystem.getJobs();
  }
}

export const emailQueue = new MockQueue('emailQueue') as any;
export type Queue = MockQueue;
export type Job = any;
export type Worker = any;
