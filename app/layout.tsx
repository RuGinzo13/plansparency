import { ClerkProvider } from '@clerk/nextjs';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';

export const metadata = { title: 'Plansparency', description: 'Your 401(k), crystal clear.' };

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// next/font serves these files from our own site at build time, so
// visitors' browsers never call Google.
const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-display',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const inner = (
    <html lang="en" className={`${cormorantGaramond.variable} ${dmSans.variable}`}>
      <body style={{ background: '#F4EFE6', margin: 0 }}>
        {children}
      </body>
    </html>
  );

  if (!clerkKey) {
    // No Clerk key in env — render without auth (dev/preview only)
    return inner;
  }

  return <ClerkProvider>{inner}</ClerkProvider>;
}
