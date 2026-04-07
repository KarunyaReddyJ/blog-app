'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useEffect } from 'react';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/posts/new', label: 'Write' },
  { href: '/admin/analytics', label: 'Analytics' },
  { href: '/admin/profile', label: 'Profile' },
  { href: '/admin/resume', label: 'Resume' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [router, status]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[color:var(--background)]">
        <div className="rounded-full border border-[color:var(--border)] bg-white/80 px-5 py-3 text-sm text-[color:var(--ink-soft)]">
          Loading workspace...
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      <header className="border-b border-[color:var(--border)] bg-[color:rgb(250_247_240_/_0.9)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="font-serif text-2xl text-[color:var(--ink-strong)]">
              Admin workspace
            </Link>
            <Link href="/" className="hidden text-sm text-[color:var(--ink-soft)] md:inline-flex">
              View public site
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-[color:var(--ink-soft)] sm:inline-flex">{session?.user?.email}</span>
            <button type="button" onClick={() => signOut({ callbackUrl: '/' })} className="button-secondary">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="h-fit rounded-[32px] border border-[color:var(--border)] bg-white/90 p-4 shadow-[0_30px_80px_rgba(31,36,48,0.05)]">
          <p className="px-3 py-2 text-xs uppercase tracking-[0.22em] text-[color:var(--ink-muted)]">Workspace</p>
          <nav className="mt-2 space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-[20px] px-4 py-3 text-sm transition ${
                    active
                      ? 'bg-[color:var(--accent)] text-white'
                      : 'text-[color:var(--ink-soft)] hover:bg-[color:var(--surface)] hover:text-[color:var(--ink-strong)]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div>{children}</div>
      </div>
    </div>
  );
}
