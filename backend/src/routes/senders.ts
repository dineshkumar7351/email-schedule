import { Router } from 'express';
import { prisma } from '../utils/db';
import { z } from 'zod';

export const sendersRouter = Router();

const createSenderSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1),
  etherealUser: z.string().optional(),
  etherealPassword: z.string().optional(),
});

sendersRouter.get('/', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ success: false, message: 'Unauthorized' });
  const user = req.user as any;
  let senders = await prisma.sender.findMany({ where: { userId: user.id } });
  
  const hasDinesk = senders.some(s => s.email === 'dinesk735100@gmail.com');
  if (!hasDinesk) {
    try {
      const nodemailer = require('nodemailer');
      const testAccount = await nodemailer.createTestAccount();
      const newSender = await prisma.sender.create({
        data: {
          userId: user.id,
          email: 'dinesk735100@gmail.com',
          displayName: `Dinesk Sender (dinesk735100@gmail.com)`,
          etherealUser: testAccount.user,
          etherealPassword: testAccount.pass
        }
      });
      senders.push(newSender);
    } catch (e) {
      console.error('Failed to auto-generate Dinesk sender', e);
    }
  }

  res.json({ success: true, data: senders });
});

sendersRouter.post('/', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ success: false, message: 'Unauthorized' });
  const user = req.user as any;

  try {
    const validated = createSenderSchema.parse(req.body);
    
    let etherealUser = validated.etherealUser;
    let etherealPassword = validated.etherealPassword;

    if (!etherealUser || !etherealPassword) {
      const nodemailer = require('nodemailer');
      const testAccount = await nodemailer.createTestAccount();
      etherealUser = testAccount.user;
      etherealPassword = testAccount.pass;
    }

    const sender = await prisma.sender.create({
      data: {
        email: validated.email,
        displayName: validated.displayName,
        etherealUser,
        etherealPassword,
        userId: user.id,
      },
    });
    res.json({ success: true, data: sender });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.errors || 'Validation Error' });
  }
});
