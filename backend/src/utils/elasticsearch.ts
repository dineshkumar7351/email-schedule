import { prisma } from './db';
import { logger } from './logger';

export const esClient = {
  indices: {
    async exists() { return true; },
    async create() { return true; }
  },
  async index() { return true; },
  async update() { return true; },
  async search(params: any) {
    try {
      const userId = params.query.bool.must[0].term.userId;
      const queryStr = params.query.bool.must[1].multi_match.query;

      logger.info(`Searching database (Elasticsearch Mock) for: "${queryStr}"`);

      const emails = await prisma.email.findMany({
        where: {
          userId,
          OR: [
            { recipient: { contains: queryStr } },
            { subject: { contains: queryStr } },
            { body: { contains: queryStr } }
          ]
        }
      });

      return {
        hits: {
          hits: emails.map(email => ({
            _source: email
          }))
        }
      };
    } catch (e) {
      logger.error(e, 'Mock ES search error');
      return { hits: { hits: [] } };
    }
  }
} as any;

export async function setupElasticsearch() {
  logger.info('Using Database-backed Elasticsearch Mock');
}
