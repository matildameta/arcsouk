import { NextResponse } from 'next/server';
import { z } from 'zod';
import { settingsTable } from '@/lib/store';
import { requireAdmin } from '@/lib/session';

const schema = z.object({
  aboutTitle: z.string().max(200).optional(),
  aboutBody: z.string().max(5000).optional(),
  creatorName: z.string().max(120).optional(),
  creatorEmail: z.string().max(200).optional(),
  creatorX: z.string().max(200).optional(),
  creatorTelegram: z.string().max(200).optional(),
});

export async function PUT(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  try {
    const s = await settingsTable().upsert({
      where: { id: 'site' },
      update: parsed.data,
      create: { id: 'site', ...parsed.data },
    });
    return NextResponse.json(s);
  } catch {
    return NextResponse.json({ error: 'Could not save settings. Run npm run db:push?' }, { status: 400 });
  }
}
