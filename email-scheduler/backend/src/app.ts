import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import passport from './utils/passport';
import { config } from './config';
import { authRouter } from './routes/auth';
import { slackRouter } from './routes/slack';
import { sendersRouter } from './routes/senders';
import { emailsRouter } from './routes/emails';

// Bull Board setup
import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { emailQueue } from './queues/emailQueue';

class MockBullMQAdapter {
  queue: any;
  constructor(queue: any) {
    this.queue = queue;
  }
  getName() { return this.queue.name; }
  async getJobCounts() { return this.queue.getJobCounts(); }
  async getJobs() { return this.queue.getJobs(); }
}

export const app = express();

app.use(helmet());
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json());

app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 } // Local dev, secure: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRouter);
app.use('/api/slack', slackRouter);
app.use('/api/senders', sendersRouter);
app.use('/api/emails', emailsRouter);

// Bull Board
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');
createBullBoard({
  queues: [new MockBullMQAdapter(emailQueue) as any],
  serverAdapter: serverAdapter,
});
app.use('/admin/queues', serverAdapter.getRouter());

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});
