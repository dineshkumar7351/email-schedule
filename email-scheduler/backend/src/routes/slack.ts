import { Router } from 'express';
import { prisma } from '../utils/db';
import { config } from '../config';
import axios from 'axios';

export const slackRouter = Router();

slackRouter.get('/status', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ success: false, message: 'Unauthorized' });
  const user = req.user as any;
  const connection = await prisma.slackConnection.findUnique({ where: { userId: user.id } });
  res.json({ success: true, data: { connected: !!connection } });
});

slackRouter.get('/auth', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ success: false, message: 'Unauthorized' });
  // Pass user id in state to link account
  const state = (req.user as any).id;
  const url = `https://slack.com/oauth/v2/authorize?client_id=${config.slack.clientId}&scope=chat:write,incoming-webhook&redirect_uri=${config.slack.redirectUri}&state=${state}`;
  res.redirect(url);
});

slackRouter.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state) return res.redirect(`${config.frontendUrl}/dashboard?error=slack_failed`);

  try {
    const response = await axios.post('https://slack.com/api/oauth.v2.access', null, {
      params: {
        client_id: config.slack.clientId,
        client_secret: config.slack.clientSecret,
        code,
        redirect_uri: config.slack.redirectUri,
      },
    });

    const data = response.data;
    if (data.ok) {
      await prisma.slackConnection.upsert({
        where: { userId: state as string },
        update: {
          accessToken: data.access_token,
          teamId: data.team.id,
          teamName: data.team.name,
        },
        create: {
          userId: state as string,
          accessToken: data.access_token,
          teamId: data.team.id,
          teamName: data.team.name,
        },
      });
      res.redirect(`${config.frontendUrl}/dashboard?slack=success`);
    } else {
      res.redirect(`${config.frontendUrl}/dashboard?error=slack_failed`);
    }
  } catch (error) {
    res.redirect(`${config.frontendUrl}/dashboard?error=slack_failed`);
  }
});

slackRouter.post('/disconnect', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ success: false, message: 'Unauthorized' });
  const user = req.user as any;
  await prisma.slackConnection.deleteMany({ where: { userId: user.id } });
  res.json({ success: true, message: 'Slack disconnected' });
});
