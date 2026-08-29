import { Router } from 'express';
import passport from 'passport';
import { config } from '../config';

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
