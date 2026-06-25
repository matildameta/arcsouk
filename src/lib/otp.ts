import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { sendOtpEmail } from '@/lib/mailer';

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Generate a fresh 6-digit one-time code for `email`, store its hash, and
 * email it to the user. Any previous codes for the same email are removed so
 * only the latest one is valid. Shared by the registration and the
 * passwordless "email code" sign-in flows.
 */
export async function issueOtp(email: string) {
  const normalized = email.toLowerCase();
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  await prisma.emailOtp.deleteMany({ where: { email: normalized } });
  await prisma.emailOtp.create({ data: { email: normalized, codeHash, expiresAt } });
  await sendOtpEmail(normalized, code);
}
