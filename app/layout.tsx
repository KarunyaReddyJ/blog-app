import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  title: {
    default: 'Northstar Notes',
    template: '%s | Northstar Notes',
  },
  description: 'An editorial blog and publishing dashboard built with Next.js and Supabase.',
  openGraph: {
    title: 'Northstar Notes',
    description: 'An editorial blog and publishing dashboard built with Next.js and Supabase.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                const stored = localStorage.getItem('northstar-theme');
                const theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                document.documentElement.dataset.theme = theme;
              })();
            `,
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
