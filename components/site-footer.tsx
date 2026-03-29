import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-[color:var(--border)] bg-white/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 text-sm text-[color:var(--ink-soft)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div>
          <p className="font-serif text-lg text-[color:var(--ink-strong)]">Northstar Notes</p>
          <p>Thoughtful writing on product, craft, and the quiet parts of building.</p>
        </div>

        <div className="flex items-center gap-5">
          <Link href="/blog" className="hover:text-[color:var(--ink-strong)]">
            Journal
          </Link>
          <Link href="/auth/signin" className="hover:text-[color:var(--ink-strong)]">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
