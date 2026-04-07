'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';

const navItems = [
  { href: '/', label: 'About' },
  { href: '/blog', label: 'Writing' },
  { href: '/resume', label: 'Resume' },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--border)] bg-[color:var(--header-bg)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="font-serif text-xl text-[color:var(--ink-strong)]">
          Northstar Notes
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-[color:var(--border)] bg-[color:var(--background-muted)] p-1 md:flex">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  active
                    ? 'bg-[color:var(--accent)] text-white'
                    : 'text-[color:var(--ink-soft)] hover:text-[color:var(--ink-strong)]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/blog" className="button-primary text-sm">
            Read posts
          </Link>
        </div>
      </div>
    </header>
  );
}
