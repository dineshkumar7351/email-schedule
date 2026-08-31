import { Router } from 'express';
import passport from 'passport';
import { config } from '../config';
import { prisma } from '../utils/db';

export const authRouter = Router();

authRouter.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

authRouter.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect(`${config.frontendUrl}/dashboard`);
  }
);

authRouter.get('/bypass', async (req, res, next) => {
  try {
    let user = await prisma.user.findUnique({ where: { email: 'dev@example.com' } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'dev@example.com',
          name: 'Developer Mode',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80'
        }
      });
    }
    req.login(user, (err) => {
      if (err) return next(err);
      res.redirect(`${config.frontendUrl}/dashboard`);
    });
  } catch (error) {
    next(error);
  }
});

authRouter.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ success: true, data: req.user });
  } else {
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
});

authRouter.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.json({ success: true, message: 'Logged out successfully' });
  });
});
