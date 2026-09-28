import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function AdvisorLayout({ children }: { children: React.ReactNode }) {
  const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (hasClerk) {
    // Clerk configured — enforce session auth.
    const { userId } = await auth();
    if (!userId) redirect('/sign-in');
  }
  // No Clerk key configured: Clerk is skipped here. Access is still protected
  // by the Basic Auth gate in middleware.ts (all of /advisor always requires
  // the password).

  return <>{children}</>;
}
