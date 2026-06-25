import { NextResponse } from 'next/server';
import { z } from 'zod';
import { issueOtp } from '@/lib/otp';

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
    }
    await issueOtp(parsed.data.email);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Could not send the code. Is the database configured?' }, { status: 500 });
  }
}
