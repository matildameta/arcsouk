import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';

export function getSession() {
  return getServerSession(authOptions);
}

export async function requireUser() {
  const session = await getSession();
  return session?.user ?? null;
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session?.user || !isAdminEmail(session.user.email)) return null;
  return session.user;
}
