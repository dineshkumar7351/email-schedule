import { logger } from './logger';

class RedisMock {
  private store = new Map<string, any>();
  private timeouts = new Map<string, NodeJS.Timeout>();

  async incr(key: string): Promise<number> {
    const val = (this.store.get(key) || 0) + 1;
    this.store.set(key, val);
    return val;
  }

  async decr(key: string): Promise<number> {
    const val = (this.store.get(key) || 0) - 1;
    this.store.set(key, val);
    return val;
  }

  async expire(key: string, seconds: number): Promise<number> {
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
    }
    const t = setTimeout(() => {
      this.store.delete(key);
      this.timeouts.delete(key);
    }, seconds * 1000);
    this.timeouts.set(key, t);
    return 1;
  }

  async set(key: string, value: string, mode?: string, duration?: number, flag?: string): Promise<string | null> {
    if (flag === 'NX' && this.store.has(key)) {
      return null;
    }
    this.store.set(key, value);
    if (mode === 'EX' && duration) {
      await this.expire(key, duration);
    }
    return 'OK';
  }

  on(event: string, callback: any) {
    if (event === 'connect') {
      setTimeout(callback, 0);
    }
  }
}

export const redis = new RedisMock() as any;
logger.info('Using In-Memory Redis Mock');
