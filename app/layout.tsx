import { ClerkProvider } from '@clerk/nextjs';

export const metadata = { title: 'Plansparency', description: 'Your 401(k), crystal clear.' };

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const inner = (
    <html lang="en">
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
