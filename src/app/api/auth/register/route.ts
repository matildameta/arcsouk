import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { issueOtp } from '@/lib/otp';

const schema = z.object({
  name: z.string().min(1).max(80).optional(),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
});

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
    }
    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });

    // Only block if there is already a *verified* account with a password.
    // An unverified, half-finished signup can be retried (re-sends a code).
    if (existing?.passwordHash && existing.emailVerified) {
      return NextResponse.json({ error: 'An account with this email already exists. Sign in instead.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    if (existing) {
      await prisma.user.update({ where: { email }, data: { passwordHash, name: parsed.data.name ?? existing.name } });
    } else {
      await prisma.user.create({ data: { email, name: parsed.data.name, passwordHash } });
    }

    // The account is created but the email is NOT verified yet. Send a one-time
    // code; the user must enter it to verify their email and finish signing in.
    await issueOtp(email);

    return NextResponse.json({ ok: true, verify: true });
  } catch {
    return NextResponse.json({ error: 'Something went wrong. Is the database configured?' }, { status: 500 });
  }
}
