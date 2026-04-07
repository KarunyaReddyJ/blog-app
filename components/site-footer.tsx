import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-[color:var(--border)] bg-white/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 text-sm text-[color:var(--ink-soft)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div>
          <p className="font-serif text-lg text-[color:var(--ink-strong)]">Northstar Notes</p>
          <p>Personal writing on software engineering, systems, debugging, and building better tools.</p>
        </div>

        <div className="flex items-center gap-5">
          <Link href="/" className="hover:text-[color:var(--ink-strong)]">
            About
          </Link>
          <Link href="/blog" className="hover:text-[color:var(--ink-strong)]">
            Writing
          </Link>
          <Link href="/resume" className="hover:text-[color:var(--ink-strong)]">
            Resume
          </Link>
        </div>
      </div>
    </footer>
  );
}
