import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { requireAdmin } from '@/lib/session';

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: 'Uploads are not configured. Set BLOB_READ_WRITE_TOKEN.' }, { status: 400 });
  }

  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const blob = await put(`products/${Date.now()}-${safeName}`, file, { access: 'public' });
    return NextResponse.json({ url: blob.url, contentType: file.type });
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
