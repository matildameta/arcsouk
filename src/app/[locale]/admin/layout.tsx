import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';

export default async function AdminLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(`/${locale}/auth/signin?callbackUrl=/${locale}/admin`);
  }

  if (!isAdminEmail(session.user.email)) {
    return (
      <div className="grid min-h-[70vh] place-items-center px-9 pt-[120px] text-center">
        <div>
          <div className="font-mono text-xs uppercase tracking-[.2em] text-ink3">403</div>
          <h1 className="mt-3 font-display text-3xl font-semibold">Not authorized</h1>
          <p className="mt-2 text-ink2">This area is restricted to Arc Souk admins (set via ADMIN_EMAILS).</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
